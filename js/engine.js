/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — the numerical engine shared by every block.

   Everything a block reports is computed here, with no library: the special
   functions, the hypergeometric model of co-occurrence, the overlap indices,
   circular statistics for months and days of the year, kernel densities on a
   grid, principal components, convex hulls and distances on the sphere. Each
   function names the publication it follows, and tests/index.html checks it
   against the worked examples of those publications or against values
   computed independently.

   Conventions: angles in radians inside, days of the year 1…365 (366 folds
   onto 365) outside; coordinates in decimal degrees, longitude first when a
   pair is written [lon, lat]; distances in kilometres. */

const Poll = {};

(function () {

  /* =====================================================================
     1 · special functions
     ===================================================================== */

  /* log Γ(x) by the Lanczos approximation (g = 7, n = 9), good to ~15 digits */
  const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lgamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1;
    let a = LG[0];
    const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  /* log of the binomial coefficient C(n, k) */
  function lchoose(n, k) {
    if (k < 0 || k > n) return -Infinity;
    return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
  }

  /* the standard normal distribution: cdf by the complementary error function
     (W. J. Cody's rational approximation as given by Press et al., erfc with
     fractional error < 1.2e-7) */
  function erfc(x) {
    const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  const pnorm = x => 0.5 * erfc(-x / Math.SQRT2);
  /* the quantile by Acklam's rational approximation refined with one Halley step */
  function qnorm(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
    const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
    const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    let q, r, x;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p <= 1 - pl) { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    else { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    const e = pnorm(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    return x - u / (1 + x * u / 2);
  }

  /* the regularised incomplete gamma P(a, x), by its series or its continued
     fraction (Press et al. 2007, §6.2) — gives the chi-square distribution */
  function gammaP(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) {
      let sum = 1 / a, del = sum, ap = a;
      for (let n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
      return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    return 1 - gammaQcf(a, x);
  }
  function gammaQcf(a, x) {
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d;
    for (let i = 1; i < 500; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  const pchisqUpper = (x, df) => (x <= 0 ? 1 : 1 - gammaP(df / 2, x / 2));

  /* the regularised incomplete beta I_x(a, b) by Lentz's continued fraction
     (Press et al. 2007, §6.4) — gives the F and t distributions */
  function betaI(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lbt = lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x);
    const cf = (xx, aa, bb) => {
      const TINY = 1e-300;
      let c = 1, d = 1 - (aa + bb) * xx / (aa + 1);
      if (Math.abs(d) < TINY) d = TINY;
      d = 1 / d;
      let h = d;
      for (let m = 1; m <= 500; m++) {
        const m2 = 2 * m;
        let an = m * (bb - m) * xx / ((aa + m2 - 1) * (aa + m2));
        d = 1 + an * d; if (Math.abs(d) < TINY) d = TINY;
        c = 1 + an / c; if (Math.abs(c) < TINY) c = TINY;
        d = 1 / d; h *= d * c;
        an = -(aa + m) * (aa + bb + m) * xx / ((aa + m2) * (aa + m2 + 1));
        d = 1 + an * d; if (Math.abs(d) < TINY) d = TINY;
        c = 1 + an / c; if (Math.abs(c) < TINY) c = TINY;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < 1e-15) break;
      }
      return h;
    };
    if (x < (a + 1) / (a + b + 2)) return Math.exp(lbt) * cf(x, a, b) / a;
    return 1 - Math.exp(lbt) * cf(1 - x, b, a) / b;
  }
  /* upper tail of F(d1, d2) */
  const pfUpper = (f, d1, d2) => (f <= 0 ? 1 : betaI(d2 / (d2 + d1 * f), d2 / 2, d1 / 2));

  /* =====================================================================
     2 · the hypergeometric model of co-occurrence (Veech 2013)
     =====================================================================
     N sites, species 1 in N1 of them, species 2 in N2. If they are placed at
     random with respect to each other, the number of sites they share, j,
     follows the hypergeometric law

        P(j) = C(N1, j) · C(N − N1, N2 − j) / C(N, N2),

     which is exactly the probability Veech (2013) derives by counting
     arrangements. The expected number of shared sites is N1·N2/N. A pair
     co-occurs LESS than expected when P(X ≤ obs) < α, MORE when
     P(X ≥ obs) < α, and at random otherwise. */
  function hyperPmf(j, N, N1, N2) {
    const lo = Math.max(0, N1 + N2 - N), hi = Math.min(N1, N2);
    if (j < lo || j > hi) return 0;
    return Math.exp(lchoose(N1, j) + lchoose(N - N1, N2 - j) - lchoose(N, N2));
  }
  function cooccurrence(N, N1, N2, obs, alpha) {
    const a = alpha == null ? 0.05 : alpha;
    const lo = Math.max(0, N1 + N2 - N), hi = Math.min(N1, N2);
    let pLe = 0, pGe = 0;
    const dist = [];
    for (let j = lo; j <= hi; j++) {
      const p = hyperPmf(j, N, N1, N2);
      dist.push([j, p]);
      if (j <= obs) pLe += p;
      if (j >= obs) pGe += p;
    }
    pLe = Math.min(1, pLe); pGe = Math.min(1, pGe);
    const exp = N ? N1 * N2 / N : NaN;
    /* the standardised effect size: (obs − exp) / sd of the hypergeometric */
    const v = N > 1 ? N1 * N2 * (N - N1) * (N - N2) / (N * N * (N - 1)) : NaN;
    const ses = v > 0 ? (obs - exp) / Math.sqrt(v) : NaN;
    /* A pair is left unclassified when chance could never be rejected for it:
       its expected overlap is under one site (too little information to
       judge), or not even the most extreme outcome reaches α in either tail. */
    const classifiable = exp >= 1 && hi > lo && (hyperPmf(lo, N, N1, N2) <= a || hyperPmf(hi, N, N1, N2) <= a);
    const verdict = !classifiable ? 'unclassified' : pGe < a ? 'positive' : pLe < a ? 'negative' : 'random';
    return { N, N1, N2, obs, exp, pLe, pGe, ses, verdict, classifiable, dist, lo, hi };
  }

  /* =====================================================================
     3 · similarity and overlap indices
     ===================================================================== */
  /* presence–absence between two sets (sites of species 1 and of species 2) */
  function setSimilarity(A, B) {
    const a = new Set(A), b = new Set(B);
    let shared = 0;
    a.forEach(x => { if (b.has(x)) shared++; });
    const n1 = a.size, n2 = b.size;
    return {
      shared, n1, n2,
      jaccard: n1 + n2 - shared ? shared / (n1 + n2 - shared) : NaN,
      sorensen: n1 + n2 ? 2 * shared / (n1 + n2) : NaN,
      simpson: Math.min(n1, n2) ? shared / Math.min(n1, n2) : NaN,   // 1 − β_sim of Baselga (2010)
      /* the share of species 1's sites that species 2 also occupies (asymmetric) */
      cover12: n1 ? shared / n1 : NaN,
      cover21: n2 ? shared / n2 : NaN,
    };
  }
  /* two distributions over the same categories or cells (need not sum to 1) */
  function normalise(v) {
    const s = v.reduce((x, y) => x + (y > 0 ? y : 0), 0);
    return s > 0 ? v.map(x => (x > 0 ? x / s : 0)) : v.map(() => 0);
  }
  /* Schoener's D (Schoener 1968): 1 − ½ Σ|p1 − p2|, from 0 (no overlap) to 1 */
  function schoenerD(v1, v2) {
    const p = normalise(v1), q = normalise(v2);
    let s = 0;
    for (let i = 0; i < p.length; i++) s += Math.abs(p[i] - q[i]);
    return 1 - 0.5 * s;
  }
  /* Warren et al. (2008) I, from the Hellinger distance H: I = 1 − ½ H²,
     H = √Σ(√p1 − √p2)² */
  function hellingerI(v1, v2) {
    const p = normalise(v1), q = normalise(v2);
    let s = 0;
    for (let i = 0; i < p.length; i++) { const d = Math.sqrt(p[i]) - Math.sqrt(q[i]); s += d * d; }
    return 1 - 0.5 * s;
  }
  /* Pianka's (1973) symmetric overlap O = Σp1p2 / √(Σp1² Σp2²) */
  function piankaO(v1, v2) {
    const p = normalise(v1), q = normalise(v2);
    let pq = 0, pp = 0, qq = 0;
    for (let i = 0; i < p.length; i++) { pq += p[i] * q[i]; pp += p[i] * p[i]; qq += q[i] * q[i]; }
    return pp && qq ? pq / Math.sqrt(pp * qq) : NaN;
  }
  /* Levins' (1968) niche breadth B = 1/Σp², and its standardised form
     B_A = (B − 1)/(n − 1) of Hurlbert (1978), from 0 (specialist) to 1 */
  function levinsB(v) {
    const p = normalise(v);
    const s = p.reduce((x, y) => x + y * y, 0);
    const B = s ? 1 / s : NaN, n = p.length;
    return { B, BA: n > 1 ? (B - 1) / (n - 1) : NaN };
  }

  /* =====================================================================
     4 · circular statistics for dates (Batschelet 1981; Zar 2010, ch. 26–27)
     =====================================================================
     A date is an angle: 1 January and 31 December are neighbours, and the
     mean of a species active in December and in January is not July. */
  const TWO_PI = 2 * Math.PI;
  const doyToAngle = d => TWO_PI * (((d - 0.5) % 365 + 365) % 365) / 365;
  /* the inverse lands in [0.5, 365.5): day d covers the half-open interval
     around its centre, so 0.7 is still 1 January, never 31 December */
  const angleToDoy = a => ((a % TWO_PI) + TWO_PI) % TWO_PI / TWO_PI * 365 + 0.5;
  /* the middle day of each month, as a day of a non-leap year */
  const MONTH_MID = [16, 45.5, 75, 105.5, 136, 166.5, 197, 228, 258.5, 289, 319.5, 350];
  const monthToAngle = m => doyToAngle(MONTH_MID[m - 1]);

  /* angles (radians), optional weights → mean vector */
  function circMean(angles, weights) {
    let C = 0, S = 0, n = 0;
    angles.forEach((a, i) => { const w = weights ? weights[i] : 1; C += w * Math.cos(a); S += w * Math.sin(a); n += w; });
    if (!n) return null;
    const Cb = C / n, Sb = S / n;
    const R = Math.sqrt(Cb * Cb + Sb * Sb);
    let mean = Math.atan2(Sb, Cb);
    if (mean < 0) mean += TWO_PI;
    /* circular standard deviation s = √(−2 ln R̄) (Mardia 1972), in radians */
    const sd = R > 0 ? Math.sqrt(-2 * Math.log(R)) : Infinity;
    return { n, C: Cb, S: Sb, R, mean, sd, meanDoy: angleToDoy(mean), sdDays: sd * 365 / TWO_PI };
  }
  /* Rayleigh's test of uniformity: Z = n R̄², p by Zar's (2010, eq. 27.4)
     approximation p ≈ exp[√(1 + 4n + 4(n² − Rn²)) − (1 + 2n)], Rn = n R̄ */
  function rayleigh(angles) {
    const m = circMean(angles);
    if (!m || m.n < 2) return { n: angles.length, R: NaN, Z: NaN, p: NaN };
    const n = m.n, Rn = n * m.R, Z = n * m.R * m.R;
    const p = Math.min(1, Math.exp(Math.sqrt(1 + 4 * n + 4 * (n * n - Rn * Rn)) - (1 + 2 * n)));
    return { n, R: m.R, Z, p, mean: m.mean };
  }
  /* the inverse of A1(κ) = I1(κ)/I0(κ): the maximum-likelihood concentration of
     a von Mises distribution from R̄ (Fisher 1993, eq. 4.40) */
  function kappaFromR(R) {
    if (!(R > 0)) return 0;
    if (R < 0.53) return 2 * R + R ** 3 + 5 * R ** 5 / 6;
    if (R < 0.85) return -0.4 + 1.39 * R + 0.43 / (1 - R);
    return 1 / (R ** 3 - 4 * R ** 2 + 3 * R);
  }
  /* Watson–Williams test that k samples share one mean direction (Zar 2010,
     §27.4, with the correction factor K of eq. 27.14). Valid when the pooled
     R̄ is large enough (κ ≥ 1, roughly R̄ ≥ 0.45); the result says so. */
  function watsonWilliams(samples) {
    const k = samples.length;
    const ms = samples.map(s => circMean(s));
    const N = ms.reduce((s, m) => s + (m ? m.n : 0), 0);
    if (k < 2 || ms.some(m => !m || m.n < 2)) return null;
    const sumR = ms.reduce((s, m) => s + m.n * m.R, 0);
    const all = [].concat(...samples);
    const mAll = circMean(all);
    const R = N * mAll.R;
    const rw = sumR / N;
    const kappa = kappaFromR(rw);
    const K = 1 + 3 / (8 * kappa);
    const F = K * (N - k) * (sumR - R) / ((k - 1) * (N - sumR));
    const p = pfUpper(F, k - 1, N - k);
    return { k, N, F, df1: k - 1, df2: N - k, p, kappa, rw, valid: kappa >= 1, means: ms.map(m => m.meanDoy) };
  }
  /* the smallest angular difference between two directions, in days */
  function doyDiff(d1, d2) {
    const a = Math.abs(((d1 - d2) % 365 + 365) % 365);
    return Math.min(a, 365 - a);
  }

  /* =====================================================================
     5 · kernel densities and grids
     ===================================================================== */
  /* Silverman's rule of thumb for a Gaussian kernel (Silverman 1986, eq. 3.31) */
  function silverman(xs) {
    const n = xs.length;
    if (n < 2) return 1;
    const m = xs.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (n - 1));
    const s = xs.slice().sort((a, b) => a - b);
    const q = p => { const h = (n - 1) * p, lo = Math.floor(h); return s[lo] + (s[Math.min(n - 1, lo + 1)] - s[lo]) * (h - lo); };
    const iqr = q(0.75) - q(0.25);
    const spread = Math.min(sd, iqr > 0 ? iqr / 1.34 : sd) || sd || 1;
    return 0.9 * spread * Math.pow(n, -0.2);
  }
  /* a Gaussian kernel density of 2-D points on an R × R grid spanning
     [x0, x1] × [y0, y1]; returns a Float64Array of R·R cells (row-major, row = y) */
  function kde2d(pts, box, R, hx, hy) {
    const [x0, x1, y0, y1] = box;
    const z = new Float64Array(R * R);
    if (!pts.length) return z;
    const dx = (x1 - x0) / (R - 1), dy = (y1 - y0) / (R - 1);
    const cutX = Math.ceil(4 * hx / dx), cutY = Math.ceil(4 * hy / dy);
    const kx = new Float64Array(2 * cutX + 1), ky = new Float64Array(2 * cutY + 1);
    for (const [px, py] of pts) {
      const ci = Math.round((px - x0) / dx), cj = Math.round((py - y0) / dy);
      for (let a = -cutX; a <= cutX; a++) { const i = ci + a, x = x0 + i * dx, u = (x - px) / hx; kx[a + cutX] = (i >= 0 && i < R) ? Math.exp(-0.5 * u * u) : 0; }
      for (let b = -cutY; b <= cutY; b++) { const j = cj + b, y = y0 + j * dy, u = (y - py) / hy; ky[b + cutY] = (j >= 0 && j < R) ? Math.exp(-0.5 * u * u) : 0; }
      for (let b = -cutY; b <= cutY; b++) {
        const j = cj + b;
        if (j < 0 || j >= R || !ky[b + cutY]) continue;
        const row = j * R;
        for (let a = -cutX; a <= cutX; a++) {
          const i = ci + a;
          if (i < 0 || i >= R) continue;
          z[row + i] += kx[a + cutX] * ky[b + cutY];
        }
      }
    }
    const norm = 1 / (pts.length * 2 * Math.PI * hx * hy);
    for (let i = 0; i < z.length; i++) z[i] *= norm;
    return z;
  }
  /* the same on a line, for one environmental variable or the elevation */
  function kde1d(xs, lo, hi, R, h) {
    const z = new Float64Array(R);
    if (!xs.length) return z;
    const dx = (hi - lo) / (R - 1);
    const hh = h || silverman(xs);
    for (const x of xs) for (let i = 0; i < R; i++) { const u = (lo + i * dx - x) / hh; if (Math.abs(u) < 5) z[i] += Math.exp(-0.5 * u * u); }
    const norm = 1 / (xs.length * Math.sqrt(2 * Math.PI) * hh);
    for (let i = 0; i < R; i++) z[i] *= norm;
    return z;
  }

  /* =====================================================================
     6 · principal components (Jacobi eigen-decomposition of a symmetric matrix)
     ===================================================================== */
  function jacobiEigen(A) {
    const n = A.length;
    const a = A.map(r => r.slice());
    const V = a.map((r, i) => r.map((_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 100; sweep++) {
      let off = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
      if (off < 1e-22) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-300) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k][p], akq = a[k][q];
          a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p][k], aqk = a[q][k];
          a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq;
        }
      }
    }
    const vals = a.map((r, i) => r[i]);
    const order = vals.map((v, i) => i).sort((i, j) => vals[j] - vals[i]);
    /* each vector's sign fixed so its largest component is positive: the same
       data give the same picture on every run */
    const vecs = order.map(j => {
      const v = V.map(r => r[j]);
      let big = 0;
      v.forEach((x, i) => { if (Math.abs(x) > Math.abs(v[big])) big = i; });
      return v[big] < 0 ? v.map(x => -x) : v;
    });
    return { values: order.map(j => vals[j]), vectors: vecs };
  }
  /* PCA of a correlation matrix: rows = observations, columns = variables.
     `fitRows` are the rows the axes are computed from (the whole background,
     as in the PCA-env of Broennimann et al. 2012); every row is projected. */
  function pca(rows, fitRows) {
    const X = fitRows || rows;
    const p = X[0].length, n = X.length;
    const mean = new Array(p).fill(0), sd = new Array(p).fill(0);
    X.forEach(r => r.forEach((v, j) => { mean[j] += v; }));
    mean.forEach((v, j) => { mean[j] = v / n; });
    X.forEach(r => r.forEach((v, j) => { sd[j] += (v - mean[j]) ** 2; }));
    sd.forEach((v, j) => { sd[j] = Math.sqrt(v / (n - 1)) || 1; });
    const C = Array.from({ length: p }, () => new Array(p).fill(0));
    X.forEach(r => {
      const z = r.map((v, j) => (v - mean[j]) / sd[j]);
      for (let i = 0; i < p; i++) for (let j = i; j < p; j++) C[i][j] += z[i] * z[j];
    });
    for (let i = 0; i < p; i++) for (let j = i; j < p; j++) { C[i][j] /= (n - 1); C[j][i] = C[i][j]; }
    const eig = jacobiEigen(C);
    const total = eig.values.reduce((a, b) => a + Math.max(0, b), 0);
    const project = r => {
      const z = r.map((v, j) => (v - mean[j]) / sd[j]);
      return eig.vectors.map(vec => vec.reduce((s, w, j) => s + w * z[j], 0));
    };
    return {
      mean, sd, values: eig.values, vectors: eig.vectors,
      explained: eig.values.map(v => Math.max(0, v) / total),
      /* loadings = correlation of each variable with each axis */
      loadings: eig.vectors.map((vec, k) => vec.map(w => w * Math.sqrt(Math.max(0, eig.values[k])))),
      project, scores: rows.map(project),
    };
  }

  /* =====================================================================
     7 · geometry on the sphere
     ===================================================================== */
  const R_EARTH = 6371.0088;   // mean radius, km (IUGG)
  function haversine(lat1, lon1, lat2, lon2) {
    const r = Math.PI / 180;
    const dlat = (lat2 - lat1) * r, dlon = (lon2 - lon1) * r;
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dlon / 2) ** 2;
    return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  /* the nearest distance from each point of A to the set B (brute force with a
     latitude pre-filter; fine for the tens of thousands of a GBIF study) */
  function nearestDistances(A, B) {
    if (!B.length) return A.map(() => Infinity);
    const sorted = B.slice().sort((p, q) => p[1] - q[1]);
    const lats = sorted.map(p => p[1]);
    const lowerBound = v => { let lo = 0, hi = lats.length; while (lo < hi) { const m = (lo + hi) >> 1; if (lats[m] < v) lo = m + 1; else hi = m; } return lo; };
    return A.map(([lon, lat]) => {
      let best = Infinity;
      const i0 = lowerBound(lat);
      /* walk outwards in latitude; stop when the latitude gap alone exceeds the best */
      for (let dir = -1; dir <= 1; dir += 2) {
        for (let i = dir < 0 ? i0 - 1 : i0; i >= 0 && i < sorted.length; i += dir) {
          const gap = Math.abs(sorted[i][1] - lat) * 111.195;
          if (gap > best) break;
          const d = haversine(lat, lon, sorted[i][1], sorted[i][0]);
          if (d < best) best = d;
        }
      }
      return best;
    });
  }
  /* convex hull of [lon, lat] points (Andrew's monotone chain, 1979) */
  function convexHull(pts) {
    const P = pts.map(p => [p[0], p[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const uniq = P.filter((p, i) => !i || p[0] !== P[i - 1][0] || p[1] !== P[i - 1][1]);
    if (uniq.length < 3) return uniq;
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const p of uniq) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
    for (let i = uniq.length - 1; i >= 0; i--) { const p = uniq[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
    upper.pop(); lower.pop();
    return lower.concat(upper);   // counter-clockwise
  }
  /* area of a polygon of [lon, lat] vertices in km², on the sphere (the
     spherical-excess formula as used by Chamberlain & Duquette 2007) */
  function sphericalArea(poly) {
    if (poly.length < 3) return 0;
    const r = Math.PI / 180;
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const [lon1, lat1] = poly[i], [lon2, lat2] = poly[(i + 1) % poly.length];
      s += (lon2 - lon1) * r * (2 + Math.sin(lat1 * r) + Math.sin(lat2 * r));
    }
    return Math.abs(s * R_EARTH * R_EARTH / 2);
  }
  /* intersection of two convex polygons (Sutherland–Hodgman clipping, 1974);
     both counter-clockwise */
  function clipConvex(subject, clip) {
    let out = subject.slice();
    const inside = (p, a, b) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0;
    const inter = (p, q, a, b) => {
      const A1 = q[1] - p[1], B1 = p[0] - q[0], C1 = A1 * p[0] + B1 * p[1];
      const A2 = b[1] - a[1], B2 = a[0] - b[0], C2 = A2 * a[0] + B2 * a[1];
      const det = A1 * B2 - A2 * B1;
      return det === 0 ? p : [(B2 * C1 - B1 * C2) / det, (A1 * C2 - A2 * C1) / det];
    };
    for (let i = 0; i < clip.length && out.length; i++) {
      const a = clip[i], b = clip[(i + 1) % clip.length];
      const input = out; out = [];
      for (let j = 0; j < input.length; j++) {
        const p = input[j], q = input[(j + 1) % input.length];
        const pin = inside(p, a, b), qin = inside(q, a, b);
        if (pin) { out.push(p); if (!qin) out.push(inter(p, q, a, b)); }
        else if (qin) out.push(inter(p, q, a, b));
      }
    }
    return out;
  }

  /* =====================================================================
     8 · sampling: rarefaction and richness estimators
     ===================================================================== */
  /* Hurlbert's (1971) expected number of types in a subsample of m from
     counts n_i summing to N: E(S_m) = Σ [1 − C(N − n_i, m)/C(N, m)] */
  function rarefy(counts, m) {
    const N = counts.reduce((a, b) => a + b, 0);
    if (m >= N) return counts.filter(c => c > 0).length;
    const lNm = lchoose(N, m);
    return counts.reduce((s, n) => s + (n > 0 ? 1 - (N - n >= m ? Math.exp(lchoose(N - n, m) - lNm) : 0) : 0), 0);
  }
  /* bias-corrected Chao1 (Chao 1987; Chao et al. 2005): S_obs + f1(f1 − 1)/(2(f2 + 1)) */
  function chao1(counts) {
    const S = counts.filter(c => c > 0).length;
    const f1 = counts.filter(c => c === 1).length, f2 = counts.filter(c => c === 2).length;
    const N = counts.reduce((a, b) => a + b, 0);
    const est = S + ((N - 1) / N) * f1 * (f1 - 1) / (2 * (f2 + 1));
    return { S, f1, f2, N, chao1: est, coverage: N ? 1 - f1 / N : NaN };
  }

  /* =====================================================================
     9 · resampling helpers
     ===================================================================== */
  function shuffle(a, r) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  /* a Monte Carlo p-value with the +1 of Davison & Hinkley (1997, eq. 4.11) */
  const mcP = (nExtreme, nSim) => (nExtreme + 1) / (nSim + 1);
  /* Benjamini–Hochberg adjusted p-values (1995), for many pairs at once */
  function bhAdjust(ps) {
    const n = ps.length;
    const idx = ps.map((p, i) => i).sort((i, j) => ps[i] - ps[j]);
    const adj = new Array(n);
    let prev = 1;
    for (let r = n - 1; r >= 0; r--) {
      const i = idx[r];
      prev = Math.min(prev, ps[i] * n / (r + 1));
      adj[i] = Math.min(1, prev);
    }
    return adj;
  }

  Object.assign(Poll, {
    lgamma, lchoose, erfc, pnorm, qnorm, gammaP, pchisqUpper, betaI, pfUpper,
    hyperPmf, cooccurrence,
    setSimilarity, normalise, schoenerD, hellingerI, piankaO, levinsB,
    TWO_PI, doyToAngle, angleToDoy, MONTH_MID, monthToAngle, circMean, rayleigh, kappaFromR, watsonWilliams, doyDiff,
    silverman, kde2d, kde1d,
    jacobiEigen, pca,
    R_EARTH, haversine, nearestDistances, convexHull, sphericalArea, clipConvex,
    rarefy, chao1,
    shuffle, mcP, bhAdjust,
  });
  if (typeof window !== 'undefined') window.Poll = Poll;
})();
