/* PollinationPro — tests of Blocks 2, 3 and 5: reading tables, cleaning and
   spatial co-occurrence.

   The readers are checked against values worked by hand. The cleaning rules
   against the errors seeded on purpose in the practice data, whose place is
   known. The co-occurrence tests by simulation: under the null hypothesis
   (two taxa placed independently among the same cells) a test at α = 0.05
   must reject at most about 5 % of the time, and with an association planted
   on purpose it must find it. */
window.TESTS = window.TESTS || [];
window.TESTS.push(async function ({ section, check, near }) {

  /* ---------------- readers ---------------- */
  section('Lectura de coordenadas, números y fechas');
  const C = TableIO.parseCoord;
  check('Decimal con punto', near(C('19.4326'), 19.4326, 1e-12));
  check('Decimal con coma', near(C('-99,1332'), -99.1332, 1e-12));
  check('GMS con N: 19°25\'30"N = 19.425', near(C('19°25\'30"N'), 19.425, 1e-9), C('19°25\'30"N'));
  check('GMS con O (oeste): 99°08\'00" O = −99.1333', near(C('99°08\'00" O'), -99.13333, 1e-4), C('99°08\'00" O'));
  check('Hemisferio al inicio: W 103 30 = −103.5', near(C('W 103 30'), -103.5, 1e-9));
  check('Texto que no es coordenada → vacío', C('cerca del río') === null && C('') === null);
  check('Número con separador de miles: 1,250.5', near(TableIO.parseNumber('1,250.5'), 1250.5, 1e-12));
  check('Altitud con unidad: 2250 msnm', near(TableIO.parseNumber('2250 msnm'), 2250, 1e-12));
  const d = TableIO.parseDate;
  check('Fecha ISO', JSON.stringify(d('2021-09-14')) === '{"y":2021,"m":9,"d":14}');
  check('Fecha día/mes/año', JSON.stringify(d('14/09/2021')) === '{"y":2021,"m":9,"d":14}');
  check('Fecha mes/día/año cuando el día pasa de 12', JSON.stringify(d('09/14/2021')) === '{"y":2021,"m":9,"d":14}');
  check('Intervalo de GBIF: toma el primer día', JSON.stringify(d('2021-09-01/2021-09-30')) === '{"y":2021,"m":9,"d":1}');
  check('Solo año y mes', JSON.stringify(d('2021-09')) === '{"y":2021,"m":9,"d":null}');
  check('Número de serie de hoja de cálculo 44453 = 2021-09-14', JSON.stringify(d(44453)) === '{"y":2021,"m":9,"d":14}');
  check('30 de febrero no existe', d('2021-02-30') === null);
  check('Separador de punto y coma detectado', TableIO.detectDelimiter('a;b;c\n1;2;3\n4;5;6') === ';');
  const pm = TableIO.parseMatrix('"Especie","Localidad"\n"Sechium edule","Huatusco, Ver."\n');
  check('Comillas con coma dentro de la celda', pm.matrix[1][1] === 'Huatusco, Ver.');
  check('Encabezado detectado', TableIO.looksLikeHeader([['taxon', 'lat', 'lon'], ['Apis mellifera', '19.1', '-96.9'], ['Bombus', '20.2', '-99.1']]));
  check('Sin encabezado detectado', !TableIO.looksLikeHeader([['Apis mellifera', '19.1', '-96.9'], ['Bombus', '20.2', '-99.1']]));

  section('Reconocimiento de columnas');
  const heads = ['Especie', 'Latitud', 'Longitud', 'Fecha de colecta', 'Altitud (m)', 'Estado'];
  const rows = [{ Especie: 'Sechium compositum', Latitud: '15.2', Longitud: '-92.3', 'Fecha de colecta': '2020-09-01', 'Altitud (m)': '1200', Estado: 'Chiapas' }];
  const map = Records.propose(heads, rows, Records.PRESENCE);
  check('Columnas en español reconocidas por nombre', map.taxon === 'Especie' && map.lat === 'Latitud' && map.lon === 'Longitud' && map.date === 'Fecha de colecta' && map.elev === 'Altitud (m)' && map.state === 'Estado', JSON.stringify(map));
  const heads2 = ['sp', 'c1', 'c2'];
  const rows2 = [{ sp: 'Bombus', c1: '19.51', c2: '-99.12' }, { sp: 'Bombus', c1: '20.72', c2: '-103.31' }];
  const map2 = Records.propose(heads2, rows2, Records.PRESENCE);
  check('Coordenadas reconocidas por contenido', map2.lat === 'c1' && map2.lon === 'c2', JSON.stringify(map2));
  const vis = Records.readVisits([{ Planta: 'Sechium edule', Visitante: 'Apis mellifera', Visitas: '12' }, { Planta: '', Visitante: 'x', Visitas: '1' }], { plant: 'Planta', visitor: 'Visitante', n: 'Visitas' });
  check('Visitas leídas y fila incompleta omitida', vis.visits.length === 1 && vis.visits[0].n === 12 && vis.bad.length === 1);
  const taxa = [Taxa.entry('Peponapis', 'poll'), Taxa.entry('Sechium', 'plant'), Taxa.entry('Sechium edule', 'plant')];
  const recs = [{ name: 'Peponapis azteca' }, { name: 'Sechium edule subsp. sylvestre' }, { name: 'Sechium compositum' }, { name: 'Bombus' }];
  Records.attach(recs, taxa);
  check('Un registro se une a la entrada más larga que lo contiene', recs[0].taxonId === taxa[0].id && recs[1].taxonId === taxa[2].id && recs[2].taxonId === taxa[1].id && !recs[3].taxonId);

  /* ---------------- cleaning ---------------- */
  section('Depuración contra los errores sembrados en los datos de práctica');
  const P = Taxa.PRESETS.find(p => p.id === 'cucurbits');
  const tx = [];
  P.plants.forEach(n => tx.push(Taxa.entry(n, 'plant')));
  P.polls.forEach(n => tx.push(Taxa.entry(n, 'poll')));
  const raw = Examples.build('cucurbits', tx);
  const res = Clean.run(raw, tx, { area: { countries: ['MX'], states: [] }, synonyms: [{ from: 'Peponapis', to: 'Xenoglossa', on: true }] });
  const all = res.records.concat(res.dropped);
  const seed = s => all.find(r => r._seed === s);
  check('(0, 0) quitado', seed('zero').removedBy === 'zero');
  check('Latitud y longitud intercambiadas: corregidas, no quitadas', !seed('swapped').removedBy && seed('swapped').flags.includes('swapped') && seed('swapped').cc2 === 'MX');
  check('Longitud sin signo: corregida', !seed('unsigned').removedBy && seed('unsigned').lon < 0);
  check('Centro del recuadro de México quitado como centroide', seed('centroid').removedBy === 'centroid');
  check('Coordenada redondeada: marcada, no quitada', !seed('rounded').removedBy && seed('rounded').flags.includes('rounded'));
  check('Fecha futura quitada', seed('future').removedBy === 'future');
  check('Incertidumbre de 25 km quitada', seed('imprecise').removedBy === 'imprecise');
  check('Los 18 duplicados sembrados quitados', res.count.duplicate.removed >= 18, res.count.duplicate.removed);
  const xen = tx.find(t => t.name === 'Xenoglossa'), pep = tx.find(t => t.name === 'Peponapis');
  check('Peponapis reunido en Xenoglossa, con el nombre original guardado', res.records.filter(r => r.origTaxonId === pep.id).every(r => r.taxonId === xen.id && /^Xenoglossa /.test(r.speciesH) && /^Peponapis /.test(r.origName)));
  check('Centroide de área de México a ~35 km del centro del recuadro', (() => { const c = Clean.centroids().filter(x => x.name === 'México (país)'); const a = c.find(x => x.def === 'area'), b = c.find(x => x.def === 'box'); return a && b && Poll.haversine(a.lat, a.lon, b.lat, b.lon) > 25 && Poll.haversine(b.lat, b.lon, 23.6345, -102.5528) < 5; })());
  check('Cultivado por palabras clave', Clean.isCultivated({ locality: 'huerto familiar', remarks: '' }) === 'words' && Clean.isCultivated({ estab: 'MANAGED' }) === 'estab' && !Clean.isCultivated({ locality: 'bosque mesófilo', remarks: '' }));

  /* ---------------- co-occurrence ---------------- */
  section('Coocurrencia: comportamiento bajo el nulo y con asociación sembrada');
  const r = rng(99);
  /* 300 cells on a 0.25° grid somewhere in Mexico; a third party records in all of them */
  const cells = [];
  for (let i = 0; i < 20; i++) for (let j = 0; j < 15; j++) cells.push([-102 + i * 0.25 + 0.125, 18 + j * 0.25 + 0.125]);
  const pick = (k, pool) => { const idx = cells.map((c, i) => i); Poll.shuffle(idx, r); return (pool || idx).slice(0, k).map(i => cells[i]); };
  let rej = 0, sims = 400;
  for (let s = 0; s < sims; s++) {
    const A = pick(60), B = pick(45);
    const recs5 = cells.map(c => ({ unit: 'bg', role: 'other', lon: c[0], lat: c[1] }))
      .concat(A.map(c => ({ unit: 'A', role: 'plant', lon: c[0], lat: c[1] })), B.map(c => ({ unit: 'B', role: 'poll', lon: c[0], lat: c[1] })));
    const out = Cooc.pairs(recs5, 0.25, 'target', { alpha: 0.05 });
    const p = out.pairs[0];
    if (p.pGe < 0.05) rej++;
  }
  check('Bajo el nulo, «más de lo esperado» ≤ 5 % (prueba exacta, conservadora)', rej / sims <= 0.06 && rej / sims >= 0.01, (100 * rej / sims).toFixed(1) + ' %');
  {
    /* B chosen mostly among A's cells */
    const idx = cells.map((c, i) => i); Poll.shuffle(idx, r);
    const A = idx.slice(0, 60), B = A.slice(0, 30).concat(idx.slice(60, 75));
    const recs5 = cells.map(c => ({ unit: 'bg', role: 'other', lon: c[0], lat: c[1] }))
      .concat(A.map(i => ({ unit: 'A', role: 'plant', lon: cells[i][0], lat: cells[i][1] })), B.map(i => ({ unit: 'B', role: 'poll', lon: cells[i][0], lat: cells[i][1] })));
    const p = Cooc.pairs(recs5, 0.25, 'target', { alpha: 0.05 }).pairs[0];
    check('Asociación sembrada detectada como positiva', p.verdict === 'positive' && p.shared === 30 && near(p.exp, 60 * 45 / 300, 1e-9), `${p.shared} vs ${p.exp}`);
  }
  {
    /* the universe matters: records of both only along a strip, with a big empty map around */
    const strip = cells.filter(c => c[1] < 18.6);
    const recs5 = [];
    strip.forEach((c, i) => { if (i % 2 === 0) recs5.push({ unit: 'A', role: 'plant', lon: c[0], lat: c[1] }); if (i % 3 === 0) recs5.push({ unit: 'B', role: 'poll', lon: c[0], lat: c[1] }); });
    const target = Cooc.pairs(recs5, 0.25, 'target').pairs[0];
    const land = Cooc.pairs(recs5, 0.25, 'land', { box: [-102, 18, -97, 21.75] }).pairs[0];
    check('Universo ingenuo infla la asociación que el grupo objetivo no ve', land.ses > target.ses + 2, `EEF ${fmtFixed(land.ses, 2)} contra ${fmtFixed(target.ses, 2)}`);
  }
  {
    /* nearest-neighbour test under the null: visitor points are a random draw of the pool */
    const pool = cells.map(() => [-102 + 5 * r(), 18 + 3.75 * r()]);      // continuous points: no ties between distances
    let rejNN = 0; const reps = 120;
    for (let s = 0; s < reps; s++) {
      /* plant and visitor drawn independently from the same pool, exactly as the null model assumes
         (drawing the visitor among the cells the plant does not occupy would build in a repulsion) */
      const ia = pool.map((c, i) => i), ib = pool.map((c, i) => i);
      Poll.shuffle(ia, r); Poll.shuffle(ib, r);
      const A = ia.slice(0, 25).map(i => pool[i]), B = ib.slice(0, 30).map(i => pool[i]);
      const t = Cooc.nnTest(A, B, pool, 99, 1000 + s);
      if (t.pCloser < 0.05) rejNN++;
    }
    check('Distancia al vecino: bajo el nulo rechaza ≈ 5 %', rejNN / reps >= 0.01 && rejNN / reps <= 0.1, (100 * rejNN / reps).toFixed(1) + ' %');
  }
  {
    const pts = [[-100, 18], [-99, 18], [-99, 19], [-100, 19], [-99.5, 18.5]];
    const ro = Cooc.rangeOverlap(pts, pts);
    check('Áreas idénticas se cubren al 100 %', near(ro.coverP, 1, 1e-9) && near(ro.coverV, 1, 1e-9));
    check('Área de un cuadrado de 1° a 18.5° N ≈ 11 700 km²', near(ro.areaP, Poll.sphericalArea([[-100, 18], [-99, 18], [-99, 19], [-100, 19]]), 1e-6) && ro.areaP > 11500 && ro.areaP < 11900, Math.round(ro.areaP));
  }
});
