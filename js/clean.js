/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 3 engine: cleaning the records and harmonising the
   names.

   Every rule is a pure function of a record (and of the whole list, for
   duplicates) that returns whether it applies; the block decides with the
   user which rules remove a record and which only flag it. The rules follow
   the checks that the occurrence-cleaning literature agrees on (Chapman
   2005; Zizka et al. 2020): coordinates that cannot be right, the
   placeholder coordinates of country and state centroids, swapped or
   unsigned coordinates detected against the country the record claims,
   imprecise and rounded coordinates, duplicates, impossible dates, the kinds
   of record that do not represent a wild population (fossils, living
   collections of botanical gardens) and cultivated plants.

   The centroids are computed here from the boundaries the app carries, with
   two definitions, because both circulate as placeholders: the area-weighted
   centroid of the polygons and the centre of their bounding box (the second
   is the one behind the "centre of Mexico" at 23.63° N, 102.55° W). */

const Clean = {};

(function () {

  /* ---------------- centroids of countries and Mexican states ---------------- */
  let CENTROIDS = null;
  function polyCentroid(rings) {
    let A = 0, cx = 0, cy = 0;
    rings.forEach(r => {
      const n = r.length / 2;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const x0 = r[2 * j], y0 = r[2 * j + 1], x1 = r[2 * i], y1 = r[2 * i + 1];
        const f = x0 * y1 - x1 * y0;
        A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
      }
    });
    return A ? [cx / (3 * A), cy / (3 * A)] : null;
  }
  function centroids() {
    if (CENTROIDS) return CENTROIDS;
    CENTROIDS = [];
    const add = (name, kind, rings, bbox) => {
      const c = polyCentroid(rings);
      if (c) CENTROIDS.push({ name, kind, def: 'area', lon: c[0], lat: c[1] });
      if (bbox) CENTROIDS.push({ name, kind, def: 'box', lon: (bbox[0] + bbox[2]) / 2, lat: (bbox[1] + bbox[3]) / 2 });
    };
    if (window.GEO) {
      GEO.WORLD.forEach(c => add(c.a2, 'country', c.rings, c.bbox));
      GEO.MX.forEach(s => add(s.name, 'state', s.rings, s.bbox));
      const mxAll = [].concat(...GEO.MX.map(s => s.rings));
      add('México (país)', 'country', mxAll, GEO.ringsBBox(mxAll));      // from the 32 states, finer than the world outline
    }
    return CENTROIDS;
  }
  function nearCentroid(lat, lon, km) {
    const list = centroids();
    for (const c of list) {
      if (Math.abs(c.lat - lat) > 1 || Math.abs(c.lon - lon) > 1.2) continue;
      if (Poll.haversine(lat, lon, c.lat, c.lon) <= km) return c;
    }
    return null;
  }

  /* ---------------- where a point falls ---------------- */
  function locate(lon, lat) {
    if (!window.GEO) return { cc: '', st: '' };
    const s = GEO.stateOf(lon, lat);
    if (s) return { cc: 'MX', st: s.code, stName: s.name };
    const c = GEO.countryOf(lon, lat);
    return { cc: c ? c.a2 : '', st: '', stName: '' };
  }
  const ccOf = r => {
    const s = String(r.cc || r.country || '').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(s)) return s;
    if (/^[A-Z]{3}$/.test(s) && window.GEO) return GEO.A3_TO_A2[s] || '';
    const n = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/MEXIC/.test(n)) return 'MX';
    if (/GUATEMALA/.test(n)) return 'GT';
    if (/ESTADOS UNIDOS|UNITED STATES|USA/.test(n)) return 'US';
    return '';
  };

  /* ---------------- words that mean "planted" ---------------- */
  const CULT_WORDS = /cultivad|cultivat|sembrad|plantad|planted|huerto|huerta|jard[ií]n|garden|traspatio|backyard|vivero|nursery|invernadero|greenhouse|mercado|market|parcela|orchard|milpa|cafetal|plantaci[oó]n|plantation|ornamental|escapad|escaped/i;
  const CULT_ESTAB = /managed|cultivated|introduced|captive|planted/i;
  function isCultivated(r) {
    if (CULT_ESTAB.test(r.estab || '')) return 'estab';
    if (CULT_WORDS.test([r.locality, r.remarks].join(' '))) return 'words';
    return null;
  }

  /* ---------------- the rules ----------------
     kind: 'drop' removes by default, 'flag' only marks by default; the user
     can switch any rule. `test(r, ctx)` returns a short reason or null. */
  const RULES = [
    { id: 'nocoord', kind: 'drop', t: ['Sin coordenadas válidas', 'No valid coordinates'], d: ['latitud o longitud vacía o fuera de ±90 / ±180', 'latitude or longitude empty or beyond ±90 / ±180'],
      test: r => (r.lat == null || r.lon == null || !isFinite(r.lat) || !isFinite(r.lon) || Math.abs(r.lat) > 90 || Math.abs(r.lon) > 180 ? 'x' : null) },
    { id: 'zero', kind: 'drop', t: ['Coordenadas (0, 0)', '(0, 0) coordinates'], d: ['el valor por omisión de muchas bases de datos: un punto en el Golfo de Guinea', 'the default value of many databases: a point in the Gulf of Guinea'],
      test: r => (Math.abs(r.lat) < 1e-6 && Math.abs(r.lon) < 1e-6 ? 'x' : null) },
    { id: 'equal', kind: 'drop', t: ['Latitud igual a la longitud', 'Latitude equal to longitude'], d: ['casi siempre un error de captura', 'nearly always a data-entry error'],
      test: r => (Math.abs(r.lat - r.lon) < 1e-9 && r.lat !== 0 ? 'x' : null) },
    { id: 'swapped', kind: 'fix', t: ['Coordenadas invertidas o sin signo', 'Swapped or unsigned coordinates'], d: ['el punto no cae en el país que dice el registro, pero sí al cambiar el signo o intercambiar latitud y longitud; se corrige', 'the point does not fall in the country the record states, but does after changing the sign or swapping latitude and longitude; it is corrected'],
      test: (r, ctx) => ctx.fix[r.id] ? ctx.fix[r.id].how : null },
    { id: 'centroid', kind: 'drop', t: ['Centroide de país o de estado', 'Country or state centroid'], d: ['a menos de la distancia elegida del centro de un país o de un estado de México: el lugar que se pone cuando solo se sabe el país', 'within the chosen distance of the centre of a country or a Mexican state: the place entered when only the country is known'],
      test: (r, ctx) => { const c = nearCentroid(r.lat, r.lon, ctx.p.centroidKm); return c ? `${c.name} (${c.def === 'box' ? 'rect.' : 'área'})` : null; } },
    { id: 'mismatch', kind: 'flag', t: ['Fuera del país declarado', 'Outside the stated country'], d: ['el punto cae en otro país y ninguna corrección lo explica (o cae en el mar)', 'the point falls in another country and no correction explains it (or falls in the sea)'],
      test: (r, ctx) => { const cc = ccOf(r); if (!cc) return null; const loc = ctx.loc[r.id]; return loc && loc.cc && loc.cc !== cc ? `${cc} → ${loc.cc}` : null; } },
    { id: 'sea', kind: 'flag', t: ['En el mar o fuera de los contornos', 'In the sea or outside the outlines'], d: ['no cae en ningún país (los contornos mundiales son gruesos: revisa antes de descartar registros costeros)', 'falls in no country (the world outlines are coarse: check before discarding coastal records)'],
      test: (r, ctx) => (ctx.loc[r.id] && !ctx.loc[r.id].cc ? 'x' : null) },
    { id: 'imprecise', kind: 'drop', t: ['Coordenada imprecisa', 'Imprecise coordinate'], d: ['incertidumbre declarada mayor que el umbral', 'declared uncertainty larger than the threshold'],
      test: (r, ctx) => (r.unc != null && r.unc > ctx.p.maxUncKm * 1000 ? `${Math.round(r.unc / 1000)} km` : null) },
    { id: 'rounded', kind: 'flag', t: ['Coordenada redondeada', 'Rounded coordinate'], d: ['latitud y longitud con menos decimales que el mínimo (un grado entero son ~110 km)', 'latitude and longitude with fewer decimals than the minimum (a whole degree is ~110 km)'],
      test: (r, ctx) => { const dec = v => { const s = String(v); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; }; return Math.max(dec(r.lat), dec(r.lon)) < ctx.p.minDecimals ? 'x' : null; } },
    { id: 'duplicate', kind: 'drop', t: ['Duplicados', 'Duplicates'], d: ['mismo taxón, mismas coordenadas y misma fecha: se conserva uno', 'same taxon, same coordinates and same date: one is kept'],
      test: (r, ctx) => (ctx.dup.has(r.id) ? 'x' : null) },
    { id: 'future', kind: 'drop', t: ['Fecha imposible', 'Impossible date'], d: ['año posterior al actual, o mes o día fuera de rango', 'year after the current one, or month or day out of range'],
      test: r => { const y = new Date().getFullYear(); return (r.y && r.y > y) || (r.m && (r.m < 1 || r.m > 12)) || (r.d && (r.d < 1 || r.d > 31)) ? 'x' : null; } },
    { id: 'old', kind: 'flag', t: ['Registro antiguo', 'Old record'], d: ['anterior al año elegido: útil para la historia, dudoso para el clima actual', 'before the chosen year: useful for history, doubtful for the current climate'],
      test: (r, ctx) => (r.y && r.y < ctx.p.minYear ? String(r.y) : null) },
    { id: 'basis', kind: 'drop', t: ['Fósiles y colecciones vivas', 'Fossils and living collections'], d: ['un ejemplar de jardín botánico o de un fósil no dice dónde vive la población silvestre', 'a botanical-garden specimen or a fossil does not say where the wild population lives'],
      test: r => (/FOSSIL|LIVING_SPECIMEN/i.test(r.basis || '') ? r.basis.toLowerCase() : null) },
    { id: 'cultivated', kind: 'drop', t: ['Plantas cultivadas', 'Cultivated plants'], d: ['solo en las plantas: medio de establecimiento «manejado» o palabras como cultivado, huerto, jardín, traspatio, vivero, invernadero, plantación', 'plants only: "managed" establishment means or words such as cultivated, garden, backyard, nursery, greenhouse, plantation'],
      test: (r, ctx) => (r.role === 'plant' && !(ctx.p.keepCultivatedFor || []).includes(r.taxonId) ? isCultivated(r) : null) },
    { id: 'region', kind: 'drop', t: ['Fuera del área de estudio', 'Outside the study area'], d: ['el punto no cae en los países (o estados de México) elegidos como área de estudio', 'the point does not fall in the countries (or Mexican states) chosen as the study area'],
      test: (r, ctx) => {
        const loc = ctx.loc[r.id]; const a = ctx.p.area;
        if (!a || (!a.countries.length && !a.states.length)) return null;
        if (a.states.length) return loc && loc.cc === 'MX' && a.states.includes(loc.st) ? null : 'x';
        return loc && a.countries.includes(loc.cc) ? null : 'x';
      } },
  ];

  /* ---------------- swapped / unsigned coordinates ----------------
     For a record that states its country and falls elsewhere, try the four
     classic mistakes; the first that lands inside the stated country is the
     correction (Chapman 2005, §4). */
  function trySwaps(r, cc) {
    if (!window.GEO || !cc) return null;
    const inCC = (lon, lat) => {
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return false;
      if (cc === 'MX') return !!GEO.stateOf(lon, lat);
      const c = GEO.WORLD_BY_A2[cc];
      return c ? GEO.inBBox(c.bbox, lon, lat) && GEO.pointInRings(c.rings, lon, lat) : false;
    };
    if (inCC(r.lon, r.lat)) return null;
    const tries = [
      ['lon−', -r.lon, r.lat], ['lat−', r.lon, -r.lat], ['both−', -r.lon, -r.lat],
      ['swap', r.lat, r.lon], ['swap lon−', -r.lat, r.lon], ['swap lat−', r.lat, -r.lon], ['swap both−', -r.lat, -r.lon],
    ];
    for (const [how, lon, lat] of tries) if (inCC(lon, lat)) return { how, lon, lat };
    return null;
  }

  /* ---------------- taxonomy ----------------
     The unit of analysis of a record: its study-list entry, or its species,
     optionally splitting the infraspecific taxa (Sechium edule subsp.
     sylvestre apart from the cultivated S. edule). Synonym rules merge an
     entry into another and rewrite the species name, keeping the original. */
  function harmonise(records, taxa, opts) {
    const o = opts || {};
    const rules = (o.synonyms || []).filter(s => s.on);
    const byName = n => taxa.find(t => Taxa.label(t).toLowerCase() === n.toLowerCase() || t.name.toLowerCase() === n.toLowerCase());
    const merged = {};
    rules.forEach(s => {
      const from = byName(s.from), to = byName(s.to);
      if (from && to) merged[from.id] = to.id;
    });
    records.forEach(r => {
      r.origTaxonId = r.origTaxonId || r.taxonId;
      r.origName = r.origName || r.name;
      let sp = r.species || '';
      let tid = r.origTaxonId;
      rules.forEach(s => {
        const re = new RegExp('^' + s.from + '\\b');
        if (re.test(sp)) sp = sp.replace(re, s.to);
      });
      if (merged[tid]) tid = merged[tid];
      r.taxonId = tid;
      r.speciesH = sp;
      const infra = o.splitInfra && r.infra ? ` ${/VARIETY/i.test(r.rank) ? 'var.' : 'subsp.'} ${r.infra}` : '';
      r.unitSpecies = sp ? sp + infra : '';
    });
    return merged;
  }

  /* ---------------- running everything ---------------- */
  function run(raw, taxa, params) {
    const p = Object.assign({ centroidKm: 5, maxUncKm: 10, minDecimals: 2, minYear: 1950, on: {}, area: null, keepCultivatedFor: [], synonyms: [], splitInfra: false }, params || {});
    const records = raw.map(r => Object.assign({}, r));
    /* 1 · locate every point and try the corrections */
    const loc = {}, fix = {};
    records.forEach(r => {
      if (r.lat == null || r.lon == null || !isFinite(r.lat) || !isFinite(r.lon)) return;
      const cc = ccOf(r);
      const l = locate(r.lon, r.lat);
      if (cc && l.cc !== cc && p.on.swapped !== 'off') {
        const f = trySwaps(r, cc);
        if (f) { fix[r.id] = { how: f.how, from: [r.lon, r.lat] }; r.lon = f.lon; r.lat = f.lat; Object.assign(l, locate(r.lon, r.lat)); }
      }
      loc[r.id] = l;
    });
    /* 2 · duplicates: the first of each taxon + coordinates + date is kept */
    const dup = new Set(), seen = new Set();
    records.forEach(r => {
      const k = [r.taxonId, r.species || r.name, r.lat != null ? r.lat.toFixed(5) : '', r.lon != null ? r.lon.toFixed(5) : '', r.y || '', r.m || '', r.d || ''].join('|');
      if (seen.has(k)) dup.add(r.id); else seen.add(k);
    });
    const ctx = { p, loc, fix, dup };
    /* 3 · every rule on every record; the first removing rule decides */
    const kept = [], dropped = [];
    const count = {};
    RULES.forEach(R => { count[R.id] = { flagged: 0, removed: 0, byTaxon: {} }; });
    records.forEach(r => {
      r.flags = [];
      let removedBy = null;
      for (const R of RULES) {
        if (R.id !== 'nocoord' && (r.lat == null || r.lon == null)) continue;
        const why = R.test(r, ctx);
        if (!why) continue;
        const action = p.on[R.id] != null ? p.on[R.id] : R.kind;
        if (action === 'off') continue;
        r.flags.push(R.id);
        count[R.id].flagged++;
        if ((action === 'drop' || action === true) && !removedBy) {
          removedBy = R.id;
          count[R.id].removed++;
          count[R.id].byTaxon[r.taxonId] = (count[R.id].byTaxon[r.taxonId] || 0) + 1;
        }
      }
      const l = loc[r.id] || {};
      r.cc2 = l.cc || ''; r.st = l.st || ''; r.stName = l.stName || '';
      if (removedBy) { r.removedBy = removedBy; dropped.push(r); } else kept.push(r);
    });
    /* 4 · names */
    const merged = harmonise(kept.concat(dropped), taxa, p);
    return { records: kept, dropped, count, fixes: Object.keys(fix).length, merged, params: p, date: new Date().toISOString() };
  }

  Object.assign(Clean, { RULES, run, centroids, nearCentroid, polyCentroid, trySwaps, locate, ccOf, isCultivated, harmonise, CULT_WORDS });
  window.Clean = Clean;
})();
