/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 9: the interaction network (the interface).
   The engine is js/network.js; the links come from the user's own visit
   observations and from the published interactions gathered in Block 2. */

const B9 = {};

(function () {
  const V = n => `var(--${n})`;
  const opt = { own: true, pub: false, visLevel: 'species', plantLevel: 'species', onlyList: true, synonyms: true, nNull: 99 };
  try { Object.assign(opt, JSON.parse(localStorage.getItem('pollinationpro:net') || '{}')); } catch (e) { /* first visit */ }
  const keep = () => { try { localStorage.setItem('pollinationpro:net', JSON.stringify(opt)); } catch (e) { /* ignore */ } };
  let N = null, focus = null;

  /* ---------------- the links ---------------- */
  function synonymise(name) {
    if (!opt.synonyms || !window.B3) return name;
    let s = name;
    (B3.prefs().synonyms || Taxa.SYNONYM_RULES.map(x => Object.assign({ on: true }, x))).filter(x => x.on).forEach(x => { s = s.replace(new RegExp('^' + x.from + '\\b'), x.to); });
    return s;
  }
  const level = (name, lv) => { const w = String(name).trim().split(/\s+/); return lv === 'genus' ? w[0] : w.slice(0, 2).join(' '); };
  function inList(plant) {
    const n = plant.toLowerCase();
    return state.taxa.filter(t => t.role === 'plant').some(t => { const k = Taxa.label(t).toLowerCase(); return n === k || n.startsWith(k + ' '); });
  }
  function links() {
    const out = [];
    if (opt.own) state.visits.forEach(v => out.push({ plant: v.plant, visitor: v.visitor, n: v.n, src: 'own' }));
    if (opt.pub) state.interactions.forEach(x => { if (!opt.onlyList || inList(x.plant)) out.push({ plant: x.plant, visitor: x.visitor, n: 1, src: 'pub', vg: x.vg }); });
    const agg = new Map();
    out.forEach(l => {
      const p = level(l.plant, opt.plantLevel), v = level(synonymise(l.visitor), opt.visLevel);
      if (!p || !v || /^(Plantae|Animalia|Insecta|Hymenoptera)$/.test(v)) return;
      const k = p + '|' + v;
      if (!agg.has(k)) agg.set(k, { plant: p, visitor: v, n: 0, vg: l.vg });
      agg.get(k).n += l.n;
    });
    return [...agg.values()];
  }

  /* ---------------- running ---------------- */
  function run() {
    clearMessages('b9Msg');
    const L = links();
    if (!L.length) { N = null; el('b9Body2').style.display = 'none'; showMessage('b9Msg', 'warning', L2('No hay interacciones con estas fuentes. Importa tus observaciones de visitas o busca las interacciones publicadas en el Bloque 2.', 'There are no interactions with these sources. Import your visit observations or search the published interactions in Block 2.')); return; }
    const M = Net2.matrix(L);
    const A = M.A;
    /* a single crop with its visitors is a common study: the plant-level
       results still hold, but the network-level indices need at least two
       plants and two visitors to mean anything */
    const full = M.rows.length >= 2 && M.cols.length >= 2;
    if (!full) showMessage('b9Msg', 'info', L2('Con una sola planta (o un solo visitante) no hay red que describir: se muestran los visitantes, sus proporciones y la completitud del muestreo; los índices de red no aplican.', 'With a single plant (or a single visitor) there is no network to describe: the visitors, their shares and the sampling completeness are shown; the network indices do not apply.'));
    const nodf = full ? Net2.nodf(A) : { nodf: NaN }, h2 = full ? Net2.h2prime(A) : { H2p: NaN };
    const mod = full ? Net2.modules(A, { restarts: 20, seed: 5 }) : { Q: NaN, n: 1, rows: M.rows.map(() => 1), cols: M.cols.map(() => 1) };
    const sp = Net2.species(A, M.rows, M.cols);
    N = { L, M, A, nodf, h2, mod, sp, conn: Net2.connectance(A), nulls: null, quantitative: opt.own && !opt.pub, full };
    if (!focus || !M.rows.includes(focus)) focus = M.rows.slice().sort((a, b) => Net2.rowSums(A)[M.rows.indexOf(b)] - Net2.rowSums(A)[M.rows.indexOf(a)])[0];
    state.network = { opt: Object.assign({}, opt), plants: M.rows.length, visitors: M.cols.length, links: L.length, visits: Net2.rowSums(A).reduce((a, b) => a + b, 0), connectance: N.conn, nodf: nodf.nodf, H2p: h2.H2p, Q: mod.Q, modules: mod.n, species: sp, focus };
    render();
  }
  function runNulls() {
    if (!N || !N.full) return;
    const b = el('b9Null'); b.disabled = true;
    /* each test keeps its own seed (11, 12, 13): letting the page repaint
       between one and the next gives the same numbers as in one go */
    const w = poWork('Modelos nulos de la red', 'Network null models');
    const step = async (f, es, en) => { if (w && window.LABG) { w.update(f, T(es, en)); await LABG.nextPaint(); } };
    poAfterPaint(async () => {
      try {
        const n = opt.nNull;
        const Nn = N;
        await step(0, `Anidamiento NODF · ${n} réplicas`, `Nestedness NODF · ${n} replicates`);
        const nodf = Net2.nullTest(Nn.A, A => Net2.nodf(A).nodf, 'curveball', n, 11);
        await step(1 / 3, Nn.quantitative ? `Especialización H₂′ · ${n} réplicas` : 'Especialización H₂′', Nn.quantitative ? `Specialisation H₂′ · ${n} replicates` : 'Specialisation H₂′');
        const h2 = Nn.quantitative ? Net2.nullTest(Nn.A, A => Net2.h2prime(A).H2p, 'pairing', n, 12) : null;
        await step(2 / 3, `Modularidad Q · ${Math.min(n, 49)} réplicas`, `Modularity Q · ${Math.min(n, 49)} replicates`);
        const q = Net2.nullTest(Nn.A, A => Net2.modules(A, { restarts: 3, seed: 1 }).Q, Nn.quantitative ? 'pairing' : 'curveball', Math.min(n, 49), 13);
        /* the network may have been rebuilt meanwhile: its old tests do not apply */
        if (N !== Nn) { if (w) w._failed = true; return; }
        N.nulls = { nodf, h2, q };
        state.network.nulls = { nodf: slim(N.nulls.nodf), h2: N.nulls.h2 ? slim(N.nulls.h2) : null, q: slim(N.nulls.q), n };
        renderTiles();
      } finally { b.disabled = !(N && N.full); }
    }, w);
  }
  const slim = t => ({ obs: t.obs, mean: t.mean, sd: t.sd, z: t.z, pGreater: t.pGreater, pLess: t.pLess });

  /* ---------------- rendering ---------------- */
  function render() {
    el('b9Body2').style.display = '';
    el('b9Null').disabled = !N.full;
    renderTiles();
    drawGraph(); drawMatrix(); renderSpecies();
    el('b9Plant').innerHTML = N.M.rows.map(p => `<option${p === focus ? ' selected' : ''}>${esc(p)}</option>`).join('');
    renderFocus();
    Fig.decorate(el('panel-9'));
  }
  function renderTiles() {
    const nl = N.nulls;
    const z = t => (t ? ` · z = ${fmtFixed(t.z, 2)}, p = ${fmtNum(Math.min(t.pGreater, t.pLess) * 2 > 1 ? 1 : Math.min(t.pGreater, t.pLess) * 2, 3)}` : '');
    statTiles('b9Tiles', [
      [T('Plantas · visitantes', 'Plants · visitors'), `${N.M.rows.length} · ${N.M.cols.length}`, T(`${N.L.length} vínculos`, `${N.L.length} links`)],
      [T('Visitas', 'Visits'), Net2.rowSums(N.A).reduce((a, b) => a + b, 0).toLocaleString('en-US'), N.quantitative ? T('observadas', 'observed') : T('registros publicados cuentan 1', 'published records count 1')],
      [T('Conectancia', 'Connectance'), fmtFixed(N.conn, 3), Help.tag('connectance', N.conn)],
      [T('Anidamiento NODF', 'Nestedness NODF'), fmtFixed(N.nodf.nodf, 1), (nl ? z(nl.nodf).replace(/^ · /, '') : T('sin modelo nulo aún', 'no null model yet'))],
      [T('Especialización H₂′', 'Specialisation H₂′'), N.quantitative ? fmtFixed(N.h2.H2p, 3) : '—', N.quantitative ? Help.tag('h2', N.h2.H2p) + (nl && nl.h2 ? z(nl.h2) : '') : T('requiere conteos de visitas', 'needs visit counts')],
      [T('Modularidad Q', 'Modularity Q'), fmtFixed(N.mod.Q, 3), T(`${N.mod.n} módulos`, `${N.mod.n} modules`) + (nl ? z(nl.q) : '')],
    ]);
  }
  /* the bipartite graph: visitors above, plants below, ordered by module */
  function drawGraph() {
    const svg = el('b9Graph');
    const { rows, cols, A } = N.M;
    const r = Net2.rowSums(A), c = Net2.colSums(A);
    const ordR = rows.map((_, i) => i).sort((a, b) => N.mod.rows[a] - N.mod.rows[b] || r[b] - r[a]);
    const ordC = cols.map((_, j) => j).sort((a, b) => N.mod.cols[a] - N.mod.cols[b] || c[b] - c[a]);
    const W = Math.max(640, Math.max(rows.length, cols.length) * 46), H = 420, yT = 140, yB = 320;
    Plot.clear(svg); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const xR = k => 30 + (k + 0.5) * (W - 60) / rows.length, xC = k => 30 + (k + 0.5) * (W - 60) / cols.length;
    const maxA = Math.max(...A.map(row => Math.max(...row)));
    const modColor = m => `var(--c${((m - 1) % 10) + 1})`;
    const add = (tag, a, text) => { const n = svgEl(tag, a, text); svg.appendChild(n); return n; };
    ordR.forEach((i, ki) => ordC.forEach((j, kj) => {
      if (!A[i][j]) return;
      const same = N.mod.rows[i] === N.mod.cols[j];
      add('path', { d: `M${xC(kj).toFixed(1)} ${yT} C ${xC(kj).toFixed(1)} ${(yT + yB) / 2} ${xR(ki).toFixed(1)} ${(yT + yB) / 2} ${xR(ki).toFixed(1)} ${yB}`, fill: 'none', stroke: same ? modColor(N.mod.rows[i]) : V('text-muted'), 'stroke-width': (0.6 + 5 * Math.sqrt(A[i][j] / maxA)).toFixed(2), opacity: same ? 0.55 : 0.25 });
    }));
    const rmax = Math.max(...r), cmax = Math.max(...c);
    ordC.forEach((j, k) => {
      const h = 6 + 26 * Math.sqrt(c[j] / cmax);
      add('rect', { x: xC(k) - 7, y: yT - h, width: 14, height: h, rx: 3, fill: modColor(N.mod.cols[j]) });
      add('text', { x: xC(k), y: yT - h - 5, 'font-size': 9.5, class: 'art-txt', 'font-style': 'italic', 'text-anchor': 'start', transform: `rotate(-50 ${xC(k)} ${yT - h - 5})` }, cols[j]);
    });
    ordR.forEach((i, k) => {
      const h = 6 + 26 * Math.sqrt(r[i] / rmax);
      add('rect', { x: xR(k) - 7, y: yB, width: 14, height: h, rx: 3, fill: modColor(N.mod.rows[i]), opacity: 0.85 });
      add('text', { x: xR(k), y: yB + h + 12, 'font-size': 9.5, class: 'art-txt', 'font-style': 'italic', 'text-anchor': 'end', transform: `rotate(-40 ${xR(k)} ${yB + h + 12})` }, rows[i]);
    });
    add('text', { x: 8, y: yT - 4, 'font-size': 9, class: 'art-mut' }, T('visitantes', 'visitors'));
    add('text', { x: 8, y: yB + 12, 'font-size': 9, class: 'art-mut' }, T('plantas', 'plants'));
  }
  /* the matrix, rows and columns sorted by degree: a nested network fills the upper-left triangle */
  function drawMatrix() {
    const svg = el('b9Matrix');
    const { rows, cols, A } = N.M;
    const deg = v => v.filter(x => x > 0).length;
    const ordR = rows.map((_, i) => i).sort((a, b) => deg(A[b]) - deg(A[a]));
    const ordC = cols.map((_, j) => j).sort((a, b) => deg(A.map(r => r[b])) - deg(A.map(r => r[a])));
    const cs = Math.max(12, Math.min(26, 520 / Math.max(rows.length, cols.length)));
    const left = 14 + Math.max(...rows.map(s => s.length)) * 6, top = 14 + Math.max(...cols.map(s => s.length)) * 5.4;
    const W = left + cols.length * cs + 20, H = top + rows.length * cs + 16;
    Plot.clear(svg); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.style.maxWidth = Math.round(W * 1.3) + 'px';
    const mx = Math.max(...A.map(r => Math.max(...r)));
    ordC.forEach((j, k) => { const x = left + k * cs + cs / 2; svg.appendChild(svgEl('text', { x, y: top - 6, 'font-size': 9.5, class: 'art-txt', 'font-style': 'italic', transform: `rotate(-55 ${x} ${top - 6})` }, cols[j])); });
    ordR.forEach((i, k) => {
      svg.appendChild(svgEl('text', { x: left - 6, y: top + k * cs + cs / 2 + 3, 'font-size': 9.5, 'text-anchor': 'end', class: 'art-txt', 'font-style': 'italic' }, rows[i]));
      ordC.forEach((j, kj) => {
        const v = A[i][j];
        svg.appendChild(svgEl('rect', { x: left + kj * cs + 0.5, y: top + k * cs + 0.5, width: cs - 1, height: cs - 1, rx: 2, fill: v ? V('primary') : V('bg-soft'), opacity: v ? (0.25 + 0.75 * Math.sqrt(v / mx)).toFixed(2) : 1 }));
      });
    });
  }
  function renderSpecies() {
    const cols = [
      { key: 'name', label: T('Especie', 'Species'), html: true, get: r => Taxa.italic(r.name) },
      { key: 'visits', label: T('Visitas', 'Visits'), num: true },
      { key: 'degree', label: T('Grado', 'Degree'), num: true },
      { key: 'ndegree', label: T('Grado normalizado', 'Normalised degree'), num: true, fmt: v => fmtFixed(v, 2) },
      { key: 'strength', label: T('Fuerza', 'Strength'), num: true, fmt: v => fmtFixed(v, 2) },
      { key: 'dprime', label: "d′", num: true, html: true, get: r => (N.quantitative ? `${fmtFixed(r.dprime, 2)} ${Help.tag('dprime', r.dprime)}` : '—') },
    ];
    buildTable('b9SpPlants', cols, N.sp.plants.slice().sort((a, b) => b.visits - a.visits));
    buildTable('b9SpVisitors', cols, N.sp.visitors.slice().sort((a, b) => b.strength - a.strength));
  }
  /* one plant: who visits it, and how complete its list of visitors is */
  function renderFocus() {
    const i = N.M.rows.indexOf(focus);
    if (i < 0) return;
    const row = N.A[i], tot = row.reduce((a, b) => a + b, 0);
    const vis = N.M.cols.map((name, j) => ({ name, n: row[j] })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);
    const svg = el('b9Share');
    const top = vis.slice(0, 14);
    const H = 40 + top.length * 22, W = 520, left = 12 + Math.max(...top.map(v => v.name.length)) * 6.2;
    Plot.clear(svg); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const mx = Math.max(...top.map(v => v.n));
    top.forEach((v, k) => {
      const y = 16 + k * 22, w = (W - left - 90) * v.n / mx;
      svg.appendChild(svgEl('text', { x: left - 6, y: y + 12, 'font-size': 10.5, 'text-anchor': 'end', class: 'art-txt', 'font-style': 'italic' }, v.name));
      svg.appendChild(svgEl('rect', { x: left, y, width: Math.max(1, w), height: 16, rx: 3, fill: V('accent'), opacity: 0.85 }));
      svg.appendChild(svgEl('text', { x: left + w + 6, y: y + 12, 'font-size': 10, class: 'art-mut' }, `${v.n} (${fmtPct(v.n / tot, 0)})`));
    });
    if (vis.length > top.length) svg.appendChild(svgEl('text', { x: left, y: H - 6, 'font-size': 9.5, class: 'art-mut' }, T(`y ${vis.length - top.length} visitantes más`, `and ${vis.length - top.length} more visitors`)));
    /* completeness: with counts of visits, rarefaction and Chao1 */
    if (N.quantitative) {
      const cm = Net2.completeness(vis.map(v => v.n));
      statTiles('b9FocusTiles', [
        [T('Visitantes registrados', 'Recorded visitors'), cm.S, T(`en ${cm.N.toLocaleString('en-US')} visitas`, `in ${cm.N.toLocaleString('en-US')} visits`)],
        [T('Chao1', 'Chao1'), fmtFixed(cm.chao1, 1), T(`${cm.f1} vistos una vez, ${cm.f2} dos veces`, `${cm.f1} seen once, ${cm.f2} twice`)],
        [T('Completitud', 'Completeness'), fmtPct(cm.completeness, 0), Help.tag('completeness', cm.completeness)],
        [T('Cobertura', 'Coverage'), fmtPct(cm.coverage, 1), T('probabilidad de que la próxima visita sea de un visitante ya visto', 'probability that the next visit is by a visitor already seen')],
      ]);
      const svg2 = el('b9Rare');
      const f = Plot.frame(svg2, { W: 460, H: 240, m: { l: 42, r: 12, t: 24, b: 36 }, x: [0, cm.N], y: [0, Math.max(cm.chao1, cm.S) * 1.15], xlab: T('visitas observadas', 'observed visits'), ylab: T('visitantes esperados', 'expected visitors') });
      Plot.line(f, cm.curve.map(([m, s]) => [f.sx(m), f.sy(s)]), V('accent'), { width: 2.2 });
      Plot.hline(f, cm.chao1, V('primary'), { label: `Chao1 = ${fmtFixed(cm.chao1, 1)}`, right: true });
      state.network.focusCompleteness = { plant: focus, S: cm.S, N: cm.N, chao1: cm.chao1, completeness: cm.completeness, coverage: cm.coverage };
      el('b9RareWrap').style.display = '';
    } else { el('b9FocusTiles').innerHTML = `<p class="hint">${L2('La completitud del muestreo necesita conteos de visitas (tus observaciones); con interacciones publicadas solo se sabe si el vínculo existe.', 'Sampling completeness needs visit counts (your observations); with published interactions it is only known whether the link exists.')}</p>`; el('b9RareWrap').style.display = 'none'; }
  }

  function show() {
    const ok = state.visits.length > 0 || state.interactions.length > 0;
    el('b9Empty').style.display = ok ? 'none' : '';
    el('b9Body').style.display = ok ? '' : 'none';
    if (!ok) return;
    el('b9Own').checked = opt.own; el('b9Pub').checked = opt.pub; el('b9VisLevel').value = opt.visLevel; el('b9PlantLevel').value = opt.plantLevel;
    el('b9OnlyList').checked = opt.onlyList; el('b9Syn').checked = opt.synonyms;
    el('b9Counts').innerHTML = L2(`${state.visits.length.toLocaleString('en-US')} filas de visitas propias · ${state.interactions.length.toLocaleString('en-US')} interacciones publicadas`, `${state.visits.length.toLocaleString('en-US')} rows of own visits · ${state.interactions.length.toLocaleString('en-US')} published interactions`);
    if (!state.visits.length && opt.own && state.interactions.length) { opt.own = false; opt.pub = true; el('b9Own').checked = false; el('b9Pub').checked = true; }
    run();
  }
  function wire() {
    if (!el('panel-9')) return;
    els('.soon-art', el('panel-9')).forEach(n => { n.innerHTML = Art.soon(); });
    const on = (id, k, prop) => el(id).addEventListener('change', () => { opt[k] = el(id)[prop || 'value']; keep(); run(); });
    on('b9Own', 'own', 'checked'); on('b9Pub', 'pub', 'checked'); on('b9VisLevel', 'visLevel'); on('b9PlantLevel', 'plantLevel'); on('b9OnlyList', 'onlyList', 'checked'); on('b9Syn', 'synonyms', 'checked');
    el('b9NullN').addEventListener('change', () => { opt.nNull = +el('b9NullN').value; keep(); });
    el('b9Null').addEventListener('click', runNulls);
    el('b9Plant').addEventListener('change', () => { focus = el('b9Plant').value; state.network.focus = focus; renderFocus(); Fig.decorate(el('panel-9')); });
    el('b9Csv').addEventListener('click', () => {
      if (!N) return;
      const rows = N.M.rows.map((p, i) => { const o = { plant: p }; N.M.cols.forEach((v, j) => { o[v] = N.A[i][j]; }); return o; });
      download(TableIO.toCSV(rows, ['plant'].concat(N.M.cols)), 'matriz_de_interacciones.csv', 'text/csv;charset=utf-8');
    });
    el('b9CsvSp').addEventListener('click', () => {
      if (!N) return;
      const rows = N.sp.plants.concat(N.sp.visitors).map(s => ({ role: s.role, species: s.name, visits: s.visits, degree: s.degree, normalised_degree: s.ndegree.toFixed(3), strength: s.strength.toFixed(3), d_prime: isFinite(s.dprime) ? s.dprime.toFixed(3) : '', module: s.role === 'plant' ? N.mod.rows[N.M.rows.indexOf(s.name)] : N.mod.cols[N.M.cols.indexOf(s.name)] }));
      download(TableIO.toCSV(rows), 'especies_de_la_red.csv', 'text/csv;charset=utf-8');
    });
    document.addEventListener('stepchange', e => { if (e.detail.step === 9) show(); });
    document.addEventListener('datachange', () => { N = null; });
    document.addEventListener('langchange', () => { if (N && document.querySelector('#panel-9.active')) render(); });
  }
  document.addEventListener('DOMContentLoaded', wire);

  Object.assign(B9, { run, runNulls, show, opt, result: () => N, links });
  window.B9 = B9;
})();
