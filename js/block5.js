/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 5: spatial co-occurrence (the interface).
   The engine is js/cooc.js. The block runs the cell test for every plant ×
   visitor pair at once, draws the pair matrix, and for the pair the user
   picks shows the null distribution, the sensitivity to the cell size, the
   nearest-neighbour test and the overlap of the ranges. */

const B5 = {};

(function () {
  const V = n => `var(--${n})`;
  const opt = { size: 0.25, mode: 'target', alpha: 0.05, adjust: true, nSim: 199 };
  try { Object.assign(opt, JSON.parse(localStorage.getItem('pollinationpro:cooc') || '{}')); } catch (e) { /* first visit */ }
  const keep = () => { try { localStorage.setItem('pollinationpro:cooc', JSON.stringify(opt)); } catch (e) { /* ignore */ } };
  let res = null, sel = null, sens = null, nn = null, rg = null;

  const VERD = {
    positive: ['más de lo esperado', 'more than expected', 'good', '+'],
    negative: ['menos de lo esperado', 'less than expected', 'bad', '−'],
    random: ['al azar', 'at random', 'ok', '·'],
    unclassified: ['sin clasificar', 'unclassified', 'warn', '?'],
  };
  const verdictOf = x => (opt.adjust ? x.verdictAdj : x.verdict);
  const vt = v => T(VERD[v][0], VERD[v][1]);

  /* ---------------- running ---------------- */
  function run() {
    const C = B3.ensure();
    if (!C || !C.records.length) return;
    const recs = C.records;
    res = Cooc.pairs(recs, opt.size, opt.mode === 'land' ? 'land' : 'target', { alpha: opt.alpha });
    if (!res) { notice('b5Msg', 'warning', T('La rejilla es demasiado fina para el universo de «toda la tierra» en esta extensión; usa celdas más grandes o el grupo objetivo.', 'The grid is too fine for the "all land" universe in this extent; use larger cells or the target group.')); return; }
    state.cooc = { opt: Object.assign({}, opt), res, date: new Date().toISOString() };
    if (!sel || !res.pairs.some(p => p.plant === sel.plant && p.visitor === sel.visitor)) {
      /* the first pair to look at: the plant and visitor with most shared cells */
      const best = res.pairs.slice().sort((a, b) => b.shared - a.shared)[0];
      sel = best ? { plant: best.plant, visitor: best.visitor } : null;
    }
    render();
  }

  function render() {
    clearMessages('b5Msg');
    const P = res.pairs;
    const count = v => P.filter(x => verdictOf(x) === v).length;
    statTiles('b5Tiles', [
      [T('Universo', 'Universe'), res.N.toLocaleString('en-US') + T(' celdas', ' cells'), `${opt.size}° · ${opt.mode === 'land' ? T('toda la tierra', 'all land') : T('grupo objetivo', 'target group')}`],
      [T('Pares probados', 'Pairs tested'), P.length, `${res.plants.length} × ${res.visitors.length}`],
      [T('Más de lo esperado', 'More than expected'), count('positive'), '', count('positive') ? 'ok' : ''],
      [T('Menos de lo esperado', 'Less than expected'), count('negative'), ''],
      [T('Al azar', 'At random'), count('random'), ''],
      [T('Sin clasificar', 'Unclassified'), count('unclassified'), T('esperado < 1 celda', 'expected < 1 cell')],
    ]);
    drawMatrix();
    renderTable();
    renderPair();
    Fig.decorate(el('panel-5'));
  }

  /* ---------------- the pair matrix ---------------- */
  function drawMatrix() {
    const svg = el('b5Matrix');
    const rows = res.plants, cols = res.visitors;
    const cw = Math.max(46, Math.min(90, 560 / Math.max(1, cols.length))), ch = 30;
    const left = 12 + Math.max(...rows.map(s => s.length)) * 6.4, top = 22 + Math.max(...cols.map(s => s.length)) * 5.2;
    const W = Math.max(left + cols.length * cw + 20, 560), H = top + rows.length * ch + 46;
    /* a matrix of two visitors must not stretch across the page: it is drawn at its natural size, up to the pane */
    svg.style.maxWidth = Math.round(Math.max(W, 520) * 1.25) + 'px';
    Plot.clear(svg);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    /* the matrix of pairs is the plot area, for the figure studio */
    svg.setAttribute('data-plot', [left, top, cols.length * cw, rows.length * ch].map(v => +v.toFixed(2)).join(' '));
    const add = (tag, a, text, parent) => { const n = svgEl(tag, a, text); (parent || svg).appendChild(n); return n; };
    cols.forEach((c, j) => {
      const x = left + j * cw + cw / 2;
      add('text', { x, y: top - 8, 'font-size': 10.5, class: 'art-txt', 'font-style': 'italic', transform: `rotate(-40 ${x} ${top - 8})` }, c);
    });
    rows.forEach((r, i) => add('text', { x: left - 8, y: top + i * ch + ch / 2 + 4, 'font-size': 10.5, 'text-anchor': 'end', class: 'art-txt', 'font-style': 'italic' }, r));
    res.pairs.forEach(p => {
      const i = rows.indexOf(p.plant), j = cols.indexOf(p.visitor);
      const x = left + j * cw, y = top + i * ch;
      const v = verdictOf(p);
      const mag = isFinite(p.ses) ? Math.min(1, Math.abs(p.ses) / 4) : 0;
      const fill = v === 'unclassified' ? V('bg-soft') : p.ses >= 0 ? V('primary') : V('rose');
      const g = add('g', { 'data-pair': `${p.plant}|${p.visitor}`, style: 'cursor:pointer' });
      add('rect', { x: x + 1, y: y + 1, width: cw - 2, height: ch - 2, rx: 4, fill, opacity: v === 'unclassified' ? 1 : (0.12 + 0.78 * mag).toFixed(2) }, null, g);
      if (sel && sel.plant === p.plant && sel.visitor === p.visitor) add('rect', { x: x + 1, y: y + 1, width: cw - 2, height: ch - 2, rx: 4, fill: 'none', stroke: V('text'), 'stroke-width': 2 }, null, g);
      if (v === 'positive' || v === 'negative') add('rect', { x: x + 3, y: y + 3, width: cw - 6, height: ch - 6, rx: 3, fill: 'none', stroke: V('text'), 'stroke-width': 1.2, 'stroke-dasharray': '3 2' }, null, g);
      add('text', { x: x + cw / 2, y: y + ch / 2 + 4, 'font-size': 11, 'text-anchor': 'middle', class: 'art-txt', 'font-weight': v === 'positive' || v === 'negative' ? 700 : 400 }, v === 'unclassified' ? '?' : (isFinite(p.ses) ? fmtFixed(p.ses, 1) : ''), g);
    });
    /* legend: one group (data-role="legend"), each entry (swatch and label) with its data-li */
    const ly = H - 22;
    const lg = add('g', { 'data-role': 'legend' });
    [[V('primary'), T('agregación (EEF > 0)', 'aggregation (SES > 0)')], [V('rose'), T('segregación (EEF < 0)', 'segregation (SES < 0)')], [V('bg-soft'), T('sin clasificar', 'unclassified')]].forEach(([c, lab], k) => {
      add('rect', { x: 12 + k * 190, y: ly - 9, width: 12, height: 12, rx: 3, fill: c, stroke: V('border'), 'data-li': k }, null, lg);
      add('text', { x: 30 + k * 190, y: ly + 1, 'font-size': 10, class: 'art-mut', 'data-li': k }, lab, lg);
    });
    add('text', { x: 12, y: H - 5, 'font-size': 9.5, class: 'art-mut' }, T('número = EEF; intensidad del color = |EEF|; borde punteado = significativo; ? = sin clasificar', 'number = SES; colour intensity = |SES|; dotted border = significant; ? = unclassified'), lg);
  }

  /* ---------------- the table of pairs ---------------- */
  function renderTable() {
    const rows = res.pairs.slice().sort((a, b) => (isFinite(b.ses) ? b.ses : -99) - (isFinite(a.ses) ? a.ses : -99));
    buildTable('b5Table', [
      { key: 'plant', label: T('Planta', 'Plant'), html: true, get: r => Taxa.italic(r.plant) },
      { key: 'visitor', label: T('Visitante', 'Visitor'), html: true, get: r => Taxa.italic(r.visitor) },
      { key: 'n1', label: T('Celdas planta', 'Plant cells'), num: true },
      { key: 'n2', label: T('Celdas visitante', 'Visitor cells'), num: true },
      { key: 'shared', label: T('Compartidas', 'Shared'), num: true },
      { key: 'exp', label: T('Esperadas', 'Expected'), num: true, fmt: v => fmtFixed(v, 1) },
      { key: 'ses', label: T('EEF', 'SES'), num: true, fmt: v => fmtFixed(v, 2) },
      { key: 'p', label: T('p (dos colas)', 'p (two-sided)'), num: true, get: r => fmtNum(Math.min(1, 2 * Math.min(r.pLe, r.pGe)), 3) },
      { key: 'pAdj', label: T('p ajustada (BH)', 'adjusted p (BH)'), num: true, get: r => (r.pAdj == null ? '—' : fmtNum(r.pAdj, 3)) },
      { key: 'v', label: T('Veredicto', 'Verdict'), html: true, get: r => `<span class="help-tag ${VERD[verdictOf(r)][2]}">${vt(verdictOf(r))}</span>` },
      { key: 'jaccard', label: 'Jaccard', num: true, fmt: v => fmtFixed(v, 3) },
      { key: 'cover', label: T('Cobertura', 'Cover'), num: true, fmt: v => fmtPct(v, 0) },
    ], rows);
  }

  /* ---------------- the chosen pair ---------------- */
  function pairOf() { return sel && res.pairs.find(p => p.plant === sel.plant && p.visitor === sel.visitor); }
  function renderPair() {
    const p = pairOf();
    if (!p) return;
    el('b5PairName').innerHTML = `${Taxa.italic(p.plant)} × ${Taxa.italic(p.visitor)}`;
    statTiles('b5PairTiles', [
      [T('Celdas compartidas', 'Shared cells'), p.shared, T(`de ${p.n1} de la planta y ${p.n2} del visitante`, `of ${p.n1} of the plant and ${p.n2} of the visitor`)],
      [T('Esperadas por azar', 'Expected by chance'), fmtFixed(p.exp, 1), `N = ${p.N}`],
      [T('EEF', 'SES'), fmtFixed(p.ses, 2), (window.Help ? Help.tag('ses', p.ses) : '')],
      [T('p (más)', 'p (more)'), fmtNum(p.pGe, 3), T('asociación positiva', 'positive association')],
      [T('p (menos)', 'p (less)'), fmtNum(p.pLe, 3), T('asociación negativa', 'negative association')],
      [T('Cobertura', 'Cover'), fmtPct(p.cover, 0), T('de las celdas de la planta tienen al visitante', 'of the plant\'s cells hold the visitor')],
    ]);
    drawNull(p);
    runSensitivity();
    runNN();
    runRange();
  }
  function drawNull(p) {
    const svg = el('b5Null');
    const lo = Math.max(0, Math.floor(Math.min(p.shared, p.exp - 4 * Math.sqrt(Math.max(1, p.exp))))), hi = Math.max(p.shared + 2, Math.ceil(p.exp + 4 * Math.sqrt(Math.max(1, p.exp))));
    const xs = p.dist.filter(d => d[0] >= lo && d[0] <= hi);
    const ymax = Math.max(...xs.map(d => d[1])) * 1.15 || 1;
    const f = Plot.frame(svg, { W: 460, H: 240, m: { l: 44, r: 12, t: 26, b: 34 }, x: [lo - 0.7, hi + 0.7], y: [0, ymax], xlab: T('celdas compartidas', 'shared cells'), ylab: T('probabilidad', 'probability'), ylabFmt: v => v.toFixed(2) });
    Plot.bars(f, xs.map(d => d[0]), xs.map(d => d[1]), (v, i) => (xs[i][0] >= p.shared && p.shared > p.exp ? V('primary') : xs[i][0] <= p.shared && p.shared < p.exp ? V('rose') : V('text-muted')), { width: Math.max(2, Math.min(18, 300 / xs.length)), opacity: 0.75 });
    Plot.vline(f, p.shared, V('gold'), { dash: '0', width: 2.5, label: T(`observado = ${p.shared}`, `observed = ${p.shared}`) });
    Plot.vline(f, p.exp, V('text-muted'), { label: T(`esperado = ${fmtFixed(p.exp, 1)}`, `expected = ${fmtFixed(p.exp, 1)}`), row: 1 });
  }
  function runSensitivity() {
    const p = pairOf(); if (!p) return;
    const sizes = [0.1, 0.25, 0.5, 1, 2];
    const recs = state.clean.records.filter(r => r.unit === p.plant || r.unit === p.visitor || true);
    sens = Cooc.sensitivity(recs, sizes, opt.mode === 'land' ? 'land' : 'target', { alpha: opt.alpha });
    const rows = sens.map(s => { const q = s.res.pairs.find(x => x.plant === p.plant && x.visitor === p.visitor); return q ? Object.assign({ size: s.size, N: s.res.N }, q) : null; }).filter(Boolean);
    const svg = el('b5Sens');
    const yv = rows.map(r => r.ses).filter(isFinite);
    const ylo = Math.min(-2.5, ...yv) - 0.5, yhi = Math.max(2.5, ...yv) + 0.5;
    /* room on the right for the ±1.96 labels, so the largest cell's point never covers them */
    const f = Plot.frame(svg, { W: 460, H: 240, m: { l: 44, r: 12, t: 26, b: 34 }, x: [-0.3, rows.length - 0.35], y: [ylo, yhi], xt: rows.map((r, i) => i), xlabFmt: i => (rows[Math.round(i)] ? rows[Math.round(i)].size + '°' : ''), xlab: T('tamaño de celda', 'cell size'), ylab: T('EEF', 'SES') });
    Plot.vspan && f.plot.appendChild(svgEl('rect', { x: f.m.l, y: f.sy(1.96), width: f.W - f.m.l - f.m.r, height: f.sy(-1.96) - f.sy(1.96), fill: V('text-muted'), opacity: 0.08 }));
    Plot.hline(f, 1.96, V('primary'), { label: '+1.96', right: true });
    Plot.hline(f, -1.96, V('rose'), { label: '−1.96', right: true, below: true });
    const pts = rows.map((r, i) => [i, isFinite(r.ses) ? r.ses : 0]);
    Plot.line(f, pts.map(([x, y]) => [f.sx(x), f.sy(y)]), V('c1'), { width: 2 });
    Plot.dots(f, pts, V('c1'), 4);
    rows.forEach((r, i) => Plot.label(f, i, isFinite(r.ses) ? r.ses : 0, VERD[verdictOf(r)][3], { dx: 6, dy: -6, bold: true, size: 11 }));
    const robust = new Set(rows.map(verdictOf)).size === 1;
    el('b5SensNote').innerHTML = robust
      ? L2(`El veredicto es el mismo con los ${rows.length} tamaños de celda: <b>${vt(verdictOf(rows[0]))}</b>. El resultado es robusto a la escala.`, `The verdict is the same with all ${rows.length} cell sizes: <b>${vt(verdictOf(rows[0]))}</b>. The result is robust to the scale.`)
      : L2(`El veredicto cambia con la escala (${rows.map(r => `${r.size}°: ${vt(verdictOf(r))}`).join('; ')}). Repórtalo así: la asociación depende de la resolución a la que se mire.`, `The verdict changes with the scale (${rows.map(r => `${r.size}°: ${vt(verdictOf(r))}`).join('; ')}). Report it that way: the association depends on the resolution it is looked at.`);
    state.cooc.sensitivity = { pair: sel, rows: rows.map(r => ({ size: r.size, N: r.N, shared: r.shared, exp: r.exp, ses: r.ses, verdict: verdictOf(r) })) };
  }
  function runNN() {
    const p = pairOf(); if (!p) return;
    const R = state.clean.records;
    const pts = u => R.filter(r => r.unit === u).map(r => [r.lon, r.lat]);
    /* thinned to one point per km so a single dense site does not decide; the pool is every record of the study */
    const A = Cooc.thin(pts(p.plant), 1), B = Cooc.thin(pts(p.visitor), 1), pool = Cooc.thin(R.map(r => [r.lon, r.lat]), 1);
    nn = Cooc.nnTest(A, B, pool, opt.nSim, 20260927);
    if (!nn) return;
    const svg = el('b5NN');
    const all = nn.nulls.concat([nn.median]);
    const lo = Math.min(...all), hi = Math.max(...all);
    const nb = 24, w = (hi - lo) / nb || 1;
    const bins = new Array(nb).fill(0);
    nn.nulls.forEach(x => { bins[Math.min(nb - 1, Math.floor((x - lo) / w))]++; });
    const f = Plot.frame(svg, { W: 460, H: 240, m: { l: 44, r: 12, t: 26, b: 34 }, x: [lo - w, hi + w], y: [0, Math.max(...bins) * 1.15], xlab: T('mediana de la distancia al visitante más cercano (km)', 'median distance to the nearest visitor (km)'), ylab: T('simulaciones', 'simulations') });
    Plot.bars(f, bins.map((b, i) => lo + (i + 0.5) * w), bins, V('text-muted'), { width: Math.max(2, (f.sx(lo + w) - f.sx(lo)) * 0.9), opacity: 0.5 });
    Plot.vline(f, nn.median, V('gold'), { dash: '0', width: 2.5, label: T(`observada = ${fmtFixed(nn.median, 1)} km`, `observed = ${fmtFixed(nn.median, 1)} km`) });
    statTiles('b5NNTiles', [
      [T('Mediana observada', 'Observed median'), fmtFixed(nn.median, 1) + ' km', T(`${A.length} puntos de la planta`, `${A.length} plant points`)],
      [T('Mediana nula', 'Null median'), fmtFixed(nn.nullMedian, 1) + ' km', T(`${opt.nSim} simulaciones`, `${opt.nSim} simulations`)],
      [T('p (más cerca · más lejos)', 'p (closer · farther)'), fmtNum(nn.pCloser, 3) + ' · ' + fmtNum(nn.pFarther, 3), nn.pCloser < 0.05 ? T('el visitante está más cerca de lo esperado', 'the visitor is closer than expected') : nn.pFarther < 0.05 ? T('el visitante está más lejos de lo esperado', 'the visitor is farther than expected') : T('distancias como las del azar', 'distances as by chance')],
      [T('Con visitante a ≤ 10 km', 'With a visitor ≤ 10 km'), fmtPct(nn.within[1], 0), T('de los puntos de la planta', 'of the plant points')],
    ]);
    state.cooc.nn = { pair: sel, median: nn.median, nullMedian: nn.nullMedian, pCloser: nn.pCloser, pFarther: nn.pFarther, within: nn.within, nSim: opt.nSim, nPlant: A.length, nVisitor: B.length };
  }
  function runRange() {
    const p = pairOf(); if (!p) return;
    const R = state.clean.records;
    const pts = u => R.filter(r => r.unit === u).map(r => [r.lon, r.lat]);
    rg = Cooc.rangeOverlap(pts(p.plant), pts(p.visitor));
    const svg = el('b5Range');
    const all = rg.hp.concat(rg.hv);
    if (all.length < 3) { Plot.empty(svg, 460, 260, T('Hacen falta al menos tres puntos por unidad.', 'At least three points per unit are needed.')); return; }
    const box = GEO.bboxOfPoints(all, 0.1);
    const W = 460, H = 280, pr = GEO.projection(box, W, H, 10);
    Plot.clear(svg); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (tag, a, text) => { const n = svgEl(tag, a, text); svg.appendChild(n); return n; };
    GEO.WORLD.forEach(c => { if (c.a2 === 'MX') return; const d = GEO.ringsToPath(c.rings, pr, box); if (d) add('path', { d, fill: V('card-bg'), stroke: V('border-strong'), 'stroke-width': 0.5 }); });
    GEO.MX.forEach(s => { const d = GEO.ringsToPath(s.rings, pr, box); if (d) add('path', { d, fill: V('card-bg'), stroke: V('border-strong'), 'stroke-width': 0.4 }); });
    const poly = h => h.map((q, i) => (i ? 'L' : 'M') + pr.X(q[0]).toFixed(1) + ' ' + pr.Y(q[1]).toFixed(1)).join(' ') + 'Z';
    add('path', { d: poly(rg.hp), fill: V('primary'), opacity: 0.2, stroke: V('primary'), 'stroke-width': 1.6 });
    add('path', { d: poly(rg.hv), fill: V('accent'), opacity: 0.2, stroke: V('accent'), 'stroke-width': 1.6 });
    if (rg.inter.length >= 3) add('path', { d: poly(rg.inter), fill: V('gold'), opacity: 0.45, stroke: 'none' });
    pts(p.plant).forEach(q => add('circle', { cx: pr.X(q[0]).toFixed(1), cy: pr.Y(q[1]).toFixed(1), r: 1.8, fill: V('primary') }));
    pts(p.visitor).forEach(q => add('circle', { cx: pr.X(q[0]).toFixed(1), cy: pr.Y(q[1]).toFixed(1), r: 1.5, fill: V('accent') }));
    statTiles('b5RangeTiles', [
      [T('Área de la planta', 'Plant area'), Math.round(rg.areaP).toLocaleString('en-US') + ' km²', T('envolvente convexa', 'convex hull')],
      [T('Área del visitante', 'Visitor area'), Math.round(rg.areaV).toLocaleString('en-US') + ' km²', ''],
      [T('Superposición', 'Overlap'), Math.round(rg.areaI).toLocaleString('en-US') + ' km²', ''],
      [T('Área de la planta cubierta', 'Plant area covered'), fmtPct(rg.coverP, 0), T('por el área del visitante', 'by the visitor\'s area')],
    ]);
    state.cooc.range = { pair: sel, areaP: rg.areaP, areaV: rg.areaV, areaI: rg.areaI, coverP: rg.coverP, coverV: rg.coverV };
  }

  /* ---------------- showing ---------------- */
  function show() {
    B3.ensure();
    const ok = !!(state.clean && state.clean.records.some(r => r.role === 'plant') && state.clean.records.some(r => r.role === 'poll'));
    el('b5Empty').style.display = ok ? 'none' : '';
    el('b5Body').style.display = ok ? '' : 'none';
    if (!ok) return;
    el('b5Size').value = String(opt.size); el('b5Mode').value = opt.mode; el('b5Adjust').checked = opt.adjust; el('b5Sim').value = String(opt.nSim);
    run();
  }
  function wire() {
    if (!el('panel-5')) return;
    els('.soon-art', el('panel-5')).forEach(n => { n.innerHTML = Art.soon(); });
    el('b5Size').addEventListener('change', () => { opt.size = +el('b5Size').value; keep(); run(); });
    el('b5Mode').addEventListener('change', () => { opt.mode = el('b5Mode').value; keep(); run(); });
    el('b5Adjust').addEventListener('change', () => { opt.adjust = el('b5Adjust').checked; keep(); render(); });
    el('b5Sim').addEventListener('change', () => { opt.nSim = +el('b5Sim').value; keep(); runNN(); });
    el('b5Matrix').addEventListener('click', e => {
      const g = e.target.closest('[data-pair]'); if (!g) return;
      const [plant, visitor] = g.dataset.pair.split('|');
      sel = { plant, visitor };
      drawMatrix(); renderPair(); Fig.decorate(el('panel-5'));
    });
    el('b5Csv').addEventListener('click', () => {
      const rows = res.pairs.map(p => ({ plant: p.plant, visitor: p.visitor, cell_deg: opt.size, universe: opt.mode, N: p.N, plant_cells: p.n1, visitor_cells: p.n2, shared: p.shared, expected: p.exp.toFixed(3), ses: isFinite(p.ses) ? p.ses.toFixed(3) : '', p_less: p.pLe, p_more: p.pGe, p_adj_bh: p.pAdj ?? '', verdict: p.verdict, verdict_adj: p.verdictAdj, jaccard: p.jaccard, sorensen: p.sorensen, simpson: p.simpson, cover: p.cover }));
      download(TableIO.toCSV(rows), 'coocurrencia_pares.csv', 'text/csv;charset=utf-8');
    });
    document.addEventListener('stepchange', e => { if (e.detail.step === 5) show(); });
    document.addEventListener('cleanchange', () => { res = null; if (document.querySelector('#panel-5.active')) show(); });
    document.addEventListener('langchange', () => { if (res && document.querySelector('#panel-5.active')) render(); });
  }
  document.addEventListener('DOMContentLoaded', wire);

  Object.assign(B5, { run, show, opt, result: () => res, selected: () => sel });
  window.B5 = B5;
})();
