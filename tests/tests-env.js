/* PollinationPro — tests of Blocks 6 and 7: phenology, rasters and niches.

   The LZW decoder is checked against an LZW encoder written here from the
   TIFF 6.0 description (the other direction of the algorithm), on random and
   on repetitive data; PackBits and the two predictors by round trips; the
   GeoTIFF reader on a tiny file built here byte by byte; the ASCII grid by a
   hand-written one. The niche engine by its limits (identical samples give
   D = 1) and by simulation under the null of equivalency. The phenology
   engine by recovering the peak and spread of simulated calendars. */
window.TESTS = window.TESTS || [];
window.TESTS.push(async function ({ section, check, near }) {

  /* ---------------- LZW, PackBits, predictors ---------------- */
  section('Descompresores de GeoTIFF');
  /* an LZW encoder as TIFF 6.0 describes it: codes MSB-first, clear at the start,
     widths 9–12 with the early change, clear again when the table fills */
  function lzwEncode(data) {
    const out = []; let acc = 0, nbits = 0, width = 9;
    const put = code => { acc = (acc << width) | code; nbits += width; while (nbits >= 8) { out.push((acc >> (nbits - 8)) & 0xFF); nbits -= 8; acc &= (1 << nbits) - 1; } };
    let dict = new Map(), next = 258;
    const reset = () => { dict = new Map(); for (let i = 0; i < 256; i++) dict.set(String.fromCharCode(i), i); next = 258; width = 9; };
    reset(); put(256);
    let w = '';
    for (let i = 0; i < data.length; i++) {
      const c = String.fromCharCode(data[i]), wc = w + c;
      if (dict.has(wc)) { w = wc; continue; }
      put(dict.get(w));
      dict.set(wc, next++);
      if (next + 1 > (1 << width) && width < 12) width++;          // the early change, mirrored
      if (next >= 4094) { put(256); reset(); }
      w = c;
    }
    if (w) put(dict.get(w));
    put(257);
    if (nbits > 0) out.push((acc << (8 - nbits)) & 0xFF);
    return Uint8Array.from(out);
  }
  const r = rng(5);
  const rand = new Uint8Array(20000).map(() => Math.floor(r() * 256));
  const rep = new Uint8Array(30000).map((_, i) => (i % 97 < 40 ? 7 : (i * 13) % 5));
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  check('LZW: datos aleatorios, ida y vuelta exacta', same(Raster.lzw(lzwEncode(rand), rand.length), rand));
  check('LZW: datos repetitivos (tabla llena y reinicio), ida y vuelta exacta', same(Raster.lzw(lzwEncode(rep), rep.length), rep));
  /* PackBits worked by hand: [2, a, b, c] = literal of 3; [-3, x] = x repeated 4 times */
  check('PackBits a mano', same(Raster.packBits(Uint8Array.of(2, 10, 11, 12, 253, 99), 7), Uint8Array.of(10, 11, 12, 99, 99, 99, 99)));
  {
    const row = Uint16Array.of(100, 105, 103, 200, 50, 60);
    const bytes = new Uint8Array(row.buffer.slice(0));
    const dv = new DataView(bytes.buffer);
    for (let i = row.length - 1; i > 0; i--) dv.setUint16(i * 2, (row[i] - row[i - 1]) & 0xFFFF, true);
    Raster.undoHorizontal(bytes, row.length, 1, 16, true);
    check('Predictor horizontal de 16 bits', same(new Uint16Array(bytes.buffer), row));
  }
  {
    const vals = Float32Array.of(12.5, -3.25, 1e-3, 1234.75);
    const raw = new Uint8Array(vals.buffer.slice(0)), n = vals.length, bpp = 4;
    const planes = new Uint8Array(n * bpp);
    for (let i = 0; i < n; i++) for (let b = 0; b < bpp; b++) planes[(bpp - 1 - b) * n + i] = raw[i * bpp + b];
    for (let i = planes.length - 1; i > 0; i--) planes[i] = (planes[i] - planes[i - 1]) & 0xFF;
    Raster.undoFloat(planes, n, 1, 32);
    check('Predictor de punto flotante', same(new Float32Array(planes.buffer), vals));
  }

  section('Lectura de GeoTIFF y rejilla ASCII');
  /* a 4 × 3 float32 GeoTIFF built byte by byte: uncompressed, one strip,
     upper-left corner at (−100, 20), cells of 0.5°, no-data −9999 */
  function tinyTiff(vals, w, h) {
    const entries = [[256, 3, 1, w], [257, 3, 1, h], [258, 3, 1, 32], [259, 3, 1, 1], [273, 4, 1, 0], [277, 3, 1, 1], [278, 3, 1, h], [279, 4, 1, w * h * 4], [339, 3, 1, 3], [33550, 12, 3, 0], [33922, 12, 6, 0], [42113, 2, 6, 0]];
    const ifdSize = 2 + entries.length * 12 + 4;
    const extraOff = 8 + ifdSize;
    const scaleOff = extraOff, tieOff = scaleOff + 24, ndOff = tieOff + 48, dataOff = ndOff + 8;
    const buf = new ArrayBuffer(dataOff + w * h * 4);
    const dv = new DataView(buf);
    dv.setUint16(0, 0x4949); dv.setUint16(2, 42, true); dv.setUint32(4, 8, true);
    dv.setUint16(8, entries.length, true);
    entries.forEach(([tag, type, count, val], i) => {
      const p = 10 + i * 12;
      dv.setUint16(p, tag, true); dv.setUint16(p + 2, type, true); dv.setUint32(p + 4, count, true);
      if (tag === 273) dv.setUint32(p + 8, dataOff, true);
      else if (tag === 33550) dv.setUint32(p + 8, scaleOff, true);
      else if (tag === 33922) dv.setUint32(p + 8, tieOff, true);
      else if (tag === 42113) dv.setUint32(p + 8, ndOff, true);
      else if (type === 3) dv.setUint16(p + 8, val, true);
      else dv.setUint32(p + 8, val, true);
    });
    [0.5, 0.5, 0].forEach((v, i) => dv.setFloat64(scaleOff + i * 8, v, true));
    [0, 0, 0, -100, 20, 0].forEach((v, i) => dv.setFloat64(tieOff + i * 8, v, true));
    new Uint8Array(buf, ndOff, 6).set(new TextEncoder().encode('-9999\0'));
    vals.forEach((v, i) => dv.setFloat32(dataOff + i * 4, v, true));
    return buf;
  }
  const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, -9999];
  const L = await Raster.readTiff(tinyTiff(vals, 4, 3));
  check('GeoTIFF: tamaño, esquina y celda', L.w === 4 && L.h === 3 && L.x0 === -100 && L.y0 === 20 && L.dx === 0.5);
  check('GeoTIFF: valores y sin-dato como NaN', L.data[0] === 1 && L.data[10] === 11 && isNaN(L.data[11]));
  check('Valor en el centro de una celda', Raster.valueAt(L, -99.75, 19.75) === 1 && Raster.valueAt(L, -98.25, 19.25) === 8 && Raster.valueAt(L, -98.75, 18.75) === 11);
  check('Interpolación bilineal entre cuatro centros = su promedio', near(Raster.valueAt(L, -99.5, 19.5), (1 + 2 + 5 + 6) / 4, 1e-6));
  check('Fuera de la capa → NaN', isNaN(Raster.valueAt(L, -90, 19)));
  const Lw = await Raster.readTiff(tinyTiff(vals, 4, 3), [-99.4, 18.6, -98.6, 19.4]);
  check('Ventana recortada: solo las celdas del recuadro', Lw.w === 2 && Lw.h === 2 && Lw.data[0] === 6 && Lw.data[3] === 11 && near(Lw.x0, -99.5, 1e-9));
  const asc = Raster.readAsc('ncols 3\nnrows 2\nxllcorner -100\nyllcorner 18\ncellsize 1\nNODATA_value -9999\n1 2 3\n4 -9999 6\n');
  check('Rejilla ASCII: esquina superior y sin-dato', asc.y0 === 20 && asc.data[2] === 3 && isNaN(asc.data[4]) && asc.data[5] === 6);

  /* ---------------- phenology ---------------- */
  section('Fenología: recuperar calendarios simulados');
  {
    const rr = rng(8);
    const mk = (peak, sd, n, unit, role) => Array.from({ length: n }, () => { let d = Math.round(peak + sd * randn(rr)); d = ((d - 1) % 365 + 365) % 365 + 1; const dt = fromDoy(2025, d); return { unit, role, m: dt.m, d: dt.d }; });
    const recs = mk(20, 25, 400, 'P', 'plant').concat(mk(355, 25, 400, 'V', 'poll'));
    const A = Pheno.analyse(recs);
    const P1 = A.units.find(u => u.unit === 'P'), V1 = A.units.find(u => u.unit === 'V');
    check('Pico del 20 de enero recuperado (±5 días)', Poll.doyDiff(P1.circ.meanDoy, 20) <= 5, fmtDoy(P1.circ.meanDoy));
    check('Pico del 21 de diciembre recuperado cruzando el año', Poll.doyDiff(V1.circ.meanDoy, 355) <= 5, fmtDoy(V1.circ.meanDoy));
    check('Desviación circular ≈ 25 días', near(P1.circ.sdDays, 25, 4), fmtFixed(P1.circ.sdDays, 1));
    const pr = A.pairs[0];
    check('Desfase ≈ 30 días aunque cruce el 31 de diciembre', near(pr.lag, 30, 6), fmtFixed(pr.lag, 1));
    const bim = Pheno.circular(mk(80, 15, 200, 'B', 'plant').concat(mk(262, 15, 200, 'B', 'plant')));
    check('Dos picos opuestos: R̄ bajo y aviso de bimodalidad', bim.R < 0.2 && bim.bimodal, `R̄ ${fmtFixed(bim.R, 2)}, R̄₂ ${fmtFixed(bim.R2, 2)}`);
    const eff = Pheno.profile([10, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [100, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], true);
    check('Corrección por esfuerzo: 10/100 y 10/10 → 1/11 y 10/11', near(eff[0], 1 / 11, 1e-12) && near(eff[1], 10 / 11, 1e-12));
  }

  /* ---------------- niche ---------------- */
  section('Nicho ambiental');
  {
    /* two synthetic layers on a 60 × 40 grid: a west–east and a south–north gradient */
    const w = 60, h = 40;
    const mkL = f => { const d = new Float32Array(w * h); for (let r0 = 0; r0 < h; r0++) for (let c = 0; c < w; c++) d[r0 * w + c] = f(c, r0); return { w, h, x0: -105, y0: 25, dx: 0.25, dy: 0.25, data: d }; };
    const L1 = mkL((c, rw) => 10 + c * 0.3 + 0.5 * Math.sin(rw / 3)), L2 = mkL((c, rw) => 500 + rw * 20 + 3 * Math.cos(c / 4));
    const Ls = [L1, L2];
    const bg = Niche.background(Ls, {});
    check('Fondo: todas las celdas válidas', bg.length === w * h);
    const rr = rng(21);
    const recAt = (unit, cx, cy, sd, n) => Array.from({ length: n }, () => ({ unit, role: unit === 'A' ? 'plant' : 'poll', lon: -105 + 0.25 * Math.min(w - 1, Math.max(0, cx + sd * randn(rr))) + 0.125, lat: 25 - 0.25 * Math.min(h - 1, Math.max(0, cy + sd * randn(rr))) - 0.125 }));
    const occ = Niche.extract(recAt('A', 20, 20, 4, 150).concat(recAt('B', 20, 20, 4, 150)), Ls);
    const S = Niche.space(bg, occ, { R: 60 });
    check('ACP del fondo: dos variables → 100 % en el plano', near(S.pca.explained[0] + S.pca.explained[1], 1, 1e-9));
    const sA = occ.map((o, i) => [o, S.sOcc[i]]).filter(([o]) => o.unit === 'A').map(([, s]) => s);
    const sB = occ.map((o, i) => [o, S.sOcc[i]]).filter(([o]) => o.unit === 'B').map(([, s]) => s);
    check('Muestras idénticas → D = 1', near(Niche.overlap(Niche.density(S, sA), Niche.density(S, sA)).D, 1, 1e-12));
    const cmp = Niche.compare(S, sA, sB, { nRep: 49, seed: 3 });
    check('Mismo nicho: D alto y no se rechaza la equivalencia', cmp.D > 0.7 && cmp.pEq > 0.05, `D ${fmtFixed(cmp.D, 3)}, p ${fmtFixed(cmp.pEq, 3)}`);
    const occ2 = Niche.extract(recAt('A', 10, 10, 3, 150).concat(recAt('B', 48, 30, 3, 150)), Ls);
    const S2 = Niche.space(bg, occ2, { R: 60 });
    const sA2 = occ2.map((o, i) => [o, S2.sOcc[i]]).filter(([o]) => o.unit === 'A').map(([, s]) => s);
    const sB2 = occ2.map((o, i) => [o, S2.sOcc[i]]).filter(([o]) => o.unit === 'B').map(([, s]) => s);
    const cmp2 = Niche.compare(S2, sA2, sB2, { nRep: 49, seed: 4 });
    check('Nichos separados: D bajo y equivalencia rechazada', cmp2.D < 0.2 && cmp2.pEq < 0.05, `D ${fmtFixed(cmp2.D, 3)}, p ${fmtFixed(cmp2.pEq, 3)}`);
  }

  /* ---------------- practice layers ---------------- */
  section('Capas de práctica ficticias');
  {
    const P = Examples.layers('present'), F = Examples.layers('future'), P2 = Examples.layers('present');
    check('Cuatro capas actuales y tres futuras, con nombres que el Bloque 8 empareja', P.length === 4 && F.length === 3 && ['bio_1', 'bio_4', 'bio_12'].every(s => P.some(f => f.name.endsWith(s + '.asc')) && F.some(f => f.name.endsWith(s + '.asc'))));
    check('Deterministas: dos generaciones dan el mismo texto', P.every((f, i) => f.text === P2[i].text));
    const read = f => Raster.readAsc(f.text, null);
    const T1 = read(P[0]), T1f = read(F[0]), R12 = read(P[2]), R12f = read(F[2]);
    const at = (L, lon, lat) => Raster.valueAt(L, lon, lat, true);
    check('Se leen con el lector de rejillas ASCII: 360 × 260 celdas de 0.1°', T1.w === 360 && T1.h === 260 && Math.abs(T1.dx - 0.1) < 1e-9, `${T1.w} × ${T1.h}`);
    check('El mar queda sin dato (golfo de México) y la tierra con dato (centro de México)', Number.isNaN(at(T1, -93, 24)) && !Number.isNaN(at(T1, -99.1, 19.4)));
    check('Más fresco en la meseta que en la costa del Pacífico', at(T1, -101.5, 22) < at(T1, -105.2, 20.6) - 3, `${fmtFixed(at(T1, -101.5, 22), 1)} vs ${fmtFixed(at(T1, -105.2, 20.6), 1)} °C`);
    check('Más lluvia en la vertiente del Golfo que en Sonora', at(R12, -97.0, 19.5) > 3 * at(R12, -110.5, 29.5));
    { const a = Raster.readAsc(P[3].text, [-105.3, 14.1, -88.7, 29.9]), b = Raster.readAsc(P[0].text, Raster.bboxOf(a)); check('Dos capas de la misma rejilla recortadas a la ventana de la primera quedan en la misma rejilla (sin remuestrear)', Raster.sameGrid(a, b), `${a.w}×${a.h} y ${b.w}×${b.h}`); }
    check('El futuro de práctica es más cálido y más seco en cada celda con dato', (() => { for (let i = 0; i < T1.data.length; i++) { if (Number.isNaN(T1.data[i])) continue; if (!(T1f.data[i] > T1.data[i] + 1.5) || !(R12f.data[i] < R12.data[i])) return false; } return true; })());
  }
});
