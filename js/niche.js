/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 7 engine: environmental niche overlap.

   The method of Broennimann et al. (2012), step by step:
   1. the background — every cell of the study area with all layers present
      (optionally only those within a distance of the study's records) —
      is summarised by a principal component analysis of the standardised
      variables (Poll.pca, fitted on the background only);
   2. the records of each unit are projected onto the first two axes;
   3. on a 100 × 100 grid of that plane, a Gaussian kernel density of the
      records and one of the background are estimated; the records' density
      is kept inside the available environment (the cells where the
      background density exceeds 1 % of its maximum) and, if the user asks,
      divided by the environment density, which corrects for how common each
      environment is but amplifies the edges of the available space;
   4. Schoener's D and Warren's I compare the densities of the two units;
   5. the equivalency test reshuffles the records between the two units, and
      the similarity test moves the second unit's records to a random place
      of the background, many times each (Warren et al. 2008; Broennimann et
      al. 2012). */

const Niche = {};

(function () {
  const P = Poll;

  /* ---------------- the background ---------------- */
  /* layers on a common grid → background cells {i, lon, lat, v:[…]} */
  function background(layers, opts) {
    const o = opts || {};
    const L0 = layers[0];
    const cells = [];
    const near = o.bufferKm && o.points && o.points.length ? bufferMask(L0, o.points, o.bufferKm) : null;
    for (let r = 0; r < L0.h; r++) for (let c = 0; c < L0.w; c++) {
      const i = r * L0.w + c;
      if (near && !near[i]) continue;
      const v = layers.map(L => L.data[i]);
      if (v.some(x => !isFinite(x))) continue;
      const lon = L0.x0 + (c + 0.5) * L0.dx, lat = L0.y0 - (r + 0.5) * L0.dy;
      if (o.box && (lon < o.box[0] || lon > o.box[2] || lat < o.box[1] || lat > o.box[3])) continue;
      cells.push({ i, lon, lat, v });
    }
    return cells;
  }
  /* cells within km of any point (a disc drawn on the grid around each point) */
  function bufferMask(L, pts, km) {
    const m = new Uint8Array(L.w * L.h);
    const kmLat = 111.195;
    pts.forEach(([lon, lat]) => {
      const kmLon = kmLat * Math.cos(lat * Math.PI / 180) || 1;
      const rx = Math.ceil(km / kmLon / L.dx), ry = Math.ceil(km / kmLat / L.dy);
      const c0 = Math.floor((lon - L.x0) / L.dx), r0 = Math.floor((L.y0 - lat) / L.dy);
      for (let r = Math.max(0, r0 - ry); r <= Math.min(L.h - 1, r0 + ry); r++) {
        const dyk = (r - r0) * L.dy * kmLat;
        for (let c = Math.max(0, c0 - rx); c <= Math.min(L.w - 1, c0 + rx); c++) {
          const dxk = (c - c0) * L.dx * kmLon;
          if (dxk * dxk + dyk * dyk <= km * km) m[r * L.w + c] = 1;
        }
      }
    });
    return m;
  }
  /* environmental values at the records; one record per cell and unit, so a
     heavily sampled locality does not weigh as a hundred */
  function extract(records, layers) {
    const L0 = layers[0];
    const seen = new Set(), out = [];
    records.forEach(r => {
      const c = Math.floor((r.lon - L0.x0) / L0.dx), rr = Math.floor((L0.y0 - r.lat) / L0.dy);
      const k = r.unit + '|' + c + '|' + rr;
      if (seen.has(k)) return;
      const v = layers.map(L => Raster.valueAt(L, r.lon, r.lat));
      if (v.some(x => !isFinite(x))) return;
      seen.add(k);
      out.push({ unit: r.unit, role: r.role, lon: r.lon, lat: r.lat, v });
    });
    return out;
  }

  /* ---------------- the environmental space ---------------- */
  function space(bg, occ, opts) {
    const o = Object.assign({ R: 100, maxBg: 40000, seed: 7 }, opts || {});
    /* the axes are fitted on the background (a random subset when it is huge) */
    let fit = bg;
    if (bg.length > o.maxBg) { const r = rng(o.seed); const idx = bg.map((_, i) => i); P.shuffle(idx, r); fit = idx.slice(0, o.maxBg).map(i => bg[i]); }
    const pca = P.pca(fit.map(c => c.v));
    const sBg = bg.map(c => pca.project(c.v).slice(0, 2));
    const sOcc = occ.map(c => pca.project(c.v).slice(0, 2));
    /* the extremes by a loop: a background of hundreds of thousands of cells
       would overflow the argument list of Math.min(...) */
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    [sBg, sOcc].forEach(arr => arr.forEach(s => { if (s[0] < x0) x0 = s[0]; if (s[0] > x1) x1 = s[0]; if (s[1] < y0) y0 = s[1]; if (s[1] > y1) y1 = s[1]; }));
    const padX = (x1 - x0) * 0.05, padY = (y1 - y0) * 0.05;
    const box = [x0 - padX, x1 + padX, y0 - padY, y1 + padY];
    /* the environment density, with Silverman's bandwidth of the background */
    const hx = P.silverman(sBg.map(s => s[0])), hy = P.silverman(sBg.map(s => s[1]));
    const zEnv = P.kde2d(sBg, box, o.R, hx, hy);
    let envMax = 0; for (let i = 0; i < zEnv.length; i++) if (zEnv[i] > envMax) envMax = zEnv[i];
    /* a cell of the plane counts as available when the background density is
       above a small fraction of its maximum: outside it, nothing is compared */
    const avail = zEnv.map(z => z > envMax * 0.01);
    return { pca, sBg, sOcc, box, R: o.R, zEnv, avail, hEnv: [hx, hy] };
  }
  /* the density of a set of scores inside the available environment, scaled to
     a maximum of 1; corrected = divided by the environment density, which
     weighs rare environments up (and amplifies the edges of the available
     space, where few cells exist) */
  function density(S, pts, h, corrected) {
    if (!pts.length) return new Float64Array(S.R * S.R);
    const hx = h ? h[0] : P.silverman(pts.map(p => p[0])), hy = h ? h[1] : P.silverman(pts.map(p => p[1]));
    const zOcc = P.kde2d(pts, S.box, S.R, Math.max(hx, 1e-6), Math.max(hy, 1e-6));
    const z = new Float64Array(zOcc.length);
    let mx = 0;
    for (let i = 0; i < z.length; i++) { z[i] = S.avail[i] ? (corrected ? zOcc[i] / S.zEnv[i] : zOcc[i]) : 0; if (z[i] > mx) mx = z[i]; }
    if (mx > 0) for (let i = 0; i < z.length; i++) z[i] /= mx;
    return z;
  }

  /* ---------------- overlap and the two tests ---------------- */
  function overlap(z1, z2) { return { D: P.schoenerD(Array.from(z1), Array.from(z2)), I: P.hellingerI(Array.from(z1), Array.from(z2)) }; }
  function compare(S, pts1, pts2, opts) {
    const o = Object.assign({ nRep: 100, seed: 11, corrected: false }, opts || {});
    const dens = pts => density(S, pts, null, o.corrected);
    const z1 = dens(pts1), z2 = dens(pts2);
    const obs = overlap(z1, z2);
    const r = rng(o.seed);
    /* equivalency: pool, shuffle, split into the original sizes */
    const pool = pts1.concat(pts2);
    const eq = [];
    for (let k = 0; k < o.nRep; k++) {
      const idx = pool.map((_, i) => i); P.shuffle(idx, r);
      const a = idx.slice(0, pts1.length).map(i => pool[i]), b = idx.slice(pts1.length).map(i => pool[i]);
      eq.push(overlap(dens(a), dens(b)).D);
    }
    /* similarity: the second unit keeps its shape and moves its centroid to a
       random point of the background (the first unit stays where it is) */
    const cx = Stat.mean(pts2.map(p => p[0])), cy = Stat.mean(pts2.map(p => p[1]));
    const sim = [];
    for (let k = 0; k < o.nRep; k++) {
      const b = S.sBg[Math.floor(r() * S.sBg.length)];
      const dx = b[0] - cx, dy = b[1] - cy;
      sim.push(overlap(z1, dens(pts2.map(p => [p[0] + dx, p[1] + dy]))).D);
    }
    return {
      D: obs.D, I: obs.I, z1, z2, eq, sim,
      /* equivalency is rejected when the observed D is lower than the null */
      pEq: P.mcP(eq.filter(x => x <= obs.D).length, o.nRep),
      /* the niches are more similar than chance when the observed D is higher */
      pSim: P.mcP(sim.filter(x => x >= obs.D).length, o.nRep),
      pSimLess: P.mcP(sim.filter(x => x <= obs.D).length, o.nRep),
      c1: [Stat.mean(pts1.map(p => p[0])), Stat.mean(pts1.map(p => p[1]))], c2: [cx, cy],
    };
  }
  /* one variable at a time: which variables set the two units apart */
  function univariate(occ1, occ2, bg, k, n) {
    const a = occ1.map(o => o.v[k]), b = occ2.map(o => o.v[k]), e = bg.map(c => c.v[k]);
    let lo = Infinity, hi = -Infinity; [e, a, b].forEach(arr => arr.forEach(x => { if (x < lo) lo = x; if (x > hi) hi = x; }));
    const R = n || 128;
    const za = P.kde1d(a, lo, hi, R), zb = P.kde1d(b, lo, hi, R);
    return { D: P.schoenerD(Array.from(za), Array.from(zb)), medA: Stat.median(a), medB: Stat.median(b), lo, hi, za, zb };
  }

  Object.assign(Niche, { background, bufferMask, extract, space, density, overlap, compare, univariate });
  window.Niche = Niche;
})();
