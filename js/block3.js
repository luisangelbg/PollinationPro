/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 3: cleaning and taxonomy (the interface).
   The engine is js/clean.js; this module holds the user's choices, runs the
   engine when they change and writes the report. The result lives in
   state.clean and is what every later block analyses. */

const B3 = {};

(function () {
  const two = p => L2(p[0], p[1]);
  const KEY = 'pollinationpro:clean';
  /* the user's choices, kept between sessions */
  let P = { on: {}, centroidKm: 5, maxUncKm: 10, minDecimals: 2, minYear: 1950, areaMode: 'download', states: [], cult: {}, synonyms: null, unit: 'entry', splitInfra: false };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) P = Object.assign(P, s); } catch (e) { /* first visit */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* ignore */ } };
  let last = null;           // the last run, for the counts next to each rule

  /* ---------------- synonyms: the built-in rules plus the user's ---------------- */
  function synonyms() {
    if (!P.synonyms) P.synonyms = Taxa.SYNONYM_RULES.map(s => ({ from: s.from, to: s.to, on: true, ref: s.ref, note: s.note, builtIn: true }));
    return P.synonyms;
  }

  /* ---------------- cultivated plants, per entry ---------------- */
  function cultStats() {
    return state.taxa.filter(t => t.role === 'plant').map(t => {
      const rs = state.raw.filter(r => r.taxonId === t.id);
      const c = rs.filter(r => Clean.isCultivated(r)).length;
      const living = rs.filter(r => /LIVING_SPECIMEN/i.test(r.basis || '')).length;
      return { t, n: rs.length, c, living, share: rs.length ? c / rs.length : 0 };
    });
  }
  function cultDecision(s) {
    if (P.cult[s.t.id]) return P.cult[s.t.id];
    return s.share > 0.5 ? 'keep' : 'remove';
  }

  function params() {
    const area = { countries: [], states: P.states.slice() };
    if (P.areaMode === 'download') area.countries = (window.B2 ? B2.filters().countries : []);
    return {
      on: P.on, centroidKm: P.centroidKm, maxUncKm: P.maxUncKm, minDecimals: P.minDecimals, minYear: P.minYear, area,
      keepCultivatedFor: cultStats().filter(s => cultDecision(s) === 'keep').map(s => s.t.id),
      synonyms: synonyms(), splitInfra: P.splitInfra, unit: P.unit,
    };
  }

  /* ---------------- rendering the controls ---------------- */
  const ACTIONS = { drop: ['quitar', 'remove'], flag: ['solo marcar', 'flag only'], off: ['no aplicar', 'do not apply'], fix: ['corregir', 'correct'] };
  function renderRules() {
    const rows = Clean.RULES.map(R => {
      const cur = P.on[R.id] || R.kind;
      const opts = (R.kind === 'fix' ? ['fix', 'off'] : ['drop', 'flag', 'off']).map(a => `<option value="${a}"${a === cur ? ' selected' : ''}>${T(...ACTIONS[a])}</option>`).join('');
      const c = last ? last.count[R.id] : null;
      const n = !c ? '' : R.kind === 'fix' ? (last.fixes ? `${last.fixes} ${T('corregidos', 'corrected')}` : '0') : `${c.flagged.toLocaleString('en-US')}${c.removed ? ` <small>(${c.removed.toLocaleString('en-US')} ${T('quitados', 'removed')})</small>` : ''}`;
      return `<tr><td><b>${two(R.t)}</b><div class="hint" style="margin:0">${two(R.d)}</div></td><td><select data-rule="${R.id}" aria-label="${esc(T('Acción de la regla: ', 'Action for the rule: ') + T(R.t[0], R.t[1]))}">${opts}</select></td><td class="num">${n}</td></tr>`;
    }).join('');
    el('b3Rules').innerHTML = `<div class="table-scroll"><table class="map-table"><thead><tr><th>${L2('Regla', 'Rule')}</th><th>${L2('Acción', 'Action')}</th><th class="num">${L2('Registros', 'Records')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function renderCult() {
    const st = cultStats();
    if (!st.length) { el('b3Cult').innerHTML = `<p class="hint">${L2('No hay plantas en la lista.', 'There are no plants in the list.')}</p>`; return; }
    el('b3Cult').innerHTML = `<div class="table-scroll"><table class="map-table"><thead><tr><th>${L2('Planta', 'Plant')}</th><th class="num">${L2('Registros', 'Records')}</th><th class="num">${L2('Cultivados', 'Cultivated')}</th><th class="num">${L2('Colección viva', 'Living collection')}</th><th>${L2('Registros cultivados', 'Cultivated records')}</th></tr></thead><tbody>` +
      st.map(s => `<tr><td>${Taxa.italic(Taxa.label(s.t), s.t.resolved && s.t.resolved.rank)}</td><td class="num">${s.n.toLocaleString('en-US')}</td><td class="num">${s.c.toLocaleString('en-US')} (${fmtPct(s.share, 0)})</td><td class="num">${s.living.toLocaleString('en-US')}</td>
        <td><select data-cult="${s.t.id}" aria-label="${esc(T('Qué hacer con los cultivados de ', 'What to do with the cultivated records of ') + Taxa.label(s.t))}"><option value="remove"${cultDecision(s) === 'remove' ? ' selected' : ''}>${T('quitar (estudio silvestre)', 'remove (wild study)')}</option><option value="keep"${cultDecision(s) === 'keep' ? ' selected' : ''}>${T('conservar (estudio del cultivo)', 'keep (crop study)')}</option></select></td></tr>`).join('') + '</tbody></table></div>' +
      `<p class="hint">${L2('Las colecciones vivas (jardines botánicos, bancos de germoplasma de campo) se tratan en la regla «Fósiles y colecciones vivas».', 'Living collections (botanical gardens, field genebanks) are handled by the rule "Fossils and living collections".')}</p>`;
  }
  function renderStates() {
    const box = el('b3States');
    if (!window.GEO) return;
    box.innerHTML = GEO.MX.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => `<label><input type="checkbox" value="${s.code}"${P.states.includes(s.code) ? ' checked' : ''}> ${esc(s.name)}</label>`).join('') +
      `<button class="btn btn-ghost btn-sm" id="b3StatesNone">${L2('ninguno', 'none')}</button>`;
    el('b3AreaMode').value = P.areaMode;
  }
  function renderSyn() {
    const list = synonyms();
    el('b3Syn').innerHTML = list.length ? list.map((s, i) => `<label class="checkbox-label" style="display:flex;gap:8px;align-items:baseline"><input type="checkbox" data-syn="${i}"${s.on ? ' checked' : ''}>
      <span>${Taxa.italic(s.from)} → ${Taxa.italic(s.to)}${s.note ? ` · <span class="hint" style="margin:0">${two(s.note)}${s.ref ? ` (${esc(s.ref)})` : ''}</span>` : ''}</span>${s.builtIn ? '' : ` <button class="tx-x" data-synrm="${i}" style="border:0;background:none;cursor:pointer">✕</button>`}</label>`).join('')
      : `<p class="hint">${L2('Sin reglas de sinónimos.', 'No synonym rules.')}</p>`;
    el('b3Unit').value = P.unit;
    el('b3Infra').checked = !!P.splitInfra;
  }

  /* ---------------- running ---------------- */
  function run() {
    if (!state.raw.length) return;
    const t0 = performance.now();
    const res = Clean.run(state.raw, state.taxa, params());
    res.unit = P.unit;
    res.ms = Math.round(performance.now() - t0);
    /* the unit of analysis of every kept record */
    res.records.forEach(r => { r.unit = unitOf(r, P.unit); });
    res.dropped.forEach(r => { r.unit = unitOf(r, P.unit); });
    last = res;
    state.clean = res;
    renderRules(); renderReport();
    [4, 5, 6, 7, 8, 9].forEach(n => enableStep(n, res.records.length > 0 && STEPS.find(s => s.n === n).ready));
    document.dispatchEvent(new CustomEvent('cleanchange'));
  }
  /* the name of the unit a record belongs to */
  function unitOf(r, unit) {
    const t = state.taxa.find(x => x.id === r.taxonId);
    const entry = t ? Taxa.label(t) : r.name;
    if (unit === 'species' && r.unitSpecies) return r.unitSpecies;
    if (unit === 'entry' && P.splitInfra && r.infra && r.unitSpecies) return r.unitSpecies;
    return entry;
  }

  /* ---------------- the report ---------------- */
  function renderReport() {
    const R = last;
    el('b3Report').style.display = '';
    const n0 = state.raw.length, n1 = R.records.length;
    statTiles('b3Tiles', [
      [T('Antes', 'Before'), n0.toLocaleString('en-US'), T('registros crudos', 'raw records')],
      [T('Después', 'After'), n1.toLocaleString('en-US'), fmtPct(n1 / Math.max(1, n0), 1) + T(' conservados', ' kept')],
      [T('Quitados', 'Removed'), R.dropped.length.toLocaleString('en-US'), ''],
      [T('Coordenadas corregidas', 'Coordinates corrected'), R.fixes.toLocaleString('en-US'), T('invertidas o sin signo', 'swapped or unsigned')],
      [T('Unidades de análisis', 'Units of analysis'), new Set(R.records.map(r => r.unit)).size, T(P.unit === 'species' ? 'especies' : 'entradas', P.unit === 'species' ? 'species' : 'entries')],
    ]);
    /* the sentence for the methods section, from what was actually done */
    const used = Clean.RULES.filter(x => R.count[x.id].removed || (x.id === 'swapped' && R.fixes));
    const parts = used.map(x => `${T(x.t[0].toLowerCase(), x.t[1].toLowerCase())} (${x.id === 'swapped' ? R.fixes : R.count[x.id].removed})`);
    const syn = synonyms().filter(s => s.on);
    el('b3Text').innerHTML = `<b>${L2('Para los métodos', 'For the methods')}.</b> ` + L2(
      `De ${n0.toLocaleString('en-US')} registros se conservaron ${n1.toLocaleString('en-US')} (${fmtPct(n1 / Math.max(1, n0), 1)}). Se quitaron o corrigieron: ${parts.join('; ') || 'ninguno'}. Los centroides se evaluaron a ${P.centroidKm} km con dos definiciones (centroide de área y centro del rectángulo envolvente), la incertidumbre máxima fue de ${P.maxUncKm} km${syn.length ? ` y se aplicaron las reglas de sinónimos ${syn.map(s => `<i>${esc(s.from)}</i> → <i>${esc(s.to)}</i>${s.ref ? ` (${esc(s.ref)})` : ''}`).join(', ')}` : ''}.`,
      `Of ${n0.toLocaleString('en-US')} records, ${n1.toLocaleString('en-US')} were kept (${fmtPct(n1 / Math.max(1, n0), 1)}). Removed or corrected: ${parts.join('; ') || 'none'}. Centroids were evaluated at ${P.centroidKm} km with two definitions (area centroid and centre of the bounding box), the maximum uncertainty was ${P.maxUncKm} km${syn.length ? ` and the synonym rules ${syn.map(s => `<i>${esc(s.from)}</i> → <i>${esc(s.to)}</i>${s.ref ? ` (${esc(s.ref)})` : ''}`).join(', ')} were applied` : ''}.`);
    buildTable('b3RuleTable', [
      { key: 'r', label: T('Regla', 'Rule'), get: x => T(...x.t) },
      { key: 'a', label: T('Acción', 'Action'), get: x => T(...ACTIONS[P.on[x.id] || x.kind]) },
      { key: 'f', label: T('Alcanzados', 'Reached'), num: true, get: x => (x.id === 'swapped' ? R.fixes : R.count[x.id].flagged).toLocaleString('en-US') },
      { key: 'q', label: T('Quitados', 'Removed'), num: true, get: x => R.count[x.id].removed.toLocaleString('en-US') },
    ], Clean.RULES);
    const rowsT = state.taxa.map(t => {
      const before = state.raw.filter(r => (r.origTaxonId || r.taxonId) === t.id).length;
      const after = R.records.filter(r => r.origTaxonId === t.id).length;
      const drops = R.dropped.filter(r => r.origTaxonId === t.id);
      const top = {}; drops.forEach(r => { top[r.removedBy] = (top[r.removedBy] || 0) + 1; });
      const main = Object.keys(top).sort((a, b) => top[b] - top[a])[0];
      const into = R.merged[t.id] ? state.taxa.find(x => x.id === R.merged[t.id]) : null;
      return { t, before, after, main: main ? `${T(...Clean.RULES.find(x => x.id === main).t)} (${top[main]})` : '—', into };
    });
    buildTable('b3TaxTable', [
      { key: 'role', label: T('Papel', 'Role'), html: true, get: r => `<span class="role-tag ${r.t.role}">${T(...Taxa.ROLE[r.t.role])}</span>` },
      { key: 'n', label: T('Entrada', 'Entry'), html: true, get: r => Taxa.italic(Taxa.label(r.t), r.t.resolved && r.t.resolved.rank) + (r.into ? ` → ${Taxa.italic(Taxa.label(r.into))}` : '') },
      { key: 'before', label: T('Antes', 'Before'), num: true, fmt: v => v.toLocaleString('en-US') },
      { key: 'after', label: T('Después', 'After'), num: true, fmt: v => v.toLocaleString('en-US') },
      { key: 'main', label: T('Principal razón de baja', 'Main reason for removal') },
    ], rowsT);
    /* the units that the next blocks will compare */
    const units = new Map();
    R.records.forEach(r => {
      if (!units.has(r.unit)) units.set(r.unit, { unit: r.unit, role: r.role, n: 0, sp: new Set(), orig: new Set() });
      const u = units.get(r.unit); u.n++; if (r.speciesH) u.sp.add(r.speciesH); if (r.origName && r.speciesH && !r.origName.startsWith(r.speciesH.split(' ')[0])) u.orig.add(r.origName.split(' ').slice(0, 2).join(' '));
    });
    const ur = [...units.values()].sort((a, b) => (a.role === b.role ? b.n - a.n : a.role === 'plant' ? -1 : 1));
    buildTable('b3UnitTable', [
      { key: 'role', label: T('Papel', 'Role'), html: true, get: r => `<span class="role-tag ${r.role}">${T(...Taxa.ROLE[r.role])}</span>` },
      { key: 'unit', label: T('Unidad', 'Unit'), html: true, get: r => Taxa.italic(r.unit) },
      { key: 'n', label: T('Registros', 'Records'), num: true, fmt: v => v.toLocaleString('en-US') },
      { key: 'sp', label: T('Especies dentro', 'Species within'), num: true, get: r => r.sp.size || '—' },
      { key: 'orig', label: T('Nombres originales reunidos', 'Original names merged'), html: true, get: r => (r.orig.size ? [...r.orig].slice(0, 4).map(n => Taxa.italic(n)).join(', ') + (r.orig.size > 4 ? '…' : '') : '—') },
    ], ur);
    renderShowSelect();
    renderRecords();
  }
  function renderShowSelect() {
    const s = el('b3Show'), cur = s.value || 'dropped';
    s.innerHTML = `<option value="dropped">${T('todos los quitados', 'all removed')}</option><option value="fixed">${T('coordenadas corregidas', 'corrected coordinates')}</option>` +
      Clean.RULES.filter(x => last.count[x.id].flagged && x.id !== 'swapped').map(x => `<option value="${x.id}">${T(...x.t)} (${last.count[x.id].flagged})</option>`).join('');
    s.value = [...s.options].some(o => o.value === cur) ? cur : 'dropped';
  }
  function renderRecords() {
    const v = el('b3Show').value;
    const all = last.records.concat(last.dropped);
    const rows = v === 'dropped' ? last.dropped : v === 'fixed' ? all.filter(r => r.flags.includes('swapped')) : all.filter(r => r.flags.includes(v));
    buildTable('b3Records', [
      { key: 'unit', label: T('Unidad', 'Unit'), html: true, get: r => Taxa.italic(r.unit || r.name) },
      { key: 'lat', label: 'Lat', num: true, fmt: v => fmtFixed(v, 4) },
      { key: 'lon', label: 'Lon', num: true, fmt: v => fmtFixed(v, 4) },
      { key: 'cc', label: T('País (dice / cae)', 'Country (says / falls)'), get: r => `${Clean.ccOf(r) || '—'} / ${r.cc2 || '—'}` },
      { key: 'st', label: T('Estado', 'State'), get: r => r.stName || r.stateProvince },
      { key: 'y', label: T('Fecha', 'Date'), get: r => [r.y, r.m, r.d].filter(x => x != null).join('-') },
      { key: 'basis', label: T('Tipo', 'Type'), get: r => String(r.basis || '').toLowerCase().replace(/_/g, ' ') },
      { key: 'why', label: T('Marcas', 'Flags'), get: r => r.flags.map(f => T(...Clean.RULES.find(x => x.id === f).t)).join('; ') + (r.removedBy ? ' ✕' : '') },
      { key: 'loc', label: T('Localidad / notas', 'Locality / notes'), get: r => [r.locality, r.remarks].filter(Boolean).join(' · ').slice(0, 90) },
    ], rows, { limit: 300 });
  }

  /* ---------------- showing the block ---------------- */
  function show() {
    const has = state.raw.length > 0;
    el('b3Empty').style.display = has ? 'none' : '';
    el('b3Body').style.display = has ? '' : 'none';
    if (!has) return;
    renderRules(); renderCult(); renderStates(); renderSyn();
    ['b3CentKm', 'b3MaxUnc', 'b3MinYear'].forEach((id, i) => { el(id).value = [P.centroidKm, P.maxUncKm, P.minYear][i]; });
    el('b3MinDec').value = String(P.minDecimals);
    if (!state.clean) run(); else { last = state.clean; renderRules(); renderReport(); }
  }
  let timer = null;
  const later = () => { persist(); clearTimeout(timer); timer = setTimeout(run, 350); };

  function wire() {
    if (!el('panel-3')) return;
    els('.soon-art', el('panel-3')).forEach(n => { n.innerHTML = Art.soon(); });
    el('b3Rules').addEventListener('change', e => { const s = e.target.closest('[data-rule]'); if (s) { P.on[s.dataset.rule] = s.value; later(); } });
    el('b3Cult').addEventListener('change', e => { const s = e.target.closest('[data-cult]'); if (s) { P.cult[s.dataset.cult] = s.value; later(); } });
    [['b3CentKm', 'centroidKm'], ['b3MaxUnc', 'maxUncKm'], ['b3MinYear', 'minYear']].forEach(([id, k]) => el(id).addEventListener('change', () => { const v = parseNum(el(id).value); if (v != null) { P[k] = v; later(); } }));
    el('b3MinDec').addEventListener('change', () => { P.minDecimals = +el('b3MinDec').value; later(); });
    el('b3AreaMode').addEventListener('change', () => { P.areaMode = el('b3AreaMode').value; later(); });
    el('b3StatesToggle').addEventListener('click', () => { const b = el('b3States'); b.style.display = b.style.display === 'none' ? '' : 'none'; });
    el('b3States').addEventListener('change', () => { P.states = els('#b3States input:checked').map(i => i.value); later(); });
    el('b3States').addEventListener('click', e => { if (e.target.id === 'b3StatesNone') { P.states = []; renderStates(); later(); } });
    el('b3Syn').addEventListener('change', e => { const c = e.target.closest('[data-syn]'); if (c) { synonyms()[+c.dataset.syn].on = c.checked; later(); } });
    el('b3Syn').addEventListener('click', e => { const b = e.target.closest('[data-synrm]'); if (b) { synonyms().splice(+b.dataset.synrm, 1); renderSyn(); later(); } });
    el('b3SynAdd').addEventListener('click', () => {
      const f = el('b3SynFrom').value.trim(), t = el('b3SynTo').value.trim();
      if (!f || !t) return;
      synonyms().push({ from: f, to: t, on: true });
      el('b3SynFrom').value = ''; el('b3SynTo').value = '';
      renderSyn(); later();
    });
    el('b3Unit').addEventListener('change', () => { P.unit = el('b3Unit').value; later(); });
    el('b3Infra').addEventListener('change', () => { P.splitInfra = el('b3Infra').checked; later(); });
    el('b3Run').addEventListener('click', () => { persist(); run(); el('b3Report').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    el('b3Show').addEventListener('change', renderRecords);
    const cols = ['id', 'src', 'role', 'unit', 'name', 'origName', 'speciesH', 'lat', 'lon', 'unc', 'elev', 'cc2', 'st', 'stName', 'locality', 'y', 'm', 'd', 'basis', 'inst', 'dataset', 'datasetKey', 'estab', 'repro', 'remarks', 'gbifKey'];
    el('b3CsvKeep').addEventListener('click', () => download(TableIO.toCSV(last.records.map(r => ({ ...r, flags: r.flags.join('|') })), cols.concat(['flags'])), 'registros_depurados.csv', 'text/csv;charset=utf-8'));
    el('b3CsvDrop').addEventListener('click', () => download(TableIO.toCSV(last.dropped.map(r => ({ ...r, flags: r.flags.join('|') })), cols.concat(['removedBy', 'flags'])), 'registros_quitados.csv', 'text/csv;charset=utf-8'));
    el('b3Next').addEventListener('click', () => { const b = document.querySelector('.step-btn[data-step="4"]'); if (b && !b.disabled) goStep(4); });
    document.addEventListener('stepchange', e => { if (e.detail.step === 3) show(); });
    document.addEventListener('datachange', () => { last = null; if (document.querySelector('#panel-3.active')) show(); });
    document.addEventListener('langchange', () => { if (state.raw.length && el('b3Body').style.display !== 'none') { renderRules(); renderCult(); renderSyn(); if (last) renderReport(); } });
  }
  document.addEventListener('DOMContentLoaded', wire);

  /* the later blocks ask for the cleaned records; if nobody visited this block yet, it runs with the saved choices */
  function ensure() { if (!state.clean && state.raw.length) run(); return state.clean; }

  Object.assign(B3, { run, ensure, params, show, unitOf, prefs: () => P, lastRun: () => last });
  window.B3 = B3;
})();
