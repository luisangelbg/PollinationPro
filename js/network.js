/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 9 engine: plant–visitor interaction networks.

   The network is a matrix A of plants (rows) × visitors (columns) holding the
   number of visits (or 1/0 when only presence of the link is known).
   Network-level indices:
   · connectance: realised links over possible links;
   · NODF, nestedness by overlap and decreasing fill (Almeida-Neto et al.
     2008), on the binary matrix;
   · H₂′, the network-level specialisation of Blüthgen et al. (2006): the
     Shannon entropy of the interactions standardised between its minimum
     and maximum for the observed marginal totals;
   · Q, the bipartite modularity of Barber (2007), weighted, optimised by
     label propagation with restarts and a merging stage in the manner of
     Liu & Murata (2010) and Beckett (2016).
   Species-level: degree, normalised degree, strength (the sum of the
   dependences of the partners on the species, Bascompte et al. 2006), d′
   (Blüthgen et al. 2006) and the share of a plant's visits by each visitor.
   Null models: for the binary matrix, the curveball algorithm (Strona et al.
   2014), which keeps every row and column total; for the quantitative
   matrix, random pairing of individual visits, which keeps the marginal
   totals and samples the same distribution as Patefield (1981). */

const Net2 = {};

(function () {
  const P = Poll;

  /* ---------------- building the matrix ---------------- */
  function matrix(links, opts) {
    const o = opts || {};
    const rows = [...new Set(links.map(l => l.plant))].sort(), cols = [...new Set(links.map(l => l.visitor))].sort();
    const A = rows.map(() => new Array(cols.length).fill(0));
    links.forEach(l => { A[rows.indexOf(l.plant)][cols.indexOf(l.visitor)] += o.binary ? 1 : (l.n || 1); });
    if (o.binary) A.forEach(r => r.forEach((v, j) => { r[j] = v > 0 ? 1 : 0; }));
    return { rows, cols, A };
  }
  const sum = a => a.reduce((x, y) => x + y, 0);
  const rowSums = A => A.map(sum);
  const colSums = A => A[0].map((_, j) => sum(A.map(r => r[j])));
  const bin = A => A.map(r => r.map(v => (v > 0 ? 1 : 0)));

  /* ---------------- network indices ---------------- */
  function connectance(A) { const L = sum(A.map(r => r.filter(v => v > 0).length)); return L / (A.length * A[0].length); }

  function nodf(A0) {
    const A = bin(A0);
    const m = A.length, n = A[0].length;
    const pairScore = (u, v) => {       // u, v: 0/1 vectors
      const ku = sum(u), kv = sum(v);
      if (ku === kv || !ku || !kv) return 0;
      const [big, small, ks] = ku > kv ? [u, v, kv] : [v, u, ku];
      let shared = 0; for (let i = 0; i < small.length; i++) if (small[i] && big[i]) shared++;
      return 100 * shared / ks;
    };
    let sr = 0, sc = 0;
    for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) sr += pairScore(A[i], A[j]);
    const cols = A[0].map((_, j) => A.map(r => r[j]));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) sc += pairScore(cols[i], cols[j]);
    const pr = m * (m - 1) / 2, pc = n * (n - 1) / 2;
    return { nodf: (sr + sc) / Math.max(1, pr + pc), rows: pr ? sr / pr : NaN, cols: pc ? sc / pc : NaN };
  }

  /* H2 and its extremes for the observed marginals */
  const H = cells => { const T = sum(cells); let h = 0; cells.forEach(v => { if (v > 0) { const p = v / T; h -= p * Math.log(p); } }); return h; };
  function h2max(r, c) {
    /* integers as close as possible to the independence expectation r_i c_j / T,
       whose continuous version maximises the entropy */
    const T = sum(r), m = r.length, n = c.length;
    const M = r.map(ri => c.map(cj => Math.floor(ri * cj / T)));
    const rr = r.map((ri, i) => ri - sum(M[i])), cc = c.map((cj, j) => cj - sum(M.map(row => row[j])));
    /* the remainders go, one by one, to the cells furthest below expectation */
    const cand = [];
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) cand.push([r[i] * c[j] / T - M[i][j], i, j]);
    cand.sort((a, b) => b[0] - a[0]);
    let left = sum(rr), guard = 0;
    while (left > 0 && guard++ < 50) {
      for (const [, i, j] of cand) { if (left <= 0) break; if (rr[i] > 0 && cc[j] > 0) { M[i][j]++; rr[i]--; cc[j]--; left--; } }
    }
    return H([].concat(...M));
  }
  function h2min(r, c) {
    /* greedy: the largest possible block first (Blüthgen et al. 2006) */
    const rr = r.slice(), cc = c.slice(), cells = [];
    for (;;) {
      let bi = -1, bj = -1, best = 0;
      for (let i = 0; i < rr.length; i++) if (rr[i] > 0) for (let j = 0; j < cc.length; j++) if (cc[j] > 0) { const v = Math.min(rr[i], cc[j]); if (v > best) { best = v; bi = i; bj = j; } }
      if (bi < 0) break;
      cells.push(best); rr[bi] -= best; cc[bj] -= best;
    }
    return H(cells);
  }
  function h2prime(A) {
    const r = rowSums(A), c = colSums(A);
    const h = H([].concat(...A)), hmax = h2max(r, c), hmin = h2min(r, c);
    const v = hmax > hmin ? (hmax - h) / (hmax - hmin) : NaN;
    return { H2: h, H2max: hmax, H2min: hmin, H2p: Math.min(1, Math.max(0, v)) };
  }

  /* ---------------- modularity (Barber 2007, weighted) ---------------- */
  function modularityQ(A, rl, cl) {
    const m = sum(A.map(sum));
    const k = rowSums(A), d = colSums(A);
    let q = 0;
    for (let i = 0; i < A.length; i++) for (let j = 0; j < A[0].length; j++) if (rl[i] === cl[j]) q += A[i][j] - k[i] * d[j] / m;
    return q / m;
  }
  function modules(A, opts) {
    const o = Object.assign({ restarts: 30, seed: 1 }, opts || {});
    const r = rng(o.seed);
    const m = sum(A.map(sum)), k = rowSums(A), d = colSums(A);
    const nr = A.length, nc = A[0].length;
    let best = null;
    for (let s = 0; s < o.restarts; s++) {
      /* every visitor starts in its own module; plants take the best label, then visitors, until stable */
      let cl = Array.from({ length: nc }, (_, j) => j), rl = new Array(nr).fill(0);
      const bestLabel = (weights, own) => {
        const score = new Map();
        weights.forEach(([lab, w]) => score.set(lab, (score.get(lab) || 0) + w));
        let bl = own, bs = -Infinity;
        const keys = [...score.keys()]; P.shuffle(keys, r);
        keys.forEach(lab => { const v = score.get(lab); if (v > bs + 1e-12) { bs = v; bl = lab; } });
        return bl;
      };
      for (let it = 0; it < 100; it++) {
        let changed = false;
        const ro = Array.from({ length: nr }, (_, i) => i); P.shuffle(ro, r);
        ro.forEach(i => {
          /* the gain of joining label L: Σ_j∈L (A_ij − k_i d_j / m) */
          const w = []; for (let j = 0; j < nc; j++) w.push([cl[j], A[i][j] - k[i] * d[j] / m]);
          const nl = bestLabel(w, rl[i]); if (nl !== rl[i]) { rl[i] = nl; changed = true; }
        });
        const co = Array.from({ length: nc }, (_, j) => j); P.shuffle(co, r);
        co.forEach(j => {
          const w = []; for (let i = 0; i < nr; i++) w.push([rl[i], A[i][j] - k[i] * d[j] / m]);
          const nl = bestLabel(w, cl[j]); if (nl !== cl[j]) { cl[j] = nl; changed = true; }
        });
        if (!changed) break;
      }
      /* the merging stage: join two modules while that raises Q */
      let q = modularityQ(A, rl, cl);
      for (let guard = 0; guard < 50; guard++) {
        const labs = [...new Set(rl.concat(cl))];
        let gain = 0, pair = null;
        for (let a = 0; a < labs.length; a++) for (let b = a + 1; b < labs.length; b++) {
          const R2 = rl.map(x => (x === labs[b] ? labs[a] : x)), C2 = cl.map(x => (x === labs[b] ? labs[a] : x));
          const q2 = modularityQ(A, R2, C2);
          if (q2 - q > gain + 1e-12) { gain = q2 - q; pair = [labs[a], labs[b]]; }
        }
        if (!pair) break;
        rl = rl.map(x => (x === pair[1] ? pair[0] : x)); cl = cl.map(x => (x === pair[1] ? pair[0] : x));
        q += gain;
      }
      if (!best || q > best.Q + 1e-12) best = { Q: q, rl: rl.slice(), cl: cl.slice() };
    }
    /* renumber the modules 1…k */
    const map = new Map();
    best.rl.concat(best.cl).forEach(x => { if (!map.has(x)) map.set(x, map.size + 1); });
    return { Q: best.Q, rows: best.rl.map(x => map.get(x)), cols: best.cl.map(x => map.get(x)), n: map.size };
  }

  /* ---------------- species level ---------------- */
  function dprime(A, i, byRow) {
    /* d' of row i (a plant) against the column totals, or of column i (a visitor) against the row totals */
    const r = rowSums(A), c = colSums(A), T = sum(r);
    const a = byRow ? A[i].slice() : A.map(row => row[i]);
    const q = byRow ? c.map(x => x / T) : r.map(x => x / T);
    const Ai = sum(a);
    if (!Ai) return NaN;
    const d = v => v.reduce((s, x, j) => (x > 0 ? s + (x / Ai) * Math.log((x / Ai) / q[j]) : s), 0);
    const dRaw = d(a);
    /* extremes for Ai interactions: most even = proportional to q (integers);
       most specialised = all into the rarest partners, limited by their totals */
    const tot = byRow ? c : r;
    const even = q.map(x => Math.floor(x * Ai)); let rem = Ai - sum(even);
    q.map((x, j) => [x * Ai - even[j], j]).sort((u, v) => v[0] - u[0]).forEach(([, j]) => { if (rem > 0) { even[j]++; rem--; } });
    const spec = new Array(q.length).fill(0); let left = Ai;
    q.map((x, j) => [x, j]).sort((u, v) => u[0] - v[0]).forEach(([, j]) => { const t = Math.min(left, tot[j]); spec[j] = t; left -= t; });
    const dmin = d(even), dmax = d(spec);
    return dmax > dmin ? Math.min(1, Math.max(0, (dRaw - dmin) / (dmax - dmin))) : 0;
  }
  function species(A, rows, cols) {
    const r = rowSums(A), c = colSums(A);
    const plants = rows.map((name, i) => ({
      name, role: 'plant', visits: r[i], degree: A[i].filter(v => v > 0).length, ndegree: A[i].filter(v => v > 0).length / cols.length,
      /* strength: Σ over visitors of the visitor's dependence on this plant */
      strength: A[i].reduce((s, v, j) => s + (c[j] ? v / c[j] : 0), 0), dprime: dprime(A, i, true),
    }));
    const visitors = cols.map((name, j) => ({
      name, role: 'poll', visits: c[j], degree: A.filter(row => row[j] > 0).length, ndegree: A.filter(row => row[j] > 0).length / rows.length,
      strength: A.reduce((s, row, i) => s + (r[i] ? row[j] / r[i] : 0), 0), dprime: dprime(A, j, false),
    }));
    return { plants, visitors };
  }

  /* ---------------- null models ---------------- */
  /* curveball (Strona et al. 2014): pairs of rows trade their non-shared partners */
  function curveball(A0, r, steps) {
    const sets = bin(A0).map(row => row.map((v, j) => (v ? j : -1)).filter(j => j >= 0));
    const n = sets.length;
    for (let s = 0; s < (steps || 5 * n); s++) {
      const a = Math.floor(r() * n); let b = Math.floor(r() * (n - 1)); if (b >= a) b++;
      const A = new Set(sets[a]), B = new Set(sets[b]);
      const onlyA = sets[a].filter(x => !B.has(x)), onlyB = sets[b].filter(x => !A.has(x));
      const shared = sets[a].filter(x => B.has(x));
      const pool = onlyA.concat(onlyB); P.shuffle(pool, r);
      sets[a] = shared.concat(pool.slice(0, onlyA.length));
      sets[b] = shared.concat(pool.slice(onlyA.length));
    }
    const m = A0[0].length;
    return sets.map(sset => { const row = new Array(m).fill(0); sset.forEach(j => { row[j] = 1; }); return row; });
  }
  /* random pairing of individual visits: fixed row and column totals */
  function pairing(A0, r) {
    const rs = rowSums(A0), cs = colSums(A0);
    const R = [], C = [];
    rs.forEach((v, i) => { for (let k = 0; k < v; k++) R.push(i); });
    cs.forEach((v, j) => { for (let k = 0; k < v; k++) C.push(j); });
    P.shuffle(C, r);
    const M = rs.map(() => new Array(cs.length).fill(0));
    for (let k = 0; k < R.length; k++) M[R[k]][C[k]]++;
    return M;
  }
  function nullTest(A, stat, kind, n, seed) {
    const r = rng(seed || 1);
    const obs = stat(A);
    let tries = 0;
    const sims = [];
    for (let s = 0; s < n; s++) {
      const M = kind === 'curveball' ? curveball(A, r) : pairing(A, r);
      if ((M.some(row => sum(row) === 0) || colSums(M).some(v => v === 0)) && tries++ < 20 * n) { s--; continue; }
      sims.push(stat(M));
    }
    const mean = Stat.mean(sims), sd = Stat.sd(sims);
    return { obs, mean, sd, z: sd ? (obs - mean) / sd : NaN, pGreater: P.mcP(sims.filter(x => x >= obs).length, n), pLess: P.mcP(sims.filter(x => x <= obs).length, n), sims };
  }

  /* ---------------- visitors of one plant: how complete is the list? ---------------- */
  function completeness(counts) {
    const N = sum(counts);
    const c = P.chao1(counts);
    const curve = [];
    const step = Math.max(1, Math.floor(N / 60));
    for (let m = 1; m <= N; m += step) curve.push([m, P.rarefy(counts, m)]);
    if (!curve.length || curve[curve.length - 1][0] !== N) curve.push([N, c.S]);
    return Object.assign(c, { curve, completeness: c.chao1 ? c.S / c.chao1 : NaN });
  }

  Object.assign(Net2, { matrix, connectance, nodf, h2prime, h2max, h2min, modularityQ, modules, dprime, species, curveball, pairing, nullTest, completeness, rowSums, colSums });
  window.Net2 = Net2;
})();
