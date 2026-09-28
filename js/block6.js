/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 6: phenology and elevation (the interface).
   The engine is js/pheno.js. */

const B6 = {};

(function () {
  const V = n => `var(--${n})`;
  const opt = { corrected: false, flowersOnly: false, step: 100 };
  try { Object.assign(opt, JSON.parse(localStorage.getItem('pollinationpro:pheno') || '{}')); } catch (e) { /* first visit */ }
  const keep = () => { try { localStorage.setItem('pollinationpro:pheno', JSON.stringify(opt)); } catch (e) { /* ignore */ } };
  let A = null, E = null, sel = null;

  function run() {
    const C = B3.ensure();
    if (!C) return;
    A = Pheno.analyse(C.records, opt);
    E = Pheno.elevation(C.records, { step: opt.step });
    if (!sel || !A.pairs.some(p => p.plant === sel.plant && p.visitor === sel.visitor)) {
      const best = A.pairs.slice().sort((a, b) => b.D - a.D)[0];
      sel = best ? { plant: best.plant, visitor: best.visitor } : null;
    }
    state.pheno = { opt: Object.assign({}, opt), units: A.units.map(u => ({ unit: u.unit, role: u.role, n: u.recs.length, nTotal: u.nTotal, counts: u.counts, prof: u.prof, meanDoy: u.circ.meanDoy, R: u.circ.R, sdDays: u.circ.sdDays, Z: u.circ.Z, p: u.circ.p, bimodal: u.circ.bimodal })),
      pairs: A.pairs, effort: A.effort, nDated: A.nDated, nAll: A.nAll, elevation: E ? { units: E.units.map(u => ({ unit: u.unit, role: u.role, n: u.n, nTotal: u.nTotal, min: u.min, q25: u.q25, med: u.med, q75: u.q75, max: u.max })), pairs: E.pairs, share: E.share } : null, sel };
    render();
  }

  function render() {
    const flowering = state.clean.records.filter(r => r.role === 'plant' && /flower|flor|anthesis|antesis/i.test(r.repro || '')).length;
    statTiles('b6Tiles', [
      [T('Registros con mes', 'Records with month'), A.nDated.toLocaleString('en-US'), fmtPct(A.nDated / Math.max(1, A.nAll), 0) + T(' del total', ' of the total')],
      [T('Plantas con flor registrada', 'Plants with recorded flowers'), flowering.toLocaleString('en-US'), T('condición reproductiva', 'reproductive condition')],
      [T('Unidades', 'Units'), A.units.length, `${A.plants.length} · ${A.visitors.length}`],
      [T('Perfil', 'Profile'), opt.corrected ? T('corregido por esfuerzo', 'effort-corrected') : T('crudo', 'raw'), ''],
    ]);
    drawPhenogram();
    renderUnitTable();
    renderPairSelect();
    renderPair();
    renderPairTable();
    renderElevation();
    Fig.decorate(el('panel-6'));
  }

  /* ---------------- the phenogram: every unit × every month ---------------- */
  function drawPhenogram() {
    const svg = el('b6Phenogram');
    const U = A.units;
    const left = 14 + Math.max(...U.map(u => u.unit.length)) * 6.4, top = 36, cw = 44, ch = 24;
    const W = left + 12 * cw + 90, H = top + U.length * ch + 40;
    Plot.clear(svg); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.maxWidth = Math.round(W * 1.3) + 'px';
    const add = (tag, a, text) => { const n = svgEl(tag, a, text); svg.appendChild(n); return n; };
    for (let m = 0; m < 12; m++) add('text', { x: left + m * cw + cw / 2, y: top - 10, 'font-size': 10.5, 'text-anchor': 'middle', class: 'art-mut' }, monthName(m + 1, true));
    /* effort of the target group, as a thin strip on top */
    const emax = Math.max(1, ...A.effort);
    A.effort.forEach((e, m) => add('rect', { x: left + m * cw + 2, y: top - 6, width: cw - 4, height: 4, fill: V('text-muted'), opacity: (0.1 + 0.8 * e / emax).toFixed(2) }));
    U.forEach((u, i) => {
      const y = top + i * ch;
      add('text', { x: left - 8, y: y + ch / 2 + 4, 'font-size': 10.5, 'text-anchor': 'end', class: 'art-txt', 'font-style': 'italic' }, u.unit);
      const mx = Math.max(...u.prof) || 1;
      u.prof.forEach((p, m) => add('rect', { x: left + m * cw + 1, y: y + 1, width: cw - 2, height: ch - 2, rx: 3, fill: u.role === 'plant' ? V('primary') : V('accent'), opacity: p > 0 ? (0.08 + 0.87 * p / mx).toFixed(2) : 0.03 }));
      /* the mean date as a tick, when the unit is seasonal */
      if (u.circ.meanDoy != null && u.circ.p < 0.05) {
        const x = left + (u.circ.meanDoy - 0.5) / 365 * 12 * cw;
        add('path', { d: `M${x.toFixed(1)} ${y + 2} l4 -5 l-8 0 Z`, fill: V('text') });
      }
      add('text', { x: left + 12 * cw + 8, y: y + ch / 2 + 4, 'font-size': 10, class: 'art-mut' }, `n = ${u.recs.length}`);
    });
    add('text', { x: 12, y: H - 10, 'font-size': 9.5, class: 'art-mut' }, T('intensidad = proporción del mes en el perfil de la unidad; ▼ fecha media (si Rayleigh p < 0.05); franja gris = esfuerzo del grupo objetivo', 'intensity = share of the month in the unit\'s profile; ▼ mean date (if Rayleigh p < 0.05); grey strip = effort of the target group'));
  }

  function renderUnitTable() {
    buildTable('b6Units', [
      { key: 'role', label: T('Papel', 'Role'), html: true, get: u => `<span class="role-tag ${u.role}">${T(...Taxa.ROLE[u.role])}</span>` },
      { key: 'unit', label: T('Unidad', 'Unit'), html: true, get: u => Taxa.italic(u.unit) },
      { key: 'n', label: T('Con fecha', 'Dated'), num: true, get: u => `${u.recs.length} / ${u.nTotal}` },
      { key: 'mean', label: T('Fecha media', 'Mean date'), get: u => (u.circ.meanDoy != null ? fmtDoy(u.circ.meanDoy) : '—') },
      { key: 'R', label: 'R̄', num: true, html: true, get: u => (u.circ.R != null ? `${fmtFixed(u.circ.R, 2)} ${Help.tag('circular', u.circ.R)}` : '—') },
      { key: 'sd', label: T('DE circular (días)', 'Circular SD (days)'), num: true, get: u => (u.circ.sdDays != null && isFinite(u.circ.sdDays) ? fmtFixed(u.circ.sdDays, 0) : '—') },
      { key: 'p', label: T('Rayleigh p', 'Rayleigh p'), num: true, get: u => (u.circ.p != null ? fmtNum(u.circ.p, 3) : '—') },
      { key: 'bi', label: T('¿Dos picos?', 'Two peaks?'), get: u => (u.circ.bimodal ? T('posible', 'possible') : '') },
    ], A.units);
  }

  /* ---------------- the chosen pair ---------------- */
  function renderPairSelect() {
    const s1 = el('b6Plant'), s2 = el('b6Visitor');
    s1.innerHTML = A.plants.map(u => `<option value="${esc(u.unit)}"${sel && sel.plant === u.unit ? ' selected' : ''}>${esc(u.unit)}</option>`).join('');
    s2.innerHTML = A.visitors.map(u => `<option value="${esc(u.unit)}"${sel && sel.visitor === u.unit ? ' selected' : ''}>${esc(u.unit)}</option>`).join('');
  }
  function renderPair() {
    if (!sel) return;
    const p = A.plants.find(u => u.unit === sel.plant), v = A.visitors.find(u => u.unit === sel.visitor);
    const pr = A.pairs.find(x => x.plant === sel.plant && x.visitor === sel.visitor);
    if (!p || !v || !pr) return;
    statTiles('b6PairTiles', [
      [T('D de Schoener', 'Schoener\'s D'), fmtFixed(pr.D, 2), Help.tag('schoenerD', pr.D)],
      [T('I de Warren · O de Pianka', 'Warren\'s I · Pianka\'s O'), `${fmtFixed(pr.I, 2)} · ${fmtFixed(pr.O, 2)}`, ''],
      [T('Desfase de las fechas medias', 'Lag between mean dates'), pr.lag != null ? `${fmtFixed(pr.lag, 0)} ${T('días', 'days')}` : '—', pr.wwP != null ? `Watson–Williams p = ${fmtNum(pr.wwP, 3)}${pr.wwValid ? '' : T(' (κ < 1)', ' (κ < 1)')}` : ''],
      [T('Floración con vuelo', 'Flowering with flight'), fmtPct(pr.coverPlant, 0), T('del perfil de la planta cae en meses con registros del visitante', 'of the plant\'s profile falls in months with visitor records')],
      [T('Meses en común', 'Months in common'), pr.monthsBoth.length ? pr.monthsBoth.map(m => monthName(m, true)).join(', ') : '—', T('ambos ≥ 5 % de su perfil', 'both ≥ 5 % of their profile')],
    ]);
    drawRose(p, v);
    drawMonths(p, v);
  }
  function drawRose(p, v) {
    const svg = el('b6Rose');
    const W = 420, H = 300, cx = 150, cy = 150, R = 120;
    Plot.clear(svg); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const add = (tag, a, text) => { const n = svgEl(tag, a, text); svg.appendChild(n); return n; };
    [0.25, 0.5, 0.75, 1].forEach(k => add('circle', { cx, cy, r: R * k, fill: 'none', stroke: V('border'), 'stroke-width': 0.6 }));
    const mx = Math.max(...p.prof, ...v.prof) || 1;
    const sector = (m, frac, rr0, rr1, fill, op) => {
      const a0 = -Math.PI / 2 + m / 12 * 2 * Math.PI, a1 = a0 + 2 * Math.PI / 12;
      const r1 = rr0 + (rr1 - rr0) * Math.sqrt(frac);        // area-true: the radius grows with the square root
      const P = (a, r) => `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
      add('path', { d: `M${P(a0, rr0)} L${P(a0, r1)} A${r1} ${r1} 0 0 1 ${P(a1, r1)} L${P(a1, rr0)} A${rr0} ${rr0} 0 0 0 ${P(a0, rr0)} Z`, fill, opacity: op, stroke: V('card-bg'), 'stroke-width': 0.8 });
    };
    for (let m = 0; m < 12; m++) {
      sector(m, p.prof[m] / mx, 0, R, V('primary'), 0.5);
      sector(m, v.prof[m] / mx, 0, R, V('accent'), 0.45);
      const a = -Math.PI / 2 + (m + 0.5) / 12 * 2 * Math.PI;
      add('text', { x: cx + Math.cos(a) * (R + 14), y: cy + Math.sin(a) * (R + 14) + 3, 'font-size': 10, 'text-anchor': 'middle', class: 'art-mut' }, monthName(m + 1, true));
    }
    [[p, 'primary'], [v, 'accent']].forEach(([u, tone]) => {
      if (u.circ.meanDoy == null) return;
      const a = -Math.PI / 2 + (u.circ.meanDoy - 0.5) / 365 * 2 * Math.PI, L = R * u.circ.R;
      add('line', { x1: cx, y1: cy, x2: cx + Math.cos(a) * L, y2: cy + Math.sin(a) * L, stroke: V(tone), 'stroke-width': 3, 'stroke-linecap': 'round' });
      add('circle', { cx: cx + Math.cos(a) * L, cy: cy + Math.sin(a) * L, r: 4, fill: V(tone), stroke: V('card-bg') });
    });
    const lx = 292;
    [[p, 'primary'], [v, 'accent']].forEach(([u, tone], k) => {
      const y = 60 + k * 70;
      add('rect', { x: lx, y: y - 9, width: 12, height: 12, rx: 3, fill: V(tone), opacity: 0.7 });
      add('text', { x: lx + 18, y: y + 1, 'font-size': 11, class: 'art-txt', 'font-style': 'italic', 'font-weight': 700 }, u.unit.length > 18 ? u.unit.slice(0, 17) + '…' : u.unit);
      add('text', { x: lx + 18, y: y + 16, 'font-size': 10, class: 'art-mut' }, `${T('media', 'mean')}: ${u.circ.meanDoy != null ? fmtDoy(u.circ.meanDoy) : '—'}`);
      add('text', { x: lx + 18, y: y + 30, 'font-size': 10, class: 'art-mut' }, `R̄ = ${u.circ.R != null ? fmtFixed(u.circ.R, 2) : '—'} · n = ${u.recs.length}`);
    });
    add('text', { x: lx, y: 220, 'font-size': 9, class: 'art-mut' }, T('área del sector ∝ proporción', 'sector area ∝ proportion'));
    add('text', { x: lx, y: 233, 'font-size': 9, class: 'art-mut' }, T('flecha: vector medio (R̄)', 'arrow: mean vector (R̄)'));
  }
  function drawMonths(p, v) {
    const svg = el('b6Months');
    const ymax = Math.max(...p.prof, ...v.prof) * 1.15 || 1;
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const f = Plot.frame(svg, { W: 460, H: 260, m: { l: 42, r: 10, t: 26, b: 28 }, x: [0.4, 12.6], y: [0, ymax], xt: xs, xlabFmt: m => monthName(m, true), ylab: T('proporción', 'proportion'), ylabFmt: y => (y * 100).toFixed(0) + '%' });
    Plot.bars(f, xs, xs.map((x, i) => Math.min(p.prof[i], v.prof[i])), V('gold'), { width: 28, opacity: 0.35 });
    Plot.bars(f, xs.map(x => x - 0.17), p.prof, V('primary'), { width: 10, opacity: 0.85 });
    Plot.bars(f, xs.map(x => x + 0.17), v.prof, V('accent'), { width: 10, opacity: 0.85 });
    Plot.legend(f, [[T('planta', 'plant'), V('primary'), 'sq'], [T('visitante', 'visitor'), V('accent'), 'sq'], [T('solapamiento = D', 'overlap = D'), V('gold'), 'sq']], 10);
  }
  function renderPairTable() {
    buildTable('b6Pairs', [
      { key: 'plant', label: T('Planta', 'Plant'), html: true, get: r => Taxa.italic(r.plant) },
      { key: 'visitor', label: T('Visitante', 'Visitor'), html: true, get: r => Taxa.italic(r.visitor) },
      { key: 'D', label: T('D de Schoener', 'Schoener\'s D'), num: true, html: true, get: r => `${fmtFixed(r.D, 2)} ${Help.tag('schoenerD', r.D)}` },
      { key: 'I', label: 'I', num: true, fmt: v => fmtFixed(v, 2) },
      { key: 'O', label: 'O', num: true, fmt: v => fmtFixed(v, 2) },
      { key: 'lag', label: T('Desfase (días)', 'Lag (days)'), num: true, fmt: v => fmtFixed(v, 0) },
      { key: 'wwP', label: 'Watson–Williams p', num: true, get: r => (r.wwP == null ? '—' : fmtNum(r.wwP, 3) + (r.wwValid ? '' : ' *')) },
      { key: 'coverPlant', label: T('Floración con vuelo', 'Flowering with flight'), num: true, fmt: v => fmtPct(v, 0) },
    ], A.pairs.slice().sort((a, b) => b.D - a.D));
  }

  /* ---------------- elevation ---------------- */
  function renderElevation() {
    const box = el('b6ElevNote');
    if (!E || !E.units.length) {
      box.innerHTML = L2('Ningún registro trae altitud. Los registros de GBIF la traen solo a veces; tus registros propios pueden traerla en una columna. En el Bloque 7, al cargar un modelo digital de elevación como capa, la altitud se lee de ahí.', 'No record carries elevation. GBIF records carry it only sometimes; your own records can carry it in a column. In Block 7, loading a digital elevation model as a layer, elevation is read from it.');
      Plot.empty(el('b6Elev'), 460, 240, T('Sin altitudes', 'No elevations'));
      el('b6ElevTable').innerHTML = '';
      return;
    }
    box.innerHTML = E.share < 0.5
      ? L2(`Solo ${fmtPct(E.share, 0)} de los registros traen altitud: el perfil puede no representar a toda la unidad.`, `Only ${fmtPct(E.share, 0)} of the records carry elevation: the profile may not represent the whole unit.`)
      : L2(`${fmtPct(E.share, 0)} de los registros traen altitud.`, `${fmtPct(E.share, 0)} of the records carry elevation.`);
    const p = sel && E.units.find(u => u.unit === sel.plant), v = sel && E.units.find(u => u.unit === sel.visitor);
    const show = [p, v].filter(Boolean);
    const svg = el('b6Elev');
    if (!show.length) { Plot.empty(svg, 460, 240, T('El par elegido no tiene altitudes', 'The chosen pair has no elevations')); }
    else {
      const lo = Math.min(...show.map(u => u.min)) - 200, hi = Math.max(...show.map(u => u.max)) + 200;
      const R = 200;
      const curves = show.map(u => ({ u, z: Poll.kde1d(u.e, lo, hi, R) }));
      const ymax = Math.max(...curves.map(c => Math.max(...c.z))) * 1.15 || 1;
      const f = Plot.frame(svg, { W: 460, H: 240, m: { l: 42, r: 10, t: 26, b: 34 }, x: [lo, hi], y: [0, ymax], xlab: T('altitud (m)', 'elevation (m)'), ylab: T('densidad', 'density'), ylabFmt: () => '' });
      const xs = Array.from({ length: R }, (_, i) => lo + i * (hi - lo) / (R - 1));
      curves.forEach(({ u, z }) => {
        const tone = u.role === 'plant' ? V('primary') : V('accent');
        Plot.area(f, xs, Array.from(z), tone, 0.25);
        Plot.line(f, xs.map((x, i) => [f.sx(x), f.sy(z[i])]), tone, { width: 2 });
      });
      Plot.legend(f, show.map(u => [u.unit, u.role === 'plant' ? V('primary') : V('accent'), 'sq']), 10);
    }
    buildTable('b6ElevTable', [
      { key: 'unit', label: T('Unidad', 'Unit'), html: true, get: u => Taxa.italic(u.unit) },
      { key: 'n', label: T('Con altitud', 'With elevation'), num: true, get: u => `${u.n} / ${u.nTotal}` },
      { key: 'min', label: T('Mín.', 'Min'), num: true, fmt: v => Math.round(v) },
      { key: 'q25', label: 'Q1', num: true, fmt: v => Math.round(v) },
      { key: 'med', label: T('Mediana', 'Median'), num: true, fmt: v => Math.round(v) },
      { key: 'q75', label: 'Q3', num: true, fmt: v => Math.round(v) },
      { key: 'max', label: T('Máx.', 'Max'), num: true, fmt: v => Math.round(v) },
    ], E.units);
    const pe = sel && E.pairs.find(x => x.plant === sel.plant && x.visitor === sel.visitor);
    el('b6ElevPair').innerHTML = pe ? L2(`Solapamiento altitudinal del par: D = <b>${fmtFixed(pe.D, 2)}</b> ${Help.tag('schoenerD', pe.D)}; ${fmtPct(pe.inside, 0)} de los registros de la planta caen dentro del 90 % central del intervalo altitudinal del visitante.`, `Elevational overlap of the pair: D = <b>${fmtFixed(pe.D, 2)}</b> ${Help.tag('schoenerD', pe.D)}; ${fmtPct(pe.inside, 0)} of the plant's records fall within the central 90 % of the visitor's elevational range.`) : '';
  }

  function show() {
    B3.ensure();
    const ok = !!(state.clean && state.clean.records.length);
    el('b6Empty').style.display = ok ? 'none' : '';
    el('b6Body').style.display = ok ? '' : 'none';
    if (!ok) return;
    el('b6Corr').checked = opt.corrected; el('b6Flow').checked = opt.flowersOnly;
    run();
  }
  function wire() {
    if (!el('panel-6')) return;
    els('.soon-art', el('panel-6')).forEach(n => { n.innerHTML = Art.soon(); });
    el('b6Corr').addEventListener('change', () => { opt.corrected = el('b6Corr').checked; keep(); run(); });
    el('b6Flow').addEventListener('change', () => { opt.flowersOnly = el('b6Flow').checked; keep(); run(); });
    const pick = () => { sel = { plant: el('b6Plant').value, visitor: el('b6Visitor').value }; state.pheno.sel = sel; renderPair(); renderElevation(); Fig.decorate(el('panel-6')); };
    el('b6Plant').addEventListener('change', pick);
    el('b6Visitor').addEventListener('change', pick);
    el('b6Csv').addEventListener('click', () => {
      const rows = A.units.map(u => {
        const o = { unit: u.unit, role: u.role, n_dated: u.recs.length, n_total: u.nTotal, mean_doy: u.circ.meanDoy != null ? u.circ.meanDoy.toFixed(1) : '', R: u.circ.R != null ? u.circ.R.toFixed(3) : '', sd_days: isFinite(u.circ.sdDays) ? u.circ.sdDays.toFixed(1) : '', rayleigh_Z: u.circ.Z != null ? u.circ.Z.toFixed(3) : '', rayleigh_p: u.circ.p ?? '' };
        u.counts.forEach((c, i) => { o['n_' + MONTHS_SHORT.en[i]] = c; });
        return o;
      });
      download(TableIO.toCSV(rows), 'fenologia_unidades.csv', 'text/csv;charset=utf-8');
    });
    el('b6CsvPairs').addEventListener('click', () => download(TableIO.toCSV(A.pairs.map(p => ({ plant: p.plant, visitor: p.visitor, D: p.D.toFixed(4), I: p.I.toFixed(4), O: p.O.toFixed(4), lag_days: p.lag != null ? p.lag.toFixed(1) : '', watson_williams_p: p.wwP ?? '', ww_valid: p.wwValid, flowering_with_flight: p.coverPlant.toFixed(3), months_both: p.monthsBoth.join(' ') }))), 'fenologia_pares.csv', 'text/csv;charset=utf-8'));
    document.addEventListener('stepchange', e => { if (e.detail.step === 6) show(); });
    document.addEventListener('cleanchange', () => { A = null; if (document.querySelector('#panel-6.active')) show(); });
    document.addEventListener('langchange', () => { if (A && document.querySelector('#panel-6.active')) render(); });
  }
  document.addEventListener('DOMContentLoaded', wire);

  Object.assign(B6, { run, show, opt, result: () => A, elevationResult: () => E, selected: () => sel });
  window.B6 = B6;
})();
