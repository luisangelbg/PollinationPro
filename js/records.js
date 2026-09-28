/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — the user's own tables: presence records and visit
   observations.

   A table arrives with columns named in any language and style. Each field
   of the app has a list of names it answers to; when no name matches, the
   content decides (a column of numbers between −90 and 90 next to one
   between −180 and 180 is a pair of coordinates). The user sees the proposed
   mapping and can correct any column before importing. */

const Records = {};

(function () {
  const TI = () => window.TableIO;
  /* lower case, no accents, no punctuation: "Latitud (°)" → "latitud" */
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  /* ---------------- the fields and the names they answer to ---------------- */
  const PRESENCE = [
    { key: 'taxon', req: true, t: ['Taxón', 'Taxon'], names: ['scientificname', 'scientific name', 'species', 'especie', 'taxon', 'taxón', 'nombre cientifico', 'nombre', 'name', 'sp', 'acceptedscientificname', 'verbatimscientificname'] },
    { key: 'lat', req: true, t: ['Latitud', 'Latitude'], names: ['decimallatitude', 'latitude', 'latitud', 'lat', 'y', 'lat dd', 'latitud decimal'] },
    { key: 'lon', req: true, t: ['Longitud', 'Longitude'], names: ['decimallongitude', 'longitude', 'longitud', 'lon', 'long', 'lng', 'x', 'lon dd', 'longitud decimal'] },
    { key: 'date', t: ['Fecha', 'Date'], names: ['eventdate', 'date', 'fecha', 'fecha de colecta', 'collection date', 'fecha colecta', 'fecha de observacion', 'observed on'] },
    { key: 'year', t: ['Año', 'Year'], names: ['year', 'ano', 'año', 'anio'] },
    { key: 'month', t: ['Mes', 'Month'], names: ['month', 'mes'] },
    { key: 'day', t: ['Día', 'Day'], names: ['day', 'dia', 'día'] },
    { key: 'elev', t: ['Altitud (m)', 'Elevation (m)'], names: ['elevation', 'altitud', 'altitude', 'elev', 'alt', 'msnm', 'masl', 'minimumelevationinmeters', 'elevacion'] },
    { key: 'unc', t: ['Incertidumbre (m)', 'Uncertainty (m)'], names: ['coordinateuncertaintyinmeters', 'uncertainty', 'incertidumbre', 'precision', 'precisión', 'error'] },
    { key: 'country', t: ['País', 'Country'], names: ['country', 'pais', 'país', 'countrycode'] },
    { key: 'state', t: ['Estado', 'State'], names: ['stateprovince', 'state', 'estado', 'entidad', 'province', 'provincia'] },
    { key: 'locality', t: ['Localidad', 'Locality'], names: ['locality', 'localidad', 'sitio', 'site', 'lugar', 'place'] },
    { key: 'basis', t: ['Tipo de registro', 'Type of record'], names: ['basisofrecord', 'basis', 'tipo', 'tipo de registro', 'record type'] },
    { key: 'estab', t: ['Silvestre / cultivado', 'Wild / cultivated'], names: ['establishmentmeans', 'establishment', 'cultivado', 'silvestre', 'origen', 'condicion', 'status'] },
    { key: 'repro', t: ['Condición reproductiva', 'Reproductive condition'], names: ['reproductivecondition', 'fenologia', 'phenology', 'condicion reproductiva', 'flowering'] },
    { key: 'role', t: ['Papel (planta / visitante)', 'Role (plant / visitor)'], names: ['role', 'papel', 'grupo', 'group', 'tipo de organismo', 'kingdom', 'reino'] },
    { key: 'notes', t: ['Notas', 'Notes'], names: ['occurrenceremarks', 'remarks', 'notes', 'notas', 'observaciones', 'habitat', 'comentarios'] },
    { key: 'recordedBy', t: ['Colector u observador', 'Collector or observer'], names: ['recordedby', 'collector', 'colector', 'observador', 'observer', 'recolector'] },
  ];
  const VISITS = [
    { key: 'plant', req: true, t: ['Planta', 'Plant'], names: ['plant', 'planta', 'plant species', 'especie de planta', 'flor', 'flower', 'host', 'hospedero'] },
    { key: 'visitor', req: true, t: ['Visitante', 'Visitor'], names: ['visitor', 'visitante', 'pollinator', 'polinizador', 'insect', 'insecto', 'animal', 'visitor species', 'especie visitante'] },
    { key: 'n', t: ['Número de visitas', 'Number of visits'], names: ['n', 'count', 'visits', 'visitas', 'numero', 'número', 'frecuencia', 'frequency', 'abundancia', 'abundance', 'individuos', 'individuals'] },
    { key: 'date', t: ['Fecha', 'Date'], names: ['date', 'fecha', 'eventdate'] },
    { key: 'year', t: ['Año', 'Year'], names: ['year', 'ano', 'año'] },
    { key: 'month', t: ['Mes', 'Month'], names: ['month', 'mes'] },
    { key: 'day', t: ['Día', 'Day'], names: ['day', 'dia', 'día'] },
    { key: 'site', t: ['Sitio', 'Site'], names: ['site', 'sitio', 'locality', 'localidad', 'parcela', 'plot', 'transecto', 'transect'] },
    { key: 'lat', t: ['Latitud', 'Latitude'], names: ['latitude', 'latitud', 'lat', 'decimallatitude'] },
    { key: 'lon', t: ['Longitud', 'Longitude'], names: ['longitude', 'longitud', 'lon', 'long', 'decimallongitude'] },
    { key: 'type', t: ['Tipo de interacción', 'Interaction type'], names: ['type', 'tipo', 'interaction', 'interaccion', 'behaviour', 'behavior', 'conducta', 'comportamiento', 'recurso', 'resource'] },
    { key: 'notes', t: ['Notas', 'Notes'], names: ['notes', 'notas', 'observaciones', 'remarks'] },
  ];

  /* ---------------- proposing a mapping ---------------- */
  function propose(headers, rows, spec) {
    const map = {};
    const used = new Set();
    /* 1 · by name: exact normalised name first, then "contains" */
    spec.forEach(f => {
      const hit = headers.find(h => !used.has(h) && f.names.some(n => norm(h) === norm(n)));
      if (hit) { map[f.key] = hit; used.add(hit); }
    });
    spec.forEach(f => {
      if (map[f.key]) return;
      const hit = headers.find(h => !used.has(h) && f.names.some(n => norm(n).length > 3 && norm(h).includes(norm(n))));
      if (hit) { map[f.key] = hit; used.add(hit); }
    });
    /* 2 · by content, for the coordinates: latitude within ±90, longitude beyond it */
    if (spec === PRESENCE && (!map.lat || !map.lon)) {
      const numeric = headers.filter(h => !used.has(h)).map(h => {
        const v = rows.slice(0, 200).map(r => TI().parseCoord(r[h])).filter(x => x != null);
        return { h, v, share: v.length / Math.max(1, Math.min(200, rows.length)) };
      }).filter(c => c.share > 0.8);
      if (!map.lat) { const c = numeric.find(c => c.v.every(x => Math.abs(x) <= 90) && c.v.some(x => x !== Math.round(x))); if (c) { map.lat = c.h; used.add(c.h); } }
      if (!map.lon) { const c = numeric.find(c => !used.has(c.h) && c.v.some(x => Math.abs(x) > 90 || x !== Math.round(x)) && c.v.every(x => Math.abs(x) <= 180)); if (c) { map.lon = c.h; used.add(c.h); } }
    }
    /* 3 · the taxon, by content: the column whose values look like binomials */
    const tkey = spec === PRESENCE ? 'taxon' : null;
    if (tkey && !map[tkey]) {
      const c = headers.filter(h => !used.has(h)).find(h => rows.slice(0, 100).filter(r => /^[A-Z][a-z]+( [a-z-]+)?/.test(r[h] || '')).length > 0.7 * Math.min(100, rows.length));
      if (c) map[tkey] = c;
    }
    return map;
  }

  /* ---------------- reading a mapped table ---------------- */
  const roleOf = v => {
    const s = norm(v);
    if (!s) return null;
    if (/^(plant|planta|plantae|flor|flower|host|hospedero|p)$/.test(s)) return 'plant';
    if (/^(visitor|visitante|pollinator|polinizador|animal|animalia|insect|insecto|v|a)$/.test(s)) return 'poll';
    return null;
  };
  /* wild / cultivated from a free-text column */
  const estabOf = v => {
    const s = norm(v);
    if (!s) return '';
    if (/cultiv|managed|sembrad|plantad|huerto|garden|introduc/.test(s)) return 'MANAGED';
    if (/silvestr|wild|native|nativ|natural/.test(s)) return 'NATIVE';
    return String(v).trim();
  };
  function readPresence(rows, map, opts) {
    const o = opts || {};
    const out = [], bad = [];
    const g = (r, k) => (map[k] ? r[map[k]] : '');
    rows.forEach((r, i) => {
      const name = String(g(r, 'taxon') || o.defaultTaxon || '').replace(/\s+/g, ' ').trim();
      const lat = TI().parseCoord(g(r, 'lat')), lon = TI().parseCoord(g(r, 'lon'));
      if (!name || lat == null || lon == null) { bad.push({ row: i + 1 + (o.headerRows || 0), why: !name ? 'taxon' : 'coords' }); return; }
      let y = null, m = null, d = null;
      const dt = g(r, 'date') ? TI().parseDate(g(r, 'date'), o.dateOrder) : null;
      if (dt) { y = dt.y; m = dt.m; d = dt.d; }
      if (map.year) { const v = TI().parseNumber(g(r, 'year')); if (v != null) y = Math.round(v); }
      if (map.month) { const v = TI().parseNumber(g(r, 'month')); if (v >= 1 && v <= 12) m = Math.round(v); }
      if (map.day) { const v = TI().parseNumber(g(r, 'day')); if (v >= 1 && v <= 31) d = Math.round(v); }
      const parts = name.split(' ');
      out.push({
        id: 'u' + (o.batch || '') + '_' + (i + 1), src: 'own', taxonId: null, role: roleOf(g(r, 'role')) || o.defaultRole || null,
        name, species: parts.length > 1 && /^[a-z]/.test(parts[1]) ? parts.slice(0, 2).join(' ') : '', genus: parts[0], family: '', rank: parts.length > 1 ? 'SPECIES' : 'GENUS', infra: '',
        lat, lon, unc: TI().parseNumber(g(r, 'unc')), elev: TI().parseNumber(g(r, 'elev')),
        cc: /^[A-Z]{2}$/.test(String(g(r, 'country')).trim()) ? String(g(r, 'country')).trim() : '', country: String(g(r, 'country') || '').trim(),
        stateProvince: String(g(r, 'state') || '').trim(), locality: String(g(r, 'locality') || '').trim(),
        y, m, d, eventDate: String(g(r, 'date') || ''),
        basis: String(g(r, 'basis') || o.defaultBasis || 'HUMAN_OBSERVATION').trim(), inst: '', dataset: o.dataset || T('Registros propios', 'Own records'), datasetKey: '', license: '',
        recordedBy: String(g(r, 'recordedBy') || '').trim(),
        estab: estabOf(g(r, 'estab')), repro: String(g(r, 'repro') || '').trim(), sex: '', lifeStage: '',
        remarks: String(g(r, 'notes') || '').trim(), issues: '',
      });
    });
    return { records: out, bad };
  }
  function readVisits(rows, map, opts) {
    const o = opts || {};
    const out = [], bad = [];
    const g = (r, k) => (map[k] ? r[map[k]] : '');
    rows.forEach((r, i) => {
      const plant = String(g(r, 'plant') || '').replace(/\s+/g, ' ').trim(), visitor = String(g(r, 'visitor') || '').replace(/\s+/g, ' ').trim();
      if (!plant || !visitor) { bad.push({ row: i + 1 + (o.headerRows || 0), why: 'names' }); return; }
      const nRaw = map.n ? TI().parseNumber(g(r, 'n')) : 1;
      if (nRaw == null || nRaw < 0) { bad.push({ row: i + 1 + (o.headerRows || 0), why: 'n' }); return; }
      let y = null, m = null, d = null;
      const dt = g(r, 'date') ? TI().parseDate(g(r, 'date'), o.dateOrder) : null;
      if (dt) { y = dt.y; m = dt.m; d = dt.d; }
      if (map.year) { const v = TI().parseNumber(g(r, 'year')); if (v != null) y = Math.round(v); }
      if (map.month) { const v = TI().parseNumber(g(r, 'month')); if (v >= 1 && v <= 12) m = Math.round(v); }
      if (map.day) { const v = TI().parseNumber(g(r, 'day')); if (v >= 1 && v <= 31) d = Math.round(v); }
      out.push({
        plant, visitor, n: nRaw, site: String(g(r, 'site') || '').trim(),
        lat: TI().parseCoord(g(r, 'lat')), lon: TI().parseCoord(g(r, 'lon')), y, m, d,
        type: String(g(r, 'type') || 'visit').trim(), notes: String(g(r, 'notes') || '').trim(), src: 'own', ref: o.dataset || T('Observaciones propias', 'Own observations'),
      });
    });
    return { visits: out, bad };
  }

  /* ---------------- attaching records to the study list ----------------
     A record belongs to the entry whose name equals its name, or is the
     first word(s) of it: "Peponapis azteca" belongs to the entry "Peponapis".
     The longest matching entry wins ("Sechium edule" before "Sechium"). */
  function attach(records, taxa) {
    const entries = taxa.map(t => ({ t, keys: [t.name, t.resolved && t.resolved.canonicalName].filter(Boolean).map(s => s.toLowerCase()) }));
    let unmatched = 0;
    records.forEach(r => {
      if (r.taxonId && taxa.some(t => t.id === r.taxonId)) return;
      const n = String(r.name || '').toLowerCase();
      let best = null, bestLen = 0;
      entries.forEach(({ t, keys }) => keys.forEach(k => {
        if ((n === k || n.startsWith(k + ' ')) && k.length > bestLen) { best = t; bestLen = k.length; }
      }));
      if (best) { r.taxonId = best.id; if (!r.role) r.role = best.role; }
      else unmatched++;
    });
    return unmatched;
  }
  /* the names of a record list that no entry claims, with how many records each */
  function orphanNames(records) {
    const m = new Map();
    records.filter(r => !r.taxonId).forEach(r => {
      const k = r.species || r.name;
      if (!m.has(k)) m.set(k, { name: k, n: 0, role: r.role || null });
      m.get(k).n++;
    });
    return [...m.values()].sort((a, b) => b.n - a.n);
  }

  Object.assign(Records, { PRESENCE, VISITS, norm, propose, readPresence, readVisits, attach, orphanNames, roleOf, estabOf });
  window.Records = Records;
})();
