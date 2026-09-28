/* PollinationPro — tests of the numerical engine (js/engine.js).

   Reference values come from three independent places: published constants
   (the normal and chi-square quantiles every table prints), closed forms
   worked by hand in the comments below, and a second implementation written
   here in a different way (exact integer arithmetic for the hypergeometric,
   a power series for the Bessel ratio, the spherical law of cosines for the
   distance). Where a statistic has no closed form, its behaviour under the
   null hypothesis is simulated. */
window.TESTS = window.TESTS || [];
window.TESTS.push(async function ({ section, check, near }) {
  const P = Poll;

  /* ---------------- special functions ---------------- */
  section('Funciones especiales');
  check('lnΓ(0.5) = ln √π', near(P.lgamma(0.5), 0.5723649429247001, 1e-12), P.lgamma(0.5));
  check('lnΓ(10) = ln 9! = ln 362 880', near(P.lgamma(10), Math.log(362880), 1e-10));
  check('ln C(52, 5) = ln 2 598 960', near(P.lchoose(52, 5), Math.log(2598960), 1e-9));
  check('Φ(1.96) = 0.9750021', near(P.pnorm(1.96), 0.9750021048517795, 2e-7), P.pnorm(1.96));
  check('Φ(−1) = 0.1586553', near(P.pnorm(-1), 0.15865525393145707, 2e-7));
  check('Φ⁻¹(0.975) = 1.959964', near(P.qnorm(0.975), 1.959963984540054, 1e-6), P.qnorm(0.975));
  check('Φ⁻¹(0.001) = −3.090232', near(P.qnorm(0.001), -3.090232306167813, 1e-6));
  check('χ²₁: P(X > 3.841459) = 0.05', near(P.pchisqUpper(3.841458820694124, 1), 0.05, 1e-7));
  check('χ²₁₀: P(X > 18.30704) = 0.05', near(P.pchisqUpper(18.307038053275146, 10), 0.05, 1e-7));
  check('F(2, 10): P(F > 4.102821) = 0.05', near(P.pfUpper(4.102821015130402, 2, 10), 0.05, 1e-6));
  check('F(3, 30): P(F > 2.922277) = 0.05', near(P.pfUpper(2.922278407514091, 3, 30), 0.05, 1e-6));
  check('I_x(a, b) + I_{1−x}(b, a) = 1', near(P.betaI(0.3, 2.5, 4) + P.betaI(0.7, 4, 2.5), 1, 1e-12));

  /* ---------------- hypergeometric co-occurrence ---------------- */
  section('Coocurrencia hipergeométrica (Veech 2013) contra aritmética entera exacta');
  /* the independent version: exact binomial coefficients with BigInt */
  const bc = (n, k) => { if (k < 0 || k > n) return 0n; let r = 1n; for (let i = 1n; i <= BigInt(k); i++) r = r * (BigInt(n) - BigInt(k) + i) / i; return r; };
  const exact = (j, N, N1, N2) => Number(bc(N1, j) * bc(N - N1, N2 - j) * 1000000000000n / bc(N, N2)) / 1e12;
  const cases = [[50, 20, 15], [120, 40, 60], [30, 5, 7], [400, 23, 190]];
  let worst = 0;
  cases.forEach(([N, N1, N2]) => { for (let j = 0; j <= Math.min(N1, N2); j++) worst = Math.max(worst, Math.abs(P.hyperPmf(j, N, N1, N2) - exact(j, N, N1, N2))); });
  check('P(j) coincide con C(N1,j)·C(N−N1,N2−j)/C(N,N2) exacto en 4 casos', worst < 1e-10, worst.toExponential(2));
  check('Σ P(j) = 1', near(cases.map(([N, N1, N2]) => { let s = 0; for (let j = 0; j <= N1; j++) s += P.hyperPmf(j, N, N1, N2); return s; }).reduce((a, b) => Math.max(a, Math.abs(b - 1)), 0), 0, 1e-10));
  {
    const r = P.cooccurrence(50, 20, 15, 6);
    check('Esperado = N1·N2/N = 6', near(r.exp, 6, 1e-12));
    check('Obs = esperado → aleatorio, dos colas > 0.05', r.verdict === 'random' && r.pLe > 0.05 && r.pGe > 0.05, `${r.pLe.toFixed(4)} / ${r.pGe.toFixed(4)}`);
    const hi = P.cooccurrence(50, 20, 15, 12), lo = P.cooccurrence(50, 20, 15, 1);
    check('12 sitios compartidos → positiva', hi.verdict === 'positive' && hi.pGe < 0.05, hi.pGe.toExponential(2));
    check('1 sitio compartido → negativa', lo.verdict === 'negative' && lo.pLe < 0.05, lo.pLe.toExponential(2));
    let s = 0; for (let j = 12; j <= 15; j++) s += exact(j, 50, 20, 15);
    check('P(X ≥ 12) igual a la suma exacta', near(hi.pGe, s, 1e-10));
    const small = P.cooccurrence(200, 2, 3, 0);
    check('Esperado < 1 sitio → sin clasificar', small.verdict === 'unclassified', small.exp.toFixed(3));
    check('Varianza hipergeométrica: EEF = (obs − esp)/√var', near(hi.ses, (12 - 6) / Math.sqrt(20 * 15 * 30 * 35 / (2500 * 49)), 1e-12));
  }

  /* ---------------- overlap indices ---------------- */
  section('Índices de similitud y solapamiento');
  const p = [0.5, 0.5, 0], q = [0, 0.5, 0.5];
  /* by hand: D = 1 − ½(0.5 + 0 + 0.5) = 0.5; I = 1 − ½[(√.5)² + 0 + (√.5)²] = 0.5;
     O = 0.25 / √(0.5 · 0.5) = 0.5 */
  check('D de Schoener a mano = 0.5', near(P.schoenerD(p, q), 0.5, 1e-12));
  check('I de Warren a mano = 0.5', near(P.hellingerI(p, q), 0.5, 1e-12));
  check('O de Pianka a mano = 0.5', near(P.piankaO(p, q), 0.5, 1e-12));
  check('Distribuciones idénticas: D = I = O = 1', near(P.schoenerD([3, 1, 2], [6, 2, 4]), 1, 1e-12) && near(P.hellingerI([3, 1, 2], [6, 2, 4]), 1, 1e-12) && near(P.piankaO([3, 1, 2], [6, 2, 4]), 1, 1e-12));
  check('Disjuntas: D = I = O = 0', P.schoenerD([1, 0], [0, 1]) === 0 && near(P.hellingerI([1, 0], [0, 1]), 0, 1e-12) && P.piankaO([1, 0], [0, 1]) === 0);
  check('I ≥ D siempre (Warren et al. 2008)', (() => { const r = rng(7); for (let k = 0; k < 200; k++) { const a = [0, 0, 0, 0, 0].map(() => r()), b = [0, 0, 0, 0, 0].map(() => r()); if (P.hellingerI(a, b) < P.schoenerD(a, b) - 1e-12) return false; } return true; })());
  const sim = P.setSimilarity(['a', 'b', 'c', 'd'], ['c', 'd', 'e']);
  check('Jaccard {a,b,c,d}∩{c,d,e} = 2/5', near(sim.jaccard, 0.4, 1e-12));
  check('Sørensen = 4/7', near(sim.sorensen, 4 / 7, 1e-12));
  check('Simpson = 2/3', near(sim.simpson, 2 / 3, 1e-12));
  const lb = P.levinsB([1, 1, 1, 1]);
  check('Levins: uso parejo de 4 recursos → B = 4, B_A = 1', near(lb.B, 4, 1e-12) && near(lb.BA, 1, 1e-12));
  check('Levins: un solo recurso → B_A = 0', near(P.levinsB([5, 0, 0, 0]).BA, 0, 1e-12));

  /* ---------------- circular statistics ---------------- */
  section('Estadística circular de fechas');
  check('Día 1 → ángulo pequeño; día 365 → casi 2π', P.doyToAngle(1) > 0 && P.doyToAngle(1) < 0.01 && P.doyToAngle(365) > 6.27);
  check('angleToDoy invierte doyToAngle', [1, 45, 180, 300, 365].every(d => near(P.angleToDoy(P.doyToAngle(d)), d, 1e-9)));
  const nye = P.circMean([P.doyToAngle(365), P.doyToAngle(1)]);
  check('Media del 31 dic y el 1 ene es Año Nuevo, no julio', P.doyDiff(nye.meanDoy, 1) <= 1, nye.meanDoy.toFixed(2));
  check('R̄ de dos fechas iguales = 1', near(P.circMean([1, 1]).R, 1, 1e-12));
  check('R̄ de fechas opuestas = 0', near(P.circMean([0, Math.PI]).R, 0, 1e-12));
  check('doyDiff(360, 5) = 10 días', near(P.doyDiff(360, 5), 10, 1e-12));
  /* the Bessel ratio A1(κ) = I1(κ)/I0(κ) by its power series, independent of the approximation */
  const bessel = (nu, x) => { let s = 0, t = Math.pow(x / 2, nu) / Math.exp(P.lgamma(nu + 1)); for (let k = 0; k < 200; k++) { s += t; t *= (x / 2) ** 2 / ((k + 1) * (k + 1 + nu)); } return s; };
  const A1 = k => bessel(1, k) / bessel(0, k);
  check('κ̂ invierte A1(κ) (Fisher 1993) con error < 2 %', [0.5, 1, 2, 4, 8].every(k => Math.abs(P.kappaFromR(A1(k)) - k) / k < 0.02), [0.5, 1, 2, 4, 8].map(k => P.kappaFromR(A1(k)).toFixed(3)).join(' '));
  {
    const r = rng(11);
    let rej = 0; const sims = 2000;
    for (let s = 0; s < sims; s++) { const a = []; for (let i = 0; i < 30; i++) a.push(r() * Poll.TWO_PI); if (P.rayleigh(a).p < 0.05) rej++; }
    check('Rayleigh: con fechas uniformes rechaza ≈ 5 % (bajo H0)', rej / sims > 0.035 && rej / sims < 0.065, (rej / sims * 100).toFixed(1) + ' %');
    const c = []; for (let i = 0; i < 30; i++) c.push(1 + 0.4 * randn(r));
    check('Rayleigh: fechas concentradas → p < 0.001', P.rayleigh(c).p < 0.001, P.rayleigh(c).p.toExponential(2));
    const big = []; for (let i = 0; i < 500; i++) big.push(0.3 * randn(r));
    const ry = P.rayleigh(big);
    /* against the older series of Greenwood & Durand as printed by Zar (2010, eq. 27.3):
       p = e^−Z [1 + (2Z − Z²)/(4n) − (24Z − 132Z² + 76Z³ − 9Z⁴)/(288n²)],
       on a sample built to give Z = 5 with n = 100 (R̄ = √0.05) */
    {
      const n = 100, R = Math.sqrt(0.05), a = [];
      /* half the angles at +θ, half at −θ: R̄ = cos θ */
      const th = Math.acos(R);
      for (let i = 0; i < n; i++) a.push(i % 2 ? th : -th);
      const t = P.rayleigh(a), Z = t.Z;
      const gd = Math.exp(-Z) * (1 + (2 * Z - Z * Z) / (4 * n) - (24 * Z - 132 * Z ** 2 + 76 * Z ** 3 - 9 * Z ** 4) / (288 * n * n));
      check('Rayleigh: Z = 5, n = 100 → p igual a la serie de Greenwood y Durand (±2 %)', near(Z, 5, 1e-9) && Math.abs(t.p - gd) / gd < 0.02, `${t.p.toFixed(5)} vs ${gd.toFixed(5)}`);
    }
    /* Watson–Williams: under H0 (same mean, κ ≈ 4) about 5 % rejections */
    let rw = 0;
    for (let s = 0; s < 1000; s++) {
      const a = [], b = [];
      for (let i = 0; i < 20; i++) { a.push(2 + 0.5 * randn(r)); b.push(2 + 0.5 * randn(r)); }
      if (P.watsonWilliams([a, b]).p < 0.05) rw++;
    }
    check('Watson–Williams: misma media → rechaza ≈ 5 %', rw / 1000 > 0.03 && rw / 1000 < 0.075, (rw / 10).toFixed(1) + ' %');
    const a = [], b = [];
    for (let i = 0; i < 20; i++) { a.push(1 + 0.4 * randn(r)); b.push(2 + 0.4 * randn(r)); }
    const ww = P.watsonWilliams([a, b]);
    check('Watson–Williams: medias a 58 días → p < 0.001', ww.p < 0.001 && ww.valid, ww.p.toExponential(2));
  }

  /* ---------------- kernels, PCA ---------------- */
  section('Densidades de kernel y componentes principales');
  const r = rng(3);
  const xs = []; for (let i = 0; i < 2000; i++) xs.push(randn(r));
  check('Silverman con n = 2000 normales ≈ 0.9·1·2000^−0.2 = 0.197', near(P.silverman(xs), 0.197, 0.02), P.silverman(xs).toFixed(3));
  const z1 = P.kde1d(xs, -6, 6, 601);
  check('KDE 1-D integra a 1', near(z1.reduce((a, b) => a + b, 0) * 12 / 600, 1, 0.005));
  const pts = []; for (let i = 0; i < 1000; i++) pts.push([randn(r), 2 * randn(r)]);
  const z2 = P.kde2d(pts, [-6, 6, -12, 12], 121, 0.3, 0.6);
  check('KDE 2-D integra a 1', near(z2.reduce((a, b) => a + b, 0) * (12 / 120) * (24 / 120), 1, 0.01));
  const e = P.jacobiEigen([[2, 1, 0], [1, 2, 0], [0, 0, 5]]);
  check('Valores propios de [[2,1,0],[1,2,0],[0,0,5]] = 5, 3, 1', near(e.values[0], 5, 1e-10) && near(e.values[1], 3, 1e-10) && near(e.values[2], 1, 1e-10));
  const rows = []; for (let i = 0; i < 3000; i++) { const a = randn(r), b = 0.8 * a + 0.6 * randn(r); rows.push([10 + 3 * a, -5 + 0.1 * b]); }
  const pc = P.pca(rows);
  check('ACP de dos variables con r ≈ 0.8: λ ≈ 1.8 y 0.2', near(pc.values[0], 1.8, 0.05) && near(pc.values[1], 0.2, 0.05), pc.values.map(v => v.toFixed(3)).join(', '));
  check('Varianza explicada suma 1', near(pc.explained.reduce((a, b) => a + b, 0), 1, 1e-12));
  check('Puntajes del eje 1 con varianza λ1', near(Stat.sd(pc.scores.map(s => s[0])) ** 2, pc.values[0], 1e-9));

  /* ---------------- geometry ---------------- */
  section('Geometría en la esfera');
  const cosLaw = (la1, lo1, la2, lo2) => { const d = Math.PI / 180; return P.R_EARTH * Math.acos(Math.sin(la1 * d) * Math.sin(la2 * d) + Math.cos(la1 * d) * Math.cos(la2 * d) * Math.cos((lo2 - lo1) * d)); };
  check('1° de latitud = 111.195 km', near(P.haversine(10, -99, 11, -99), 111.195, 0.001));
  check('CDMX–Guadalajara igual por haversine y ley de cosenos', near(P.haversine(19.4326, -99.1332, 20.6597, -103.3496), cosLaw(19.4326, -99.1332, 20.6597, -103.3496), 1e-6), P.haversine(19.4326, -99.1332, 20.6597, -103.3496).toFixed(1) + ' km');
  const nd = P.nearestDistances([[-99, 19], [-100, 20]], [[-99, 19.5], [-110, 30], [-100.1, 20]]);
  check('Vecino más cercano correcto', near(nd[0], P.haversine(19, -99, 19.5, -99), 1e-9) && near(nd[1], P.haversine(20, -100, 20, -100.1), 1e-9));
  {
    const A = [], B = []; for (let i = 0; i < 300; i++) { A.push([-110 + 20 * r(), 15 + 15 * r()]); B.push([-110 + 20 * r(), 15 + 15 * r()]); }
    const fast = P.nearestDistances(A, B);
    const slow = A.map(([lo, la]) => Math.min(...B.map(([lo2, la2]) => P.haversine(la, lo, la2, lo2))));
    check('Vecino más cercano = fuerza bruta en 300 × 300 puntos', fast.every((d, i) => near(d, slow[i], 1e-9)));
  }
  check('Celda de 1° × 1° en el ecuador = 12 363.7 km²', near(P.sphericalArea([[0, 0], [1, 0], [1, 1], [0, 1]]), 12363.7, 0.2), P.sphericalArea([[0, 0], [1, 0], [1, 1], [0, 1]]).toFixed(1));
  check('La celda a 60° mide la mitad (cos 60° ≈ 0.5)', near(P.sphericalArea([[0, 60], [1, 60], [1, 61], [0, 61]]) / P.sphericalArea([[0, 0], [1, 0], [1, 1], [0, 1]]), 0.4924, 0.002));
  const hull = P.convexHull([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1], [0.5, 1.5], [1, 0]]);
  check('Envolvente convexa de un cuadrado con puntos internos = 4 vértices', hull.length === 4);
  const shoelace = pg => Math.abs(pg.reduce((s, p, i) => { const q = pg[(i + 1) % pg.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const inter = P.clipConvex([[0, 0], [1, 0], [1, 1], [0, 1]], [[0.5, 0.5], [1.5, 0.5], [1.5, 1.5], [0.5, 1.5]]);
  check('Intersección de dos cuadrados desplazados ½ = ¼', near(shoelace(inter), 0.25, 1e-12));
  check('Polígonos disjuntos → intersección vacía', P.clipConvex([[0, 0], [1, 0], [1, 1], [0, 1]], [[2, 2], [3, 2], [3, 3], [2, 3]]).length === 0 || shoelace(P.clipConvex([[0, 0], [1, 0], [1, 1], [0, 1]], [[2, 2], [3, 2], [3, 3], [2, 3]])) < 1e-12);

  /* ---------------- sampling ---------------- */
  section('Rarefacción, Chao1 y ajuste de p');
  /* by hand: counts (2, 1), N = 3, m = 2 → [1 − C(1,2)/C(3,2)] + [1 − C(2,2)/C(3,2)] = 1 + 2/3 */
  check('Hurlbert a mano: E(S₂) de (2, 1) = 5/3', near(P.rarefy([2, 1], 2), 5 / 3, 1e-12));
  check('Rarefacción al total = S observada', P.rarefy([5, 3, 1, 1], 10) === 4);
  check('Rarefacción a 1 individuo = 1', near(P.rarefy([5, 3, 1, 1], 1), 1, 1e-12));
  /* by hand: S = 5, f1 = 3, f2 = 1, N = 10 → 5 + 0.9·3·2/(2·2) = 6.35 */
  const c1 = P.chao1([1, 1, 1, 2, 5]);
  check('Chao1 corregido a mano = 6.35', near(c1.chao1, 6.35, 1e-12));
  check('Cobertura de Good = 1 − f1/N = 0.7', near(c1.coverage, 0.7, 1e-12));
  const bh = P.bhAdjust([0.01, 0.04, 0.03, 0.005]);
  check('Benjamini–Hochberg a mano = [0.02, 0.04, 0.04, 0.02]', [0.02, 0.04, 0.04, 0.02].every((v, i) => near(bh[i], v, 1e-12)), bh.join(', '));
  check('Valor p de Monte Carlo (k+1)/(n+1)', near(P.mcP(0, 999), 0.001, 1e-12));
});
