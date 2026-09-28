/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 7: environmental niche (the interface).
   Layers are read by js/raster.js and compared by js/niche.js. The layers
   are the user's: the app brings none (the climate databases do not allow
   their files to be redistributed), and they stay in memory for the session. */

const B7 = {};

(function () {
  const V = n => `var(--${n})`;
  const opt = { bg: 'buffer', bufferKm: 200, nRep: 100, margin: 3, corrected: false };
  try { Object.assign(opt, JSON.parse(localStorage.getItem('pollinationpro:niche') || '{}')); } catch (e) { /* first visit */ }
  const keep = () => { try { localStorage.setItem('pollinationpro:niche', JSON.stringify(opt)); } catch (e) { /* ignore */ } };
  let sel = null, last = null, occAll = null, bgCells = null, S = null;

  /* ---------------- loading layers ---------------- */
  function cropBox() {
    const C = B3.ensure();
    if (!C || !C.records.length) return GEO.MX_BBOX;
    const b = GEO.bboxOfPoints(C.records.map(r => [r.lon, r.lat]), 0);
    return [b[0] - opt.margin, b[1] - opt.margin, b[2] + opt.margin, b[3] + opt.margin];
  }
  async function load(files) {
    const list = [...files].filter(f => /\.(tiff?|asc)$/i.test(f.name));
    if (!list.length) { notice('b7LoadMsg', 'warning', L2('No hay archivos .tif, .tiff o .asc en lo elegido.', 'There are no .tif, .tiff or .asc files in the selection.')); return; }
    const box = cropBox();
    if (!state.rasters) state.rasters = { layers: [], box };
    clearMessages('b7LoadMsg');
    const msg = showMessage('b7LoadMsg', 'info', '…');
    let ok = 0;
    for (const f of list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
      msg.innerHTML = L2(`Leyendo <b>${esc(f.name)}</b>…`, `Reading <b>${esc(f.name)}</b>…`);
      await new Promise(r => setTimeout(r, 0));
      try {
        let L = await Raster.readFile(f, state.rasters.layers.length ? Raster.bboxOf(state.rasters.layers[0]) : box);
        const first = state.rasters.layers[0];
        if (first && !Raster.sameGrid(first, L)) L = Object.assign(Raster.resampleTo(L, first), { name: L.name, file: L.file, resampled: true });
        L.label = prettyName(L.name);
        L.use = true;
        L.st = Raster.stats(L);
        state.rasters.layers = state.rasters.layers.filter(x => x.name !== L.name).concat([L]);
        ok++;
      } catch (e) {
        showMessage('b7LoadMsg', 'error', `<b>${esc(f.name)}</b>: ` + esc(e.message || e));
      }
    }
    msg.remove();
    if (ok) showMessage('b7LoadMsg', 'success', L2(`${ok} capas leídas y recortadas al área de estudio (±${opt.margin}° alrededor de los registros).`, `${ok} layers read and cropped to the study area (±${opt.margin}° around the records).`));
    state.niche = null; bgCells = null; S = null;
    render();
  }
  /* "wc2.1_30s_bio_12" → "BIO12"; anything else keeps its name */
  function prettyName(n) {
    const m = /bio_?0?(\d{1,2})$/i.exec(n);
    if (m) return 'BIO' + m[1];
    if (/elev|alt|dem|srtm/i.test(n)) return T('Altitud', 'Elevation');
    return n;
  }
  const BIO_NAMES = { 1: ['Temperatura media anual', 'Annual mean temperature'], 2: ['Oscilación diurna media', 'Mean diurnal range'], 3: ['Isotermalidad', 'Isothermality'], 4: ['Estacionalidad de la temperatura', 'Temperature seasonality'], 5: ['Máxima del mes más cálido', 'Max temperature of warmest month'], 6: ['Mínima del mes más frío', 'Min temperature of coldest month'], 7: ['Oscilación anual', 'Annual range'], 8: ['Media del trimestre más húmedo', 'Mean temperature of wettest quarter'], 9: ['Media del trimestre más seco', 'Mean temperature of driest quarter'], 10: ['Media del trimestre más cálido', 'Mean temperature of warmest quarter'], 11: ['Media del trimestre más frío', 'Mean temperature of coldest quarter'], 12: ['Precipitación anual', 'Annual precipitation'], 13: ['Precipitación del mes más húmedo', 'Precipitation of wettest month'], 14: ['Precipitación del mes más seco', 'Precipitation of driest month'], 15: ['Estacionalidad de la precipitación', 'Precipitation seasonality'], 16: ['Precipitación del trimestre más húmedo', 'Precipitation of wettest quarter'], 17: ['Precipitación del trimestre más seco', 'Precipitation of driest quarter'], 18: ['Precipitación del trimestre más cálido', 'Precipitation of warmest quarter'], 19: ['Precipitación del trimestre más frío', 'Precipitation of coldest quarter'] };
  const longName = L => { const m = /^BIO(\d+)$/.exec(L.label); return m && BIO_NAMES[m[1]] ? T(...BIO_NAMES[m[1]]) : ''; };
  const used = () => (state.rasters ? state.rasters.layers.filter(L => L.use) : []);

  function renderLayers() {
    const R = state.rasters;
    el('b7Layers').innerHTML = !R || !R.layers.length ? `<p class="hint">${L2('Todavía no hay capas.', 'No layers yet.')}</p>` :
      `<div class="table-scroll"><table class="map-table"><thead><tr><th>${L2('Usar', 'Use')}</th><th>${L2('Capa', 'Layer')}</th><th>${L2('Archivo', 'File')}</th><th class="num">${L2('Resolución', 'Resolution')}</th><th class="num">${L2('Celdas', 'Cells')}</th><th class="num">${L2('Mín.', 'Min')}</th><th class="num">${L2('Máx.', 'Max')}</th><th></th></tr></thead><tbody>` +
      R.layers.map((L, i) => `<tr><td><input type="checkbox" data-use="${i}"${L.use ? ' checked' : ''}></td><td><b>${esc(L.label)}</b> <span class="hint" style="margin:0">${esc(longName(L))}</span></td><td class="ex">${esc(L.file)}${L.resampled ? ' · ' + T('remuestreada', 'resampled') : ''}</td>
        <td class="num">${fmtNum(L.dx * 60, 2)}′ (~${fmtNum(L.dx * 111.2, 1)} km)</td><td class="num">${L.st.n.toLocaleString('en-US')}</td><td class="num">${fmtNum(L.st.min, 3)}</td><td class="num">${fmtNum(L.st.max, 3)}</td>
        <td><button class="tx-x" data-rm="${i}" style="border:0;background:none;cursor:pointer">✕</button></td></tr>`).join('') + '</tbody></table></div>';
    const el0 = el('b7ElevLayer');
    if (el0) el0.innerHTML = `<option value="">${T('(ninguna)', '(none)')}</option>` + (R ? R.layers.map((L, i) => `<option value="${i}"${/Altitud|Elevation/.test(L.label) ? ' selected' : ''}>${esc(L.label)}</option>`).join('') : '');
  }

  /* ---------------- correlation between the chosen variables ---------------- */
  function renderCorr() {
    const Ls = used();
    const box = el('b7Corr');
    if (Ls.length < 2) { box.innerHTML = ''; return; }
    const bg = Niche.background(Ls, {});
    const r = rng(3), idx = bg.map((_, i) => i); Poll.shuffle(idx, r);
    const sample = idx.slice(0, 20000).map(i => bg[i].v);
    const k = Ls.length;
    const mean = new Array(k).fill(0), sd = new Array(k).fill(0);
    sample.forEach(v => v.forEach((x, j) => { mean[j] += x; }));
    mean.forEach((m, j) => { mean[j] = m / sample.length; });
    sample.forEach(v => v.forEach((x, j) => { sd[j] += (x - mean[j]) ** 2; }));
    sd.forEach((s, j) => { sd[j] = Math.sqrt(s / (sample.length - 1)); });
    const cor = (a, b) => { let s = 0; sample.forEach(v => { s += (v[a] - mean[a]) * (v[b] - mean[b]); }); return s / ((sample.length - 1) * sd[a] * sd[b]); };
    let high = 0;
    const cells = Ls.map((La, a) => Ls.map((Lb, b) => { if (a >= b) return null; const c = cor(a, b); if (Math.abs(c) > 0.8) high++; return c; }));
    box.innerHTML = `<div class="table-scroll"><table class="map-table"><thead><tr><th></th>${Ls.map(L => `<th class="num">${esc(L.label)}</th>`).join('')}</tr></thead><tbody>` +
      Ls.map((La, a) => `<tr><td><b>${esc(La.label)}</b></td>${Ls.map((Lb, b) => { const c = cells[a][b]; return c == null ? '<td></td>' : `<td class="num" style="${Math.abs(c) > 0.8 ? 'color:var(--danger);font-weight:700' : ''}">${fmtFixed(c, 2)}</td>`; }).join('')}</tr>`).join('') + '</tbody></table></div>' +
      `<p class="hint">${high ? L2(`${high} pares con |r| > 0.8 (en rojo). El análisis de componentes principales absorbe la correlación, pero variables casi idénticas dan más peso a lo que miden: considera dejar una de cada par.`, `${high} pairs with |r| > 0.8 (in red). The principal component analysis absorbs correlation, but near-identical variables give more weight to what they measure: consider keeping one of each pair.`) : L2('Ningún par pasa de |r| = 0.8.', 'No pair exceeds |r| = 0.8.')}</p>`;
  }

  /* ---------------- the analysis ---------------- */
  function prepare() {
    const Ls = used();
    if (Ls.length < 2) return false;
    const C = B3.ensure();
    occAll = Niche.extract(C.records, Ls);
    const pts = C.records.map(r => [r.lon, r.lat]);
    bgCells = Niche.background(Ls, opt.bg === 'buffer' ? { bufferKm: opt.bufferKm, points: pts } : {});
    if (bgCells.length < 50) return false;
    S = Niche.space(bgCells, occAll, { R: 100 });
    return true;
  }
  function run() {
    clearMessages('b7RunMsg');
    if (!prepare()) { showMessage('b7RunMsg', 'warning', L2('Hacen falta al menos dos capas en uso y un fondo con celdas válidas.', 'At least two layers in use and a background with valid cells are needed.')); return; }
    const units = [...new Set(occAll.map(o => o.unit))];
    const plants = units.filter(u => occAll.find(o => o.unit === u).role === 'plant'), visitors = units.filter(u => occAll.find(o => o.unit === u).role === 'poll');
    if (!sel || !plants.includes(sel.plant) || !visitors.includes(sel.visitor)) sel = { plant: plants[0], visitor: visitors[0] };
    el('b7Plant').innerHTML = plants.map(u => `<option${u === sel.plant ? ' selected' : ''}>${esc(u)}</option>`).join('');
    el('b7Visitor').innerHTML = visitors.map(u => `<option${u === sel.visitor ? ' selected' : ''}>${esc(u)}</option>`).join('');
    /* the D of every pair (no tests: those are run for the chosen pair) */
    const dens = {};
    units.forEach(u => { dens[u] = Niche.density(S, occAll.map((o, i) => [o, S.sOcc[i]]).filter(([o]) => o.unit === u).map(([, s]) => s), null, opt.corrected); });
    const matrix = [];
    plants.forEach(p => visitors.forEach(v => matrix.push(Object.assign({ plant: p, visitor: v }, Niche.overlap(dens[p], dens[v])))));
    state.niche = { practice: !!(state.rasters && state.rasters.practice), layers: used().map(L => L.label), corrected: opt.corrected, bg: opt.bg, bufferKm: opt.bufferKm, nBg: bgCells.length, explained: S.pca.explained.slice(0, 2), loadings: S.pca.loadings.slice(0, 2), matrix, units: units.map(u => ({ unit: u, n: occAll.filter(o => o.unit === u).length })) };
    el('b7Body2').style.display = '';
    statTiles('b7Tiles', [
      [T('Fondo', 'Background'), bgCells.length.toLocaleString('en-US') + T(' celdas', ' cells'), opt.bg === 'buffer' ? T(`a ≤ ${opt.bufferKm} km de los registros`, `within ${opt.bufferKm} km of the records`) : T('toda el área', 'the whole area')],
      [T('Varianza en el plano', 'Variance on the plane'), fmtPct(S.pca.explained[0] + S.pca.explained[1], 1), `CP1 ${fmtPct(S.pca.explained[0], 1)} · CP2 ${fmtPct(S.pca.explained[1], 1)}`],
      [T('Registros con ambiente', 'Records with environment'), occAll.length.toLocaleString('en-US'), T('uno por celda y unidad', 'one per cell and unit')],
      [T('Variables', 'Variables'), used().length, used().map(L => L.label).join(' ')],
    ]);
    buildTable('b7Matrix', [
      { key: 'plant', label: T('Planta', 'Plant'), html: true, get: r => Taxa.italic(r.plant) },
      { key: 'visitor', label: T('Visitante', 'Visitor'), html: true, get: r => Taxa.italic(r.visitor) },
      { key: 'D', label: T('D de Schoener', 'Schoener\'s D'), num: true, html: true, get: r => `${fmtFixed(r.D, 3)} ${Help.tag('schoenerD', r.D)}` },
      { key: 'I', label: T('I de Warren', 'Warren\'s I'), num: true, fmt: v => fmtFixed(v, 3) },
    ], matrix.slice().sort((a, b) => b.D - a.D));
    runPair();
  }
  function runPair() {
    const pick = u => occAll.map((o, i) => [o, S.sOcc[i]]).filter(([o]) => o.unit === u).map(([, s]) => s);
    const a = pick(sel.plant), b = pick(sel.visitor);
    if (a.length < 5 || b.length < 5) { notice('b7RunMsg', 'warning', L2('Cada unidad necesita al menos 5 registros con valores ambientales.', 'Each unit needs at least 5 records with environmental values.')); return; }
    const t0 = performance.now();
    last = Niche.compare(S, a, b, { nRep: opt.nRep, seed: 20260927, corrected: opt.corrected });
    last.ms = performance.now() - t0;
    last.n1 = a.length; last.n2 = b.length;
    statTiles('b7PairTiles', [
      [T('D de Schoener', 'Schoener\'s D'), fmtFixed(last.D, 3), Help.tag('schoenerD', last.D)],
      [T('I de Warren', 'Warren\'s I'), fmtFixed(last.I, 3), ''],
      [T('Equivalencia', 'Equivalency'), `p = ${fmtNum(last.pEq, 3)}`, last.pEq < 0.05 ? T('los nichos NO son equivalentes', 'the niches are NOT equivalent') : T('no se rechaza la equivalencia', 'equivalency not rejected')],
      [T('Similitud', 'Similarity'), `p = ${fmtNum(last.pSim, 3)}`, last.pSim < 0.05 ? T('más parecidos de lo que el ambiente explica', 'more alike than the environment explains') : T('no más parecidos que al azar', 'no more alike than chance')],
      [T('Registros', 'Records'), `${last.n1} · ${last.n2}`, T(`${opt.nRep} repeticiones`, `${opt.nRep} replicates`)],
    ]);
    drawSpace(); drawNull('b7Eq', last.eq, T('D bajo equivalencia', 'D under equivalency')); drawNull('b7Sim', last.sim, T('D bajo similitud', 'D under similarity'));
    renderUni();
    state.niche.pair = { plant: sel.plant, visitor: sel.visitor, D: last.D, I: last.I, pEq: last.pEq, pSim: last.pSim, nRep: opt.nRep, n1: last.n1, n2: last.n2 };
    Fig.decorate(el('panel-7'));
  }

  /* ---------------- figures ---------------- */
  function drawSpace() {
    const svg = el('b7Space');
    const R = S.R, [bx0, bx1, by0, by1] = S.box;
    const f = Plot.frame(svg, { W: 520, H: 440, m: { l: 46, r: 14, t: 26, b: 40 }, x: [bx0, bx1], y: [by0, by1], xlab: `CP1 (${fmtPct(S.pca.explained[0], 1)})`, ylab: `CP2 (${fmtPct(S.pca.explained[1], 1)})`, grid: false });
    const cw = (f.sx(bx1) - f.sx(bx0)) / (R - 1), ch = (f.sy(by0) - f.sy(by1)) / (R - 1);
    let envMax = 0; for (let i = 0; i < S.zEnv.length; i++) if (S.zEnv[i] > envMax) envMax = S.zEnv[i];
    const g = svgEl('g');
    for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
      const k = j * R + i;
      if (!S.avail[k]) continue;
      const x = f.sx(bx0 + i * (bx1 - bx0) / (R - 1)) - cw / 2, y = f.sy(by0 + j * (by1 - by0) / (R - 1)) - ch / 2;
      g.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (cw + 0.4).toFixed(1), height: (ch + 0.4).toFixed(1), fill: V('text-muted'), opacity: (0.05 + 0.2 * Math.sqrt(S.zEnv[k] / envMax)).toFixed(3) }));
      const a = last.z1[k], b = last.z2[k];
      if (a > 0.02) g.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (cw + 0.4).toFixed(1), height: (ch + 0.4).toFixed(1), fill: V('primary'), opacity: (0.7 * a).toFixed(3) }));
      if (b > 0.02) g.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (cw + 0.4).toFixed(1), height: (ch + 0.4).toFixed(1), fill: V('accent'), opacity: (0.6 * b).toFixed(3) }));
    }
    f.plot.appendChild(g);
    /* the centroids and the shift between them */
    f.top.appendChild(svgEl('line', { x1: f.sx(last.c1[0]), y1: f.sy(last.c1[1]), x2: f.sx(last.c2[0]), y2: f.sy(last.c2[1]), stroke: V('text'), 'stroke-width': 1.6, 'stroke-dasharray': '4 3' }));
    [[last.c1, 'primary'], [last.c2, 'accent']].forEach(([c, t]) => f.top.appendChild(svgEl('circle', { cx: f.sx(c[0]), cy: f.sy(c[1]), r: 5, fill: V(t), stroke: V('card-bg'), 'stroke-width': 1.5 })));
    /* the correlation circle, as an inset */
    const ix = f.W - f.m.r - 88, iy = f.m.t + 8, ir = 38;
    const inset = svgEl('g');
    inset.appendChild(svgEl('circle', { cx: ix + ir + 6, cy: iy + ir + 6, r: ir, fill: V('card-bg'), stroke: V('border-strong'), opacity: 0.95 }));
    const Ls = used();
    S.pca.vectors[0].forEach((_, j) => {
      const lx = S.pca.loadings[0][j], ly = S.pca.loadings[1][j];
      const x2 = ix + ir + 6 + lx * ir, y2 = iy + ir + 6 - ly * ir;
      inset.appendChild(svgEl('line', { x1: ix + ir + 6, y1: iy + ir + 6, x2, y2, stroke: V('text'), 'stroke-width': 1 }));
      inset.appendChild(svgEl('text', { x: x2 + (lx >= 0 ? 2 : -2), y: y2 + (ly >= 0 ? -2 : 8), 'font-size': 7.5, 'text-anchor': lx >= 0 ? 'start' : 'end', class: 'art-txt' }, Ls[j] ? Ls[j].label : ''));
    });
    f.top.appendChild(inset);
    Plot.legend(f, [[sel.plant, V('primary'), 'sq'], [sel.visitor, V('accent'), 'sq'], [T('ambiente disponible', 'available environment'), V('text-muted'), 'sq']], 10);
  }
  function drawNull(id, arr, lab) {
    const svg = el(id);
    const all = arr.concat([last.D]);
    const lo = Math.max(0, Math.min(...all) - 0.02), hi = Math.min(1, Math.max(...all) + 0.02);
    const nb = 20, w = (hi - lo) / nb || 0.01;
    const bins = new Array(nb).fill(0);
    arr.forEach(x => { bins[Math.min(nb - 1, Math.max(0, Math.floor((x - lo) / w)))]++; });
    const f = Plot.frame(svg, { W: 360, H: 220, m: { l: 40, r: 10, t: 24, b: 34 }, x: [lo, hi], y: [0, Math.max(...bins) * 1.2 || 1], xlab: lab, ylab: T('repeticiones', 'replicates') });
    Plot.bars(f, bins.map((b, i) => lo + (i + 0.5) * w), bins, V('text-muted'), { width: Math.max(2, (f.sx(lo + w) - f.sx(lo)) * 0.9), opacity: 0.5 });
    Plot.vline(f, last.D, V('gold'), { dash: '0', width: 2.5, label: `D = ${fmtFixed(last.D, 3)}` });
  }
  /* as many decimals as the size of the value calls for: 2,270 mm, 22.7 °C, 0.45 */
  const med = v => fmtNum(v, Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2);
  function renderUni() {
    const Ls = used();
    const a = occAll.filter(o => o.unit === sel.plant), b = occAll.filter(o => o.unit === sel.visitor);
    const rows = Ls.map((L, k) => Object.assign({ label: L.label, long: longName(L) }, Niche.univariate(a, b, bgCells, k)));
    buildTable('b7Uni', [
      { key: 'label', label: T('Variable', 'Variable'), html: true, get: r => `<b>${esc(r.label)}</b> <span class="hint" style="margin:0">${esc(r.long)}</span>` },
      { key: 'medA', label: T('Mediana planta', 'Plant median'), num: true, fmt: med },
      { key: 'medB', label: T('Mediana visitante', 'Visitor median'), num: true, fmt: med },
      { key: 'D', label: T('D en esta variable', 'D on this variable'), num: true, html: true, get: r => `${fmtFixed(r.D, 2)} ${Help.tag('schoenerD', r.D)}` },
    ], rows.sort((x, y) => x.D - y.D));
    state.niche.univariate = rows.map(r => ({ variable: r.label, medPlant: r.medA, medVisitor: r.medB, D: r.D }));
  }

  /* ---------------- elevation from a layer ---------------- */
  function fillElevation() {
    const i = el('b7ElevLayer').value;
    if (i === '') return;
    const L = state.rasters.layers[+i];
    let n = 0;
    const fill = r => { if (r.elev == null || !isFinite(r.elev)) { const v = Raster.valueAt(L, r.lon, r.lat); if (isFinite(v)) { r.elev = Math.round(v); r.elevFrom = L.label; n++; } } };
    state.raw.forEach(fill);
    if (state.clean) { state.clean.records.forEach(fill); state.clean.dropped.forEach(fill); }
    notice('b7ElevMsg', 'success', L2(`Se completó la altitud de ${n.toLocaleString('en-US')} registros con la capa ${esc(L.label)}. El Bloque 6 ya la usa; los registros que traían altitud propia la conservan.`, `Elevation was filled for ${n.toLocaleString('en-US')} records from the layer ${esc(L.label)}. Block 6 uses it now; records that carried their own elevation keep it.`));
    if (window.B2) B2.save();
  }

  function render() {
    renderLayers();
    const has = !!(state.rasters && state.rasters.layers.length);
    el('b7AfterLoad').style.display = has ? '' : 'none';
    if (has) renderCorr();
  }
  function show() {
    B3.ensure();
    const ok = !!(state.clean && state.clean.records.length);
    el('b7Empty').style.display = ok ? 'none' : '';
    el('b7Body').style.display = ok ? '' : 'none';
    if (!ok) return;
    el('b7Bg').value = opt.bg; el('b7Corr2').value = opt.corrected ? '1' : '0'; el('b7Buf').value = opt.bufferKm; el('b7Rep').value = String(opt.nRep); el('b7Margin').value = opt.margin;
    render();
  }
  function wire() {
    if (!el('panel-7')) return;
    els('.soon-art', el('panel-7')).forEach(n => { n.innerHTML = Art.soon(); });
    el('b7Files').addEventListener('change', e => { load(e.target.files); e.target.value = ''; });
    el('b7Folder').addEventListener('change', e => { load(e.target.files); e.target.value = ''; });
    el('b7Practice').addEventListener('click', async () => {
      const b = el('b7Practice'); b.disabled = true;
      notice('b7LoadMsg', 'info', L2('Generando las capas de práctica…', 'Generating the practice layers…'));
      await new Promise(r => setTimeout(r, 30));
      try {
        await load(Examples.layers('present').map(f => new File([f.text], f.name, { type: 'text/plain' })));
        state.rasters.practice = true;
        state.rasters.layers.forEach(L => { if (/altitud/i.test(L.name)) L.use = false; });
        render();
        showMessage('b7LoadMsg', 'warning', L2('Son capas <b>ficticias</b>: sirven para practicar, no para concluir ni para publicar.', 'These are <b>fictional</b> layers: for practising, not for drawing conclusions or publishing.'));
      } finally { b.disabled = false; }
    });
    el('b7Layers').addEventListener('change', e => { const c = e.target.closest('[data-use]'); if (c) { state.rasters.layers[+c.dataset.use].use = c.checked; renderCorr(); } });
    el('b7Layers').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { state.rasters.layers.splice(+b.dataset.rm, 1); if (!state.rasters.layers.length) state.rasters = null; render(); } });
    el('b7Clear').addEventListener('click', () => { state.rasters = null; state.niche = null; el('b7Body2').style.display = 'none'; render(); });
    el('b7Margin').addEventListener('change', () => { opt.margin = Math.max(0, parseNum(el('b7Margin').value) || 3); keep(); });
    el('b7Bg').addEventListener('change', () => { opt.bg = el('b7Bg').value; keep(); });
    el('b7Buf').addEventListener('change', () => { opt.bufferKm = Math.max(10, parseNum(el('b7Buf').value) || 200); keep(); });
    el('b7Rep').addEventListener('change', () => { opt.nRep = +el('b7Rep').value; keep(); });
    el('b7Corr2').addEventListener('change', () => { opt.corrected = el('b7Corr2').value === '1'; keep(); });
    el('b7Run').addEventListener('click', () => { const b = el('b7Run'); b.disabled = true; setTimeout(() => { try { run(); } finally { b.disabled = false; } }, 30); });
    el('b7Plant').addEventListener('change', () => { sel.plant = el('b7Plant').value; runPair(); });
    el('b7Visitor').addEventListener('change', () => { sel.visitor = el('b7Visitor').value; runPair(); });
    el('b7ElevFill').addEventListener('click', fillElevation);
    el('b7Csv').addEventListener('click', () => {
      if (!occAll) return;
      const Ls = used();
      download(TableIO.toCSV(occAll.map((o, i) => { const r = { unit: o.unit, role: o.role, lon: o.lon, lat: o.lat, PC1: S.sOcc[i][0].toFixed(4), PC2: S.sOcc[i][1].toFixed(4) }; Ls.forEach((L, k) => { r[L.label] = o.v[k]; }); return r; })), 'valores_ambientales.csv', 'text/csv;charset=utf-8');
    });
    document.addEventListener('stepchange', e => { if (e.detail.step === 7) show(); });
    document.addEventListener('cleanchange', () => { occAll = null; S = null; if (document.querySelector('#panel-7.active')) show(); });
    document.addEventListener('langchange', () => { if (document.querySelector('#panel-7.active')) { render(); if (last) runPair(); } });
  }
  document.addEventListener('DOMContentLoaded', wire);

  Object.assign(B7, { load, run, runPair, show, opt, lastPair: () => last, space: () => S, occurrences: () => occAll, used });
  window.B7 = B7;
})();
