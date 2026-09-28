/* PollinationPro — tests of Blocks 8 and 9: distribution models and
   interaction networks, on cases whose answer is known by construction. */
window.TESTS = window.TESTS || [];
window.TESTS.push(async function ({ section, check, near }) {

  /* ---------------- networks ---------------- */
  section('Redes de interacción');
  const nested = [[1, 1, 1], [1, 1, 0], [1, 0, 0]];
  check('Matriz perfectamente anidada → NODF = 100', near(Net2.nodf(nested).nodf, 100, 1e-12));
  check('Grados iguales → NODF = 0', near(Net2.nodf([[1, 0], [0, 1]]).nodf, 0, 1e-12));
  check('Conectancia de la matriz anidada = 6/9', near(Net2.connectance(nested), 6 / 9, 1e-12));
  const diag = [[5, 0], [0, 5]], even = [[2, 2], [2, 2]];
  check('H₂′ de una red diagonal (especialización total) = 1', near(Net2.h2prime(diag).H2p, 1, 1e-12));
  check('H₂′ de una red proporcional (sin especialización) = 0', near(Net2.h2prime(even).H2p, 0, 1e-12));
  check('H₂ ≤ H₂max y H₂ ≥ H₂min en una red cualquiera', (() => { const A = [[7, 1, 0, 2], [0, 3, 4, 1], [2, 0, 1, 6]]; const h = Net2.h2prime(A); return h.H2 <= h.H2max + 1e-12 && h.H2 >= h.H2min - 1e-12; })());
  /* d′: a visitor that visits in exact proportion to the plants' totals, and one that is exclusive to the rarest plant */
  const Ad = [[10, 6, 0], [5, 3, 0], [0, 0, 4]];
  check('d′ = 0 para un visitante que visita en proporción a la disponibilidad', near(Net2.dprime([[10, 5], [10, 5]], 0, false), 0, 1e-9));
  check('d′ = 1 para un visitante exclusivo de la planta más rara, que solo lo recibe a él', near(Net2.dprime(Ad, 2, false), 1, 1e-9));
  const blocks = [[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 1]];
  const md = Net2.modules(blocks, { restarts: 10, seed: 2 });
  check('Dos bloques separados → 2 módulos y Q = 0.5 (Barber)', md.n === 2 && near(md.Q, 0.5, 1e-9), `n = ${md.n}, Q = ${fmtFixed(md.Q, 3)}`);
  const r = rng(4);
  const A = [[7, 1, 0, 2], [0, 3, 4, 1], [2, 0, 1, 6]];
  const cb = Net2.curveball(A, r, 200), pr = Net2.pairing(A, r);
  const same = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
  check('Bola curva conserva los grados de filas y columnas', same(Net2.rowSums(cb), Net2.rowSums(A.map(row => row.map(v => (v ? 1 : 0))))) && same(Net2.colSums(cb), Net2.colSums(A.map(row => row.map(v => (v ? 1 : 0))))));
  check('Reparto al azar conserva los totales de visitas', same(Net2.rowSums(pr), Net2.rowSums(A)) && same(Net2.colSums(pr), Net2.colSums(A)));
  const cm = Net2.completeness([10, 5, 3, 1, 1, 2]);
  check('Completitud: Chao1 corregido y curva que termina en S observada', near(cm.chao1, 6 + (21 / 22) * 2 * 1 / (2 * 2), 1e-9) && cm.curve[cm.curve.length - 1][1] === 6);

  /* ---------------- distribution models ---------------- */
  section('Modelos de distribución');
  const rr = rng(9);
  /* presences around (20, 1000), background over a wide box */
  const pres = Array.from({ length: 200 }, () => [20 + 2 * randn(rr), 1000 + 150 * randn(rr)]);
  const bg = Array.from({ length: 2000 }, () => [10 + 20 * rr(), 200 + 2000 * rr()]);
  ['envelope', 'mahalanobis', 'logistic'].forEach(kind => {
    const m = SDM.fit(kind, pres, bg);
    const a = SDM.auc(pres.map(m.predict), bg.map(m.predict));
    check(`${kind}: AUC alta cuando las presencias son un subconjunto claro del fondo`, a > 0.85, fmtFixed(a, 3));
    check(`${kind}: el centro es más idóneo que un extremo`, m.predict([20, 1000]) > m.predict([29, 2100]));
  });
  check('AUC = 0.5 cuando presencias y fondo son iguales', near(SDM.auc([1, 2, 3, 4], [1, 2, 3, 4]), 0.5, 1e-12));
  check('AUC = 1 con separación total', near(SDM.auc([5, 6, 7], [1, 2, 3]), 1, 1e-12));
  check('TSS = 1 con separación total y umbral en medio', near(SDM.tss([5, 6, 7], [1, 2, 3], 4).tss, 1, 1e-12));
  const M = [[4, 2, 0], [2, 3, 1], [0, 1, 2]];
  const inv = SDM.invert(M);
  const prod = M.map(row => inv[0].map((_, j) => row.reduce((s, v, k) => s + v * inv[k][j], 0)));
  check('Inversa de una matriz simétrica: A·A⁻¹ = I', prod.every((row, i) => row.every((v, j) => near(v, i === j ? 1 : 0, 1e-9))));
  /* Mahalanobis on standard normal data: the suitability of the points should be uniform on [0, 1] */
  const z = Array.from({ length: 3000 }, () => [randn(rr), randn(rr)]);
  const mh = SDM.fitMahalanobis(z);
  const s = z.map(mh.predict);
  check('Mahalanobis: bajo normalidad, la idoneidad es uniforme (mediana ≈ 0.5)', near(Stat.median(s), 0.5, 0.05), fmtFixed(Stat.median(s), 3));
  const L0 = { w: 2, h: 2, x0: 0, y0: 0, dx: 1, dy: 1 };
  const mm = SDM.mismatch(Uint8Array.of(1, 1, 0, 255), [Uint8Array.of(1, 0, 0, 1)], L0);
  check('Clases de desajuste: ambos, solo planta, ninguno, sin dato', mm.cls[0] === 3 && mm.cls[1] === 1 && mm.cls[2] === 0 && mm.cls[3] === 255);
});
