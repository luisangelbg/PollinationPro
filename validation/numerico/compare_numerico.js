/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — validation of the numerical engine (js/engine.js and the
   small statistics of js/core.js) against R. Reference: ref_numerico.R. */
VAL.sections.push({ name: 'Motor numérico', run(REF) {
  const r = REF.numerico, P = Poll, A = VAL.arr;
  r.lgamma.x.forEach((x, i) => VAL.check('log Γ', P.lgamma(x), r.lgamma.y[i], 1e-13, 'x = ' + x, 1e-14));
  r.lchoose.n.forEach((n, i) => VAL.check('log C(n, k)', P.lchoose(n, r.lchoose.k[i]), r.lchoose.y[i], 1e-11, `${n}, ${r.lchoose.k[i]}`, 1e-9));
  r.pnorm.x.forEach((x, i) => VAL.check('normal: acumulada', P.pnorm(x), r.pnorm.y[i], 2e-7, 'x = ' + x));
  r.qnorm.p.forEach((p, i) => VAL.check('normal: cuantil', P.qnorm(p), r.qnorm.y[i], 2e-7, 'p = ' + p, 2e-7));
  r.gammaP.a.forEach((a, i) => VAL.check('gamma incompleta P(a, x)', P.gammaP(a, r.gammaP.x[i]), r.gammaP.y[i], 1e-12, `${a}, ${r.gammaP.x[i]}`));
  r.pchisqUpper.x.forEach((x, i) => VAL.check('ji cuadrada: cola superior', P.pchisqUpper(x, r.pchisqUpper.df[i]), r.pchisqUpper.y[i], 1e-10, `${x}, gl ${r.pchisqUpper.df[i]}`, 1e-15));
  r.betaI.x.forEach((x, i) => VAL.check('beta incompleta I_x(a, b)', P.betaI(x, r.betaI.a[i], r.betaI.b[i]), r.betaI.y[i], 1e-10, `${x}, ${r.betaI.a[i]}, ${r.betaI.b[i]}`, 1e-15));
  r.pfUpper.f.forEach((f, i) => VAL.check('F: cola superior', P.pfUpper(f, r.pfUpper.d1[i], r.pfUpper.d2[i]), r.pfUpper.y[i], 1e-10, `${f}, ${r.pfUpper.d1[i]}, ${r.pfUpper.d2[i]}`, 1e-15));

  const h = r.hyper;
  h.j.forEach((j, i) => {
    const info = `j ${j}, N ${h.N[i]}, N1 ${h.N1[i]}, N2 ${h.N2[i]}`;
    VAL.check('hipergeométrica: P(j)', P.hyperPmf(j, h.N[i], h.N1[i], h.N2[i]), h.pmf[i], 1e-9, info, 1e-300);
    const c = P.cooccurrence(h.N[i], h.N1[i], h.N2[i], j);
    VAL.check('hipergeométrica: P(X ≤ j)', c.pLe, h.pLe[i], 1e-9, info, 1e-300);
    VAL.check('hipergeométrica: P(X ≥ j)', c.pGe, h.pGe[i], 1e-9, info, 1e-300);
  });

  r.muestras.forEach((m, k) => {
    const x = A(m.x), info = 'muestra ' + (k + 1);
    VAL.check('media', Stat.mean(x), m.media, 1e-13, info);
    VAL.check('desviación estándar', Stat.sd(x), m.de, 1e-13, info);
    VAL.check('mediana', Stat.median(x), m.mediana, 1e-13, info);
    [0.05, 0.1, 0.25, 0.75, 0.95].forEach((q, i) => VAL.check('cuantiles (tipo 7)', Stat.quantile(x, q), m.q[i], 1e-13, info + ', q ' + q));
    VAL.check('ancho de banda de Silverman', P.silverman(x), m.silverman, 1e-13, info);
  });
  r.bh.forEach((b, k) => { const adj = P.bhAdjust(A(b.p)); A(b.adj).forEach((v, i) => VAL.check('Benjamini-Hochberg', adj[i], v, 1e-13, `lista ${k + 1}, p ${i + 1}`)); });

  /* kernel densities: R evaluates the full Gaussian kernel; the app cuts it at
     5 (one dimension) or 4 (two) bandwidths, so the difference is bounded by
     the kernel's height there: e⁻¹²·⁵ and e⁻⁸ of its peak */
  r.kde1d.forEach((k, s) => {
    const z = P.kde1d(k.x, k.lo, k.hi, k.n, k.h), top = Math.max(...k.z);
    k.z.forEach((v, i) => VAL.abs('densidad de núcleo en una dimensión (fracción del máximo)', z[i] / top, v / top, 1e-5, `serie ${s + 1}, punto ${i}`));
  });
  r.kde2d.forEach((k, s) => {
    const z = P.kde2d(k.pts, k.caja, k.R, k.hx, k.hy), top = Math.max(...k.z);
    k.z.forEach((v, i) => VAL.abs('densidad de núcleo en dos dimensiones (fracción del máximo)', z[i] / top, v / top, 2e-3, `nube ${s + 1}, celda ${i}`));
  });

  /* principal components: an axis and its opposite are the same axis, so each
     one is compared after choosing the sign that matches R's */
  r.pca.forEach((c, s) => {
    const m = P.pca(c.X), other = c.otros.map(m.project);
    c.valores.forEach((v, k) => VAL.check('componentes: valores propios', m.values[k], v, 1e-10, `matriz ${s + 1}, eje ${k + 1}`));
    c.vectores.forEach((vec, k) => {
      const sg = Math.sign(vec.reduce((t, w, j) => t + w * m.vectors[k][j], 0)) || 1;
      vec.forEach((w, j) => VAL.check('componentes: vectores propios', sg * m.vectors[k][j], w, 1e-8, `matriz ${s + 1}, eje ${k + 1}, variable ${j + 1}`, 1e-10));
      c.puntajes.forEach((row, i) => VAL.check('componentes: puntajes', sg * m.scores[i][k], row[k], 1e-7, `matriz ${s + 1}, fila ${i + 1}, eje ${k + 1}`, 1e-9));
      c.puntajesOtros.forEach((row, i) => VAL.check('componentes: puntajes de puntos nuevos', sg * other[i][k], row[k], 1e-7, `matriz ${s + 1}, punto ${i + 1}, eje ${k + 1}`, 1e-9));
    });
  });
} });
