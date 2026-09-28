/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 5 engine: spatial co-occurrence of plants and
   visitors.

   Three independent readings of "do they meet in space?":
   1. cells — the territory is cut into a grid; for each plant × visitor pair
      the number of cells both occupy is compared with the hypergeometric
      distribution of Veech (2013), within a universe of cells that the user
      chooses (the target group by default: cells where any taxon of the study
      was recorded, Phillips et al. 2009);
   2. distances — the distance from each plant record to the nearest visitor
      record, against a null model that places the visitor records at random
      among the locations of the target group (a Monte Carlo test, Davison &
      Hinkley 1997);
   3. ranges — the convex hull of each unit, its area on the sphere and the
      share of the plant's hull covered by the visitor's. */

const Cooc = {};

(function () {
  const P = Poll;

  /* ---------------- cells ---------------- */
  const key = (lon, lat, s) => GEO.cellKey(lon, lat, s);
  /* records → Map(unit → Set of cell keys) */
  function occupancy(records, size) {
    const m = new Map();
    records.forEach(r => {
      if (!m.has(r.unit)) m.set(r.unit, { unit: r.unit, role: r.role, cells: new Set(), n: 0 });
      const u = m.get(r.unit); u.cells.add(key(r.lon, r.lat, size)); u.n++;
    });
    return m;
  }
  /* the universe of cells */
  function universe(records, size, mode, opts) {
    const o = opts || {};
    if (mode === 'land') return landCells(records, size, o.box);
    const set = new Set();
    const pool = mode === 'targetRole' ? records.filter(r => r.role === o.role) : records;
    pool.forEach(r => set.add(key(r.lon, r.lat, size)));
    (o.extra || []).forEach(r => set.add(key(r.lon, r.lat, size)));
    return set;
  }
  /* every cell of the extent whose centre is on land (the naive universe that
     ignores sampling effort; offered only to show how much it inflates the result) */
  function landCells(records, size, box) {
    const b = box || GEO.bboxOfPoints(records.map(r => [r.lon, r.lat]), 0.02);
    const set = new Set();
    const i0 = Math.floor(b[0] / size), i1 = Math.floor(b[2] / size), j0 = Math.floor(b[1] / size), j1 = Math.floor(b[3] / size);
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > 400000) return null;          // too fine for this extent
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const lon = (i + 0.5) * size, lat = (j + 0.5) * size;
      if (GEO.stateOf(lon, lat) || GEO.countryOf(lon, lat)) set.add(`${i}|${j}`);
    }
    records.forEach(r => set.add(key(r.lon, r.lat, size)));           // a coastal record keeps its cell
    return set;
  }

  /* every plant × visitor pair */
  function pairs(records, size, mode, opts) {
    const occ = occupancy(records, size);
    const U = universe(records, size, mode, opts);
    if (!U) return null;
    const N = U.size;
    const plants = [...occ.values()].filter(u => u.role === 'plant');
    const visitors = [...occ.values()].filter(u => u.role === 'poll');
    const out = [];
    plants.forEach(p => visitors.forEach(v => {
      const a = [...p.cells].filter(c => U.has(c)), b = [...v.cells].filter(c => U.has(c));
      const bs = new Set(b);
      const shared = a.filter(c => bs.has(c)).length;
      const h = P.cooccurrence(N, a.length, b.length, shared, opts && opts.alpha);
      const s = P.setSimilarity(a, b);
      out.push({ plant: p.unit, visitor: v.unit, N, n1: a.length, n2: b.length, shared, exp: h.exp, pLe: h.pLe, pGe: h.pGe, ses: h.ses, verdict: h.verdict, classifiable: h.classifiable,
        jaccard: s.jaccard, sorensen: s.sorensen, simpson: s.simpson, cover: s.cover12, dist: h.dist });
    }));
    /* Benjamini–Hochberg over the classifiable pairs, on the tail that matters (two-sided: 2·min) */
    const cls = out.filter(x => x.classifiable);
    const adj = P.bhAdjust(cls.map(x => Math.min(1, 2 * Math.min(x.pLe, x.pGe))));
    cls.forEach((x, i) => { x.pAdj = adj[i]; });
    const alpha = (opts && opts.alpha) || 0.05;
    out.forEach(x => {
      if (!x.classifiable) { x.verdictAdj = 'unclassified'; return; }
      x.verdictAdj = x.pAdj < alpha ? (x.shared > x.exp ? 'positive' : 'negative') : 'random';
    });
    return { N, size, mode, pairs: out, plants: plants.map(u => u.unit), visitors: visitors.map(u => u.unit), occ };
  }

  /* the same test over several cell sizes: does the verdict hold? */
  function sensitivity(records, sizes, mode, opts) {
    return sizes.map(s => ({ size: s, res: pairs(records, s, mode, opts) })).filter(x => x.res);
  }

  /* ---------------- distances ----------------
     Observed: the median distance from each plant record to its nearest
     visitor record. Null: the visitor's records are replaced by as many
     locations drawn without replacement from the target group (every record
     of the study), which keeps the geography of sampling and breaks only the
     link between the two taxa. One-sided p = share of nulls at least as close. */
  function nnTest(plantPts, visitorPts, poolPts, nSim, seed) {
    if (!plantPts.length || !visitorPts.length) return null;
    const obsD = P.nearestDistances(plantPts, visitorPts);
    const med = Stat.median(obsD);
    const r = rng(seed || 1);
    const nulls = [];
    const pool = poolPts.slice();
    const k = Math.min(visitorPts.length, pool.length);
    for (let s = 0; s < nSim; s++) {
      /* partial Fisher–Yates: the first k of a shuffled copy */
      for (let i = 0; i < k; i++) { const j = i + Math.floor(r() * (pool.length - i)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      nulls.push(Stat.median(P.nearestDistances(plantPts, pool.slice(0, k))));
    }
    const closer = nulls.filter(x => x <= med).length;
    const farther = nulls.filter(x => x >= med).length;
    return { obs: obsD, median: med, nulls, nullMedian: Stat.median(nulls), pCloser: P.mcP(closer, nSim), pFarther: P.mcP(farther, nSim),
      ses: (med - Stat.mean(nulls)) / (Stat.sd(nulls) || NaN), within: [5, 10, 25, 50].map(km => obsD.filter(d => d <= km).length / obsD.length) };
  }
  /* thinning to at most one point per cell of `km` kilometres: with thousands of
     records the test stays fast and the result is not driven by a few dense spots */
  function thin(pts, km) {
    const deg = km / 111.195, seen = new Set(), out = [];
    pts.forEach(p => { const k = Math.floor(p[0] / deg) + '|' + Math.floor(p[1] / deg); if (!seen.has(k)) { seen.add(k); out.push(p); } });
    return out;
  }

  /* ---------------- ranges ---------------- */
  function hullOf(pts) { return P.convexHull(pts); }
  function rangeOverlap(plantPts, visitorPts) {
    const hp = hullOf(plantPts), hv = hullOf(visitorPts);
    if (hp.length < 3 || hv.length < 3) return { hp, hv, areaP: 0, areaV: 0, inter: [], areaI: 0, coverP: NaN, coverV: NaN };
    const inter = P.clipConvex(hp, hv);
    const areaP = P.sphericalArea(hp), areaV = P.sphericalArea(hv), areaI = inter.length >= 3 ? P.sphericalArea(inter) : 0;
    return { hp, hv, inter, areaP, areaV, areaI, coverP: areaI / areaP, coverV: areaI / areaV };
  }

  Object.assign(Cooc, { occupancy, universe, landCells, pairs, sensitivity, nnTest, thin, rangeOverlap });
  window.Cooc = Cooc;
})();
