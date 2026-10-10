/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — validation of Block 9 (js/network.js and the sampling
   functions of js/engine.js) against R. Reference: ref_block9.R. */
VAL.sections.push({ name: 'Bloque 9 · Redes', run(REF) {
  const r = REF.block9, P = Poll, arr = VAL.arr;
  let worstQ = -Infinity, betterQ = 0, worstH = 0, hiMax = 0, loMin = 0, worstD = 0, sameD = 0, nD = 0;
  /* d′: the same d and the same maximum, ln(T/Aᵢ); the minimum is searched, and a lower minimum gives a d′ that is never below bipartite's */
  const dp = (got, want, info) => {
    VAL.same('d′: no queda por debajo del de bipartite', got >= want - 1e-9, true, info + ': app ' + got + ' · bipartite ' + want);
    VAL.abs('d′ (bipartite)', got, want, 0.01, info);
    worstD = Math.max(worstD, Math.abs(got - want)); nD++; if (Math.abs(got - want) < 1e-9) sameD++;
  };
  r.redes.forEach((w, k) => {
    const A = w.A, nm = w.nombre;
    VAL.check('conectancia (bipartite)', Net2.connectance(A), w.conectancia, 1e-13, nm);
    const nd = Net2.nodf(A);
    VAL.check('NODF (vegan)', nd.nodf, w.NODF, 1e-12, nm, 1e-12);
    VAL.check('NODF (bipartite)', nd.nodf, w.NODFbipartite, 1e-12, nm, 1e-12);
    VAL.check('NODF entre plantas (vegan)', nd.rows, w.NODFfilas, 1e-12, nm, 1e-12);
    VAL.check('NODF entre visitantes (vegan)', nd.cols, w.NODFcolumnas, 1e-12, nm, 1e-12);
    const h = Net2.h2prime(A);
    VAL.check('H₂ sin estandarizar (bipartite)', h.H2, w.H2, 1e-12, nm);
    /* the extremes are searched, not computed: the app's must be at least as extreme as bipartite's */
    VAL.same('H₂ máxima: la de la app no queda por debajo de la de bipartite', h.H2max >= w.H2max - 1e-10, true, `${nm}: app ${h.H2max} · bipartite ${w.H2max}`);
    VAL.same('H₂ mínima: la de la app no queda por encima de la de bipartite', h.H2min <= w.H2min + 1e-10, true, `${nm}: app ${h.H2min} · bipartite ${w.H2min}`);
    VAL.check('H₂′ de bipartite, con la fórmula de la app y los extremos de bipartite', (w.H2max - h.H2) / (w.H2max - w.H2min), w.H2p, 1e-10, nm, 1e-12);
    VAL.abs('H₂′ (bipartite)', h.H2p, w.H2p, 0.02, nm);
    worstH = Math.max(worstH, Math.abs(h.H2p - w.H2p)); if (h.H2max > w.H2max + 1e-10) hiMax++; if (h.H2min < w.H2min - 1e-10) loMin++;
    const sp = Net2.species(A, w.filas, w.columnas);
    sp.plants.forEach((s, i) => {
      VAL.same('grado', s.degree, arr(w.gradoPlantas)[i], nm + ' ' + s.name);
      VAL.check('grado normalizado (bipartite)', s.ndegree, arr(w.gradoNPlantas)[i], 1e-13, nm + ' ' + s.name);
      VAL.check('fuerza (bipartite)', s.strength, arr(w.fuerzaPlantas)[i], 1e-12, nm + ' ' + s.name);
      dp(s.dprime, arr(w.dPlantas)[i], nm + ' ' + s.name);
    });
    sp.visitors.forEach((s, i) => {
      VAL.same('grado', s.degree, arr(w.gradoVisit)[i], nm + ' ' + s.name);
      VAL.check('grado normalizado (bipartite)', s.ndegree, arr(w.gradoNVisit)[i], 1e-13, nm + ' ' + s.name);
      VAL.check('fuerza (bipartite)', s.strength, arr(w.fuerzaVisit)[i], 1e-12, nm + ' ' + s.name);
      dp(s.dprime, arr(w.dVisit)[i], nm + ' ' + s.name);
    });
    /* modularity: the Q of the partition that bipartite found, computed by the app, must be bipartite's Q;
       and the app's own search must not end clearly below it */
    VAL.check('Q de la partición de bipartite, calculada por la app', Net2.modularityQ(A, arr(w.modulos.filas), arr(w.modulos.columnas)), w.Q, 1e-10, nm);
    const mo = Net2.modules(A, { restarts: 30, seed: 1 });
    VAL.check('Q de la partición de la app, recalculada', Net2.modularityQ(A, mo.rows, mo.cols), mo.Q, 1e-10, nm);
    VAL.same('la búsqueda de módulos de la app llega al menos a 0.01 de la Q de bipartite', mo.Q >= w.Q - 0.01, true, `${nm}: app ${mo.Q.toFixed(4)} · bipartite ${w.Q.toFixed(4)}`);
    worstQ = Math.max(worstQ, w.Q - mo.Q); if (mo.Q > w.Q + 1e-9) betterQ++;
    /* null models: same model, another random generator */
    const n1 = Net2.nullTest(A, M => Net2.nodf(M).nodf, 'curveball', w.nSim, 200 + k);
    VAL.mc('modelo nulo de totales fijos (binario): media de NODF', n1.mean, w.nodfNuloMedia, Math.sqrt((n1.sd * n1.sd + w.nodfNuloDE * w.nodfNuloDE) / w.nSim), nm);
    VAL.mc('modelo nulo de totales fijos (binario): desviación de NODF', n1.sd, w.nodfNuloDE, 2 * w.nodfNuloDE / Math.sqrt(w.nSim), nm);
    const n2 = Net2.nullTest(A, M => Net2.h2prime(M).H2, 'pairing', w.nSim, 300 + k);
    VAL.mc('modelo nulo de totales fijos (visitas): media de H₂', n2.mean, w.hNuloMedia, Math.sqrt((n2.sd * n2.sd + w.hNuloDE * w.hNuloDE) / w.nSim), nm);
    VAL.mc('modelo nulo de totales fijos (visitas): desviación de H₂', n2.sd, w.hNuloDE, 2 * w.hNuloDE / Math.sqrt(w.nSim), nm);
    const n3 = Net2.nullTest(A, M => Net2.connectance(M), 'pairing', w.nSim, 400 + k);
    VAL.mc('modelo nulo de totales fijos (visitas): media de la conectancia', n3.mean, w.cNuloMedia, Math.sqrt((n3.sd * n3.sd + w.cNuloDE * w.cNuloDE) / w.nSim), nm);
    VAL.mc('modelo nulo de totales fijos (visitas): desviación de la conectancia', n3.sd, w.cNuloDE, 2 * w.cNuloDE / Math.sqrt(w.nSim), nm);
  });
  VAL.note(`H₂′: la app encontró una H₂ máxima más alta que bipartite en ${hiMax} de ${r.redes.length} redes y una mínima más baja en ${loMin}; por eso H₂′ difiere, a lo más ${worstH.toFixed(4)}.`);
  VAL.note(`d′: idéntico al de bipartite en ${sameD} de ${nD} especies; la mayor diferencia fue ${worstD.toExponential(1)} (donde difiera, es porque la app halló un mínimo más bajo).`);
  VAL.note(`módulos: la mayor ventaja de bipartite sobre la app fue Q = ${Math.max(0, worstQ).toFixed(4)}; la app encontró una partición mejor en ${betterQ} de ${r.redes.length} redes.`);

  r.muestreo.forEach((m, k) => {
    const cc = arr(m.conteos), c = P.chao1(cc), info = 'lista ' + (k + 1), N = cc.reduce((a, b) => a + b, 0);
    VAL.same('riqueza observada, únicos y dobles', [c.S, c.f1, c.f2], [m.S, m.f1, m.f2], info);
    if (m.chao1SpadeR != null) VAL.check('Chao1 con corrección de sesgo (SpadeR)', c.chao1, m.chao1SpadeR, 5e-4, info);   // SpadeR la da con tres decimales
    /* vegan's form lacks the factor (N − 1)/N of Chao et al. (2005) */
    VAL.check('Chao1 (vegan, llevado al factor (N − 1)/N)', c.chao1, m.S + (m.chao1Vegan - m.S) * (N - 1) / N, 1e-12, info);
    arr(m.m).forEach((mm, i) => VAL.check('rarefacción de Hurlbert (vegan)', P.rarefy(cc, mm), arr(m.rarefaccion)[i], 1e-9, info + ', m = ' + mm));
  });
} });
