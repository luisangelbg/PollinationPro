/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — the two laboratories of the home page.

   Both run the real engine (js/engine.js) on virtual data generated here
   with a seeded generator, so the same controls always give the same result.

   Lab 1 · co-occurrence and sampling bias. A virtual landscape of 36 × 24
   cells with an environmental gradient. A plant and a bee each occupy the
   cells whose environment suits them; how far apart their optima are is a
   control. Then someone samples the landscape, more along a road than away
   from it: only the sampled cells yield records. The lab runs Veech's test
   twice — with every cell as the universe and with only the sampled cells
   (the target group) — and against the truth, which in a virtual landscape
   is known.

   Lab 2 · phenological overlap. A plant flowers and a bee flies around two
   peak dates with two spreads. The lab draws records from both calendars,
   computes the circular mean, R̄ and Rayleigh's test of each, the
   Watson–Williams test between them, and the overlap of their monthly
   profiles (Schoener's D, Warren's I and Pianka's O). */

(function () {
  const P = Poll;
  const two = p => L2(p[0], p[1]);
  const V = n => `var(--${n})`;

  /* =====================================================================
     LAB 1 · co-occurrence and sampling bias
     ===================================================================== */
  const NX = 36, NY = 24;
  let seed1 = 7;

  /* the environmental gradient: warm lowlands to the south-west, cool
     highlands to the north-east, with some relief, in [0, 1] */
  function envAt(i, j, r) {
    const x = i / (NX - 1), y = j / (NY - 1);
    return Math.min(1, Math.max(0, 0.15 + 0.55 * x + 0.3 * (1 - y) + 0.12 * Math.sin(5 * x + 3 * y)));
  }
  function landscape() {
    const sep = Plot.val('l1Sep'), width = Plot.val('l1Width'), bias = Plot.val('l1Bias'), effort = Plot.val('l1Effort');
    const r = rng(seed1);
    /* the other taxa of the group (other bees, other plants of the family) that the same
       collector records wherever they sample: a separate stream, so the landscape itself
       does not change with it */
    const rOther = rng(seed1 + 101);
    const cells = [];
    /* the road: a gentle curve across the landscape */
    const roadY = i => NY * 0.62 - 0.28 * i + 3 * Math.sin(i / 5);
    const optP = 0.5 - sep / 2, optB = 0.5 + sep / 2;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const e = envAt(i, j, r);
      const sP = Math.exp(-0.5 * ((e - optP) / width) ** 2), sB = Math.exp(-0.5 * ((e - optB) / width) ** 2);
      const plant = r() < 0.85 * sP, beeHere = r() < 0.85 * sB;
      const dRoad = Math.abs(j - roadY(i));
      /* probability that anyone samples the cell: the base effort everywhere,
         plus a bonus that decays with the distance to the road, weighted by the bias */
      const pS = Math.min(1, effort * (1 - bias) + bias * Math.exp(-dRoad / 2.2));
      const sampled = r() < pS;
      const other = rOther() < 0.75;
      cells.push({ i, j, e, plant, bee: beeHere, sampled, recP: plant && sampled, recB: beeHere && sampled, recO: other && sampled });
    }
    return { cells, roadY };
  }
  function lab1() {
    const L = landscape();
    const C = L.cells;
    const all = C.length;
    const sampled = C.filter(c => c.sampled);
    /* observed records */
    const nP = C.filter(c => c.recP).length, nB = C.filter(c => c.recB).length, shared = C.filter(c => c.recP && c.recB).length;
    /* universe 1: every cell of the map */
    const naive = P.cooccurrence(all, nP, nB, shared);
    /* universe 2: the target group — cells where anyone recorded either taxon or any other
       taxon of the same group. Only the two taxa themselves would not do: every cell of that
       universe holds one of them, which pushes the test towards segregation. */
    const tg = C.filter(c => c.recP || c.recB || c.recO).length;
    /* universe 3 (a stricter target group): every sampled cell, when the effort is known */
    const corrected = P.cooccurrence(sampled.length, nP, nB, shared);
    const tgRes = P.cooccurrence(tg, nP, nB, shared);
    /* the truth: every cell, true presences */
    const tP = C.filter(c => c.plant).length, tB = C.filter(c => c.bee).length, tS = C.filter(c => c.plant && c.bee).length;
    const truth = P.cooccurrence(all, tP, tB, tS);
    drawLandscape(L);
    drawHyper('l1Hyper', [
      [naive, T('todo el mapa', 'whole map'), 'danger'],
      [corrected, T('celdas muestreadas', 'sampled cells'), 'primary'],
    ]);
    const verdictTxt = v => ({ positive: T('más de lo esperado', 'more than expected'), negative: T('menos de lo esperado', 'less than expected'), random: T('al azar', 'at random'), unclassified: T('sin clasificar', 'unclassified') }[v]);
    const tone = (v, truthV) => (v === truthV ? 'good' : 'bad');
    const rd = (l, v, t, cls) => `<div class="rd ${cls || ''}"><div class="rd-l">${l}</div><div class="rd-v">${v}</div>${t ? `<div class="rd-t">${t}</div>` : ''}</div>`;
    el('l1Readout').innerHTML =
      rd(T('Registros', 'Records'), `${nP} · ${nB}`, T(`planta · abeja, en ${sampled.length} de ${all} celdas muestreadas`, `plant · bee, in ${sampled.length} of ${all} sampled cells`)) +
      rd(T('Celdas compartidas', 'Shared cells'), String(shared), T(`esperadas: ${fmtFixed(naive.exp, 1)} (mapa) · ${fmtFixed(corrected.exp, 1)} (muestreadas)`, `expected: ${fmtFixed(naive.exp, 1)} (map) · ${fmtFixed(corrected.exp, 1)} (sampled)`)) +
      rd(T('La verdad', 'The truth'), verdictTxt(truth.verdict), T(`con las presencias reales: EEF ${fmtFixed(truth.ses, 2)}`, `with the true presences: SES ${fmtFixed(truth.ses, 2)}`)) +
      rd(T('Universo = todo el mapa', 'Universe = whole map'), verdictTxt(naive.verdict), `EEF ${fmtFixed(naive.ses, 2)} · ${naive.verdict === truth.verdict ? T('acierta', 'right') : T('se equivoca', 'wrong')}`, tone(naive.verdict, truth.verdict)) +
      rd(T('Universo = grupo objetivo', 'Universe = target group'), verdictTxt(tgRes.verdict), `EEF ${fmtFixed(tgRes.ses, 2)} · ${T(`${tg} celdas con algún registro`, `${tg} cells with any record`)}`, tone(tgRes.verdict, truth.verdict)) +
      rd(T('Universo = celdas muestreadas', 'Universe = sampled cells'), verdictTxt(corrected.verdict), `EEF ${fmtFixed(corrected.ses, 2)} · ${corrected.verdict === truth.verdict ? T('acierta', 'right') : T('se equivoca', 'wrong')}`, tone(corrected.verdict, truth.verdict));
    const msg = el('l1Status');
    if (msg) {
      const fixedRight = corrected.verdict === truth.verdict;
      const allRight = naive.verdict === truth.verdict && tgRes.verdict === truth.verdict && fixedRight;
      if (naive.verdict !== truth.verdict && naive.verdict === 'positive') msg.innerHTML = L2(
        `<b>La trampa del sesgo:</b> con todo el mapa como universo la prueba declara una asociación positiva que no existe, solo porque las dos especies se registraron donde se muestreó más.${fixedRight ? ' Restringir el universo a los sitios muestreados la desactiva.' : ''}`,
        `<b>The bias trap:</b> with the whole map as the universe the test declares a positive association that does not exist, only because both species were recorded where more sampling happened.${fixedRight ? ' Restricting the universe to the sampled sites disarms it.' : ''}`);
      else if (naive.verdict !== truth.verdict && truth.verdict === 'negative') msg.innerHTML = L2(
        `<b>El sesgo también esconde:</b> en el paisaje las dos especies se evitan, pero como las dos se registraron junto a la carretera, con todo el mapa como universo la segregación desaparece.${fixedRight ? ' Con el universo de los sitios muestreados vuelve a verse.' : ''}`,
        `<b>Bias also hides:</b> in the landscape the two species avoid each other, but since both were recorded along the road, with the whole map as the universe the segregation vanishes.${fixedRight ? ' With the universe of sampled sites it shows again.' : ''}`);
      else if (naive.verdict !== truth.verdict) msg.innerHTML = L2(
        `<b>El universo cambia la respuesta:</b> con todo el mapa la prueba dice «${verdictTxt(naive.verdict)}»; en el paisaje, la verdad es «${verdictTxt(truth.verdict)}».`,
        `<b>The universe changes the answer:</b> with the whole map the test says "${verdictTxt(naive.verdict)}"; in the landscape, the truth is "${verdictTxt(truth.verdict)}".`);
      else if (allRight) msg.innerHTML = L2(
        `Aquí los tres universos coinciden con la verdad. Sube el <b>sesgo hacia la carretera</b> y baja el <b>esfuerzo de fondo</b>: verás que con el universo equivocado aparecen asociaciones que el paisaje no tiene, o desaparecen las que sí tiene.`,
        `Here all three universes agree with the truth. Raise the <b>bias towards the road</b> and lower the <b>background effort</b>: you will see that with the wrong universe associations appear that the landscape does not have, or vanish those it does have.`);
      else msg.innerHTML = L2(
        `Con un muestreo parejo todo el mapa acierta, y el grupo objetivo puede apartarse: al dejar fuera las celdas donde nadie registró nada —las que no tienen ni a la planta ni al visitante— el universo pierde las ausencias compartidas y la prueba se inclina hacia «menos de lo esperado». El grupo objetivo corrige el sesgo; cuando no hay sesgo, cuesta un poco de exactitud.`,
        `With even sampling the whole map is right, and the target group may drift: by leaving out the cells where nobody recorded anything —those with neither the plant nor the visitor— the universe loses the shared absences and the test leans towards "less than expected". The target group corrects bias; when there is no bias, it costs a little accuracy.`);
    }
  }
  function drawLandscape(L) {
    const svg = el('l1Map'); if (!svg) return;
    const W = 420, H = 290, m = 6, cw = (W - 2 * m) / NX, ch = (H - 2 * m - 20) / NY;
    Plot.clear(svg);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const g = svgEl('g');
    L.cells.forEach(c => {
      const x = m + c.i * cw, y = m + (NY - 1 - c.j) * ch;
      /* the environment as a pale background ramp */
      g.appendChild(svgEl('rect', { x, y, width: cw + 0.3, height: ch + 0.3, fill: `var(--heat-mid)`, opacity: (0.08 + 0.32 * c.e).toFixed(3) }));
      if (!c.sampled) g.appendChild(svgEl('rect', { x: x + cw * 0.08, y: y + ch * 0.08, width: cw * 0.84, height: ch * 0.84, fill: 'none', stroke: 'var(--border-strong)', 'stroke-width': 0.4, 'stroke-dasharray': '1.5 1.5', opacity: 0.8 }));
      /* true presences as faint marks; records as solid dots */
      if (c.plant && !c.recP) g.appendChild(svgEl('circle', { cx: x + cw * 0.32, cy: y + ch * 0.5, r: 1.6, fill: 'none', stroke: V('primary'), 'stroke-width': 0.8, opacity: 0.6 }));
      if (c.bee && !c.recB) g.appendChild(svgEl('circle', { cx: x + cw * 0.68, cy: y + ch * 0.5, r: 1.6, fill: 'none', stroke: V('accent'), 'stroke-width': 0.8, opacity: 0.6 }));
      if (c.recP && c.recB) g.appendChild(svgEl('rect', { x: x + 0.5, y: y + 0.5, width: cw - 1, height: ch - 1, fill: V('gold'), opacity: 0.55, rx: 1.5 }));
      if (c.recP) g.appendChild(svgEl('circle', { cx: x + cw * 0.32, cy: y + ch * 0.5, r: 2.5, fill: V('primary') }));
      if (c.recB) g.appendChild(svgEl('circle', { cx: x + cw * 0.68, cy: y + ch * 0.5, r: 2.5, fill: V('accent') }));
    });
    svg.appendChild(g);
    /* the road */
    let d = '';
    for (let i = 0; i <= NX; i += 0.5) { const x = m + i * cw, y = m + (NY - 1 - L.roadY(i)) * ch + ch / 2; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }
    svg.appendChild(svgEl('path', { d, stroke: 'var(--text-muted)', 'stroke-width': 3.2, fill: 'none', opacity: 0.35, 'stroke-linecap': 'round' }));
    /* legend */
    const ly = H - 8, lg = svgEl('g');
    const item = (x, shape, lab) => { lg.appendChild(shape(x)); lg.appendChild(svgEl('text', { x: x + 8, y: ly + 3, 'font-size': 9, class: 'art-mut' }, lab)); };
    item(10, x => svgEl('circle', { cx: x, cy: ly, r: 3, fill: V('primary') }), T('registro de planta', 'plant record'));
    item(116, x => svgEl('circle', { cx: x, cy: ly, r: 3, fill: V('accent') }), T('registro de abeja', 'bee record'));
    item(214, x => svgEl('rect', { x: x - 4, y: ly - 4, width: 8, height: 8, fill: V('gold'), opacity: 0.6 }), T('compartida', 'shared'));
    item(292, x => svgEl('circle', { cx: x, cy: ly, r: 2.5, fill: 'none', stroke: V('text-muted') }), T('presente sin registro', 'present, unrecorded'));
    svg.appendChild(lg);
  }
  /* the hypergeometric distributions of two universes, with the observed value */
  function drawHyper(id, series) {
    const svg = el(id); if (!svg) return;
    const W = 420, H = 200;
    const obs = series[0][0].obs;
    const hi = Math.max(obs + 2, ...series.map(([r]) => Math.min(r.hi, Math.ceil(r.exp + 4 * Math.sqrt(Math.max(1, r.exp))))));
    const lo = Math.max(0, Math.min(obs - 2, ...series.map(([r]) => Math.floor(r.exp - 4 * Math.sqrt(Math.max(1, r.exp))))));
    const ymax = Math.max(...series.map(([r]) => Math.max(...r.dist.map(d => d[1])))) * 1.12;
    const f = Plot.frame(svg, { W, H, m: { l: 42, r: 10, t: 22, b: 30 }, x: [lo - 0.8, hi + 0.8], y: [0, ymax], xlab: T('celdas compartidas', 'shared cells'), ylab: T('probabilidad', 'probability'), ylabFmt: v => v.toFixed(2) });
    series.forEach(([r, lab, tone], k) => {
      const xs = r.dist.filter(d => d[0] >= lo && d[0] <= hi);
      Plot.bars(f, xs.map(d => d[0] + (k ? 0.18 : -0.18)), xs.map(d => d[1]), V(tone), { width: 5, opacity: 0.7 });
    });
    Plot.vline(f, obs, V('gold'), { dash: '0', width: 2.4, label: T(`observado = ${obs}`, `observed = ${obs}`) });
    Plot.legend(f, series.map(([r, lab, tone]) => [lab, V(tone), 'sq']), 10, 150);
  }

  /* =====================================================================
     LAB 2 · phenological overlap
     ===================================================================== */
  let seed2 = 3;
  const DOY_MID = P.MONTH_MID;
  function drawDates(r, peak, spread, n) {
    /* a wrapped normal around the peak: dates in days, folded into 1…365 */
    const out = [];
    for (let i = 0; i < n; i++) { let d = peak + spread * randn(r); d = ((Math.round(d) - 1) % 365 + 365) % 365 + 1; out.push(d); }
    return out;
  }
  function monthOf(d) { let m = 1; while (m < 12 && d > [31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334][m - 1]) m++; return m; }
  function lab2() {
    const pk1 = Plot.val('l2P1'), sd1 = Plot.val('l2S1'), pk2 = Plot.val('l2P2'), sd2 = Plot.val('l2S2'), n = Plot.val('l2N');
    const r = rng(seed2);
    const dP = drawDates(r, pk1, sd1, n), dB = drawDates(r, pk2, sd2, n);
    const aP = dP.map(P.doyToAngle), aB = dB.map(P.doyToAngle);
    const mP = P.circMean(aP), mB = P.circMean(aB);
    const rP = P.rayleigh(aP), rB = P.rayleigh(aB);
    const ww = P.watsonWilliams([aP, aB]);
    const hP = new Array(12).fill(0), hB = new Array(12).fill(0);
    dP.forEach(d => hP[monthOf(d) - 1]++); dB.forEach(d => hB[monthOf(d) - 1]++);
    const D = P.schoenerD(hP, hB), I = P.hellingerI(hP, hB), O = P.piankaO(hP, hB);
    drawClock(dP, dB, mP, mB);
    drawMonths(hP, hB);
    const rd = (l, v, t, cls) => `<div class="rd ${cls || ''}"><div class="rd-l">${l}</div><div class="rd-v">${v}</div>${t ? `<div class="rd-t">${t}</div>` : ''}</div>`;
    const band = (k, v) => (window.Help ? Help.tag(k, v) : '');
    el('l2Readout').innerHTML =
      rd(T('Fecha media de floración', 'Mean flowering date'), fmtDoy(mP.meanDoy), `R̄ = ${fmtFixed(mP.R, 2)} ${band('circular', mP.R)} · ± ${fmtFixed(mP.sdDays, 0)} ${T('días', 'days')}`) +
      rd(T('Fecha media de vuelo', 'Mean flight date'), fmtDoy(mB.meanDoy), `R̄ = ${fmtFixed(mB.R, 2)} ${band('circular', mB.R)} · ± ${fmtFixed(mB.sdDays, 0)} ${T('días', 'days')}`) +
      rd(T('Desfase', 'Lag'), `${fmtFixed(P.doyDiff(mP.meanDoy, mB.meanDoy), 0)} ${T('días', 'days')}`, ww ? `Watson–Williams p = ${fmtNum(ww.p, 3)}${ww.valid ? '' : T(' (κ < 1: poco fiable)', ' (κ < 1: unreliable)')}` : '') +
      rd('Rayleigh', `p = ${fmtNum(rP.p, 3)} · ${fmtNum(rB.p, 3)}`, T('planta · abeja', 'plant · bee')) +
      rd(T('D de Schoener', 'Schoener\'s D'), fmtFixed(D, 2), band('schoenerD', D)) +
      rd(`I · O`, `${fmtFixed(I, 2)} · ${fmtFixed(O, 2)}`, T('I de Warren · O de Pianka', 'Warren\'s I · Pianka\'s O'));
  }
  function drawClock(dP, dB, mP, mB) {
    const svg = el('l2Clock'); if (!svg) return;
    const W = 420, H = 250, cx = 140, cy = 128, R = 92;
    Plot.clear(svg);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const g = svgEl('g');
    g.appendChild(svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: 'var(--border-strong)' }));
    for (let m = 0; m < 12; m++) {
      const a = -Math.PI / 2 + m / 12 * 2 * Math.PI, b = a + Math.PI / 12;
      g.appendChild(svgEl('line', { x1: cx + Math.cos(a) * R * 0.94, y1: cy + Math.sin(a) * R * 0.94, x2: cx + Math.cos(a) * R, y2: cy + Math.sin(a) * R, stroke: 'var(--border-strong)' }));
      g.appendChild(svgEl('text', { x: cx + Math.cos(b) * (R + 13), y: cy + Math.sin(b) * (R + 13) + 3, 'font-size': 9, 'text-anchor': 'middle', class: 'art-mut' }, monthName(m + 1, true)));
    }
    const ang = d => -Math.PI / 2 + (d - 0.5) / 365 * 2 * Math.PI;
    dP.forEach(d => g.appendChild(svgEl('circle', { cx: cx + Math.cos(ang(d)) * (R - 8), cy: cy + Math.sin(ang(d)) * (R - 8), r: 2.2, fill: V('primary'), opacity: 0.75 })));
    dB.forEach(d => g.appendChild(svgEl('circle', { cx: cx + Math.cos(ang(d)) * (R - 18), cy: cy + Math.sin(ang(d)) * (R - 18), r: 2.2, fill: V('accent'), opacity: 0.75 })));
    /* the mean vectors, scaled by R̄ */
    [[mP, 'primary'], [mB, 'accent']].forEach(([mm, tone]) => {
      const a = ang(mm.meanDoy), L = (R - 26) * mm.R;
      g.appendChild(svgEl('line', { x1: cx, y1: cy, x2: cx + Math.cos(a) * L, y2: cy + Math.sin(a) * L, stroke: V(tone), 'stroke-width': 3, 'stroke-linecap': 'round' }));
      g.appendChild(svgEl('circle', { cx: cx + Math.cos(a) * L, cy: cy + Math.sin(a) * L, r: 3.6, fill: V(tone) }));
    });
    g.appendChild(svgEl('circle', { cx, cy, r: 2.5, fill: 'var(--text)' }));
    /* the legend and the two mean dates, to the right of the clock */
    const lx = 272;
    [[mP, 'primary', T('floración', 'flowering')], [mB, 'accent', T('vuelo', 'flight')]].forEach(([mm, tone, lab], k) => {
      const y = 70 + k * 58;
      g.appendChild(svgEl('circle', { cx: lx, cy: y - 3, r: 4, fill: V(tone) }));
      g.appendChild(svgEl('text', { x: lx + 10, y, 'font-size': 11, class: 'art-txt', 'font-weight': 700 }, lab));
      g.appendChild(svgEl('text', { x: lx + 10, y: y + 15, 'font-size': 10, class: 'art-mut' }, `${T('media', 'mean')}: ${fmtDoy(mm.meanDoy)}`));
      g.appendChild(svgEl('text', { x: lx + 10, y: y + 29, 'font-size': 10, class: 'art-mut' }, `R̄ = ${fmtFixed(mm.R, 2)}`));
    });
    g.appendChild(svgEl('text', { x: lx - 6, y: 200, 'font-size': 9, class: 'art-mut' }, T('flecha: vector medio', 'arrow: mean vector')));
    g.appendChild(svgEl('text', { x: lx - 6, y: 213, 'font-size': 9, class: 'art-mut' }, T('(su largo es R̄)', '(its length is R̄)')));
    svg.appendChild(g);
  }
  function drawMonths(hP, hB) {
    const svg = el('l2Months'); if (!svg) return;
    const W = 420, H = 220;
    const nP = hP.reduce((a, b) => a + b, 0) || 1, nB = hB.reduce((a, b) => a + b, 0) || 1;
    const pP = hP.map(v => v / nP), pB = hB.map(v => v / nB);
    const ymax = Math.max(...pP, ...pB) * 1.15 || 1;
    const f = Plot.frame(svg, { W, H, m: { l: 40, r: 10, t: 24, b: 28 }, x: [0.4, 12.6], y: [0, ymax], xt: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], xlabFmt: v => monthName(v, true), ylab: T('proporción', 'proportion'), ylabFmt: v => (v * 100).toFixed(0) + '%' });
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    /* the overlap, min(p1, p2), shaded behind: its sum is exactly Schoener's D */
    Plot.bars(f, xs, xs.map((x, i) => Math.min(pP[i], pB[i])), V('gold'), { width: 26, opacity: 0.35 });
    Plot.bars(f, xs.map(x => x - 0.17), pP, V('primary'), { width: 9, opacity: 0.85 });
    Plot.bars(f, xs.map(x => x + 0.17), pB, V('accent'), { width: 9, opacity: 0.85 });
    Plot.legend(f, [[T('floración', 'flowering'), V('primary'), 'sq'], [T('vuelo', 'flight'), V('accent'), 'sq'], [T('solapamiento = D', 'overlap = D'), V('gold'), 'sq']], 10);
  }

  /* =====================================================================
     wiring
     ===================================================================== */
  function wire() {
    if (!el('l1Map')) return;
    const pct = v => Math.round(v * 100) + '%';
    Plot.bindSlider('l1Sep', v => v < 0.05 ? T('mismo óptimo', 'same optimum') : fmtFixed(v, 2), lab1);
    Plot.bindSlider('l1Width', v => fmtFixed(v, 2), lab1);
    Plot.bindSlider('l1Bias', pct, lab1);
    Plot.bindSlider('l1Effort', pct, lab1);
    el('l1New').addEventListener('click', () => { seed1 = (seed1 * 7919 + 13) % 100003; lab1(); });
    Plot.bindSlider('l2P1', v => fmtDoy(v), lab2);
    Plot.bindSlider('l2S1', v => `± ${v} ${T('días', 'days')}`, lab2);
    Plot.bindSlider('l2P2', v => fmtDoy(v), lab2);
    Plot.bindSlider('l2S2', v => `± ${v} ${T('días', 'days')}`, lab2);
    Plot.bindSlider('l2N', v => String(v), lab2);
    el('l2New').addEventListener('click', () => { seed2 = (seed2 * 7919 + 13) % 100003; lab2(); });
    els('.lab-tab').forEach(b => b.addEventListener('click', () => {
      els('.lab-tab').forEach(x => x.classList.toggle('on', x === b));
      els('.lab').forEach(x => x.classList.toggle('on', x.id === b.dataset.lab));
    }));
    const redraw = () => {
      ['l1Sep', 'l1Width', 'l1Bias', 'l1Effort', 'l2P1', 'l2S1', 'l2P2', 'l2S2', 'l2N'].forEach(id => el(id).dispatchEvent(new Event('input')));
    };
    document.addEventListener('langchange', redraw);
    lab1(); lab2();
  }
  document.addEventListener('DOMContentLoaded', wire);
  window.Labs = { lab1, lab2, _landscape: landscape };
})();
