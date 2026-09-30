/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 2: gathering the records.

   The study list (plants and visitors), the resolution of each name in GBIF,
   the paged download of occurrences by country, the published interactions,
   the user's own presence and visit tables, the practice data, the summary
   of what arrived, and saving or opening a project. */

const B2 = {};

(function () {
  const two = p => L2(p[0], p[1]);
  const TX = () => window.Taxa;

  /* ---------------- countries ---------------- */
  const REGIONS = [
    { id: 'mx', t: ['México', 'Mexico'], c: [['MX', 'México', 'Mexico']] },
    { id: 'cam', t: ['Centroamérica', 'Central America'], c: [['GT', 'Guatemala', 'Guatemala'], ['BZ', 'Belice', 'Belize'], ['SV', 'El Salvador', 'El Salvador'], ['HN', 'Honduras', 'Honduras'], ['NI', 'Nicaragua', 'Nicaragua'], ['CR', 'Costa Rica', 'Costa Rica'], ['PA', 'Panamá', 'Panama']] },
    { id: 'nam', t: ['Norteamérica', 'North America'], c: [['US', 'Estados Unidos', 'United States'], ['CA', 'Canadá', 'Canada']] },
    { id: 'car', t: ['Caribe', 'Caribbean'], c: [['CU', 'Cuba', 'Cuba'], ['DO', 'Rep. Dominicana', 'Dominican Rep.'], ['HT', 'Haití', 'Haiti'], ['JM', 'Jamaica', 'Jamaica'], ['PR', 'Puerto Rico', 'Puerto Rico']] },
    { id: 'sam', t: ['Sudamérica', 'South America'], c: [['CO', 'Colombia', 'Colombia'], ['VE', 'Venezuela', 'Venezuela'], ['EC', 'Ecuador', 'Ecuador'], ['PE', 'Perú', 'Peru'], ['BO', 'Bolivia', 'Bolivia'], ['BR', 'Brasil', 'Brazil'], ['PY', 'Paraguay', 'Paraguay'], ['CL', 'Chile', 'Chile'], ['AR', 'Argentina', 'Argentina'], ['UY', 'Uruguay', 'Uruguay'], ['GY', 'Guyana', 'Guyana'], ['SR', 'Surinam', 'Suriname'], ['GF', 'Guayana Francesa', 'French Guiana']] },
  ];
  const countryName = code => { for (const r of REGIONS) for (const c of r.c) if (c[0] === code) return T(c[1], c[2]); return code; };
  const selectedCountries = () => els('#b2Countries input:checked').map(i => i.value);
  function renderCountries(selected) {
    const box = el('b2Countries'), btns = el('b2RegionBtns');
    const sel = new Set(selected || selectedCountries());
    box.innerHTML = REGIONS.map(r => r.c.map(([code, es, en]) => `<label data-region="${r.id}"><input type="checkbox" value="${code}"${sel.has(code) ? ' checked' : ''}> ${L2(es, en)} <span class="cc">${code}</span></label>`).join('')).join('');
    btns.innerHTML = REGIONS.map(r => `<button class="chip" data-region="${r.id}">${two(r.t)}</button>`).join('') +
      `<button class="chip" data-region="none">${L2('sin filtro (todo el mundo)', 'no filter (whole world)')}</button>`;
    syncRegionChips();
  }
  function syncRegionChips() {
    els('#b2RegionBtns .chip').forEach(b => {
      const r = b.dataset.region;
      if (r === 'none') { b.classList.toggle('on', selectedCountries().length === 0); return; }
      const items = els(`#b2Countries label[data-region="${r}"] input`);
      b.classList.toggle('on', items.length > 0 && items.every(i => i.checked));
    });
  }
  function filters() {
    const basis = el('b2Basis').value;
    return {
      countries: selectedCountries(),
      noGeoIssue: el('b2NoGeo').checked,
      maxRecords: +el('b2Max').value || 20000,
      yearFrom: parseNum(el('b2YearFrom').value), yearTo: parseNum(el('b2YearTo').value),
      basis: basis ? basis.split(',') : [],
    };
  }

  /* ---------------- persistence ----------------
     The whole study goes to the browser's local database (Store, in core.js)
     after every change, a moment later so that a burst of changes is written
     once. The project file is the portable copy. */
  const KEY = 'project';
  function project() {
    return { app: 'PollinationPro', version: APP_VERSION, saved: new Date().toISOString(), taxa: state.taxa, raw: state.raw, interactions: state.interactions, visits: state.visits, fetchMeta: state.fetchMeta, filters: filters(), example: state.example || null };
  }
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { Store.put(KEY, project()); }, 400);
  }
  function applyProject(p) {
    state.taxa = p.taxa || [];
    state.raw = p.raw || [];
    state.interactions = p.interactions || [];
    state.visits = p.visits || [];
    state.fetchMeta = p.fetchMeta || {};
    TX().syncSeq(state.taxa);
    if (p.filters && p.filters.countries) renderCountries(p.filters.countries);
    changed(false);
    return p;
  }
  async function restore() {
    try {
      const p = await Store.get(KEY);
      if (!p || !p.taxa) return false;
      applyProject(p);
      state.example = p.example || null;
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- the study list ---------------- */
  function addNames(role, text) {
    const names = String(text || '').split(/[,;\n]+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    let added = 0;
    names.forEach(n => {
      if (state.taxa.some(t => t.name.toLowerCase() === n.toLowerCase())) return;
      state.taxa.push(TX().entry(n, role)); added++;
    });
    if (added) changed();
    return added;
  }
  function removeTaxon(id) {
    const t = state.taxa.find(x => x.id === id);
    state.taxa = state.taxa.filter(x => x.id !== id);
    const before = state.raw.length;
    state.raw = state.raw.filter(r => r.taxonId !== id);
    if (t && before !== state.raw.length) notice('b2ListMsg', 'info', L2(`Se quitó <b>${esc(t.name)}</b> con sus ${(before - state.raw.length).toLocaleString('en-US')} registros.`, `<b>${esc(t.name)}</b> was removed with its ${(before - state.raw.length).toLocaleString('en-US')} records.`));
    changed();
  }
  function taxonRow(t) {
    const nRec = state.raw.filter(r => r.taxonId === t.id).length;
    const res = t.resolved;
    const exact = res && (res.exactName || res.matchType === 'EXACT');
    const cls = !res ? (t.status === 'nomatch' ? 'bad' : '') : (exact && String(res.status).toUpperCase() === 'ACCEPTED' ? 'ok' : 'warn');
    let sub = '';
    if (res) {
      sub = [res.rank ? res.rank.toLowerCase() : '', res.family, res.order, String(res.status || '').toLowerCase(),
        !exact ? (res.matchType === 'FUZZY' ? T(`ortografía corregida (escribiste «${t.name}»)`, `spelling corrected (you typed "${t.name}")`) : T('coincidencia aproximada', 'approximate match')) : '']
        .filter(Boolean).map(esc).join(' · ') + (res.key ? ` · <a href="https://www.gbif.org/species/${res.key}" target="_blank" rel="noopener">GBIF ${res.key}</a>` : '');
    } else if (t.status === 'nomatch') sub = L2('GBIF no reconoce el nombre: revisa la ortografía', 'GBIF does not recognise the name: check the spelling');
    else if (t.status === 'example') sub = L2('datos de práctica (sin resolver en GBIF)', 'practice data (not resolved in GBIF)');
    else sub = L2('sin resolver', 'not resolved');
    const cand = t.candidates && t.candidates.length > 1
      ? `<select data-cand="${t.id}" aria-label="${esc(T('Nombre aceptado para ', 'Accepted name for ') + t.name)}">${t.candidates.map(c => `<option value="${c.key}"${res && c.key === res.key ? ' selected' : ''}>${esc(c.scientificName)} · ${esc(c.family || c.order || c.kingdom || '')}${c.nOcc != null ? ' · ' + c.nOcc.toLocaleString('en-US') + ' reg.' : ''}</option>`).join('')}</select>` : '';
    const count = t.count != null ? T(`${t.count.toLocaleString('en-US')} en GBIF`, `${t.count.toLocaleString('en-US')} in GBIF`) : (res && res.nOcc != null ? T(`${res.nOcc.toLocaleString('en-US')} en el mundo`, `${res.nOcc.toLocaleString('en-US')} worldwide`) : '');
    return `<div class="taxon-row ${cls}"><div><div class="tx-name">${TX().italic(TX().label(t), res && res.rank)}</div><div class="tx-sub">${sub}</div>${cand}</div>
      <div class="tx-n">${count}${nRec ? `<br><b>${nRec.toLocaleString('en-US')}</b> ${T('cargados', 'loaded')}` : ''}</div>
      <button class="tx-x" data-rm="${t.id}" title="${esc(T('Quitar de la lista', 'Remove from the list'))}">✕</button></div>`;
  }
  function renderLists() {
    ['plant', 'poll'].forEach(role => {
      const box = el(role === 'plant' ? 'b2PlantList' : 'b2PollList');
      const list = state.taxa.filter(t => t.role === role);
      box.innerHTML = list.length ? list.map(taxonRow).join('') : `<p class="hint">${L2('Todavía no hay nombres.', 'No names yet.')}</p>`;
    });
  }
  function renderPresets() {
    el('b2Presets').innerHTML = TX().PRESETS.map(p => `<button class="preset" data-preset="${p.id}"><b>${two(p.t)}</b><small>${two(p.s)}</small></button>`).join('');
  }
  function usePreset(id) {
    const p = TX().PRESETS.find(x => x.id === id);
    if (!p) return;
    state.taxa = []; state.raw = []; state.interactions = []; state.fetchMeta = {};
    p.plants.forEach(n => state.taxa.push(TX().entry(n, 'plant')));
    p.polls.forEach(n => state.taxa.push(TX().entry(n, 'poll')));
    renderCountries(p.countries);
    els('.preset').forEach(b => b.classList.toggle('on', b.dataset.preset === id));
    clearMessages('b2ListMsg');
    notice('b2ListMsg', 'info', L2(`Lista de «${p.t[0]}» cargada y países fijados. Ahora resuelve los nombres en GBIF; puedes añadir o quitar nombres antes.`, `List "${p.t[1]}" loaded and countries set. Now resolve the names in GBIF; you can add or remove names first.`));
    changed();
  }

  async function resolveAll() {
    const todo = state.taxa.filter(t => !t.resolved);
    if (!todo.length) { notice('b2ListMsg', 'info', L2('Todos los nombres ya están resueltos.', 'Every name is already resolved.')); return; }
    const btn = el('b2Resolve'); btn.disabled = true;
    clearMessages('b2ListMsg');
    const msg = showMessage('b2ListMsg', 'info', L2('Consultando GBIF…', 'Querying GBIF…'));
    let ok = 0, bad = 0;
    try {
      for (const t of todo) {
        msg.innerHTML = L2(`Consultando GBIF: <i>${esc(t.name)}</i>…`, `Querying GBIF: <i>${esc(t.name)}</i>…`);
        const r = await Net.resolveName(t.name, t.role);
        t.candidates = r.candidates;
        if (r.chosen) {
          t.resolved = r.chosen;
          /* a synonym is downloaded through its accepted name */
          t.key = String(r.chosen.status).toUpperCase() === 'SYNONYM' && r.chosen.acceptedKey ? r.chosen.acceptedKey : r.chosen.key;
          t.status = 'ok'; ok++;
        } else { t.status = 'nomatch'; bad++; }
        renderLists();
      }
      msg.remove();
      showMessage('b2ListMsg', bad ? 'warning' : 'success', L2(`${ok} nombres resueltos${bad ? `; ${bad} sin coincidencia (revisa la ortografía)` : ''}. Cuando hay homónimos se elige el del reino correcto con más registros; puedes cambiarlo en el selector de cada nombre.`,
        `${ok} names resolved${bad ? `; ${bad} without a match (check the spelling)` : ''}. When there are homonyms, the one of the right kingdom with most records is chosen; you can change it in each name's selector.`));
    } catch (e) {
      msg.remove();
      showMessage('b2ListMsg', 'error', L2('No se pudo consultar GBIF: ', 'Could not query GBIF: ') + Net.errHTML(e) + '<br>' + L2('Revisa tu conexión, o practica con los datos ficticios de abajo.', 'Check your connection, or practise with the fictional data below.'));
    } finally { btn.disabled = false; changed(); }
  }

  /* ---------------- GBIF: count and download ---------------- */
  let abort = null;
  function progRow(t) { return `<div class="prog" id="prog_${t.id}"><div>${TX().italic(TX().label(t), t.resolved && t.resolved.rank)}</div><div class="bar"><i></i></div><div class="pl">…</div><span class="lw-imark" aria-hidden="true"><svg viewBox="0 0 52 52"><circle class="lw-disc" cx="26" cy="26" r="26"/><path class="lw-check" d="M14.5 27.5l8 8L38 19"/><path class="lw-cross" d="M18 18L34 34M34 18L18 34"/></svg></span></div>`; }
  function setProg(t, frac, text, cls) {
    const row = el('prog_' + t.id); if (!row) return;
    row.querySelector('i').style.width = Math.round(100 * Math.min(1, frac || 0)) + '%';
    row.querySelector('.pl').textContent = text;
    row.classList.remove('done', 'fail'); if (cls) row.classList.add(cls);
  }
  async function countAll() {
    const list = state.taxa.filter(t => t.key);
    if (!list.length) { notice('b2FetchMsg', 'warning', L2('Primero resuelve los nombres en GBIF (sección 1).', 'First resolve the names in GBIF (section 1).')); return; }
    clearMessages('b2FetchMsg');
    const f = filters();
    const btn = el('b2Count'); btn.disabled = true;
    try {
      for (const t of list) { t.count = await Net.countOcc(t.key, f); renderLists(); }
      const tot = list.reduce((a, t) => a + (t.count || 0), 0), big = list.filter(t => t.count > f.maxRecords);
      showMessage('b2FetchMsg', big.length ? 'warning' : 'info', L2(`Con estos filtros hay <b>${tot.toLocaleString('en-US')}</b> registros con coordenadas.${big.length ? ` ${big.length === 1 ? `1 nombre pasa` : `${big.length} nombres pasan`} del máximo elegido (${f.maxRecords.toLocaleString('en-US')}): se descargarán solo los primeros, o sube el máximo.` : ''}`,
        `With these filters there are <b>${tot.toLocaleString('en-US')}</b> records with coordinates.${big.length ? ` ${big.length === 1 ? `1 name exceeds` : `${big.length} names exceed`} the chosen maximum (${f.maxRecords.toLocaleString('en-US')}): only the first ones will be downloaded, or raise the maximum.` : ''}`));
    } catch (e) { showMessage('b2FetchMsg', 'error', L2('No se pudo contar: ', 'Could not count: ') + Net.errHTML(e)); }
    finally { btn.disabled = false; changed(); }
  }
  async function fetchAll() {
    const list = state.taxa.filter(t => t.key);
    if (!list.length) { notice('b2FetchMsg', 'warning', L2('Primero resuelve los nombres en GBIF (sección 1).', 'First resolve the names in GBIF (section 1).')); return; }
    const f = filters();
    clearMessages('b2FetchMsg');
    el('b2Progress').innerHTML = list.map(progRow).join('');
    I18N.apply(el('b2Progress'));
    abort = new AbortController();
    el('b2Fetch').disabled = true; el('b2Stop').style.display = '';
    let got = 0, failed = 0;
    for (const t of list) {
      if (abort.signal.aborted) { setProg(t, 0, T('no se descargó', 'not downloaded'), 'fail'); continue; }
      try {
        const res = await Net.fetchOcc(t, f, (done, cap, total, note) => {
          if (note) { setProg(t, null, note); return; }
          setProg(t, cap ? done / cap : 1, `${done.toLocaleString('en-US')} / ${cap.toLocaleString('en-US')}`);
        }, abort.signal);
        replaceGbif(t, res.records);
        state.fetchMeta[t.id] = { total: res.total, fetched: res.records.length, truncated: res.truncated, filters: f, date: new Date().toISOString().slice(0, 10) };
        t.count = res.total;
        setProg(t, 1, `${res.records.length.toLocaleString('en-US')}${res.truncated ? T(` de ${res.total.toLocaleString('en-US')}`, ` of ${res.total.toLocaleString('en-US')}`) : ''}`, 'done');
        got += res.records.length;
      } catch (e) {
        failed++;
        if (e && e.partial && e.partial.length) {
          replaceGbif(t, e.partial);
          state.fetchMeta[t.id] = { total: e.partialTotal, fetched: e.partial.length, truncated: true, partial: true, filters: f, date: new Date().toISOString().slice(0, 10) };
          setProg(t, e.partial.length / Math.max(1, e.partialTotal), T(`corte: ${e.partial.length.toLocaleString('en-US')} guardados`, `cut: ${e.partial.length.toLocaleString('en-US')} kept`), 'fail');
          got += e.partial.length;
        } else setProg(t, 0, e && e.name === 'AbortError' ? T('detenido', 'stopped') : T('falló', 'failed'), 'fail');
        if (e && e.name !== 'AbortError') showMessage('b2FetchMsg', 'error', `<i>${esc(TX().label(t))}</i>: ` + Net.errHTML(e));
      }
      renderLists();
    }
    el('b2Fetch').disabled = false; el('b2Stop').style.display = 'none';
    abort = null;
    notice('b2FetchMsg', failed ? 'warning' : 'success', L2(`Descarga terminada: ${got.toLocaleString('en-US')} registros.${failed ? ' Algunos nombres fallaron o se detuvieron; puedes volver a descargar y solo se reemplazarán sus registros de GBIF.' : ''} GBIF pide citar cada descarga con su DOI: para el artículo final repite la descarga en su portal con los mismos filtros.`,
      `Download finished: ${got.toLocaleString('en-US')} records.${failed ? ' Some names failed or were stopped; you can download again and only their GBIF records will be replaced.' : ''} GBIF asks for each download to be cited with its DOI: for the final paper, repeat the download on its portal with the same filters.`));
    changed();
  }
  /* a new download of an entry replaces its previous GBIF records, never the user's own */
  function replaceGbif(t, records) {
    state.raw = state.raw.filter(r => !(r.taxonId === t.id && r.src === 'gbif')).concat(records);
  }

  /* ---------------- published interactions ---------------- */
  async function searchInteractions() {
    const list = state.taxa;
    if (!list.length) { notice('b2GlobiMsg', 'warning', L2('La lista de estudio está vacía.', 'The study list is empty.')); return; }
    clearMessages('b2GlobiMsg');
    const btn = el('b2Globi'); btn.disabled = true;
    const msg = showMessage('b2GlobiMsg', 'info', L2('Buscando…', 'Searching…'));
    const all = [];
    let failed = 0;
    for (const t of list) {
      msg.innerHTML = L2(`Buscando las interacciones de <i>${esc(TX().label(t))}</i>…`, `Searching the interactions of <i>${esc(TX().label(t))}</i>…`);
      try { (await Net.interactions(TX().label(t), t.role)).forEach(x => { x.fromTaxon = t.id; all.push(x); }); }
      catch (e) { failed++; }
    }
    msg.remove();
    /* each published record once, even if both of its ends are in the list */
    const seen = new Set();
    state.interactions = all.filter(x => { const k = [x.plant, x.visitor, x.type, x.ref].join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
    btn.disabled = false;
    showMessage('b2GlobiMsg', failed ? 'warning' : 'success', L2(`${state.interactions.length.toLocaleString('en-US')} registros de interacción publicados${failed ? `; ${failed} consultas fallaron` : ''}.`, `${state.interactions.length.toLocaleString('en-US')} published interaction records${failed ? `; ${failed} queries failed` : ''}.`));
    renderInteractions();
    changed();
  }
  const GROUP = { bee: ['abeja', 'bee'], wasp: ['avispa', 'wasp'], hoverfly: ['mosca sírfida', 'hoverfly'], fly: ['mosca', 'fly'], butterfly: ['mariposa o polilla', 'butterfly or moth'], beetle: ['escarabajo', 'beetle'], bat: ['murciélago', 'bat'], bird: ['ave', 'bird'], other: ['otro', 'other'], unknown: ['sin clasificar', 'unclassified'] };
  function inList(name) {
    const n = String(name || '').toLowerCase();
    return state.taxa.some(t => { const k = TX().label(t).toLowerCase(); return n === k || n.startsWith(k + ' '); });
  }
  function renderInteractions() {
    const box = el('b2GlobiTable');
    if (!state.interactions.length) { box.innerHTML = ''; return; }
    const links = Net.summariseLinks(state.interactions);
    buildTable(box, [
      { key: 'plant', label: T('Planta', 'Plant'), html: true, get: r => TX().italic(r.plant) + (inList(r.plant) ? ' <span class="role-tag plant">' + T('en la lista', 'in list') + '</span>' : '') },
      { key: 'visitor', label: T('Visitante', 'Visitor'), html: true, get: r => TX().italic(r.visitor) + (inList(r.visitor) ? ' <span class="role-tag poll">' + T('en la lista', 'in list') + '</span>' : '') },
      { key: 'group', label: T('Grupo', 'Group'), get: r => T(...GROUP[r.vg || 'unknown']) },
      { key: 'n', label: T('Registros', 'Records'), num: true },
      { key: 'pol', label: T('¿Poliniza?', 'Pollinates?'), get: r => (r.pollinates ? T('lo afirma al menos uno', 'at least one says so') : T('solo visita', 'visit only')) },
    /* the aggregated query often comes back without the study citation: the column of sources
       is shown only when the database sent at least one */
    ].concat(links.some(r => r.refs.length) ? [{ key: 'refs', label: T('Fuentes', 'Sources'), num: true, get: r => r.refs.length || '—' }] : []), links, { limit: 300 });
    const b = mk('div', { class: 'btn-row' });
    b.innerHTML = `<button class="btn btn-ghost btn-sm" id="b2GlobiCsv">${L2('⤓ Interacciones (.csv)', '⤓ Interactions (.csv)')}</button>`;
    box.appendChild(b);
    el('b2GlobiCsv').addEventListener('click', () => download(TableIO.toCSV(state.interactions, ['plant', 'visitor', 'type', 'ref', 'lat', 'lon']), 'interacciones_publicadas.csv', 'text/csv;charset=utf-8'));
  }

  /* ---------------- own data ---------------- */
  let ownKind = 'presence', pending = null, batch = 0;
  async function readFile(file) {
    clearMessages('b2OwnMsg');
    try {
      const sheets = await TableIO.readAny(file);
      prepare(sheets, file.name);
    } catch (e) { showMessage('b2OwnMsg', 'error', L2('No se pudo leer el archivo: ', 'Could not read the file: ') + Net.errHTML(e)); }
  }
  function prepare(sheets, fname) {
    const usable = sheets.filter(s => s.matrix.length);
    if (!usable.length) { showMessage('b2OwnMsg', 'error', L2('El archivo no tiene filas.', 'The file has no rows.')); return; }
    pending = { sheets: usable, sheet: 0, fname, header: 'auto' };
    renderMapping();
  }
  function renderMapping() {
    const box = el('b2Map');
    if (!pending) { box.innerHTML = ''; return; }
    const sh = pending.sheets[pending.sheet];
    const tab = TableIO.toObjects(sh.matrix, pending.header);
    const spec = ownKind === 'presence' ? Records.PRESENCE : Records.VISITS;
    if (!pending.map || pending.mapFor !== ownKind + '|' + pending.sheet + '|' + tab.header) { pending.map = Records.propose(tab.headers, tab.rows, spec); pending.mapFor = ownKind + '|' + pending.sheet + '|' + tab.header; }
    pending.tab = tab;
    const opts = h => `<option value="">${T('(ninguna)', '(none)')}</option>` + tab.headers.map(x => `<option value="${esc(x)}"${x === h ? ' selected' : ''}>${esc(x)}</option>`).join('');
    const example = h => (h ? esc((tab.rows.find(r => r[h]) || {})[h] || '') : '');
    box.innerHTML = `<h3>${L2('Columnas', 'Columns')} · ${esc(pending.fname)}</h3>
      <div class="btn-row">
        ${pending.sheets.length > 1 ? `<label class="inline-label">${L2('Hoja', 'Sheet')} <select id="b2Sheet">${pending.sheets.map((s, i) => `<option value="${i}"${i === pending.sheet ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>` : ''}
        <label class="checkbox-label"><input type="checkbox" id="b2Header"${tab.header ? ' checked' : ''}> ${L2('La primera fila son títulos', 'The first row holds titles')}</label>
        <span class="hint" style="margin:0">${tab.rows.length.toLocaleString('en-US')} ${L2('filas', 'rows')} · ${tab.headers.length} ${L2('columnas', 'columns')}</span>
      </div>
      <div class="table-scroll"><table class="map-table"><thead><tr><th>${L2('Campo de la app', 'App field')}</th><th>${L2('Columna de tu tabla', 'Column of your table')}</th><th>${L2('Primer valor', 'First value')}</th></tr></thead><tbody>
      ${spec.map(f => `<tr><td>${two(f.t)}${f.req ? ' <b style="color:var(--danger)">*</b>' : ''}</td><td><select data-field="${f.key}">${opts(pending.map[f.key])}</select></td><td class="ex">${example(pending.map[f.key])}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="form-grid">
        ${ownKind === 'presence' ? `<div class="field"><label>${L2('Si no hay columna de papel', 'If there is no role column')}</label><select id="b2DefRole"><option value="list">${T('según la lista de estudio', 'from the study list')}</option><option value="plant">${T('todas son plantas', 'all are plants')}</option><option value="poll">${T('todos son visitantes', 'all are visitors')}</option></select></div>` : ''}
        <div class="field"><label>${L2('Fechas escritas como', 'Dates written as')}</label><select id="b2DateOrder"><option value="dmy">${T('día/mes/año', 'day/month/year')}</option><option value="mdy">${T('mes/día/año', 'month/day/year')}</option></select></div>
        <div class="field"><label>${L2('Al importar', 'When importing')}</label><select id="b2Mode"><option value="add">${T('añadir a lo que hay', 'add to what there is')}</option><option value="replace">${T('reemplazar mis datos anteriores', 'replace my previous data')}</option></select></div>
      </div>
      <div class="btn-row"><button class="btn btn-primary" id="b2Import">${ownKind === 'presence' ? L2('Importar los registros', 'Import the records') : L2('Importar las visitas', 'Import the visits')}</button></div>`;
  }
  function doImport() {
    const spec = ownKind === 'presence' ? Records.PRESENCE : Records.VISITS;
    const missing = spec.filter(f => f.req && !pending.map[f.key]);
    clearMessages('b2OwnMsg');
    if (missing.length) { showMessage('b2OwnMsg', 'error', L2('Falta asignar: ', 'Still to assign: ') + missing.map(f => two(f.t)).join(', ')); return; }
    const opts = { dateOrder: el('b2DateOrder').value, headerRows: pending.tab.header ? 1 : 0, batch: ++batch, dataset: pending.fname };
    const mode = el('b2Mode').value;
    if (ownKind === 'presence') {
      const dr = el('b2DefRole').value;
      if (dr !== 'list') opts.defaultRole = dr;
      const { records, bad } = Records.readPresence(pending.tab.rows, pending.map, opts);
      if (mode === 'replace') state.raw = state.raw.filter(r => r.src !== 'own');
      state.raw = state.raw.concat(records);
      const orphans = Records.attach(state.raw, state.taxa);
      showMessage('b2OwnMsg', bad.length ? 'warning' : 'success', L2(`${records.length.toLocaleString('en-US')} registros importados.${bad.length ? ` ${bad.length} filas sin taxón o sin coordenadas legibles se omitieron (la primera: fila ${bad[0].row}).` : ''}`,
        `${records.length.toLocaleString('en-US')} records imported.${bad.length ? ` ${bad.length} rows without a taxon or readable coordinates were skipped (the first: row ${bad[0].row}).` : ''}`));
      if (orphans) renderOrphans();
    } else {
      const { visits, bad } = Records.readVisits(pending.tab.rows, pending.map, opts);
      if (mode === 'replace') state.visits = [];
      state.visits = state.visits.concat(visits);
      const tot = visits.reduce((a, v) => a + v.n, 0);
      showMessage('b2OwnMsg', bad.length ? 'warning' : 'success', L2(`${visits.length.toLocaleString('en-US')} filas de visitas importadas (${tot.toLocaleString('en-US')} visitas).${bad.length ? ` ${bad.length} filas incompletas se omitieron (la primera: fila ${bad[0].row}).` : ''}`,
        `${visits.length.toLocaleString('en-US')} visit rows imported (${tot.toLocaleString('en-US')} visits).${bad.length ? ` ${bad.length} incomplete rows were skipped (the first: row ${bad[0].row}).` : ''}`));
    }
    pending = null; renderMapping();
    changed();
  }
  /* names in the user's table that no entry of the study list claims */
  function renderOrphans() {
    const box = el('b2Orphans');
    const orph = Records.orphanNames(state.raw);
    if (!orph.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<h3>${L2('Nombres que no están en la lista', 'Names not in the list')}</h3>
      <p class="hint">${L2('Sus registros no entran a los análisis hasta que pertenezcan a una entrada. Añádelos como planta o como visitante, o déjalos fuera.', 'Their records do not enter the analyses until they belong to an entry. Add them as a plant or as a visitor, or leave them out.')}</p>
      <div class="table-scroll"><table class="map-table"><thead><tr><th>${L2('Nombre', 'Name')}</th><th class="num">${L2('Registros', 'Records')}</th><th>${L2('Añadir como', 'Add as')}</th></tr></thead><tbody>
      ${orph.slice(0, 60).map((o, i) => `<tr><td>${TX().italic(o.name)}</td><td class="num">${o.n}</td><td><select data-orph="${i}"><option value="">${T('dejar fuera', 'leave out')}</option><option value="plant"${o.role === 'plant' ? ' selected' : ''}>${T('planta', 'plant')}</option><option value="poll"${o.role === 'poll' ? ' selected' : ''}>${T('visitante', 'visitor')}</option></select></td></tr>`).join('')}
      </tbody></table></div><div class="btn-row"><button class="btn btn-secondary btn-sm" id="b2OrphAdd">${L2('Añadir a la lista', 'Add to the list')}</button></div>`;
    el('b2OrphAdd').addEventListener('click', () => {
      els('#b2Orphans select').forEach(s => { if (s.value) addNames(s.value, orph[+s.dataset.orph].name); });
      Records.attach(state.raw, state.taxa);
      renderOrphans(); changed();
    });
  }
  function template() {
    const cols = ownKind === 'presence'
      ? ['taxon', 'latitude', 'longitude', 'date', 'elevation', 'locality', 'state', 'country', 'wild_or_cultivated', 'role', 'notes']
      : ['plant', 'visitor', 'visits', 'site', 'date', 'latitude', 'longitude', 'interaction_type', 'notes'];
    const row = ownKind === 'presence'
      ? ['Sechium compositum', '15.2345', '-92.3456', '2024-09-14', '1250', 'Rancho El Aguacate', 'Chiapas', 'MX', 'silvestre', 'planta', '']
      : ['Sechium compositum', 'Trigona fulviventris', '12', 'Sitio 1', '2024-09-14', '15.2345', '-92.3456', 'néctar', '15 min de observación'];
    download('﻿' + cols.join(',') + '\r\n' + row.join(',') + '\r\n', ownKind === 'presence' ? 'plantilla_registros.csv' : 'plantilla_visitas.csv', 'text/csv;charset=utf-8');
  }

  /* ---------------- practice data ---------------- */
  function loadExample(id) {
    const S = Examples.STUDIES[id];
    const p = TX().PRESETS.find(x => x.id === S.preset);
    state.taxa = [];
    p.plants.forEach(n => state.taxa.push(Object.assign(TX().entry(n, 'plant'), { status: 'example' })));
    p.polls.forEach(n => state.taxa.push(Object.assign(TX().entry(n, 'poll'), { status: 'example' })));
    state.raw = Examples.build(id, state.taxa);
    state.visits = Examples.visits(id);
    state.interactions = [];
    state.fetchMeta = {};
    state.example = id;
    renderCountries(p.countries);
    els('.preset').forEach(b => b.classList.toggle('on', b.dataset.preset === p.id));
    clearMessages('b2ListMsg');
    notice('b2ListMsg', 'warning', L2(`Datos de práctica cargados: <b>${state.raw.length.toLocaleString('en-US')} registros y ${state.visits.length} filas de visitas FICTICIOS</b>, generados por el programa. No se consultó internet. Llevan errores sembrados a propósito para el Bloque 3.`,
      `Practice data loaded: <b>${state.raw.length.toLocaleString('en-US')} FICTIONAL records and ${state.visits.length} visit rows</b>, generated by the program. The internet was not queried. They carry errors seeded on purpose for Block 3.`));
    changed();
  }

  /* ---------------- summary ---------------- */
  function renderSummary() {
    const R = state.raw;
    const card = el('b2SummaryCard');
    if (!R.length && !state.visits.length) { el('b2Tiles').innerHTML = `<p class="hint">${L2('Aún no hay registros.', 'No records yet.')}</p>`; el('b2Table').innerHTML = ''; return; }
    const years = R.map(r => r.y).filter(Boolean);
    const ccs = new Set(R.map(r => r.cc || r.country).filter(Boolean));
    const bySrc = s => R.filter(r => r.src === s).length;
    statTiles('b2Tiles', [
      [T('Registros', 'Records'), R.length.toLocaleString('en-US'), T(`GBIF ${bySrc('gbif').toLocaleString('en-US')} · propios ${bySrc('own').toLocaleString('en-US')}${bySrc('example') ? ' · práctica ' + bySrc('example').toLocaleString('en-US') : ''}`, `GBIF ${bySrc('gbif').toLocaleString('en-US')} · own ${bySrc('own').toLocaleString('en-US')}${bySrc('example') ? ' · practice ' + bySrc('example').toLocaleString('en-US') : ''}`)],
      [T('Plantas · visitantes', 'Plants · visitors'), `${state.taxa.filter(t => t.role === 'plant').length} · ${state.taxa.filter(t => t.role === 'poll').length}`, T('entradas de la lista', 'list entries')],
      [T('Países', 'Countries'), ccs.size, [...ccs].slice(0, 6).join(' ')],
      [T('Años', 'Years'), years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '—', T(`${fmtPct(years.length / Math.max(1, R.length), 0)} con año`, `${fmtPct(years.length / Math.max(1, R.length), 0)} with year`)],
      [T('Visitas propias', 'Own visits'), state.visits.reduce((a, v) => a + v.n, 0).toLocaleString('en-US'), T(`${state.visits.length} filas`, `${state.visits.length} rows`)],
      [T('Interacciones publicadas', 'Published interactions'), state.interactions.length.toLocaleString('en-US'), ''],
    ]);
    const rows = state.taxa.map(t => {
      const rs = R.filter(r => r.taxonId === t.id);
      const ys = rs.map(r => r.y).filter(Boolean);
      const sp = new Set(rs.map(r => r.species).filter(Boolean));
      return {
        role: t.role, name: TX().label(t), rank: t.resolved && t.resolved.rank, n: rs.length,
        gbif: rs.filter(r => r.src === 'gbif').length, own: rs.filter(r => r.src === 'own').length,
        sp: sp.size, years: ys.length ? `${Math.min(...ys)}–${Math.max(...ys)}` : '—',
        dated: rs.length ? rs.filter(r => r.m).length / rs.length : null,
        meta: state.fetchMeta[t.id],
      };
    });
    buildTable('b2Table', [
      { key: 'role', label: T('Papel', 'Role'), html: true, get: r => `<span class="role-tag ${r.role}">${T(...TX().ROLE[r.role])}</span>` },
      { key: 'name', label: T('Entrada', 'Entry'), html: true, get: r => TX().italic(r.name, r.rank) },
      { key: 'n', label: T('Registros', 'Records'), num: true, fmt: v => v.toLocaleString('en-US') },
      { key: 'gbif', label: 'GBIF', num: true, get: r => (r.meta && r.meta.truncated ? `${r.gbif.toLocaleString('en-US')} / ${r.meta.total.toLocaleString('en-US')}` : r.gbif.toLocaleString('en-US')) },
      { key: 'own', label: T('Propios', 'Own'), num: true },
      { key: 'sp', label: T('Especies', 'Species'), num: true },
      { key: 'years', label: T('Años', 'Years') },
      { key: 'dated', label: T('Con mes', 'With month'), num: true, get: r => (r.dated == null ? '—' : fmtPct(r.dated, 0)) },
    ], rows);
    card.style.display = '';
  }

  /* everything that depends on the data is redrawn and saved together */
  function changed(persist) {
    Records.attach(state.raw, state.taxa);
    renderLists(); renderSummary(); renderInteractions();
    state.clean = null;                      // Block 3 must run again on the new data
    const ready = state.raw.length > 0;
    [3, 4, 5, 6, 7, 8, 10].forEach(n => enableStep(n, ready && STEPS.find(s => s.n === n).ready));
    enableStep(9, (ready || state.visits.length > 0 || state.interactions.length > 0) && STEPS.find(s => s.n === 9).ready);
    document.dispatchEvent(new CustomEvent('datachange'));
    if (persist !== false) save();
  }

  /* ---------------- wiring ---------------- */
  function wire() {
    renderPresets(); renderCountries(['MX']);
    el('b2Presets').addEventListener('click', e => { const b = e.target.closest('.preset'); if (b) usePreset(b.dataset.preset); });
    const add = role => { const inp = el(role === 'plant' ? 'b2PlantIn' : 'b2PollIn'); if (addNames(role, inp.value)) inp.value = ''; };
    el('b2PlantAdd').addEventListener('click', () => add('plant'));
    el('b2PollAdd').addEventListener('click', () => add('poll'));
    el('b2PlantIn').addEventListener('keydown', e => { if (e.key === 'Enter') add('plant'); });
    el('b2PollIn').addEventListener('keydown', e => { if (e.key === 'Enter') add('poll'); });
    ['b2PlantList', 'b2PollList'].forEach(id => {
      el(id).addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) removeTaxon(b.dataset.rm); });
      el(id).addEventListener('change', e => {
        const s = e.target.closest('[data-cand]'); if (!s) return;
        const t = state.taxa.find(x => x.id === s.dataset.cand);
        const c = t && t.candidates.find(x => String(x.key) === s.value);
        if (c) { t.resolved = c; t.key = String(c.status).toUpperCase() === 'SYNONYM' && c.acceptedKey ? c.acceptedKey : c.key; t.count = null; state.raw = state.raw.filter(r => !(r.taxonId === t.id && r.src === 'gbif')); changed(); }
      });
    });
    el('b2Resolve').addEventListener('click', resolveAll);
    el('b2Clear').addEventListener('click', () => { state.taxa = []; state.raw = []; state.interactions = []; state.visits = []; state.fetchMeta = {}; els('.preset').forEach(b => b.classList.remove('on')); clearMessages('b2ListMsg'); el('b2Progress').innerHTML = ''; changed(); });
    el('b2RegionBtns').addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      if (b.dataset.region === 'none') els('#b2Countries input').forEach(i => { i.checked = false; });
      else { const items = els(`#b2Countries label[data-region="${b.dataset.region}"] input`); const all = items.every(i => i.checked); items.forEach(i => { i.checked = !all; }); }
      syncRegionChips(); save();
    });
    el('b2Countries').addEventListener('change', () => { syncRegionChips(); save(); });
    el('b2Count').addEventListener('click', countAll);
    el('b2Fetch').addEventListener('click', fetchAll);
    el('b2Stop').addEventListener('click', () => { if (abort) abort.abort(); });
    el('b2Globi').addEventListener('click', searchInteractions);
    els('#b2PracticeBox [data-example]').forEach(b => b.addEventListener('click', () => loadExample(b.dataset.example)));
    /* own data */
    el('b2OwnTabs').addEventListener('click', e => {
      const b = e.target.closest('.lab-tab'); if (!b) return;
      ownKind = b.dataset.kind;
      els('#b2OwnTabs .lab-tab').forEach(x => x.classList.toggle('on', x === b));
      if (pending) { pending.map = null; renderMapping(); }
    });
    el('b2File').addEventListener('change', e => { const f = e.target.files[0]; if (f) readFile(f); e.target.value = ''; });
    const drop = el('b2Drop');
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) readFile(f); });
    el('b2PasteRead').addEventListener('click', () => {
      const t = el('b2Paste').value;
      if (!t.trim()) return;
      const pm = TableIO.parseMatrix(t);
      prepare([{ name: T('texto pegado', 'pasted text'), matrix: pm.matrix }], T('texto pegado', 'pasted text'));
    });
    el('b2Map').addEventListener('change', e => {
      if (!pending) return;
      if (e.target.id === 'b2Sheet') { pending.sheet = +e.target.value; pending.map = null; renderMapping(); return; }
      if (e.target.id === 'b2Header') { pending.header = e.target.checked; pending.map = null; renderMapping(); return; }
      const f = e.target.dataset.field;
      if (f) { pending.map[f] = e.target.value || undefined; renderMapping(); }
    });
    el('b2Map').addEventListener('click', e => { if (e.target.closest('#b2Import')) doImport(); });
    el('b2Template').addEventListener('click', template);
    /* summary, project */
    el('b2Csv').addEventListener('click', () => {
      const cols = ['id', 'src', 'role', 'taxonId', 'name', 'species', 'genus', 'family', 'lat', 'lon', 'unc', 'elev', 'cc', 'stateProvince', 'locality', 'y', 'm', 'd', 'basis', 'inst', 'dataset', 'datasetKey', 'license', 'estab', 'repro', 'remarks', 'issues', 'gbifKey'];
      download(TableIO.toCSV(state.raw, cols), 'registros_crudos.csv', 'text/csv;charset=utf-8');
    });
    el('b2Save').addEventListener('click', () => download(JSON.stringify(project()), `pollinationpro_${new Date().toISOString().slice(0, 10)}.json`, 'application/json'));
    el('b2Open').addEventListener('change', async e => {
      const f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      try {
        const p = JSON.parse(await f.text());
        if (p.app !== 'PollinationPro') throw new Error('not a project');
        applyProject(p);
        notice('b2Messages', 'success', L2(`Proyecto abierto: ${state.taxa.length} nombres y ${state.raw.length.toLocaleString('en-US')} registros (guardado el ${esc(String(p.saved || '').slice(0, 10))}).`, `Project opened: ${state.taxa.length} names and ${state.raw.length.toLocaleString('en-US')} records (saved on ${esc(String(p.saved || '').slice(0, 10))}).`));
        save();
      } catch (err) { notice('b2Messages', 'error', L2('Ese archivo no es un proyecto de PollinationPro.', 'That file is not a PollinationPro project.')); }
    });
    el('b2Next').addEventListener('click', () => { if (state.raw.length) goStep(3); else notice('b2Messages', 'warning', L2('Primero carga registros: de GBIF, propios o de práctica.', 'First load records: from GBIF, your own or practice ones.')); });
    document.addEventListener('langchange', () => { renderPresets(); renderCountries(); renderLists(); renderSummary(); renderInteractions(); renderMapping(); renderOrphans(); });
    changed(false);
    restore().then(ok => {
      if (!ok) return;
      notice('b2Messages', 'info', L2(`Se recuperó la sesión anterior: ${state.taxa.length} nombres y ${state.raw.length.toLocaleString('en-US')} registros.`, `The previous session was recovered: ${state.taxa.length} names and ${state.raw.length.toLocaleString('en-US')} records.`));
      document.dispatchEvent(new CustomEvent('restored'));
    });
  }
  document.addEventListener('DOMContentLoaded', wire);

  Object.assign(B2, { addNames, usePreset, resolveAll, countAll, fetchAll, searchInteractions, loadExample, changed, save, project, applyProject, filters, REGIONS, countryName, _pending: () => pending, _setKind: k => { ownKind = k; }, _prepare: prepare, _doImport: doImport });
  window.B2 = B2;
})();
