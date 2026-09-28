/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 8 engine: potential distributions and mismatch.

   Three presence-based models, from the simplest to the most flexible:
   · envelope — the climatic envelope of Nix (1986): for each variable the
     percentile of a cell among the unit's records; the suitability is the
     smallest, over variables, of 2·min(p, 1 − p);
   · Mahalanobis — the distance of a cell to the centroid of the records in
     the space of the variables, scaled by their covariance (Farber & Kadmon
     2003); suitability = the upper tail of χ²(k) at that distance;
   · logistic — presences against background cells (the target group or the
     whole area), with linear and quadratic terms of the standardised
     variables and a ridge penalty, fitted by iteratively reweighted least
     squares with the background down-weighted to the number of presences
     (Phillips et al. 2009; Elith et al. 2011 for the family of models).

   Each model is evaluated by k-fold cross-validation with the AUC of
   presences against background and the true skill statistic at the chosen
   threshold (Allouche et al. 2006). The binary maps of a plant and of its
   potential visitors give the mismatch map: where the plant is suitable and
   no visitor is. Extrapolation is flagged where a cell lies outside the
   range of the records used to fit the model (the simplest form of the MESS
   of Elith et al. 2010). */

const SDM = {};

(function () {
  const P = Poll;

  /* ---------------- helpers ---------------- */
  function colStats(rows) {
    const k = rows[0].length, n = rows.length;
    const mean = new Array(k).fill(0), sd = new Array(k).fill(0);
    rows.forEach(r => r.forEach((v, j) => { mean[j] += v; }));
    mean.forEach((m, j) => { mean[j] = m / n; });
    rows.forEach(r => r.forEach((v, j) => { sd[j] += (v - mean[j]) ** 2; }));
    sd.forEach((s, j) => { sd[j] = Math.sqrt(s / Math.max(1, n - 1)) || 1; });
    return { mean, sd };
  }
  /* solve A x = b for a small symmetric positive-definite A (Cholesky) */
  function cholSolve(A, b) {
    const n = A.length, L = A.map(r => new Array(n).fill(0));
    for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) { if (s <= 0) s = 1e-10; L[i][i] = Math.sqrt(s); } else L[i][j] = s / L[j][j];
    }
    const y = new Array(n);
    for (let i = 0; i < n; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; }
    return x;
  }
  function invert(A) {
    const n = A.length;
    return A.map((_, j) => cholSolve(A, A.map((__, i) => (i === j ? 1 : 0)))).map((col, j, all) => all.map(c => c[j]));
  }

  /* ---------------- the three models ---------------- */
  function fitEnvelope(pres) {
    const k = pres[0].length;
    const sorted = Array.from({ length: k }, (_, j) => pres.map(r => r[j]).sort((a, b) => a - b));
    const pct = (j, v) => {
      const s = sorted[j], n = s.length;
      let lo = 0, hi = n;
      while (lo < hi) { const m = (lo + hi) >> 1; if (s[m] < v) lo = m + 1; else hi = m; }
      let lo2 = lo, hi2 = n;
      while (lo2 < hi2) { const m = (lo2 + hi2) >> 1; if (s[m] <= v) lo2 = m + 1; else hi2 = m; }
      return (lo + lo2) / 2 / n;                    // mid-rank percentile
    };
    return { kind: 'envelope', predict: x => { let s = 1; for (let j = 0; j < k; j++) { const p = pct(j, x[j]); s = Math.min(s, 2 * Math.min(p, 1 - p)); } return s; } };
  }
  function fitMahalanobis(pres) {
    const k = pres[0].length, n = pres.length;
    const { mean } = colStats(pres);
    const C = Array.from({ length: k }, () => new Array(k).fill(0));
    pres.forEach(r => { for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) C[i][j] += (r[i] - mean[i]) * (r[j] - mean[j]); });
    for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) C[i][j] /= Math.max(1, n - 1);
    for (let i = 0; i < k; i++) C[i][i] += 1e-9 * (C[i][i] || 1);
    const Ci = invert(C);
    return { kind: 'mahalanobis', predict: x => { let d2 = 0; const dx = x.map((v, i) => v - mean[i]); for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) d2 += dx[i] * Ci[i][j] * dx[j]; return P.pchisqUpper(d2, k); } };
  }
  function fitLogistic(pres, bg, opts) {
    const o = Object.assign({ lambda: 1, iter: 30 }, opts || {});
    const st = colStats(pres.concat(bg));
    const feats = x => { const z = x.map((v, j) => (v - st.mean[j]) / st.sd[j]); return [1].concat(z, z.map(v => v * v)); };
    const X = pres.map(feats).concat(bg.map(feats));
    const y = pres.map(() => 1).concat(bg.map(() => 0));
    /* the background is weighted so that it sums to the presences: the model
       learns the contrast, not the arbitrary number of background cells */
    const wB = pres.length / Math.max(1, bg.length);
    const w = pres.map(() => 1).concat(bg.map(() => wB));
    const p = X[0].length;
    let beta = new Array(p).fill(0);
    for (let it = 0; it < o.iter; it++) {
      const H = Array.from({ length: p }, () => new Array(p).fill(0)), g = new Array(p).fill(0);
      X.forEach((xi, i) => {
        const eta = xi.reduce((s, v, j) => s + v * beta[j], 0), mu = 1 / (1 + Math.exp(-eta));
        const wi = w[i] * Math.max(1e-6, mu * (1 - mu)), ri = w[i] * (y[i] - mu);
        for (let a = 0; a < p; a++) { g[a] += xi[a] * ri; for (let b = 0; b <= a; b++) H[a][b] += xi[a] * wi * xi[b]; }
      });
      for (let a = 0; a < p; a++) { for (let b = 0; b < a; b++) H[b][a] = H[a][b]; if (a) { H[a][a] += o.lambda; g[a] -= o.lambda * beta[a]; } }
      const step = cholSolve(H, g);
      beta = beta.map((b, j) => b + step[j]);
      if (Math.max(...step.map(Math.abs)) < 1e-7) break;
    }
    return { kind: 'logistic', beta, predict: x => 1 / (1 + Math.exp(-feats(x).reduce((s, v, j) => s + v * beta[j], 0))) };
  }
  function fit(kind, pres, bg, opts) {
    if (kind === 'envelope') return fitEnvelope(pres);
    if (kind === 'mahalanobis') return fitMahalanobis(pres);
    return fitLogistic(pres, bg, opts);
  }

  /* ---------------- evaluation ---------------- */
  /* AUC as the Mann–Whitney probability that a presence outranks a background cell */
  function auc(sp, sb) {
    const all = sp.map(v => [v, 1]).concat(sb.map(v => [v, 0])).sort((a, b) => a[0] - b[0]);
    let rank = 0, sumP = 0, i = 0;
    while (i < all.length) {
      let j = i; while (j < all.length && all[j][0] === all[i][0]) j++;
      const avg = (i + j + 1) / 2;
      for (let k = i; k < j; k++) if (all[k][1]) sumP += avg;
      i = j;
    }
    const n1 = sp.length, n0 = sb.length;
    return n1 && n0 ? (sumP - n1 * (n1 + 1) / 2) / (n1 * n0) : NaN;
  }
  /* sensitivity + specificity − 1 at a threshold (Allouche et al. 2006) */
  function tss(sp, sb, t) {
    const sens = sp.filter(v => v >= t).length / sp.length, spec = sb.filter(v => v < t).length / sb.length;
    return { tss: sens + spec - 1, sens, spec };
  }
  /* thresholds: the tenth percentile of the training presences, or the one that maximises TSS */
  function threshold(sp, sb, rule) {
    if (rule === 'p10') return Stat.quantile(sp, 0.1);
    if (rule === 'p0') return Math.min(...sp);
    const cands = [...new Set(sp.concat(sb).map(v => +v.toFixed(4)))].sort((a, b) => a - b);
    let best = 0.5, bt = -2;
    const step = Math.max(1, Math.floor(cands.length / 400));
    for (let i = 0; i < cands.length; i += step) { const t = tss(sp, sb, cands[i]).tss; if (t > bt) { bt = t; best = cands[i]; } }
    return best;
  }
  /* k-fold cross-validation, presences split at random (seeded) */
  function crossValidate(kind, pres, bg, k, rule, seed) {
    const r = rng(seed || 1);
    const idx = pres.map((_, i) => i); P.shuffle(idx, r);
    const folds = [];
    for (let f = 0; f < k; f++) {
      const test = idx.filter((_, i) => i % k === f).map(i => pres[i]), train = idx.filter((_, i) => i % k !== f).map(i => pres[i]);
      if (train.length < 5 || !test.length) continue;
      const m = fit(kind, train, bg);
      const sTr = train.map(m.predict), sTe = test.map(m.predict), sB = bg.map(m.predict);
      const t = threshold(sTr, sB, rule);
      folds.push({ auc: auc(sTe, sB), tss: tss(sTe, sB, t).tss, omission: sTe.filter(v => v < t).length / sTe.length });
    }
    const mean = key => Stat.mean(folds.map(f => f[key]));
    return { folds, auc: mean('auc'), tss: mean('tss'), omission: mean('omission') };
  }

  /* ---------------- maps ---------------- */
  /* prediction on every cell of the layers' grid (NaN where a layer is missing) */
  function predictGrid(model, layers) {
    const L0 = layers[0], n = L0.w * L0.h, out = new Float32Array(n);
    const x = new Array(layers.length);
    for (let i = 0; i < n; i++) {
      let ok = true;
      for (let j = 0; j < layers.length; j++) { const v = layers[j].data[i]; if (!isFinite(v)) { ok = false; break; } x[j] = v; }
      out[i] = ok ? model.predict(x) : NaN;
    }
    return out;
  }
  /* cells outside the range of the records used to fit (per variable) */
  function extrapolation(pres, layers) {
    const k = layers.length, lo = new Array(k).fill(Infinity), hi = new Array(k).fill(-Infinity);
    pres.forEach(r => r.forEach((v, j) => { if (v < lo[j]) lo[j] = v; if (v > hi[j]) hi[j] = v; }));
    const L0 = layers[0], n = L0.w * L0.h, out = new Uint8Array(n);
    for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) { const v = layers[j].data[i]; if (isFinite(v) && (v < lo[j] || v > hi[j])) { out[i] = 1; break; } }
    return out;
  }
  /* area of a cell in km² at its latitude */
  function cellArea(L, row) {
    const lat1 = L.y0 - row * L.dy, lat2 = lat1 - L.dy;
    return P.sphericalArea([[0, lat2], [L.dx, lat2], [L.dx, lat1], [0, lat1]]);
  }
  /* the mismatch classes: 0 neither, 1 plant only, 2 visitor only, 3 both */
  function mismatch(plantBin, visitorBins, L0) {
    const n = plantBin.length, cls = new Uint8Array(n).fill(255);
    const area = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      if (plantBin[i] === 255) continue;
      const v = visitorBins.some(b => b[i] === 1) ? 1 : 0;
      const c = (plantBin[i] ? 1 : 0) + (v ? 2 : 0);
      cls[i] = c;
      area[c] += cellArea(L0, Math.floor(i / L0.w));
    }
    return { cls, area };
  }
  const binary = (grid, t) => { const b = new Uint8Array(grid.length); for (let i = 0; i < grid.length; i++) b[i] = isFinite(grid[i]) ? (grid[i] >= t ? 1 : 0) : 255; return b; };

  Object.assign(SDM, { fit, fitEnvelope, fitMahalanobis, fitLogistic, auc, tss, threshold, crossValidate, predictGrid, extrapolation, mismatch, binary, cellArea, cholSolve, invert, colStats });
  window.SDM = SDM;
})();
