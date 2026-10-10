/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — validation of Block 5 (js/cooc.js and the geometry of
   js/engine.js) against R. Reference: ref_block5.R. */
VAL.sections.push({ name: 'Bloque 5 · Coocurrencia', run(REF) {
  const r = REF.block5, P = Poll;
  const recs = r.registros;
  const pts = u => recs.filter(x => x.unit === u).map(x => [x.lon, x.lat]);

  /* cells: the whole path of the block, from the records to the verdicts */
  r.celdas.forEach(c => {
    const res = Cooc.pairs(recs, c.size, 'target', { alpha: 0.05 });
    VAL.same('celdas del universo', res.N, c.N, 'celda ' + c.size);
    c.pares.forEach(w => {
      const g = res.pairs.find(x => x.plant === w.plant && x.visitor === w.visitor), info = `${w.plant} × ${w.visitor}, celda ${c.size}`;
      VAL.same('celdas ocupadas y compartidas', [g.n1, g.n2, g.shared], [w.n1, w.n2, w.shared], info);
      VAL.same('celdas compartidas (cooccur)', g.shared, w.co_obs, info);
      VAL.check('compartidas esperadas', g.exp, w.exp, 1e-13, info);
      /* cooccur reports the expected number rounded to one decimal */
      VAL.abs('compartidas esperadas (cooccur, a un decimal)', g.exp, w.co_exp, 0.0500001, info);
      VAL.check('P(X ≤ observado) (phyper)', g.pLe, w.pLe, 1e-9, info, 1e-300);
      VAL.check('P(X ≥ observado) (phyper)', g.pGe, w.pGe, 1e-9, info, 1e-300);
      /* cooccur rounds its probabilities to five decimals */
      VAL.abs('P(X ≤ observado) (cooccur, a 5 decimales)', g.pLe, w.co_plt, 5.01e-6, info);
      VAL.abs('P(X ≥ observado) (cooccur, a 5 decimales)', g.pGe, w.co_pgt, 5.01e-6, info);
      VAL.check('tamaño del efecto estandarizado', g.ses, w.ses, 1e-12, info);
      VAL.check('Jaccard (vegan)', g.jaccard, w.jaccard, 1e-13, info, 1e-15);
      VAL.check('Sørensen (vegan)', g.sorensen, w.sorensen, 1e-13, info, 1e-15);
      VAL.check('Simpson (vegan)', g.simpson, w.simpson, 1e-13, info, 1e-15);
      VAL.same('par clasificable', g.classifiable, w.classifiable, info);
      if (w.classifiable) VAL.check('p ajustada de Benjamini-Hochberg', g.pAdj, w.pAdj, 1e-9, info, 1e-300);
      VAL.same('veredicto', g.verdict, w.verdict, info);
      VAL.same('veredicto tras el ajuste', g.verdictAdj, w.verdictAdj, info);
    });
  });

  /* distances on the sphere */
  r.haversine.a.forEach((a, i) => { const b = r.haversine.b[i]; VAL.check('distancia en la esfera (geosphere)', P.haversine(a[1], a[0], b[1], b[0]), r.haversine.km[i], 1e-11, `${a} → ${b}`, 1e-9); });
  const near = P.nearestDistances(pts(r.cercana.plant), pts(r.cercana.visitor));
  r.cercana.km.forEach((d, i) => VAL.check('distancia al visitante más cercano', near[i], d, 1e-11, 'registro ' + (i + 1), 1e-9));

  /* the nearest-neighbour test: observed values are exact; the null summaries
     come from two different random generators and may differ by simulation error */
  const pool = recs.map(x => [x.lon, x.lat]);
  r.vecino.forEach((v, k) => {
    const t = Cooc.nnTest(pts(v.plant), pts(v.visitor), pool, v.nSim, 100 + k), info = `${v.plant} × ${v.visitor}`;
    VAL.check('vecino más cercano: mediana observada', t.median, v.mediana, 1e-11, info);
    v.dentro.forEach((w, i) => VAL.check('vecino más cercano: proporción a menos de 5, 10, 25 y 50 km', t.within[i], w, 1e-13, info, 1e-15));
    const sdN = Stat.sd(t.nulls);
    VAL.mc('vecino más cercano: media del modelo nulo', Stat.mean(t.nulls), v.nuloMedia, Math.sqrt((sdN * sdN + v.nuloDE * v.nuloDE) / v.nSim), info);
    /* a standard deviation estimated from n draws has a relative error near 1/√(2n) (twice that allows for heavy tails) */
    VAL.mc('vecino más cercano: desviación del modelo nulo', sdN, v.nuloDE, 2 * v.nuloDE * Math.sqrt(1 / v.nSim), info);
    const seP = p => Math.sqrt(Math.max(p * (1 - p), 1 / v.nSim) * 2 / v.nSim);
    VAL.mc('vecino más cercano: p (más cerca)', t.pCloser, v.pCerca, seP(v.pCerca), info);
    VAL.mc('vecino más cercano: p (más lejos)', t.pFarther, v.pLejos, seP(v.pLejos), info);
  });

  /* ranges */
  const close = (A, B) => A.length === B.length && A.every(a => B.some(b => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9));
  let worstGeo = 0;
  r.rangos.forEach(g => {
    const o = Cooc.rangeOverlap(pts(g.plant), pts(g.visitor)), info = `${g.plant} × ${g.visitor}`;
    VAL.same('envolvente convexa: mismos vértices (chull)', close(o.hp, g.hp) && close(o.hv, g.hv), true, info);
    VAL.check('área de la envolvente (sf, proyección equivalente)', o.areaP, g.areaP, 1e-10, info + ', planta');
    VAL.check('área de la envolvente (sf, proyección equivalente)', o.areaV, g.areaV, 1e-10, info + ', visitante');
    VAL.check('área compartida (sf)', o.areaI, g.areaI, 1e-8, info, 1e-6);
    VAL.check('área con lados de círculo máximo (geosphere)', o.areaP, g.geoP, 2e-2, info + ', planta');
    VAL.check('área con lados de círculo máximo (geosphere)', o.areaV, g.geoV, 2e-2, info + ', visitante');
    worstGeo = Math.max(worstGeo, Math.abs(o.areaP / g.geoP - 1), Math.abs(o.areaV / g.geoV - 1));
  });
  VAL.note(`el área de una envolvente difiere a lo más ${(100 * worstGeo).toFixed(2)} % de la que resulta con lados de círculo máximo; es otra definición del polígono, no un error de cálculo.`);
} });
