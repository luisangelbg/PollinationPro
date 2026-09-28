/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 1: the home page.
   Builds the stepper, the block cards, the strip of study questions, the
   method gallery, the comparison of data sources and the reference list. The
   content lives here as bilingual data, so the map of the app is one editable
   list. */

(function () {

  /* ---------------- the ten blocks ---------------- */
  const BLOCKS = [
    { n: 2, art: 'bData', tag: ['datos', 'data'],
      t: ['Registros de plantas y polinizadores', 'Records of plants and pollinators'],
      d: ['Arma la lista de estudio —las plantas de un lado, los polinizadores del otro— y trae sus registros de GBIF filtrados por país, más las interacciones ya publicadas en las bases de interacciones bióticas. O sube tus propios registros de presencia y de visitas desde una hoja de cálculo.',
        'Build the study list —the plants on one side, the pollinators on the other— and bring their GBIF records filtered by country, plus the interactions already published in the biotic-interaction databases. Or upload your own presence and visit records from a spreadsheet.'] },
    { n: 3, art: 'bClean', tag: ['calidad', 'quality'],
      t: ['Depuración y taxonomía', 'Cleaning and taxonomy'],
      d: ['Duplicados, coordenadas imposibles o de centroide, fechas dudosas, registros cultivados separados de los silvestres, sinónimos reunidos bajo el nombre actual (como <i>Peponapis</i> dentro de <i>Xenoglossa</i>) y el estado de México de cada punto. Todo con su reporte, para el apartado de métodos.',
        'Duplicates, impossible or centroid coordinates, doubtful dates, cultivated records set apart from wild ones, synonyms merged under the current name (such as <i>Peponapis</i> within <i>Xenoglossa</i>) and the Mexican state of every point. All with its report, for the methods section.'] },
    { n: 4, art: 'bMap', tag: ['mapa', 'map'],
      t: ['Mapa de plantas y polinizadores', 'Map of plants and pollinators'],
      d: ['Los registros de cada taxón sobre México por estados o sobre el mundo, sin internet: colores por taxón o por papel, densidad por celdas, entidades con más registros, flecha, escala y exportación lista para publicar.',
        'The records of every taxon over Mexico by state or over the world, offline: colours by taxon or by role, density by cells, the states with most records, arrow, scale and export ready to publish.'] },
    { n: 5, art: 'bCooc', tag: ['espacio', 'space'],
      t: ['Coocurrencia espacial', 'Spatial co-occurrence'],
      d: ['¿Coinciden la planta y el polinizador en el territorio más de lo que el azar predice? Prueba exacta de Veech con el universo corregido por esfuerzo de muestreo, índices de similitud, distancias al vecino más cercano contra un modelo nulo y solapamiento de las áreas de distribución.',
        'Do the plant and the pollinator coincide in the territory more than chance predicts? Veech\'s exact test with the universe corrected for sampling effort, similarity indices, nearest-neighbour distances against a null model and overlap of the ranges.'] },
    { n: 6, art: 'bPheno', tag: ['tiempo', 'time'],
      t: ['Fenología y altitud', 'Phenology and elevation'],
      d: ['¿Vuela el polinizador cuando la planta florece? Estadística circular de las fechas (fecha media, R̄, Rayleigh, Watson–Williams), solapamiento mes a mes corregido por esfuerzo y el mismo análisis a lo largo del gradiente altitudinal.',
        'Does the pollinator fly when the plant flowers? Circular statistics of the dates (mean date, R̄, Rayleigh, Watson–Williams), month-by-month overlap corrected for effort and the same analysis along the elevation gradient.'] },
    { n: 7, art: 'bNiche', tag: ['ambiente', 'environment'],
      t: ['Nicho ambiental', 'Environmental niche'],
      d: ['Carga tus capas climáticas (GeoTIFF o rejilla ASCII) y compara los nichos en el espacio de componentes principales del ambiente: D de Schoener, I de Warren, pruebas de equivalencia y de similitud, y las variables que separan a los dos taxones.',
        'Load your climate layers (GeoTIFF or ASCII grid) and compare the niches in the principal-component space of the environment: Schoener\'s D, Warren\'s I, equivalency and similarity tests, and the variables that set the two taxa apart.'] },
    { n: 8, art: 'bSdm', tag: ['distribución', 'distribution'],
      t: ['Distribución potencial y desajuste', 'Potential distribution and mismatch'],
      d: ['Mapas de idoneidad de cada taxón, el área donde la planta tiene polinizador potencial y la que no, y cómo cambian con capas de clima futuro. Con las capas de práctica del Bloque 7 se puede aprender sin descargar nada.',
        'Suitability maps for each taxon, the area where the plant has a potential pollinator and the area where it does not, and how they change with future climate layers. With the practice layers of Block 7 it can be learned without downloading anything.'] },
    { n: 9, art: 'bNetwork', tag: ['red', 'network'],
      t: ['Red de interacciones', 'Interaction network'],
      d: ['Con tus observaciones de visitas y las interacciones publicadas: la red planta–visitante, su conectancia, anidamiento, especialización y modularidad contra modelos nulos, la importancia de cada visitante y cuántos visitantes faltan por registrar.',
        'With your visit observations and the published interactions: the plant–visitor network, its connectance, nestedness, specialisation and modularity against null models, the importance of each visitor and how many visitors remain unrecorded.'] },
    { n: 10, art: 'bReport', tag: ['informe', 'report'],
      t: ['Figuras, informe y paquete', 'Figures, report and package'],
      d: ['Todas las figuras del estudio en PNG, JPG o SVG hasta 900 ppp con el estilo que elijas; un informe con los métodos redactados a partir de lo que realmente calculaste; y un .zip con los registros depurados, los cuadros y los parámetros que lo reproducen.',
        'Every figure of the study as PNG, JPG or SVG up to 900 dpi in the style you choose; a report with methods written from what you actually computed; and a .zip with the cleaned records, the tables and the parameters that reproduce it.'] },
  ];

  /* ---------------- the questions a study asks ---------------- */
  const QUESTIONS = [
    { art: 'mNN', t: ['¿Quién podría polinizarla?', 'Who could pollinate it?'], s: ['los visitantes que comparten su espacio, su temporada y su clima', 'the visitors that share its space, its season and its climate'], k: ['Bloques 5–7', 'Blocks 5–7'], kc: '' },
    { art: 'mPhenoOverlap', t: ['¿Coinciden en el tiempo?', 'Do they coincide in time?'], s: ['floración contra actividad de vuelo, mes a mes', 'flowering against flight activity, month by month'], k: ['Bloque 6', 'Block 6'], kc: 'l' },
    { art: 'mMismatch', t: ['¿Qué pasará con el clima?', 'What will happen with the climate?'], s: ['dónde la planta podría quedarse sin su polinizador', 'where the plant could lose its pollinator'], k: ['Bloque 8', 'Block 8'], kc: 'g' },
    { art: 'mWild', t: ['¿Silvestre o cultivada?', 'Wild or cultivated?'], s: ['lo que cambia al separar las poblaciones silvestres', 'what changes when wild populations are set apart'], k: ['Bloque 3', 'Block 3'], kc: '' },
    { art: 'mNetwork', t: ['¿Qué tan especializada es la red?', 'How specialised is the network?'], s: ['generalistas, especialistas y visitantes clave', 'generalists, specialists and key visitors'], k: ['Bloque 9', 'Block 9'], kc: 'l' },
    { art: 'mRarefy', t: ['¿Dónde falta muestrear?', 'Where is sampling missing?'], s: ['entidades y meses sin registros, visitantes por descubrir', 'states and months with no records, visitors yet to find'], k: ['Bloques 4 y 9', 'Blocks 4 and 9'], kc: 'g' },
  ];

  /* ---------------- the method gallery ---------------- */
  const FAMS = { all: ['Todos', 'All'], dat: ['Datos y calidad', 'Data and quality'], esp: ['Espacio', 'Space'], tie: ['Tiempo', 'Time'], amb: ['Ambiente', 'Environment'], red: ['Redes y diversidad', 'Networks and diversity'] };
  const METHODS = [
    { f: 'dat', art: 'mGbif', n: ['Descarga de GBIF', 'GBIF download'], s: ['por taxón y país, con paginación y reintentos', 'by taxon and country, with paging and retries'], b: 2 },
    { f: 'dat', art: 'mSynonyms', n: ['Armonización taxonómica', 'Taxonomic harmonisation'], s: ['sinónimos bajo el nombre actual, sin perder el original', 'synonyms under the current name, keeping the original'], b: 3 },
    { f: 'dat', art: 'mClean', n: ['Depuración de registros', 'Record cleaning'], s: ['duplicados, (0, 0), centroides, precisión, fechas', 'duplicates, (0, 0), centroids, precision, dates'], b: 3 },
    { f: 'dat', art: 'mWild', n: ['Silvestre contra cultivado', 'Wild versus cultivated'], s: ['por medio de establecimiento y por palabras clave', 'by establishment means and by keywords'], b: 3 },
    { f: 'esp', art: 'mHyper', n: ['Coocurrencia probabilística', 'Probabilistic co-occurrence'], s: ['prueba hipergeométrica exacta (Veech 2013)', 'exact hypergeometric test (Veech 2013)'], b: 5 },
    { f: 'esp', art: 'mGrid', n: ['Similitud por celdas', 'Similarity by cells'], s: ['Jaccard, Sørensen, Simpson y cobertura', 'Jaccard, Sørensen, Simpson and cover'], b: 5 },
    { f: 'esp', art: 'mNN', n: ['Distancia al vecino más cercano', 'Nearest-neighbour distance'], s: ['contra un nulo del grupo objetivo', 'against a target-group null'], b: 5 },
    { f: 'esp', art: 'mHull', n: ['Solapamiento de áreas', 'Range overlap'], s: ['envolventes convexas y área en la esfera', 'convex hulls and area on the sphere'], b: 5 },
    { f: 'tie', art: 'mCircular', n: ['Estadística circular', 'Circular statistics'], s: ['fecha media, R̄, Rayleigh y Watson–Williams', 'mean date, R̄, Rayleigh and Watson–Williams'], b: 6 },
    { f: 'tie', art: 'mPhenoOverlap', n: ['Solapamiento fenológico', 'Phenological overlap'], s: ['D, I y Pianka mes a mes, corregidos por esfuerzo', 'D, I and Pianka month by month, effort-corrected'], b: 6 },
    { f: 'tie', art: 'mElev', n: ['Solapamiento altitudinal', 'Elevational overlap'], s: ['densidades de kernel a lo largo del gradiente', 'kernel densities along the gradient'], b: 6 },
    { f: 'amb', art: 'mPcaEnv', n: ['ACP del ambiente', 'PCA of the environment'], s: ['Broennimann et al. 2012', 'Broennimann et al. 2012'], b: 7 },
    { f: 'amb', art: 'mDI', n: ['D de Schoener e I de Warren', 'Schoener\'s D and Warren\'s I'], s: ['sobre densidades corregidas por el ambiente disponible', 'on densities corrected by the available environment'], b: 7 },
    { f: 'amb', art: 'mTests', n: ['Equivalencia y similitud de nicho', 'Niche equivalency and similarity'], s: ['pruebas por aleatorización (Warren et al. 2008)', 'randomisation tests (Warren et al. 2008)'], b: 7 },
    { f: 'amb', art: 'mEnvelope', n: ['Idoneidad ambiental', 'Environmental suitability'], s: ['envolvente, distancia de Mahalanobis y logística con fondo', 'envelope, Mahalanobis distance and background logistic'], b: 8 },
    { f: 'amb', art: 'mMismatch', n: ['Mapa de desajuste', 'Mismatch map'], s: ['planta sin polinizador potencial, hoy y en el futuro', 'plant without a potential pollinator, now and in the future'], b: 8 },
    { f: 'red', art: 'mNetwork', n: ['Red bipartita', 'Bipartite network'], s: ['conectancia, grado, fuerza e importancia de visitantes', 'connectance, degree, strength and visitor importance'], b: 9 },
    { f: 'red', art: 'mNodf', n: ['Anidamiento (NODF)', 'Nestedness (NODF)'], s: ['Almeida-Neto et al. 2008, contra modelos nulos', 'Almeida-Neto et al. 2008, against null models'], b: 9 },
    { f: 'red', art: 'mH2', n: ['Especialización H₂′ y d′', 'Specialisation H₂′ and d′'], s: ['Blüthgen et al. 2006', 'Blüthgen et al. 2006'], b: 9 },
    { f: 'red', art: 'mRarefy', n: ['Riqueza de visitantes', 'Visitor richness'], s: ['rarefacción, Chao1 y cobertura del muestreo', 'rarefaction, Chao1 and sampling coverage'], b: 9 },
  ];

  /* ---------------- data sources side by side ---------------- */
  const COMPARE = {
    cols: [['Registros de GBIF', 'GBIF records'], ['Tus registros de presencia', 'Your presence records'], ['Tus observaciones de visitas', 'Your visit observations'], ['Bases de interacciones', 'Interaction databases']],
    rows: [
      { t: ['Qué dicen', 'What they say'], v: [['el taxón estuvo en ese lugar y esa fecha', 'the taxon was at that place on that date'], ['lo mismo, con tu control de calidad', 'the same, with your own quality control'], ['este visitante tocó esta flor', 'this visitor touched this flower'], ['alguien publicó que A visita o poliniza a B', 'someone published that A visits or pollinates B']] },
      { t: ['Qué no dicen', 'What they do not say'], v: [['dónde no está; si interactúa', 'where it is absent; whether it interacts'], ['dónde no está', 'where it is absent'], ['si llevó o depositó polen', 'whether it carried or deposited pollen'], ['dónde, cuándo ni cuántas veces, casi nunca', 'where, when or how often, almost never']] },
      { t: ['Sesgo principal', 'Main bias'], v: [['esfuerzo desigual: ciudades y caminos', 'uneven effort: cities and roads'], ['tus sitios de trabajo', 'your field sites'], ['horas y sitios observados', 'hours and sites observed'], ['lo que se estudió y se digitalizó', 'what was studied and digitised']] },
      { t: ['Para qué sirven', 'What they are for'], v: [['oportunidad de interacción', 'opportunity for interaction'], ['oportunidad y verificación', 'opportunity and verification'], ['la red y la especialización', 'the network and specialisation'], ['contexto y comparación', 'context and comparison']] },
      { t: ['En la app', 'In the app'], v: [['✓ Bloques 2–8', '✓ Blocks 2–8'], ['✓ Bloques 2–8', '✓ Blocks 2–8'], ['✓ Bloque 9', '✓ Block 9'], ['✓ Bloques 2 y 9', '✓ Blocks 2 and 9']] },
    ],
  };

  /* ---------------- what it brings together ---------------- */
  const BRING = [
    { t: ['Un solo lugar', 'One place'], s: ['datos, depuración, espacio, tiempo, nicho y red encadenados: lo que sale de un bloque entra al siguiente', 'data, cleaning, space, time, niche and network chained: what leaves one block enters the next'], ic: '<path d="M4 12h16M12 4v16"/>' },
    { t: ['Métodos citados', 'Cited methods'], s: ['cada prueba lleva su publicación original, y el informe cita solo las que usaste', 'every test carries its original publication, and the report cites only those you used'], ic: '<path d="M4 5h16v14H4zM8 9h8M8 13h6"/>' },
    { t: ['Validado', 'Validated'], s: ['cada fórmula comprobada contra aritmética exacta, fórmulas cerradas o simulación en la página de pruebas', 'every formula checked against exact arithmetic, closed forms or simulation on the test page'], ic: '<path d="M5 12l5 5L20 7"/>' },
    { t: ['Escalas para leer', 'Scales to read by'], s: ['cada número lleva al lado la escala que dice si es bajo o alto, y el error más común', 'every number carries beside it the scale that says whether it is low or high, and the commonest mistake'], ic: '<path d="M4 18h16M6 14v4M10 10v8M14 6v12M18 12v6"/>' },
    { t: ['Figuras editables', 'Editable figures'], s: ['paleta, tipografía y fondo de toda la app en un panel, y cada figura con su propio editor ✎ de textos, colores y tamaños; exportación hasta 900 ppp', 'palette, font and background of the whole app in one panel, and every figure with its own ✎ editor of texts, colours and sizes; export up to 900 dpi'], ic: '<circle cx="12" cy="12" r="8"/><circle cx="9" cy="10" r="1.2"/><circle cx="14" cy="8.5" r="1.2"/><circle cx="15" cy="13" r="1.2"/>' },
    { t: ['Sin instalar nada', 'Nothing to install'], s: ['abre con doble clic; solo la descarga de GBIF necesita internet y tus datos no salen de tu equipo', 'opens with a double click; only the GBIF download needs the internet and your data never leave your computer'], ic: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>' },
  ];

  /* ---------------- references ---------------- */
  const RFAM = { all: ['Todas', 'All'], dat: ['Datos y calidad', 'Data and quality'], esp: ['Espacio', 'Space'], tie: ['Tiempo', 'Time'], amb: ['Nicho', 'Niche'], red: ['Redes y diversidad', 'Networks and diversity'], bio: ['Cultivos y polinizadores', 'Crops and pollinators'], num: ['Métodos numéricos', 'Numerical methods'] };
  /* [family, key as cited in the app, full reference] */
  const REFS = [
    ['amb', 'Allouche et al. 2006', 'Allouche, O., Tsoar, A., & Kadmon, R. (2006). Assessing the accuracy of species distribution models: prevalence, kappa and the true skill statistic (TSS). <i>Journal of Applied Ecology</i>, 43(6), 1223–1232.'],
    ['amb', 'Elith et al. 2010', 'Elith, J., Kearney, M., & Phillips, S. (2010). The art of modelling range-shifting species. <i>Methods in Ecology and Evolution</i>, 1(4), 330–342.'],
    ['amb', 'Elith et al. 2011', 'Elith, J., Phillips, S. J., Hastie, T., Dudík, M., Chee, Y. E., & Yates, C. J. (2011). A statistical explanation of MaxEnt for ecologists. <i>Diversity and Distributions</i>, 17(1), 43–57.'],
    ['amb', 'Farber & Kadmon 2003', 'Farber, O., & Kadmon, R. (2003). Assessment of alternative approaches for bioclimatic modeling with special emphasis on the Mahalanobis distance. <i>Ecological Modelling</i>, 160(1–2), 115–130.'],
    ['amb', 'Kerr et al. 2015', 'Kerr, J. T., Pindar, A., Galpern, P., Packer, L., Potts, S. G., Roberts, S. M., Rasmont, P., Schweiger, O., Colla, S. R., Richardson, L. L., Wagner, D. L., Gall, L. F., Sikes, D. S., & Pantoja, A. (2015). Climate change impacts on bumblebees converge across continents. <i>Science</i>, 349(6244), 177–180.'],
    ['amb', 'Liu et al. 2005', 'Liu, C., Berry, P. M., Dawson, T. P., & Pearson, R. G. (2005). Selecting thresholds of occurrence in the prediction of species distributions. <i>Ecography</i>, 28(3), 385–393.'],
    ['amb', 'Lobo et al. 2008', 'Lobo, J. M., Jiménez-Valverde, A., & Real, R. (2008). AUC: a misleading measure of the performance of predictive distribution models. <i>Global Ecology and Biogeography</i>, 17(2), 145–151.'],
    ['amb', 'Nix 1986', 'Nix, H. A. (1986). A biogeographic analysis of Australian elapid snakes. En R. Longmore (Ed.), <i>Atlas of elapid snakes of Australia</i> (pp. 4–15). Bureau of Flora and Fauna.'],
    ['amb', 'Schweiger et al. 2008', 'Schweiger, O., Settele, J., Kudrna, O., Klotz, S., & Kühn, I. (2008). Climate change can cause spatial mismatch of trophically interacting species. <i>Ecology</i>, 89(12), 3472–3479.'],
    ['amb', 'Swets 1988', 'Swets, J. A. (1988). Measuring the accuracy of diagnostic systems. <i>Science</i>, 240(4857), 1285–1293.'],
    ['red', 'Almeida-Neto et al. 2008', 'Almeida-Neto, M., Guimarães, P., Guimarães, P. R., Jr., Loyola, R. D., & Ulrich, W. (2008). A consistent metric for nestedness analysis in ecological systems: reconciling concept and measurement. <i>Oikos</i>, 117(8), 1227–1239.'],
    ['red', 'Barber 2007', 'Barber, M. J. (2007). Modularity and community detection in bipartite networks. <i>Physical Review E</i>, 76(6), 066102.'],
    ['red', 'Bascompte et al. 2003', 'Bascompte, J., Jordano, P., Melián, C. J., & Olesen, J. M. (2003). The nested assembly of plant–animal mutualistic networks. <i>Proceedings of the National Academy of Sciences</i>, 100(16), 9383–9387.'],
    ['red', 'Bascompte et al. 2006', 'Bascompte, J., Jordano, P., & Olesen, J. M. (2006). Asymmetric coevolutionary networks facilitate biodiversity maintenance. <i>Science</i>, 312(5772), 431–433.'],
    ['red', 'Beckett 2016', 'Beckett, S. J. (2016). Improved community detection in weighted bipartite networks. <i>Royal Society Open Science</i>, 3(1), 140536.'],
    ['red', 'Blüthgen et al. 2006', 'Blüthgen, N., Menzel, F., & Blüthgen, N. (2006). Measuring specialization in species interaction networks. <i>BMC Ecology</i>, 6, 9.'],
    ['red', 'Chacoff et al. 2012', 'Chacoff, N. P., Vázquez, D. P., Lomáscolo, S. B., Stevani, E. L., Dorado, J., & Padrón, B. (2012). Evaluating sampling completeness in a desert plant–pollinator network. <i>Journal of Animal Ecology</i>, 81(1), 190–200.'],
    ['red', 'Jordano 1987', 'Jordano, P. (1987). Patterns of mutualistic interactions in pollination and seed dispersal: connectance, dependence asymmetries, and coevolution. <i>The American Naturalist</i>, 129(5), 657–677.'],
    ['red', 'Liu & Murata 2010', 'Liu, X., & Murata, T. (2010). An efficient algorithm for optimizing bipartite modularity in bipartite networks. <i>Journal of Advanced Computational Intelligence and Intelligent Informatics</i>, 14(4), 408–415.'],
    ['red', 'Patefield 1981', 'Patefield, W. M. (1981). An efficient method of generating random R × C tables with given row and column totals. <i>Applied Statistics</i>, 30(1), 91–97.'],
    ['red', 'Strona et al. 2014', 'Strona, G., Nappo, D., Boccacci, F., Fattorini, S., & San-Miguel-Ayanz, J. (2014). A fast and unbiased procedure to randomize ecological binary matrices with fixed row and column totals. <i>Nature Communications</i>, 5, 4114.'],
    ['num', 'Andrew 1979', 'Andrew, A. M. (1979). Another efficient algorithm for convex hulls in two dimensions. <i>Information Processing Letters</i>, 9(5), 216–219.'],
    ['esp', 'Baselga 2010', 'Baselga, A. (2010). Partitioning the turnover and nestedness components of beta diversity. <i>Global Ecology and Biogeography</i>, 19(1), 134–143.'],
    ['tie', 'Batschelet 1981', 'Batschelet, E. (1981). <i>Circular statistics in biology</i>. Academic Press.'],
    ['dat', 'Beck et al. 2014', 'Beck, J., Böller, M., Erhardt, A., & Schwanghart, W. (2014). Spatial bias in the GBIF database and its effect on modeling species\' geographic distributions. <i>Ecological Informatics</i>, 19, 10–15.'],
    ['num', 'Benjamini & Hochberg 1995', 'Benjamini, Y., & Hochberg, Y. (1995). Controlling the false discovery rate: a practical and powerful approach to multiple testing. <i>Journal of the Royal Statistical Society B</i>, 57(1), 289–300.'],
    ['esp', 'Blanchet et al. 2020', 'Blanchet, F. G., Cazelles, K., & Gravel, D. (2020). Co-occurrence is not evidence of ecological interactions. <i>Ecology Letters</i>, 23(7), 1050–1063.'],
    ['amb', 'Broennimann et al. 2012', 'Broennimann, O., Fitzpatrick, M. C., Pearman, P. B., Petitpierre, B., Pellissier, L., Yoccoz, N. G., Thuiller, W., Fortin, M.-J., Randin, C., Zimmermann, N. E., Graham, C. H., & Guisan, A. (2012). Measuring ecological niche overlap from occurrence and spatial environmental data. <i>Global Ecology and Biogeography</i>, 21(4), 481–497.'],
    ['num', 'Chamberlain & Duquette 2007', 'Chamberlain, R. G., & Duquette, W. H. (2007). <i>Some algorithms for polygons on a sphere</i> (JPL Publication 07-03). Jet Propulsion Laboratory.'],
    ['red', 'Chao 1987', 'Chao, A. (1987). Estimating the population size for capture–recapture data with unequal catchability. <i>Biometrics</i>, 43(4), 783–791.'],
    ['num', 'Davison & Hinkley 1997', 'Davison, A. C., & Hinkley, D. V. (1997). <i>Bootstrap methods and their application</i>. Cambridge University Press.'],
    ['dat', 'Chapman 2005', 'Chapman, A. D. (2005). <i>Principles and methods of data cleaning: primary species and species-occurrence data</i> (version 1.0). Global Biodiversity Information Facility.'],
    ['esp', 'Dormann et al. 2018', 'Dormann, C. F., Bobrowski, M., Dehling, D. M., Harris, D. J., Hartig, F., Lischke, H., Moretti, M. D., Pagel, J., Pinkert, S., Schleuning, M., Schmidt, S. I., Sheppard, C. S., Steinbauer, M. J., Zeuss, D., & Kraan, C. (2018). Biotic interactions in species distribution modelling: 10 questions to guide interpretation and avoid false conclusions. <i>Global Ecology and Biogeography</i>, 27(9), 1004–1016.'],
    ['tie', 'Fisher 1993', 'Fisher, N. I. (1993). <i>Statistical analysis of circular data</i>. Cambridge University Press.'],
    ['bio', 'Freitas et al. 2023', 'Freitas, F. V., Branstetter, M. G., Franceschini-Santos, V. H., Dorchin, A., Wright, K. W., López-Uribe, M. M., Griswold, T., Silveira, F. A., & Almeida, E. A. B. (2023). UCE phylogenomics, biogeography, and classification of long-horned bees (Hymenoptera: Apidae: Eucerini), with insights on using specimens with extremely degraded DNA. <i>Insect Systematics and Diversity</i>, 7(4), 3.'],
    ['esp', 'Gotelli 2000', 'Gotelli, N. J. (2000). Null model analysis of species co-occurrence patterns. <i>Ecology</i>, 81(9), 2606–2621.'],
    ['dat', 'Graham et al. 2004', 'Graham, C. H., Ferrier, S., Huettman, F., Moritz, C., & Peterson, A. T. (2004). New developments in museum-based informatics and applications in biodiversity analysis. <i>Trends in Ecology & Evolution</i>, 19(9), 497–503.'],
    ['bio', 'Hurd & Linsley 1964', 'Hurd, P. D., Jr., & Linsley, E. G. (1964). The squash and gourd bees — genera <i>Peponapis</i> Robertson and <i>Xenoglossa</i> Smith — inhabiting America north of Mexico (Hymenoptera: Apoidea). <i>Hilgardia</i>, 35(15), 375–477.'],
    ['red', 'Hurlbert 1971', 'Hurlbert, S. H. (1971). The nonconcept of species diversity: a critique and alternative parameters. <i>Ecology</i>, 52(4), 577–586.'],
    ['tie', 'Hurlbert 1978', 'Hurlbert, S. H. (1978). The measurement of niche overlap and some relatives. <i>Ecology</i>, 59(1), 67–77.'],
    ['esp', 'Jaccard 1912', 'Jaccard, P. (1912). The distribution of the flora in the alpine zone. <i>New Phytologist</i>, 11(2), 37–50.'],
    ['dat', 'Kramer-Schadt et al. 2013', 'Kramer-Schadt, S., Niedballa, J., Pilgrim, J. D., Schröder, B., Lindenborn, J., Reinfelder, V., Stillfried, M., Heckmann, I., Scharf, A. K., Augeri, D. M., Cheyne, S. M., Hearn, A. J., Ross, J., Macdonald, D. W., Mathai, J., Eaton, J., Marshall, A. J., Semiadi, G., Rustam, R., … Wilting, A. (2013). The importance of correcting for sampling bias in MaxEnt species distribution models. <i>Diversity and Distributions</i>, 19(11), 1366–1379.'],
    ['tie', 'Levins 1968', 'Levins, R. (1968). <i>Evolution in changing environments</i>. Princeton University Press.'],
    ['bio', 'Klein et al. 2007', 'Klein, A.-M., Vaissière, B. E., Cane, J. H., Steffan-Dewenter, I., Cunningham, S. A., Kremen, C., & Tscharntke, T. (2007). Importance of pollinators in changing landscapes for world crops. <i>Proceedings of the Royal Society B</i>, 274(1608), 303–313.'],
    ['bio', 'Lira-Saade 1996', 'Lira-Saade, R. (1996). <i>Chayote. Sechium edule (Jacq.) Sw.</i> Promoting the conservation and use of underutilized and neglected crops 8. International Plant Genetic Resources Institute.'],
    ['tie', 'Mardia 1972', 'Mardia, K. V. (1972). <i>Statistics of directional data</i>. Academic Press.'],
    ['tie', 'Morellato et al. 2010', 'Morellato, L. P. C., Alberti, L. F., & Hudson, I. L. (2010). Applications of circular statistics in plant phenology: a case studies approach. En I. L. Hudson & M. R. Keatley (Eds.), <i>Phenological research</i> (pp. 339–359). Springer.'],
    ['dat', 'Phillips et al. 2009', 'Phillips, S. J., Dudík, M., Elith, J., Graham, C. H., Lehmann, A., Leathwick, J., & Ferrier, S. (2009). Sample selection bias and presence-only distribution models: implications for background and pseudo-absence data. <i>Ecological Applications</i>, 19(1), 181–197.'],
    ['tie', 'Pianka 1973', 'Pianka, E. R. (1973). The structure of lizard communities. <i>Annual Review of Ecology and Systematics</i>, 4, 53–74.'],
    ['num', 'Press et al. 2007', 'Press, W. H., Teukolsky, S. A., Vetterling, W. T., & Flannery, B. P. (2007). <i>Numerical recipes: the art of scientific computing</i> (3.ª ed.). Cambridge University Press.'],
    ['amb', 'Rödder & Engler 2011', 'Rödder, D., & Engler, J. O. (2011). Quantitative metrics of overlaps in Grinnellian niches: advances and possible drawbacks. <i>Global Ecology and Biogeography</i>, 20(6), 915–927.'],
    ['dat', 'Sandve et al. 2013', 'Sandve, G. K., Nekrutenko, A., Taylor, J., & Hovig, E. (2013). Ten simple rules for reproducible computational research. <i>PLoS Computational Biology</i>, 9(10), e1003285.'],
    ['amb', 'Schoener 1968', 'Schoener, T. W. (1968). The <i>Anolis</i> lizards of Bimini: resource partitioning in a complex fauna. <i>Ecology</i>, 49(4), 704–726.'],
    ['num', 'Silverman 1986', 'Silverman, B. W. (1986). <i>Density estimation for statistics and data analysis</i>. Chapman & Hall.'],
    ['num', 'Sutherland & Hodgman 1974', 'Sutherland, I. E., & Hodgman, G. W. (1974). Reentrant polygon clipping. <i>Communications of the ACM</i>, 17(1), 32–42.'],
    ['esp', 'Veech 2013', 'Veech, J. A. (2013). A probabilistic model for analysing species co-occurrence. <i>Global Ecology and Biogeography</i>, 22(2), 252–260.'],
    ['amb', 'Warren et al. 2008', 'Warren, D. L., Glor, R. E., & Turelli, M. (2008). Environmental niche equivalency versus conservatism: quantitative approaches to niche evolution. <i>Evolution</i>, 62(11), 2868–2883.'],
    ['dat', 'Wilkinson et al. 2016', 'Wilkinson, M. D., Dumontier, M., Aalbersberg, I. J., et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. <i>Scientific Data</i>, 3, 160018.'],
    ['tie', 'Zar 2010', 'Zar, J. H. (2010). <i>Biostatistical analysis</i> (5.ª ed.). Pearson Prentice Hall.'],
    ['dat', 'Zizka et al. 2020', 'Zizka, A., Antunes Carvalho, F., Calvente, A., Baez-Lizarazo, M. R., Cabral, A., Coelho, J. F. R., Colli-Silva, M., Fantinati, M. R., Fernandes, M. F., Ferreira-Araújo, T., Moreira, F. G. L., Santos, N. M. C., Santos, T. A. B., dos Santos-Costa, R. C., Serrano, F. C., da Silva, A. P. A., de Souza Soares, A., de Souza, P. G. C., Tomaz, E. C., … Antonelli, A. (2020). No one-size-fits-all solution to clean GBIF. <i>PeerJ</i>, 8, e9916.'],
  ];

  /* ---------------- rendering ---------------- */
  const two = p => L2(p[0], p[1]);

  function renderStepper() {
    const nav = el('stepper'); if (!nav) return;
    nav.innerHTML = STEPS.map(s => `<button class="step-btn${s.n === 1 ? ' active' : ''}" data-step="${s.n}"${s.ready ? '' : ' disabled'}><span class="step-num">${s.n}</span>${two([s.es, s.en])}</button>`).join('');
  }
  function renderFeatures() {
    const g = el('featureGrid'); if (!g) return;
    g.innerHTML = BLOCKS.map(b => {
      const ready = STEPS.find(s => s.n === b.n).ready;
      return `<div class="feature" data-step="${b.n}"><div class="f-num">${b.n}</div><div class="f-art">${Art[b.art]()}</div>
        <span class="f-tag">${two(b.tag)}${ready ? '' : `<span class="f-soon">${L2('próximamente', 'coming soon')}</span>`}</span><h3>${two(b.t)}</h3><p>${two(b.d)}</p></div>`;
    }).join('');
    if (g.dataset.wired) return;
    g.dataset.wired = '1';
    g.addEventListener('click', e => {
      const f = e.target.closest('.feature'); if (!f) return;
      const n = f.dataset.step;
      const btn = document.querySelector(`.step-btn[data-step="${n}"]`);
      if (btn && !btn.disabled) goStep(n);
      else notSoon(n);
    });
  }
  function notSoon(n) {
    const m = el('homeMessages'); if (!m) return;
    clearMessages(m);
    showMessage(m, 'info', L2(`El Bloque ${n} llega en la siguiente etapa de construcción. Mientras tanto, los laboratorios de esta página ya calculan con el motor completo.`, `Block ${n} arrives in the next stage of construction. Meanwhile, the laboratories on this page already compute with the complete engine.`));
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function renderQuestions() {
    const g = el('questionStrip'); if (!g) return;
    g.innerHTML = QUESTIONS.map(m => `<div class="material">${Art[m.art]()}<div class="mt-t">${two(m.t)}</div><div class="mt-s">${two(m.s)}</div><span class="mt-k ${m.kc}">${two(m.k)}</span></div>`).join('');
  }
  let methodFilter = 'all';
  function renderMethods() {
    const f = el('methodFilter'), g = el('methodGallery'); if (!g) return;
    if (f && !f.dataset.ready) {
      f.dataset.ready = '1';
      f.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; methodFilter = b.dataset.fam; renderMethods(); });
    }
    if (f) f.innerHTML = Object.keys(FAMS).map(k => `<button class="chip${k === methodFilter ? ' on' : ''}" data-fam="${k}">${two(FAMS[k])}</button>`).join('');
    g.innerHTML = METHODS.filter(m => methodFilter === 'all' || m.f === methodFilter).map(m =>
      `<div class="method-card"><span class="m-fam ${m.f}">${two(FAMS[m.f])}</span>${Art[m.art]()}<div class="m-name">${two(m.n)}</div><div class="m-sub">${two(m.s)} · ${L2('Bloque', 'Block')} ${m.b}</div></div>`).join('');
  }
  function renderCompare() {
    const box = el('sourceCompare'); if (!box) return;
    box.innerHTML = `<table><thead><tr><th></th>${COMPARE.cols.map(c => `<th>${two(c)}</th>`).join('')}</tr></thead><tbody>` +
      COMPARE.rows.map(r => `<tr><td>${two(r.t)}</td>${r.v.map(v => `<td>${two(v)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
  }
  function renderBring() {
    const g = el('bringGrid'); if (!g) return;
    g.innerHTML = BRING.map(b => `<div class="bring"><div class="b-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${b.ic}</svg></div><div><b>${two(b.t)}</b><span>${two(b.s)}</span></div></div>`).join('');
  }
  let refFilter = 'all';
  function renderRefs() {
    const f = el('refFilter'), g = el('refList'); if (!g) return;
    if (f && !f.dataset.ready) {
      f.dataset.ready = '1';
      f.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; refFilter = b.dataset.fam; renderRefs(); });
    }
    if (f) f.innerHTML = Object.keys(RFAM).map(k => `<button class="chip${k === refFilter ? ' on' : ''}" data-fam="${k}">${two(RFAM[k])}</button>`).join('');
    g.innerHTML = REFS.filter(r => refFilter === 'all' || r[0] === refFilter).map(r => `<li>${r[2]}</li>`).join('');
  }
  /* illustrations that contain translated labels are redrawn when the language changes */
  function renderArt() {
    const h = el('heroArt'); if (h) h.innerHTML = Art.hero();
    const figs = { theoryEvidenceFig: 'figEvidence', theoryBiasFig: 'figBias' };
    for (const id in figs) {
      const n = el(id);
      if (n) { const cap = n.querySelector('.cap'); n.innerHTML = Art[figs[id]](); if (cap) n.appendChild(cap); }
    }
    const b = el('brandLogo'); if (b) b.innerHTML = Art.logo();
    els('.soon-art').forEach(n => { n.innerHTML = Art.soon(); });
  }

  function wire() {
    const nav = el('stepper');
    if (nav) nav.addEventListener('click', e => { const b = e.target.closest('.step-btn'); if (b && !b.disabled) goStep(b.dataset.step); });
    const brand = el('brand'); if (brand) brand.addEventListener('click', () => goStep(1));
    const scrollTo = id => { const n = el(id); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const on = (id, fn) => { const n = el(id); if (n) n.addEventListener('click', fn); };
    on('startBtn', () => {
      const b = document.querySelector('.step-btn[data-step="2"]');
      if (b && !b.disabled) goStep(2); else notSoon(2);
    });
    on('simBtn', () => scrollTo('labs'));
    on('theoryBtn', () => { scrollTo('theory'); const first = document.querySelector('#theory + .section-sub + .theory-card .acc'); if (first) first.open = true; });
    on('citeBtn', () => scrollTo('cite'));
    on('copyCite', () => {
      const t = el('citeText'); if (!t || !navigator.clipboard) return;
      const txt = [...t.querySelectorAll('[data-l="' + I18N.lang + '"]')].map(n => n.textContent).join('') || t.textContent;
      navigator.clipboard.writeText(txt.trim()).then(() => { const b = el('copyCite'); if (b) { b.textContent = T('✓ Copiada', '✓ Copied'); setTimeout(() => I18N.apply(b.parentNode), 1800); } });
    });
    els('[data-goto]').forEach(n => n.addEventListener('click', () => { const s = n.dataset.goto; const b = document.querySelector(`.step-btn[data-step="${s}"]`); if (b && !b.disabled) goStep(s); else notSoon(s); }));
    const redraw = () => { renderArt(); renderFeatures(); renderQuestions(); renderMethods(); renderCompare(); renderBring(); renderRefs(); Fig.decorate(); };
    document.addEventListener('langchange', redraw);
    document.addEventListener('themechange', renderArt);
  }

  function init() {
    renderStepper(); renderArt(); renderFeatures(); renderQuestions(); renderMethods(); renderCompare(); renderBring(); renderRefs(); wire();
    I18N.apply();
    Fig.decorate();
  }
  document.addEventListener('DOMContentLoaded', init);
  window.Home = { BLOCKS, METHODS, REFS, QUESTIONS, COMPARE, FAMS };
})();
