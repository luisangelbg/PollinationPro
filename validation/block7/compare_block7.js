/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — validation of Block 7 (js/niche.js and js/raster.js)
   against R. References: ref_block7.R and ref_capas.R. */
VAL.sections.push({ name: 'Bloque 7 · Capas', async run(REF) {
  const r = REF.capas, arr = VAL.arr;
  const bytes = b64 => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };
  const cells = (name, L, want, info, tol) => arr(want).forEach((v, i) => {
    const g = L.data[i];
    if (v === null) VAL.same(name + ': celdas sin dato', Number.isNaN(g), true, info + ', celda ' + i);
    else VAL.check(name + ': valor de cada celda', g, v, tol, info + ', celda ' + i, 1e-12);
  });
  for (const t of r.tiff) {
    const L = await Raster.readTiff(bytes(t.archivo));
    VAL.same('GeoTIFF: columnas y filas', [L.w, L.h], [t.w, t.h], t.nombre);
    [[L.x0, t.x0], [L.y0, t.y0], [L.dx, t.dx], [L.dy, t.dy]].forEach(([a, b]) => VAL.check('GeoTIFF: origen y tamaño de celda', a, b, 1e-12, t.nombre));
    /* the app keeps every layer as 32-bit reals */
    cells('GeoTIFF', L, t.valores, t.nombre, 1e-7);
    const C = await Raster.readTiff(bytes(t.archivo), r.caja);
    VAL.same('GeoTIFF recortado: columnas y filas', [C.w, C.h], [t.recorte.w, t.recorte.h], t.nombre);
    [[C.x0, t.recorte.x0], [C.y0, t.recorte.y0]].forEach(([a, b]) => VAL.check('GeoTIFF recortado: origen', a, b, 1e-12, t.nombre));
    cells('GeoTIFF recortado', C, t.recorte.valores, t.nombre, 1e-7);
  }
  const A = Raster.readAsc(r.asc.texto);
  VAL.same('rejilla ASCII: columnas y filas', [A.w, A.h], [r.asc.w, r.asc.h], '');
  [[A.x0, r.asc.x0], [A.y0, r.asc.y0], [A.dx, r.asc.dx]].forEach(([a, b]) => VAL.check('rejilla ASCII: origen y tamaño de celda', a, b, 1e-9, ''));
  cells('rejilla ASCII', A, r.asc.valores, '', 1e-6);

  const L = await Raster.readTiff(bytes(r.tiff[0].archivo));
  r.puntos.xy.forEach((p, i) => {
    const c = r.puntos.celda[i], b = r.puntos.bilineal[i];
    if (c === null) VAL.same('valor en un punto: celda sin dato', Number.isNaN(Raster.valueAt(L, p[0], p[1], true)), true, 'punto ' + i);
    else VAL.check('valor en un punto: la celda que lo contiene (terra)', Raster.valueAt(L, p[0], p[1], true), c, 1e-7, 'punto ' + i);
    if (b !== null) VAL.check('valor en un punto: interpolación bilineal (terra)', Raster.valueAt(L, p[0], p[1]), b, 1e-6, 'punto ' + i);
  });
} });

VAL.sections.push({ name: 'Bloque 7 · Nichos', run(REF) {
  const r = REF.block7, arr = VAL.arr;
  const bg = r.fondo.map(v => ({ v }));
  const units = r.unidades.map(ix => arr(ix));
  const occ = [].concat(...units.map((ix, u) => ix.map(i => ({ unit: 'u' + u, v: r.fondo[i] }))));
  const S = Niche.space(bg, occ, { R: 100 });
  const e = r.espacio;
  S.pca.explained.slice(0, 2).forEach((v, k) => VAL.check('varianza explicada por los dos ejes (prcomp)', v, e.explicada[k], 1e-10, 'eje ' + (k + 1)));
  /* an axis and its opposite are the same axis: the box may come mirrored */
  const mirror = (lo, hi, a, b) => (Math.abs(lo - a) < Math.abs(lo + b) ? [lo, hi] : [-hi, -lo]);
  const bx = mirror(S.box[0], S.box[1], e.caja[0], e.caja[1]).concat(mirror(S.box[2], S.box[3], e.caja[2], e.caja[3]));
  bx.forEach((v, k) => VAL.check('límites del plano ambiental', v, e.caja[k], 1e-8, 'límite ' + (k + 1)));
  S.hEnv.forEach((v, k) => VAL.check('ancho de banda del fondo (bw.nrd0)', v, e.hEnv[k], 1e-9, 'eje ' + (k + 1)));
  let mx = 0; S.zEnv.forEach(z => { if (z > mx) mx = z; });
  VAL.check('máximo de la densidad del fondo (ks)', mx, e.envMax, 1e-3, '');
  /* cells on the very edge of the 1 % threshold can fall on either side of it */
  VAL.abs('celdas del plano con ambiente disponible', S.avail.filter(Boolean).length, e.disponibles, 5, '');

  let at = 0;
  const pts = units.map(ix => { const p = S.sOcc.slice(at, at + ix.length); at += ix.length; return p; });
  const dens = (u, cor) => Niche.density(S, pts[u], null, cor);
  const de = [], dec = [], da = [], dac = [];
  r.pares.forEach(w => {
    const info = `unidades ${w.a + 1} y ${w.b + 1}`;
    const o = Niche.overlap(dens(w.a, false), dens(w.b, false)), oc = Niche.overlap(dens(w.a, true), dens(w.b, true));
    /* same steps in R with the full Gaussian kernel (the app cuts it at four bandwidths) */
    VAL.abs('D de Schoener en el plano ambiental (ks + dismo)', o.D, w.D, 2e-3, info);
    VAL.abs('I de Warren en el plano ambiental (ks + dismo)', o.I, w.I, 2e-3, info);
    VAL.abs('D con la densidad corregida por el ambiente (ks + dismo)', oc.D, w.Dc, 5e-3, info);
    VAL.abs('I con la densidad corregida por el ambiente (ks + dismo)', oc.I, w.Ic, 5e-3, info);
    /* ecospat smooths with another bandwidth: the two D are not the same number, but must tell the same story */
    VAL.abs('D frente a ecospat (otro suavizado)', o.D, w.ecoD, 0.15, info);
    VAL.abs('I frente a ecospat (otro suavizado)', o.I, w.ecoI, 0.15, info);
    da.push(o.D); de.push(w.ecoD); dac.push(oc.D); dec.push(w.ecoDc);
  });
  const cor = (x, y) => { const mx2 = Stat.mean(x), my = Stat.mean(y); let a = 0, b = 0, c = 0; x.forEach((v, i) => { a += (v - mx2) * (y[i] - my); b += (v - mx2) ** 2; c += (y[i] - my) ** 2; }); return a / Math.sqrt(b * c); };
  const c1 = cor(da, de), c2 = cor(dac, dec);
  VAL.same('correlación entre la D de la app y la de ecospat mayor que 0.95', c1 > 0.95, true, 'r = ' + c1.toFixed(4));
  VAL.same('correlación entre las D corregidas de la app y de ecospat mayor que 0.9', c2 > 0.9, true, 'r = ' + c2.toFixed(4));
  const dif = Math.max(...da.map((v, i) => Math.abs(v - de[i]))), difc = Math.max(...dac.map((v, i) => Math.abs(v - dec[i])));
  VAL.note(`frente a ecospat, que suaviza con otro ancho de banda, la D de los ${da.length} pares difiere a lo más ${dif.toFixed(3)} (correlación ${c1.toFixed(3)}); con la densidad corregida, ${difc.toFixed(3)} (correlación ${c2.toFixed(3)}).`);
} });
