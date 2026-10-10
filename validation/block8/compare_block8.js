/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — validation of Block 8 (js/sdm.js) against R.
   Reference: ref_block8.R. */
VAL.sections.push({ name: 'Bloque 8 · Distribuciones potenciales', run(REF) {
  const r = REF.block8;
  r.casos.forEach(c => {
    const nm = c.nombre, k = c.pres[0].length;
    const env = SDM.fitEnvelope(c.pres), mah = SDM.fitMahalanobis(c.pres), lg = SDM.fitLogistic(c.pres, c.fondo, { lambda: c.lambda, iter: 100 });
    c.prueba.forEach((x, i) => {
      VAL.check('envolvente climática (dismo::bioclim)', env.predict(x), c.envolvente[i], 1e-12, `${nm}, punto ${i + 1}`, 1e-15);
      /* the app adds a billionth of each variance to the diagonal so that the matrix can always be inverted */
      VAL.check('Mahalanobis: idoneidad (stats)', mah.predict(x), c.mahal[i], 1e-6, `${nm}, punto ${i + 1}`, 1e-300);
      VAL.abs('logística: idoneidad (óptimo hallado por optim)', lg.predict(x), c.logistica[i], 1e-5, `${nm}, punto ${i + 1}`);
    });
    lg.beta.forEach((b, j) => {
      VAL.abs('logística: coeficientes (optim)', b, c.betaOptim[j], 1e-4, `${nm}, β${j}`);
      VAL.abs('logística: coeficientes (glmnet)', b, c.betaGlmnet[j], 2e-3, `${nm}, β${j}`);
    });
    [['envolvente', c.evalEnvolvente], ['logística', c.evalLogistica]].forEach(([tag, e]) => {
      const info = `${nm}, ${tag}`;
      VAL.check('AUC (pROC)', SDM.auc(e.p, e.a), e.aucPROC, 1e-12, info);
      VAL.check('AUC (dismo)', SDM.auc(e.p, e.a), e.aucDismo, 1e-12, info);
      const t = SDM.threshold(e.p, e.a, 'p10');
      VAL.check('umbral del percentil 10 de las presencias', t, e.t10, 1e-13, info);
      const s = SDM.tss(e.p, e.a, t);
      VAL.check('sensibilidad en el umbral (dismo)', s.sens, e.sens, 1e-13, info);
      VAL.check('especificidad en el umbral (dismo)', s.spec, e.espec, 1e-13, info);
      /* every score is a candidate threshold, as in pROC */
      const tm = SDM.tss(e.p, e.a, SDM.threshold(e.p, e.a, 'maxTSS')).tss;
      VAL.check('TSS en el umbral que la maximiza (pROC)', tm, e.tssMax, 1e-12, info);
    });
  });
  const c = r.celdas, L = { y0: c.y0, dx: c.dx, dy: c.dy };
  let worst = 0;
  c.zona.forEach((a, row) => {
    VAL.check('área de una celda: zona esférica entre dos paralelos', SDM.cellArea(L, row), a, 1e-12, 'fila ' + row);
    VAL.check('área de una celda en la esfera (geosphere)', SDM.cellArea(L, row), c.geosphere[row], 1e-5, 'fila ' + row);
    VAL.check('área de una celda frente al elipsoide WGS84 (terra)', SDM.cellArea(L, row), c.wgs84[row], 5e-3, 'fila ' + row);
    worst = Math.max(worst, Math.abs(SDM.cellArea(L, row) / c.wgs84[row] - 1));
  });
  VAL.note(`el área de las celdas se mide en una esfera; frente al elipsoide WGS84 difiere a lo más ${(100 * worst).toFixed(2)} % entre 14° y 29° de latitud.`);
} });
