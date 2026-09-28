/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — talking to the two public services the app uses:

   · GBIF (api.gbif.org/v1): resolving a name to its taxon key, counting and
     downloading occurrence records by taxon and country;
   · Global Biotic Interactions (api.globalbioticinteractions.org): the
     plant–visitor interactions already published.

   Both answer to a page opened with a double click (they allow any origin).
   Nothing is sent to them but the taxon names and the filters. */

const Net = {};

(function () {
  const GBIF = 'https://api.gbif.org/v1';
  const GLOBI = 'https://api.globalbioticinteractions.org';
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function bilingualError(es, en) { const e = new Error(en); e.html = L2(es, en); return e; }
  const errHTML = e => (e && e.html ? e.html : esc(e && e.message ? e.message : e));

  /* GET with retries and growing waits on transient errors (429 = too many
     requests; 500–504 = overloaded or under maintenance; network failure).
     The body is read inside the try: a page of 300 records weighs a couple of
     megabytes and the connection can die while it streams. */
  async function getJSON(url, opts) {
    const o = opts || {};
    const retries = o.retries == null ? 6 : o.retries;
    let wait = 1500;
    for (let attempt = 0; ; attempt++) {
      let r, body;
      try {
        r = await fetch(url, { headers: { Accept: 'application/json' }, signal: o.signal });
        if (r.ok) body = await r.json();
      } catch (netErr) {
        if (netErr && netErr.name === 'AbortError') throw netErr;
        if (attempt >= retries) throw bilingualError('se perdió la conexión (' + esc(netErr.message) + ')', 'the connection was lost (' + esc(netErr.message) + ')');
        if (o.onWait) o.onWait(attempt + 1, retries, wait);
        await sleep(wait); wait = Math.min(wait * 2, 30000); continue;
      }
      if (r.ok) return body;
      const transient = r.status === 429 || (r.status >= 500 && r.status <= 504);
      if (transient && attempt < retries) {
        const ra = parseInt(r.headers.get('Retry-After'), 10), w = ra ? ra * 1000 : wait;
        if (o.onWait) o.onWait(attempt + 1, retries, w);
        await sleep(w); wait = Math.min(wait * 2, 30000); continue;
      }
      throw bilingualError(`el servicio respondió ${r.status}` + (r.status === 503 ? ' (saturado o en mantenimiento; espera unos minutos)' : ''),
        `the service answered ${r.status}` + (r.status === 503 ? ' (overloaded or under maintenance; wait a few minutes)' : ''));
    }
  }

  /* =====================================================================
     1 · names
     =====================================================================
     A bare genus name is often ambiguous across kingdoms (Trigona is a
     stingless bee, a snail and a clam; Cucurbita returns nothing without a
     kingdom). The kingdom follows from the role: plants are Plantae, and
     visitors are Animalia. Among the exact alternatives of that kingdom, the
     accepted one with most occurrence records wins; the others are kept so
     the user can switch. */
  async function resolveName(name, role) {
    const kingdom = role === 'plant' ? 'Plantae' : 'Animalia';
    const q = new URLSearchParams({ name, kingdom, verbose: 'true' });
    const m = await getJSON(`${GBIF}/species/match?${q}`);
    const pool = [];
    const add = x => {
      if (!x || !x.usageKey || x.rank === 'KINGDOM' || x.rank === 'PHYLUM' || x.rank === 'CLASS') return;
      if (x.kingdom && x.kingdom !== kingdom) return;
      if (x.matchType === 'FUZZY' && pool.length) return;
      if (pool.some(p => p.usageKey === x.usageKey)) return;
      pool.push(x);
    };
    add(m);
    (m.alternatives || []).forEach(a => { if (a.matchType === 'EXACT' || a.matchType === 'FUZZY') add(a); });
    if (!pool.length) return { name, candidates: [], chosen: null };
    /* how many records each candidate has (a quick count, limit=0) */
    await Promise.all(pool.slice(0, 6).map(async c => {
      try { c.nOcc = (await getJSON(`${GBIF}/occurrence/search?taxonKey=${c.usageKey}&limit=0`, { retries: 2 })).count; }
      catch (e) { c.nOcc = null; }
    }));
    /* The ranking, in order: the canonical name is exactly what was typed; its
       rank agrees with the number of words (one word is a genus or higher,
       two a species, three an infraspecific taxon); it is accepted; it has
       more records. GBIF calls the genus Cucurbita L. a "higher-rank" match
       and the fossil "Cucurbita spec" an exact one: the first two rules put
       the genus first. */
    const words = name.trim().split(/\s+/).length;
    const rankFits = r => {
      const R = String(r || '').toUpperCase();
      if (words === 1) return !['SPECIES', 'SUBSPECIES', 'VARIETY', 'FORM'].includes(R);
      if (words === 2) return R === 'SPECIES';
      return ['SUBSPECIES', 'VARIETY', 'FORM'].includes(R);
    };
    const same = c => String(c.canonicalName || '').toLowerCase() === name.trim().toLowerCase();
    const score = c => (same(c) ? 8e9 : 0) + (rankFits(c.rank) ? 4e9 : 0) + ((c.status || '').toUpperCase() === 'ACCEPTED' ? 2e9 : 0) + (c.matchType === 'EXACT' ? 1e9 : 0) + Math.min(9.9e8, c.nOcc || 0);
    const cands = pool.slice(0, 6).sort((a, b) => score(b) - score(a));
    const out = cands.map(c => Object.assign(slim(c), { exactName: same(c) }));
    return { name, candidates: out, chosen: out[0] };
  }
  function slim(c) {
    if (!c) return null;
    return {
      key: c.usageKey, acceptedKey: c.acceptedUsageKey || null, scientificName: c.scientificName, canonicalName: c.canonicalName || c.scientificName,
      rank: c.rank, status: c.status, matchType: c.matchType, kingdom: c.kingdom, order: c.order || '', family: c.family || '', genus: c.genus || '', nOcc: c.nOcc ?? null,
    };
  }

  /* =====================================================================
     2 · occurrences
     ===================================================================== */
  /* the country filter goes to GBIF as a repeated parameter (OR), so the count
     GBIF reports already comes filtered */
  function occParams(key, f) {
    const p = new URLSearchParams();
    p.set('taxonKey', key);
    p.set('hasCoordinate', 'true');
    if (f.noGeoIssue) p.set('hasGeospatialIssue', 'false');
    (f.countries || []).forEach(c => p.append('country', c));
    if (f.yearFrom || f.yearTo) p.set('year', `${f.yearFrom || 1600},${f.yearTo || new Date().getFullYear()}`);
    (f.basis || []).forEach(b => p.append('basisOfRecord', b));
    return p;
  }
  async function countOcc(key, f) {
    const p = occParams(key, f); p.set('limit', '0');
    return (await getJSON(`${GBIF}/occurrence/search?${p}`)).count;
  }
  /* the fields kept from each occurrence */
  function normalise(o, taxon) {
    const num = v => (v === null || v === undefined || v === '' || isNaN(+v) ? null : +v);
    const ev = String(o.eventDate || '');
    return {
      id: 'g' + o.key, gbifKey: o.key, src: 'gbif',
      taxonId: taxon.id, role: taxon.role,
      name: o.scientificName || '', species: o.species || '', genus: o.genus || '', family: o.family || '',
      rank: o.taxonRank || '', infra: o.infraspecificEpithet || '',
      lat: num(o.decimalLatitude), lon: num(o.decimalLongitude), unc: num(o.coordinateUncertaintyInMeters),
      elev: num(o.elevation),
      cc: o.countryCode || '', country: o.country || '', stateProvince: o.stateProvince || '', locality: o.locality || '',
      y: num(o.year), m: num(o.month), d: num(o.day), eventDate: ev.slice(0, 21),
      basis: o.basisOfRecord || '', inst: o.institutionCode || '', dataset: o.datasetName || '', datasetKey: o.datasetKey || '', license: o.license || '',
      recordedBy: Array.isArray(o.recordedBy) ? o.recordedBy.join('; ') : (o.recordedBy || ''),
      estab: o.establishmentMeans || o.degreeOfEstablishment || '', repro: o.reproductiveCondition || '',
      sex: o.sex || '', lifeStage: o.lifeStage || '',
      remarks: [o.occurrenceRemarks, o.habitat, o.fieldNotes].filter(Boolean).join(' · ').slice(0, 400),
      issues: Array.isArray(o.issues) ? o.issues.join('|') : '',
    };
  }
  /* paged download; `onProgress(done, cap, total, note)`; an interrupted
     download throws with err.partial so the caller can keep what arrived */
  async function fetchOcc(taxon, f, onProgress, signal) {
    const LIMIT = 300;
    const p = occParams(taxon.key, f); p.set('limit', String(LIMIT));
    const onWait = (n, max, ms) => onProgress && onProgress(null, null, null, T(`servicio ocupado; reintento ${n}/${max} en ${Math.round(ms / 1000)} s…`, `service busy; retry ${n}/${max} in ${Math.round(ms / 1000)} s…`));
    const first = await getJSON(`${GBIF}/occurrence/search?${p}&offset=0`, { onWait, signal });
    const total = first.count;
    const cap = Math.min(total, f.maxRecords || 20000, 99000);          // GBIF: offset + limit < 100 000
    const out = first.results.map(o => normalise(o, taxon));
    if (onProgress) onProgress(Math.min(out.length, cap), cap, total);
    let offset = LIMIT;
    while (offset < cap) {
      let page;
      try { page = await getJSON(`${GBIF}/occurrence/search?${p}&offset=${offset}`, { onWait, signal }); }
      catch (err) { err.partial = out.slice(0, cap); err.partialTotal = total; throw err; }
      if (!page.results || !page.results.length) break;
      page.results.forEach(o => out.push(normalise(o, taxon)));
      if (onProgress) onProgress(Math.min(out.length, cap), cap, total);
      offset += LIMIT;
      if (page.endOfRecords) break;
      await sleep(120);
    }
    return { records: out.slice(0, cap), total, truncated: total > cap };
  }

  /* =====================================================================
     3 · published interactions
     =====================================================================
     The service stores each interaction with a direction (source → target)
     and a type from a hierarchy: 'flowersVisitedBy' includes
     'pollinatedBy', and 'visitsFlowersOf' includes 'pollinates'. For a plant
     the question is asked as source; for a visitor, as source with the
     inverse type: both directions are merged so every link is read as
     plant ← visitor. */
  const FIELDS = 'source_taxon_name,interaction_type,target_taxon_name,latitude,longitude,study_citation,study_source_citation,source_taxon_path,target_taxon_path';
  async function interactions(name, role, signal) {
    const type = role === 'plant' ? 'flowersVisitedBy' : 'visitsFlowersOf';
    const out = [];
    for (let offset = 0; offset < 4000; offset += 1000) {
      const q = new URLSearchParams({ sourceTaxon: name, interactionType: type, limit: '1000', offset: String(offset), fields: FIELDS });
      const r = await getJSON(`${GLOBI}/interaction?${q}`, { retries: 3, signal });
      const cols = r.columns || [], rows = r.data || [];
      rows.forEach(row => {
        const o = {}; cols.forEach((c, i) => { o[c] = row[i]; });
        const plantSide = role === 'plant' ? 'source' : 'target';
        const visSide = role === 'plant' ? 'target' : 'source';
        out.push({
          plant: o[plantSide + '_taxon_name'] || '', visitor: o[visSide + '_taxon_name'] || '',
          vg: visitorGroup(o[visSide + '_taxon_path'], o[visSide + '_taxon_name']), plantFamily: familyOf(o[plantSide + '_taxon_path']), visitorFamily: familyOf(o[visSide + '_taxon_path']),
          type: o.interaction_type || '', lat: o.latitude ?? null, lon: o.longitude ?? null,
          ref: o.study_citation || o.study_source_citation || '', src: 'globi', n: 1,
        });
      });
      if (rows.length < 1000) break;
    }
    return out;
  }
  /* the plant–visitor pairs, each once, with how many published records back it
     and whether any calls it pollination rather than a flower visit */
  function summariseLinks(list) {
    const m = new Map();
    list.forEach(x => {
      const k = x.plant + '|' + x.visitor;
      if (!m.has(k)) m.set(k, { plant: x.plant, visitor: x.visitor, n: 0, pollinates: false, refs: new Set(), vg: x.vg, plantFamily: x.plantFamily, visitorFamily: x.visitorFamily });
      const e = m.get(k);
      e.n += x.n || 1;
      if (/pollinat/i.test(x.type)) e.pollinates = true;
      if (x.ref) e.refs.add(x.ref);
    });
    return [...m.values()].map(e => ({ ...e, refs: [...e.refs] })).sort((a, b) => b.n - a.n);
  }

  /* the family in a taxonomic path "… | Apidae | Apinae | …" */
  function familyOf(path) { const m = String(path || '').split('|').map(s => s.trim()).filter(s => /(aceae|idae)$/.test(s)); return m.length ? m[m.length - 1] : ''; }

  /* which group a visitor belongs to, from its taxonomic path: the words a
     reader looks for in a pollination table */
  function visitorGroup(path, name) {
    const p = ' ' + String(path || '') + ' ';
    if (/\| Anthophila \||Apidae|Halictidae|Andrenidae|Megachilidae|Colletidae|Melittidae/.test(p)) return 'bee';
    if (/Hymenoptera/.test(p)) return 'wasp';
    if (/Syrphidae|Bombyliidae/.test(p)) return 'hoverfly';
    if (/Diptera/.test(p)) return 'fly';
    if (/Lepidoptera/.test(p)) return 'butterfly';
    if (/Coleoptera/.test(p)) return 'beetle';
    if (/Chiroptera/.test(p)) return 'bat';
    if (/Trochilidae|Aves/.test(p)) return 'bird';
    if (/Hemiptera|Thysanoptera|Acari|Arachnida/.test(p)) return 'other';
    return /^(Apis|Bombus|Trigona|Melipona|Xenoglossa|Peponapis)\b/.test(String(name)) ? 'bee' : 'unknown';
  }

  Object.assign(Net, { getJSON, resolveName, countOcc, fetchOcc, normalise, interactions, summariseLinks, visitorGroup, bilingualError, errHTML, sleep });
  window.Net = Net;
})();
