/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 8: potential distribution and mismatch (the
   interface). The engine is js/sdm.js; the layers come from Block 7. */

const B8 = {};

(function () {
  const V = n => `var(--${n})`;
  const opt = { kind: 'logistic', rule: 'maxtss', folds: 4, bgMode: 'target', maxBg: 5000 };
  try { Object.assign(opt, JSON.parse(localStorage.getItem('pollinationpro:sdm') || '{}')); } catch (e) { /* first visit */ }
  const keep = () => { try { localStorage.setItem('pollinationpro:sdm', JSON.stringify(opt)); } catch (e) { /* ignore */ } };
  let res = null, fut = null;

  const layers = () => (window.B7 ? B7.used() : []);
  /* presences of a unit: one per cell, with all variables present */
  function presencesOf(unit, Ls) {
    const L0 = Ls[0], seen = new Set(), out = [];
    state.clean.records.forEach(r => {
      if (r.unit !== unit) return;
      const c = Math.floor((r.lon - L0.x0) / L0.dx), rw = Math.floor((L0.y0 - r.lat) / L0.dy);
      if (c < 0 || rw < 0 || c >= L0.w || rw >= L0.h) return;
      const k = c + '|' + rw; if (seen.has(k)) return;
      const x = Ls.map(L => L.data[rw * L0.w + c]);
      if (x.some(v => !isFinite(v))) return;
      seen.add(k); out.push(x);
    });
    return out;
  }
  /* background: the cells of every record of the study (target group), or a random sample of the whole grid */
  function backgroundRows(Ls) {
    const L0 = Ls[0], r = rng(12);
    let idx = [];
    if (opt.bgMode === 'target') {
      const seen = new Set();
      state.clean.records.forEach(q => {
        const c = Math.floor((q.lon - L0.x0) / L0.dx), rw = Math.floor((L0.y0 - q.lat) / L0.dy);
        if (c < 0 || rw < 0 || c >= L0.w || rw >= L0.h) return;
        const i = rw * L0.w + c; if (!seen.has(i)) { seen.add(i); idx.push(i); }
      });
    } else for (let i = 0; i < L0.w * L0.h; i++) idx.push(i);
    idx = idx.filter(i => Ls.every(L => isFinite(L.data[i])));
    Poll.shuffle(idx, r);
    return idx.slice(0, opt.maxBg).map(i => Ls.map(L => L.data[i]));
  }

  /* ---------------- running ---------------- */
  /* `w` (optional) is the waiting window: between one unit and the next the
     page may repaint; every model keeps its own seed, so the result is the
     same as in one go */
  async function run(w) {
    clearMessages('b8Msg');
    const Ls = layers();
    if (Ls.length < 2) { showMessage('b8Msg', 'warning', L2('Carga al menos dos capas en el Bloque 7.', 'Load at least two layers in Block 7.')); return; }
    const plant = el('b8Plant').value, visitors = els('#b8Visitors input:checked').map(i => i.value);
    if (!plant || !visitors.length) { showMessage('b8Msg', 'warning', L2('Elige una planta y al menos un visitante.', 'Choose a plant and at least one visitor.')); return; }
    const bg = backgroundRows(Ls);
    const units = [plant].concat(visitors);
    const out = { plant, visitors, kind: opt.kind, rule: opt.rule, units: {}, nBg: bg.length, layers: Ls.map(L => L.label) };
    for (const [k, u] of units.entries()) {
      if (w && window.LABG) { w.update(k / units.length, T(`Modelo ${k + 1} de ${units.length}: ${u}`, `Model ${k + 1} of ${units.length}: ${u}`)); await LABG.nextPaint(); }
      const pres = presencesOf(u, Ls);
      if (pres.length < 8) { showMessage('b8Msg', 'warning', L2(`<i>${esc(u)}</i> tiene ${pres.length} celdas con registros: hacen falta al menos 8 para modelar.`, `<i>${esc(u)}</i> has ${pres.length} cells with records: at least 8 are needed to model.`)); continue; }
      const cv = SDM.crossValidate(opt.kind, pres, bg, opt.folds, opt.rule, 7);
      const model = SDM.fit(opt.kind, pres, bg);
      const sP = pres.map(model.predict), sB = bg.map(model.predict);
      const t = SDM.threshold(sP, sB, opt.rule);
      const grid = SDM.predictGrid(model, Ls);
      const bin = SDM.binary(grid, t);
      out.units[u] = { n: pres.length, cv, t, aucTrain: SDM.auc(sP, sB), grid, bin, model, pres, extra: SDM.extrapolation(pres, Ls) };
    }
    if (!out.units[plant] || !visitors.some(v => out.units[v])) { res = null; el('b8Body2').style.display = 'none'; return; }
    const vBins = visitors.filter(v => out.units[v]).map(v => out.units[v].bin);
    out.mm = SDM.mismatch(out.units[plant].bin, vBins, Ls[0]);
    res = out;
    fut = null;
    state.sdm = { plant, visitors, kind: opt.kind, rule: opt.rule, nBg: bg.length, bgMode: opt.bgMode, layers: out.layers,
      units: Object.fromEntries(Object.entries(out.units).map(([u, x]) => [u, { n: x.n, auc: x.cv.auc, tss: x.cv.tss, omission: x.cv.omission, aucTrain: x.aucTrain, threshold: x.t }])),
      area: out.mm.area };
    render();
    return true;
  }

  /* ---------------- drawing a raster inside an SVG ---------------- */
  const rgb = c => { const s = String(c).trim(); if (s.startsWith('#')) { const h = s.length === 4 ? s.slice(1).split('').map(x => x + x).join('') : s.slice(1, 7); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); } const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [128, 128, 128]; };
  function rasterImage(L, colourOf) {
    const cv = document.createElement('canvas'); cv.width = L.w; cv.height = L.h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(L.w, L.h);
    for (let i = 0; i < L.w * L.h; i++) {
      const c = colourOf(i);
      if (!c) continue;
      img.data[4 * i] = c[0]; img.data[4 * i + 1] = c[1]; img.data[4 * i + 2] = c[2]; img.data[4 * i + 3] = c[3] == null ? 255 : c[3];
    }
    ctx.putImageData(img, 0, 0);
    return cv.toDataURL('image/png');
  }
  function mapFrame(svg, L) {
    const box = [L.x0, L.y0 - L.h * L.dy, L.x0 + L.w * L.dx, L.y0];
    const W = 520, H = Math.round(520 * (L.h * L.dy) / (L.w * L.dx * Math.cos((box[1] + box[3]) / 2 * Math.PI / 180))) + 20;
    const pr = GEO.projection(box, W, Math.min(560, H), 6);
    Plot.clear(svg); svg.setAttribute('viewBox', `0 0 ${W} ${Math.min(560, H)}`);
    return { pr, box, W, H: Math.min(560, H) };
  }
  function outlines(svg, pr, box) {
    const g = svgEl('g');
    GEO.WORLD.forEach(c => { if (c.a2 === 'MX') return; const d = GEO.ringsToPath(c.rings, pr, box); if (d) g.appendChild(svgEl('path', { d, fill: 'none', stroke: V('text-muted'), 'stroke-width': 0.6, opacity: 0.7 })); });
    GEO.MX.forEach(s => { const d = GEO.ringsToPath(s.rings, pr, box); if (d) g.appendChild(svgEl('path', { d, fill: 'none', stroke: V('text-muted'), 'stroke-width': 0.45, opacity: 0.7 })); });
    svg.appendChild(g);
  }
  function placeImage(svg, pr, L, href) {
    const x0 = pr.X(L.x0), x1 = pr.X(L.x0 + L.w * L.dx), y0 = pr.Y(L.y0), y1 = pr.Y(L.y0 - L.h * L.dy);
    svg.appendChild(svgEl('image', { href, x: x0.toFixed(1), y: y0.toFixed(1), width: (x1 - x0).toFixed(1), height: (y1 - y0).toFixed(1), preserveAspectRatio: 'none', style: 'image-rendering:pixelated' }));
  }
  function drawSuit(id, u, tone) {
    const svg = el(id), L = layers()[0], x = res.units[u];
    if (!x) { Plot.empty(svg, 520, 300, T('Sin modelo', 'No model')); return; }
    const { pr, box, W, H } = mapFrame(svg, L);
    const hi = rgb(cssVar('--' + tone)), lo = rgb(cssVar('--card-bg'));
    const href = rasterImage(L, i => { const v = x.grid[i]; if (!isFinite(v)) return null; const t = Math.max(0, Math.min(1, v)); return lo.map((c, k) => Math.round(c + (hi[k] - c) * t)).concat([255]); });
    placeImage(svg, pr, L, href);
    outlines(svg, pr, box);
    x.pres.length && state.clean.records.filter(r => r.unit === u).slice(0, 3000).forEach(r => svg.appendChild(svgEl('circle', { cx: pr.X(r.lon).toFixed(1), cy: pr.Y(r.lat).toFixed(1), r: 1.3, fill: V('text'), opacity: 0.55 })));
    /* the colour ramp (a key without entries: data-legend, for the figure studio) */
    const g = svgEl('g', { 'data-legend': 'colorbar' });
    for (let k = 0; k < 20; k++) g.appendChild(svgEl('rect', { x: 12 + k * 6, y: H - 18, width: 6, height: 8, fill: `rgb(${lo.map((c, j) => Math.round(c + (hi[j] - c) * k / 19)).join(',')})` }));
    g.appendChild(svgEl('text', { x: 12, y: H - 22, 'font-size': 9, class: 'art-mut' }, T('idoneidad 0 → 1', 'suitability 0 → 1')));
    svg.appendChild(g);
  }
  const MM = [['neither', 'bg-soft', ['ninguno', 'neither']], ['plant', 'rose', ['solo la planta (desajuste)', 'plant only (mismatch)']], ['visitor', 'accent', ['solo el visitante', 'visitor only']], ['both', 'primary', ['planta con visitante', 'plant with visitor']]];
  function drawMismatch(id, mm) {
    const svg = el(id), L = layers()[0];
    const { pr, box, H } = mapFrame(svg, L);
    const cols = MM.map(m => rgb(cssVar('--' + m[1])));
    const href = rasterImage(L, i => { const c = mm.cls[i]; if (c === 255) return null; return cols[c].concat([c === 0 ? 150 : 235]); });
    placeImage(svg, pr, L, href);
    outlines(svg, pr, box);
    /* the legend (data-role="legend"), each entry (swatch and label) with its data-li, for the figure studio */
    const g = svgEl('g', { 'data-role': 'legend' });
    MM.slice(1).concat([MM[0]]).forEach((m, k) => {
      const c = MM.indexOf(m);
      g.appendChild(svgEl('rect', { x: 12, y: H - 64 + k * 14, width: 10, height: 10, rx: 2, fill: `rgb(${cols[c].join(',')})`, 'data-li': k }));
      g.appendChild(svgEl('text', { x: 27, y: H - 55 + k * 14, 'font-size': 9.5, class: 'art-txt', 'data-li': k }, T(...m[2])));
    });
    svg.appendChild(g);
  }

  /* ---------------- rendering ---------------- */
  function render() {
    el('b8Body2').style.display = '';
    const U = res.units;
    buildTable('b8Eval', [
      { key: 'u', label: T('Unidad', 'Unit'), html: true, get: r => Taxa.italic(r.u) },
      { key: 'n', label: T('Celdas con registros', 'Cells with records'), num: true },
      { key: 'auc', label: T('AUC (validación)', 'AUC (validation)'), num: true, html: true, get: r => `${fmtFixed(r.cv.auc, 3)} ${Help.tag('auc', r.cv.auc)}` },
      { key: 'tss', label: T('TSS (validación)', 'TSS (validation)'), num: true, html: true, get: r => `${fmtFixed(r.cv.tss, 3)} ${Help.tag('tss', r.cv.tss)}` },
      { key: 'om', label: T('Omisión', 'Omission'), num: true, get: r => fmtPct(r.cv.omission, 0) },
      { key: 't', label: T('Umbral', 'Threshold'), num: true, get: r => fmtFixed(r.t, 3) },
    ], Object.entries(U).map(([u, x]) => Object.assign({ u }, x)));
    const A = res.mm.area, plantA = A[1] + A[3];
    statTiles('b8Tiles', [
      [T('Área idónea de la planta', 'Plant suitable area'), Math.round(plantA).toLocaleString('en-US') + ' km²', ''],
      [T('Con visitante potencial', 'With a potential visitor'), fmtPct(A[3] / Math.max(1, plantA), 0), Math.round(A[3]).toLocaleString('en-US') + ' km²'],
      [T('Desajuste: planta sin visitante', 'Mismatch: plant without visitor'), fmtPct(A[1] / Math.max(1, plantA), 0), Math.round(A[1]).toLocaleString('en-US') + ' km²', A[1] / Math.max(1, plantA) > 0.3 ? 'warn' : ''],
      [T('Solo el visitante', 'Visitor only'), Math.round(A[2]).toLocaleString('en-US') + ' km²', ''],
    ]);
    drawSuit('b8MapPlant', res.plant, 'primary');
    /* the visitors' combined suitability: the highest of them in each cell */
    const vs = res.visitors.filter(v => U[v]);
    const comb = { grid: new Float32Array(U[vs[0]].grid.length).fill(NaN), pres: [] };
    for (let i = 0; i < comb.grid.length; i++) { let m = NaN; vs.forEach(v => { const g = U[v].grid[i]; if (isFinite(g) && !(m >= g)) m = g; }); comb.grid[i] = m; }
    res.units.__visitors = comb;
    drawSuit('b8MapVis', '__visitors', 'accent');
    delete res.units.__visitors;
    drawMismatch('b8MapMM', res.mm);
    const ex = U[res.plant].extra; let nEx = 0; for (let i = 0; i < ex.length; i++) nEx += ex[i];
    el('b8Extra').innerHTML = L2(`${fmtPct(nEx / Math.max(1, ex.length), 0)} de las celdas del mapa quedan fuera del intervalo ambiental de los registros de la planta en al menos una variable: ahí el modelo extrapola y su idoneidad debe leerse con cautela.`, `${fmtPct(nEx / Math.max(1, ex.length), 0)} of the map cells lie outside the environmental range of the plant's records in at least one variable: there the model extrapolates and its suitability must be read with caution.`);
    Fig.decorate(el('panel-8'));
  }

  /* ---------------- future climate ---------------- */
  async function loadFuture(files) {
    clearMessages('b8FutMsg');
    if (!res) { showMessage('b8FutMsg', 'warning', L2('Primero ajusta los modelos con el clima actual.', 'First fit the models with the current climate.')); return; }
    const Ls = layers(), L0 = Ls[0];
    const byLabel = {};
    for (const f of [...files]) {
      const name = f.name.replace(/\.(tiff?|asc)$/i, '');
      const m = /bio_?0?(\d{1,2})$/i.exec(name);
      const label = m ? 'BIO' + m[1] : name;
      if (!Ls.some(L => L.label === label)) continue;
      let L = await Raster.readFile(f, Raster.bboxOf(L0));
      if (!Raster.sameGrid(L0, L)) L = Raster.resampleTo(L, L0);
      byLabel[label] = L;
    }
    const missing = Ls.filter(L => !byLabel[L.label]).map(L => L.label);
    if (missing.length) { showMessage('b8FutMsg', 'error', L2(`Faltan capas futuras para: ${missing.join(', ')}. Deben llamarse igual que las actuales (por ejemplo, terminar en «bio_1»).`, `Future layers are missing for: ${missing.join(', ')}. They must be named like the current ones (for instance, ending in "bio_1").`)); return; }
    const FL = Ls.map(L => byLabel[L.label]);
    const plantBin = SDM.binary(SDM.predictGrid(res.units[res.plant].model, FL), res.units[res.plant].t);
    const vBins = res.visitors.filter(v => res.units[v]).map(v => SDM.binary(SDM.predictGrid(res.units[v].model, FL), res.units[v].t));
    fut = SDM.mismatch(plantBin, vBins, L0);
    const A0 = res.mm.area, A1 = fut.area;
    const p0 = A0[1] + A0[3], p1 = A1[1] + A1[3];
    buildTable('b8FutTable', [
      { key: 'k', label: '' }, { key: 'now', label: T('Actual (km²)', 'Current (km²)'), num: true }, { key: 'fut', label: T('Futuro (km²)', 'Future (km²)'), num: true }, { key: 'ch', label: T('Cambio', 'Change'), num: true },
    ], [
      [T('Área idónea de la planta', 'Plant suitable area'), p0, p1],
      [T('Planta con visitante potencial', 'Plant with a potential visitor'), A0[3], A1[3]],
      [T('Planta sin visitante (desajuste)', 'Plant without a visitor (mismatch)'), A0[1], A1[1]],
    ].map(([k, a, b]) => ({ k, now: Math.round(a).toLocaleString('en-US'), fut: Math.round(b).toLocaleString('en-US'), ch: a ? fmtPct((b - a) / a, 0) : '—' })));
    drawMismatch('b8MapFut', fut);
    el('b8FutBody').style.display = '';
    state.sdm.future = { area: A1, files: [...files].map(f => f.name) };
    Fig.decorate(el('panel-8'));
  }

  function show() {
    B3.ensure();
    const Ls = layers();
    const ok = !!(state.clean && Ls.length >= 2);
    el('b8Empty').style.display = ok ? 'none' : '';
    el('b8Body').style.display = ok ? '' : 'none';
    if (!ok) return;
    const units = [...new Set(state.clean.records.map(r => r.unit))];
    const role = u => state.clean.records.find(r => r.unit === u).role;
    const plants = units.filter(u => role(u) === 'plant'), visitors = units.filter(u => role(u) === 'poll');
    const cur = el('b8Plant').value;
    el('b8Plant').innerHTML = plants.map(u => `<option${u === cur ? ' selected' : ''}>${esc(u)}</option>`).join('');
    const checked = new Set(els('#b8Visitors input:checked').map(i => i.value));
    el('b8Visitors').innerHTML = visitors.map(u => `<label style="margin-right:12px"><input type="checkbox" value="${esc(u)}"${checked.size ? (checked.has(u) ? ' checked' : '') : ' checked'}> <i>${esc(u)}</i></label>`).join('');
    el('b8Kind').value = opt.kind; el('b8Rule').value = opt.rule; el('b8BgMode').value = opt.bgMode;
    el('b8Layers').textContent = el('b8LayersEn').textContent = Ls.map(L => L.label).join(', ');
  }
  function wire() {
    if (!el('panel-8')) return;
    els('.soon-art', el('panel-8')).forEach(n => { n.innerHTML = Art.soon(); });
    el('b8Kind').addEventListener('change', () => { opt.kind = el('b8Kind').value; keep(); });
    el('b8Rule').addEventListener('change', () => { opt.rule = el('b8Rule').value; keep(); });
    el('b8BgMode').addEventListener('change', () => { opt.bgMode = el('b8BgMode').value; keep(); });
    el('b8Run').addEventListener('click', () => { const b = el('b8Run'); b.disabled = true; el('b8Msg').innerHTML = `<div class="msg msg-info">${L2('Ajustando modelos…', 'Fitting models…')}</div>`; const w = poWork('Ajustando los modelos', 'Fitting the models'); poAfterPaint(async () => { try { if (!(await run(w)) && w) w._failed = true; } finally { b.disabled = false; } }, w); });
    el('b8Fut').addEventListener('change', e => { const files = [...e.target.files]; const w = poWork('Proyectando al futuro', 'Projecting to the future'); poAfterPaint(() => loadFuture(files), w); e.target.value = ''; });
    el('b8FutPractice').addEventListener('click', () => { if (!state.rasters || !state.rasters.practice) { showMessage('b8FutMsg', 'warning', L2('El futuro de práctica solo acompaña a las capas de práctica del Bloque 7.', 'The practice future only goes with the practice layers of Block 7.')); return; } const w = poWork('Proyectando al futuro', 'Projecting to the future'); poAfterPaint(() => loadFuture(Examples.layers('future').map(f => new File([f.text], f.name, { type: 'text/plain' }))), w); });
    el('b8Csv').addEventListener('click', () => {
      if (!res) return;
      const L0 = layers()[0], rows = [];
      for (let i = 0; i < res.mm.cls.length; i++) { const c = res.mm.cls[i]; if (c === 255) continue; rows.push({ lon: (L0.x0 + (i % L0.w + 0.5) * L0.dx).toFixed(5), lat: (L0.y0 - (Math.floor(i / L0.w) + 0.5) * L0.dy).toFixed(5), plant_suitability: res.units[res.plant].grid[i].toFixed(4), class: ['neither', 'plant_only', 'visitor_only', 'both'][c], future_class: fut ? ['neither', 'plant_only', 'visitor_only', 'both'][fut.cls[i]] || '' : '' }); }
      download(TableIO.toCSV(rows), 'desajuste_celdas.csv', 'text/csv;charset=utf-8');
    });
    document.addEventListener('stepchange', e => { if (e.detail.step === 8) show(); });
    document.addEventListener('themechange', () => { if (res && document.querySelector('#panel-8.active')) render(); });
    document.addEventListener('langchange', () => { if (document.querySelector('#panel-8.active')) { show(); if (res) render(); } });
  }
  document.addEventListener('DOMContentLoaded', wire);

  Object.assign(B8, { run, show, opt, result: () => res, future: () => fut, loadFuture, rasterImage });
  window.B8 = B8;
})();
