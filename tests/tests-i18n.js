/* PollinationPro — tests of the English interface: the abbreviations that
   change with the language, the names of the files the app writes, the
   templates read back in either language, the dates and the references.
   Each check switches the language for a moment and puts it back. */
window.TESTS = window.TESTS || [];
window.TESTS.push(async function ({ section, check }) {
  const inLang = (lang, f) => { const was = I18N.lang; I18N.lang = lang; try { return f(); } finally { I18N.lang = was; } };

  section('Interfaz en inglés: abreviaturas');
  check('EEF en español, SES en inglés', inLang('es', () => term('ses')) === 'EEF' && inLang('en', () => term('ses')) === 'SES');
  check('CP1 en español, PC1 en inglés', inLang('es', () => term('pc') + '1') === 'CP1' && inLang('en', () => term('pc') + '1') === 'PC1');
  check('ppp en español, dpi en inglés', inLang('es', () => term('dpi')) === 'ppp' && inLang('en', () => term('dpi')) === 'dpi');

  section('Interfaz en inglés: nombres de los archivos');
  const es = k => outName(k, 'es'), en = k => outName(k, 'en');
  check('Paquete en español: LEEME.txt, informe.html, proyecto.json, parametros.json, cuadros/, figuras/',
    es('readme') === 'LEEME.txt' && es('report') === 'informe.html' && es('project') === 'proyecto.json' && es('params') === 'parametros.json' && es('tablesDir') === 'cuadros' && es('figuresDir') === 'figuras');
  check('Paquete en inglés: README.txt, report.html, project.json, parameters.json, tables/, figures/',
    en('readme') === 'README.txt' && en('report') === 'report.html' && en('project') === 'project.json' && en('params') === 'parameters.json' && en('tablesDir') === 'tables' && en('figuresDir') === 'figures');
  check('El .zip del paquete y el de las figuras: paquete/figuras → package/figures',
    es('packageZip') === 'paquete' && en('packageZip') === 'package' && es('figuresZip') === 'figuras' && en('figuresZip') === 'figures');
  const spanishWord = /[áéíóúñ]|registros|pares|unidades|celdas|plantilla|cuadros|figuras|informe|proyecto|parametros|conjuntos|matriz|especies|nicho|fenologia|coocurrencia|desajuste|valores|puntos|estilo|interacciones|crudos|depurados|quitados|distribucion|mapa/;
  const leftovers = Object.keys(OUT_NAMES).filter(k => spanishWord.test(en(k)));
  check('Ningún nombre de archivo en inglés conserva palabras en español', leftovers.length === 0, leftovers.join(', ') || null);
  check('Cada nombre tiene su versión en los dos idiomas', Object.keys(OUT_NAMES).every(k => OUT_NAMES[k].length === 2 && OUT_NAMES[k][0] && OUT_NAMES[k][1]));
  check('Sin idioma explícito, outName sigue a la interfaz', inLang('en', () => outName('readme')) === 'README.txt' && inLang('es', () => outName('readme')) === 'LEEME.txt');

  /* the tables of the package follow the language, folder included; the columns do not change */
  const saved = { clean: state.clean, cooc: state.cooc, pheno: state.pheno, niche: state.niche, sdm: state.sdm, network: state.network };
  try {
    Object.assign(state, { clean: { records: [{ id: 'g1', src: 'gbif', role: 'plant', unit: 'A', name: 'A', lat: 19, lon: -99, dataset: 'D', datasetKey: 'k1' }], dropped: [] }, cooc: null, pheno: null, niche: null, sdm: null, network: null });
    const nEs = inLang('es', () => Report.csvs().map(c => c.name)), nEn = inLang('en', () => Report.csvs().map(c => c.name));
    check('Cuadros del paquete en español: cuadros/registros_depurados.csv, cuadros/conjuntos_gbif.csv', nEs.join(' ') === 'cuadros/registros_depurados.csv cuadros/conjuntos_gbif.csv', nEs.join(' '));
    check('Cuadros del paquete en inglés: tables/clean_records.csv, tables/gbif_datasets.csv', nEn.join(' ') === 'tables/clean_records.csv tables/gbif_datasets.csv', nEn.join(' '));
    const hEs = inLang('es', () => Report.csvs()[0].text.split(/\r?\n/)[0]), hEn = inLang('en', () => Report.csvs()[0].text.split(/\r?\n/)[0]);
    check('Las columnas de los cuadros son las mismas en los dos idiomas (se leen igual al volver a abrirlas)', hEs === hEn && /\bid\b.*\blat\b.*\blon\b/.test(hEn), hEn.slice(0, 60));
  } finally { Object.assign(state, saved); }

  section('Interfaz en inglés: plantillas de datos propios');
  const head = ['taxon', 'latitude', 'longitude', 'date', 'elevation', 'locality', 'state', 'country', 'wild_or_cultivated', 'role', 'notes'];
  const row = (wild, role) => ({ taxon: 'Sechium compositum', latitude: '15.2345', longitude: '-92.3456', date: '2024-09-14', elevation: '1250', locality: 'Rancho El Aguacate', state: 'Chiapas', country: 'MX', wild_or_cultivated: wild, role, notes: '' });
  const read = r => { const map = Records.propose(head, [r], Records.PRESENCE); return Records.readPresence([r], map).records[0]; };
  const rEs = read(row('silvestre', 'planta')), rEn = read(row('wild', 'plant'));
  check('La plantilla en español se lee: planta, silvestre', rEs && rEs.role === 'plant' && rEs.estab === 'NATIVE' && rEs.lat === 15.2345);
  check('La plantilla en inglés se lee igual: plant, wild', rEn && rEn.role === 'plant' && rEn.estab === 'NATIVE' && rEn.lat === 15.2345);
  const vHead = ['plant', 'visitor', 'visits', 'site', 'date', 'latitude', 'longitude', 'interaction_type', 'notes'];
  const vRow = (site, type) => ({ plant: 'Sechium compositum', visitor: 'Trigona fulviventris', visits: '12', site, date: '2024-09-14', latitude: '15.2345', longitude: '-92.3456', interaction_type: type, notes: '' });
  const readV = r => { const map = Records.propose(vHead, [r], Records.VISITS); return Records.readVisits([r], map).visits[0]; };
  const vEs = readV(vRow('Sitio 1', 'néctar')), vEn = readV(vRow('Site 1', 'nectar'));
  check('La plantilla de visitas se lee en los dos idiomas', vEs && vEn && vEs.n === 12 && vEn.n === 12 && vEn.plant === 'Sechium compositum');

  section('Interfaz en inglés: fechas y porcentajes');
  check('Fecha corta: «11 ago» en español, «Aug 11» en inglés', inLang('es', () => fmtDate('2026-08-11', true)) === '11 ago' && inLang('en', () => fmtDate('2026-08-11', true)) === 'Aug 11');
  check('Fecha completa: «11 de agosto de 2026» / «August 11, 2026»', inLang('es', () => fmtDate('2026-08-11')) === '11 de agosto de 2026' && inLang('en', () => fmtDate('2026-08-11')) === 'August 11, 2026');
  check('Día del año 248 → «5 sep» / «Sep 5»', inLang('es', () => fmtDoy(248)) === '5 sep' && inLang('en', () => fmtDoy(248)) === 'Sep 5');
  check('Porcentaje con espacio antes del signo: 12.3 %', fmtPct(0.123) === '12.3 %' && fmtPct(-0.05, 0) === '−5 %');
  check('parseNum sigue leyendo «12 %» y «12%»', parseNum('12 %') === 0.12 && parseNum('12%') === 0.12);

  section('Interfaz en inglés: referencias');
  if (window.Home && Home.refText) {
    const nix = Home.REFS.find(r => r[1] === 'Nix 1986')[2], press = Home.REFS.find(r => r[1] === 'Press et al. 2007')[2], zar = Home.REFS.find(r => r[1] === 'Zar 2010')[2];
    check('En español se conservan «En … (Ed.)» y «(3.ª ed.)»', Home.refText(nix, 'es') === nix && /\(3\.ª ed\.\)/.test(Home.refText(press, 'es')));
    check('En inglés: «In R. Longmore (Ed.)», «(3rd ed.)», «(5th ed.)»', /\. In R\. Longmore \(Ed\.\)/.test(Home.refText(nix, 'en')) && /\(3rd ed\.\)/.test(Home.refText(press, 'en')) && /\(5th ed\.\)/.test(Home.refText(zar, 'en')));
    const rest = Home.REFS.map(r => Home.refText(r[2], 'en')).filter(s => /\. En [A-Z]|\.ª ed|\(versión /.test(s));
    check('Ninguna referencia en inglés conserva formas españolas', rest.length === 0, rest.length ? rest[0].slice(0, 80) : null);
  } else check('El módulo de referencias está cargado', false);
});
