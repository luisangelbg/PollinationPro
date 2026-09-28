/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — the catalogue of the interpretation help.

   One entry per concept or number the app prints: what it measures, how it
   is read, the scale that places a value (flagged as a convention when it is
   one) and the mistake most often made with it. The references are short
   citations; the full list is on the home page. */

(function () {
  const E = Help.add, S = Help.S;

  /* =====================================================================
     the ideas the whole app rests on
     ===================================================================== */

  E('occurrence', {
    t: ['Registro de presencia', 'Occurrence record'],
    what: ['Una especie vista (o colectada) en un lugar y una fecha: un ejemplar de herbario o de colección entomológica, una fotografía verificada, una observación de campo. Dice <b>dónde estuvo</b> la especie, nunca dónde no está: la falta de registros en una región puede ser ausencia real o simplemente que nadie fue a buscar.',
      'A species seen (or collected) at a place and a date: a herbarium or insect-collection specimen, a verified photograph, a field observation. It says <b>where the species was</b>, never where it is not: the lack of records in a region may be real absence or simply that nobody went looking.'],
    read: ['Cada registro trae coordenadas, fecha, tipo de evidencia e institución. Los de GBIF reúnen cientos de colecciones con estándares distintos: por eso la app los depura (Bloque 3) antes de cualquier análisis, y por eso cada resultado se lee como <b>hipótesis a verificar en campo</b>.',
      'Each record carries coordinates, date, type of evidence and institution. GBIF\'s gather hundreds of collections with different standards: that is why the app cleans them (Block 3) before any analysis, and why every result is read as a <b>hypothesis to verify in the field</b>.'],
    care: ['El número de registros mide el <b>esfuerzo de muestreo</b>, no la abundancia. Un estado con 400 registros de abejas y otro con 12 no dicen que haya más abejas en el primero: dicen que ahí hay más entomólogos, más caminos o más ciencia ciudadana.',
      'The number of records measures <b>sampling effort</b>, not abundance. A state with 400 bee records and another with 12 do not say there are more bees in the first: they say there are more entomologists, more roads or more citizen science there.'],
    ref: 'Graham et al. 2004; Beck et al. 2014',
  });

  E('cooccurnotinteraction', {
    t: ['Coocurrir no es interactuar', 'Co-occurring is not interacting'],
    what: ['Que una planta y una abeja tengan registros en la misma celda del mapa, en los mismos meses y en climas parecidos es una condición <b>necesaria</b> para que la abeja la visite, pero no <b>suficiente</b>. La abeja puede no usar esa flor, visitarla solo por néctar sin llevar polen, o estar ahí por otras plantas.',
      'That a plant and a bee have records in the same map cell, in the same months and in similar climates is a <b>necessary</b> condition for the bee to visit it, but not a <b>sufficient</b> one. The bee may not use that flower, visit it only for nectar without carrying pollen, or be there for other plants.'],
    read: ['Los Bloques 5 a 8 miden <b>oportunidad de interacción</b>: dónde, cuándo y en qué ambientes es posible. El Bloque 9 trabaja con interacciones <b>observadas</b> (tus registros de visitas y las bases de interacciones). Un artículo sólido usa lo primero para delimitar y priorizar, y lo segundo para afirmar.',
      'Blocks 5 to 8 measure <b>opportunity for interaction</b>: where, when and in what environments it is possible. Block 9 works with <b>observed</b> interactions (your visit records and the interaction databases). A sound paper uses the former to delimit and prioritise, and the latter to assert.'],
    care: ['La frase que un revisor tachará: «la especie X es polinizador de Y porque sus distribuciones se solapan». La frase correcta: «X y Y se solapan en el espacio, el tiempo y el nicho climático, lo que la hace un polinizador potencial a confirmar con observaciones de visitas y de carga de polen».',
      'The sentence a reviewer will strike out: "species X is a pollinator of Y because their distributions overlap". The correct one: "X and Y overlap in space, time and climatic niche, which makes X a potential pollinator to be confirmed with observations of visits and pollen loads".'],
    ref: 'Blanchet et al. 2020; Dormann et al. 2018',
  });

  E('samplingbias', {
    t: ['Sesgo de muestreo', 'Sampling bias'],
    what: ['Los registros se amontonan cerca de ciudades, carreteras, universidades y áreas protegidas. Si la planta y la abeja se registraron más donde se muestrea más, parecerán asociadas aunque no lo estén: las dos siguen al mismo muestreador.',
      'Records pile up near cities, roads, universities and protected areas. If the plant and the bee were recorded more where more sampling happens, they will look associated even if they are not: both follow the same sampler.'],
    read: ['La corrección que usa la app es el <b>grupo objetivo</b> (Phillips et al. 2009): el universo de sitios del modelo nulo no es todo el mapa sino las celdas donde alguien registró <i>cualquier</i> taxón del estudio. Así, «coinciden más de lo esperado» significa «más de lo esperado <b>entre los sitios que sí se muestrearon</b>».',
      'The correction the app uses is the <b>target group</b> (Phillips et al. 2009): the universe of sites of the null model is not the whole map but the cells where someone recorded <i>any</i> taxon of the study. So "they co-occur more than expected" means "more than expected <b>among the sites that were actually sampled</b>".'],
    care: ['Sin esa corrección casi todos los pares salen «positivos»: el laboratorio de la portada lo muestra con un paisaje virtual. Revisa siempre en el informe con qué universo de sitios se calculó.',
      'Without that correction almost every pair comes out "positive": the home-page laboratory shows it with a virtual landscape. Always check in the report which universe of sites was used.'],
    ref: 'Phillips et al. 2009; Kramer-Schadt et al. 2013',
  });

  E('hypergeo', {
    t: ['Modelo probabilístico de coocurrencia', 'Probabilistic co-occurrence model'],
    what: ['Si la planta ocupa N₁ de N sitios y el polinizador N₂, y se colocaran al azar uno respecto del otro, el número de sitios compartidos seguiría la distribución hipergeométrica, con media N₁·N₂/N. La app calcula la probabilidad de observar <b>tan pocos o menos</b> (asociación negativa) y <b>tantos o más</b> (positiva).',
      'If the plant occupies N₁ of N sites and the pollinator N₂, and they were placed at random with respect to each other, the number of shared sites would follow the hypergeometric distribution, with mean N₁·N₂/N. The app computes the probability of observing <b>as few or fewer</b> (negative association) and <b>as many or more</b> (positive).'],
    read: ['Es la prueba exacta de Veech (2013), sin simulaciones ni supuestos de normalidad. Los pares cuyo número esperado de sitios compartidos es menor que uno se dejan <b>sin clasificar</b>: con tan pocos datos ninguna conclusión es posible. Cuando se prueban muchos pares, la app ajusta los valores p por tasa de falsos descubrimientos.',
      'It is Veech\'s (2013) exact test, with no simulation and no normality assumption. Pairs whose expected number of shared sites is under one are left <b>unclassified</b>: with so few data no conclusion is possible. When many pairs are tested the app adjusts the p-values for the false discovery rate.'],
    care: ['La conclusión depende del tamaño de la celda: con celdas de 1° casi todo coincide; con celdas de 1 km casi nada. Repite con dos o tres tamaños y reporta si el resultado se sostiene.',
      'The conclusion depends on the cell size: with 1° cells nearly everything coincides; with 1 km cells nearly nothing does. Repeat with two or three sizes and report whether the result holds.'],
    ref: 'Veech 2013',
  });

  E('ses', {
    t: ['Tamaño estandarizado del efecto (EEF)', 'Standardised effect size (SES)'],
    what: ['Cuántas desviaciones estándar se aleja lo observado de lo esperado por azar: (observado − esperado) / desviación estándar del modelo nulo. Positivo = más coincidencia de la esperada; negativo = menos.',
      'How many standard deviations the observed value lies from what chance predicts: (observed − expected) / standard deviation of the null model. Positive = more coincidence than expected; negative = less.'],
    read: ['Permite comparar pares con tamaños de muestra distintos, cosa que el valor p no hace. Por la aproximación normal, |EEF| > 1.96 corresponde más o menos a p < 0.05 a dos colas.',
      'It lets pairs with different sample sizes be compared, which the p-value does not. By the normal approximation, |SES| > 1.96 corresponds roughly to p < 0.05 two-sided.'],
    scaleTitle: ['EEF', 'SES'],
    scale: [
      S(null, -1.96, ['segregación', 'segregation'], 'warn', ['coinciden menos que al azar', 'they coincide less than by chance']),
      S(-1.96, 1.96, ['azar', 'chance'], 'ok', ['no distinguible del azar', 'not distinguishable from chance']),
      S(1.96, null, ['agregación', 'aggregation'], 'good', ['coinciden más que al azar', 'they coincide more than by chance']),
    ],
    conv: true,
    care: ['Con miles de celdas cualquier diferencia pequeña da un EEF enorme. Léelo junto con la magnitud: cuántos sitios compartidos de más.',
      'With thousands of cells any small difference yields a huge SES. Read it together with the magnitude: how many extra shared sites.'],
    ref: 'Gotelli 2000',
  });

  E('schoenerD', {
    t: ['D de Schoener', 'Schoener\'s D'],
    what: ['Solapamiento entre dos distribuciones (por meses, por celdas, por ambientes): 1 − ½ Σ|p₁ − p₂|. Vale 0 cuando no comparten nada y 1 cuando son idénticas.',
      'Overlap between two distributions (over months, cells or environments): 1 − ½ Σ|p₁ − p₂|. It is 0 when they share nothing and 1 when they are identical.'],
    read: ['Es la medida estándar de solapamiento de nicho desde Warren et al. (2008) y Broennimann et al. (2012). La escala de abajo es la de Rödder y Engler (2011), muy usada para describir resultados.',
      'It is the standard niche-overlap measure since Warren et al. (2008) and Broennimann et al. (2012). The scale below is Rödder and Engler\'s (2011), widely used to describe results.'],
    scaleTitle: ['D', 'D'],
    scale: [
      S(0, 0.2, ['nulo o muy limitado', 'none or very limited'], 'bad'),
      S(0.2, 0.4, ['bajo', 'low'], 'warn'),
      S(0.4, 0.6, ['moderado', 'moderate'], 'ok'),
      S(0.6, 0.8, ['alto', 'high'], 'good'),
      S(0.8, null, ['muy alto', 'very high'], 'good'),
    ],
    conv: true,
    care: ['D depende de la resolución (cuántas clases o celdas) y de cómo se suaviza. Comparar un D de este estudio con otro de un artículo que usó otra rejilla no tiene sentido; compara siempre dentro del mismo análisis.',
      'D depends on the resolution (how many classes or cells) and on the smoothing. Comparing a D from this study with one from a paper that used another grid makes no sense; always compare within the same analysis.'],
    ref: 'Schoener 1968; Warren et al. 2008; Rödder & Engler 2011',
  });

  E('hellingerI', {
    t: ['I de Warren (Hellinger)', 'Warren\'s I (Hellinger)'],
    what: ['Otra medida de solapamiento, basada en la distancia de Hellinger: I = 1 − ½ Σ(√p₁ − √p₂)². También va de 0 a 1 y siempre es mayor o igual que D.',
      'Another overlap measure, based on the Hellinger distance: I = 1 − ½ Σ(√p₁ − √p₂)². It also runs from 0 to 1 and is always greater than or equal to D.'],
    read: ['Da menos peso a las diferencias en las colas de las distribuciones. Se reporta junto con D; si los dos cuentan la misma historia, el resultado es robusto.',
      'It weighs differences in the tails of the distributions less. It is reported alongside D; if both tell the same story, the result is robust.'],
    care: ['No uses la escala de D para I: al ser siempre mayor, un I de 0.6 no es «alto» en el mismo sentido que un D de 0.6.',
      'Do not use D\'s scale for I: since it is always larger, an I of 0.6 is not "high" in the same sense as a D of 0.6.'],
    ref: 'Warren et al. 2008',
  });

  E('pianka', {
    t: ['Índice de Pianka', 'Pianka\'s index'],
    what: ['Solapamiento simétrico de uso de recursos: O = Σp₁p₂ / √(Σp₁² Σp₂²). Es el coseno del ángulo entre los dos perfiles de uso.',
      'Symmetric resource-use overlap: O = Σp₁p₂ / √(Σp₁² Σp₂²). It is the cosine of the angle between the two use profiles.'],
    read: ['Muy usado en ecología de comunidades y de polinización para comparar perfiles fenológicos (meses) o de uso de flores. Se reporta con D para poder comparar con la literatura de nicho.',
      'Widely used in community and pollination ecology to compare phenological (monthly) or flower-use profiles. It is reported with D so it can be compared with the niche literature.'],
    ref: 'Pianka 1973',
  });

  E('jaccard', {
    t: ['Similitud de Jaccard y de Sørensen', 'Jaccard and Sørensen similarity'],
    what: ['Proporción de sitios compartidos: Jaccard = compartidos / (sitios de cualquiera de los dos); Sørensen = 2 · compartidos / (sitios de uno + sitios del otro). La de Simpson divide entre el taxón con menos sitios y no se castiga porque uno sea mucho más común.',
      'Proportion of shared sites: Jaccard = shared / (sites of either); Sørensen = 2 · shared / (sites of one + sites of the other). Simpson\'s divides by the taxon with fewer sites and is not penalised because one is much commoner.'],
    read: ['Para un polinizador y su planta, la pregunta útil suele ser asimétrica: <b>¿en qué fracción de los sitios de la planta está el polinizador?</b> La app la da como «cobertura».',
      'For a pollinator and its plant, the useful question is usually asymmetric: <b>in what fraction of the plant\'s sites is the pollinator?</b> The app gives it as "cover".'],
    care: ['Sin modelo nulo, un Jaccard de 0.3 no dice si es mucho o poco: depende de cuán comunes son los dos. Por eso la app acompaña cada índice con la prueba hipergeométrica.',
      'Without a null model, a Jaccard of 0.3 does not say whether it is a lot or a little: it depends on how common both are. That is why the app pairs every index with the hypergeometric test.'],
    ref: 'Jaccard 1912; Baselga 2010',
  });

  E('circular', {
    t: ['Estadística circular de fechas', 'Circular statistics of dates'],
    what: ['El año es un círculo: el 31 de diciembre y el 1 de enero están juntos. La fecha media se calcula como la dirección media de los días convertidos en ángulos, y <b>R̄</b> (longitud del vector medio, de 0 a 1) dice qué tan concentrados están los registros alrededor de esa fecha.',
      'The year is a circle: 31 December and 1 January are neighbours. The mean date is the mean direction of the days turned into angles, and <b>R̄</b> (length of the mean vector, from 0 to 1) says how concentrated the records are around that date.'],
    read: ['R̄ cercano a 1: la actividad o la floración ocurre en una ventana corta. Cercano a 0: todo el año, o dos picos opuestos que se anulan (revisa el histograma antes de concluir «no estacional»). La desviación estándar circular se da en días.',
      'R̄ near 1: activity or flowering happens in a short window. Near 0: all year round, or two opposite peaks that cancel out (check the histogram before concluding "aseasonal"). The circular standard deviation is given in days.'],
    scaleTitle: ['R̄ (estacionalidad)', 'R̄ (seasonality)'],
    scale: [
      S(0, 0.3, ['difusa', 'diffuse'], 'warn', ['casi todo el año o bimodal', 'nearly all year or bimodal']),
      S(0.3, 0.6, ['moderada', 'moderate'], 'ok'),
      S(0.6, null, ['marcada', 'marked'], 'good', ['una temporada definida', 'one defined season']),
    ],
    conv: true,
    care: ['La media aritmética de los meses (1 a 12) es un error clásico: una especie activa de noviembre a febrero tendría su «pico» en junio.',
      'The arithmetic mean of the months (1 to 12) is a classic mistake: a species active from November to February would have its "peak" in June.'],
    ref: 'Batschelet 1981; Zar 2010; Morellato et al. 2010',
  });

  E('rayleigh', {
    t: ['Prueba de Rayleigh', 'Rayleigh test'],
    what: ['¿Están las fechas concentradas en una parte del año, o repartidas al azar? La hipótesis nula es la uniformidad; Z = n·R̄².',
      'Are the dates concentrated in one part of the year, or spread at random? The null hypothesis is uniformity; Z = n·R̄².'],
    read: ['p < 0.05: hay estacionalidad significativa y la fecha media tiene sentido. p ≥ 0.05: no hay evidencia de estacionalidad y la fecha media no debe reportarse como «pico».',
      'p < 0.05: there is significant seasonality and the mean date is meaningful. p ≥ 0.05: there is no evidence of seasonality and the mean date should not be reported as a "peak".'],
    scaleTitle: ['p', 'p'],
    scale: [
      S(null, 0.001, ['muy estacional', 'strongly seasonal'], 'good'),
      S(0.001, 0.05, ['estacional', 'seasonal'], 'good'),
      S(0.05, null, ['sin evidencia', 'no evidence'], 'warn'),
    ],
    care: ['Detecta un solo pico. Una especie con dos floraciones al año puede dar p grande aunque sea muy estacional.',
      'It detects a single peak. A species with two flowerings a year can give a large p even though it is highly seasonal.'],
    ref: 'Zar 2010, cap. 27',
  });

  E('nicheoverlap', {
    t: ['Solapamiento de nicho ambiental', 'Environmental niche overlap'],
    what: ['Se compara en qué climas viven la planta y el polinizador, no dónde. Los ambientes de toda la región se resumen en dos ejes de componentes principales; en ese plano se estima la densidad de registros de cada taxón, corregida por lo que el ambiente ofrece, y se mide D.',
      'It compares in which climates the plant and the pollinator live, not where. The environments of the whole region are summarised on two principal-component axes; on that plane the density of records of each taxon is estimated, corrected by what the environment offers, and D is measured.'],
    read: ['Dos pruebas acompañan a D (Warren et al. 2008; Broennimann et al. 2012). <b>Equivalencia</b>: ¿son los dos nichos intercambiables? Se reparten los registros al azar entre los dos taxones muchas veces; si el D real es menor que casi todos los simulados, los nichos no son equivalentes. <b>Similitud</b>: ¿se parecen más de lo que se parecerían sus ambientes disponibles por sí solos?',
      'Two tests accompany D (Warren et al. 2008; Broennimann et al. 2012). <b>Equivalency</b>: are the two niches interchangeable? Records are shuffled between the two taxa many times; if the real D is smaller than almost all simulated ones, the niches are not equivalent. <b>Similarity</b>: are they more alike than their available environments alone would make them?'],
    care: ['Un nicho climático compartido es una condición para que la interacción persista ante el cambio climático; uno que no se comparte anticipa un <b>desajuste</b>: la planta podría quedarse sin su polinizador en parte de su área (Bloque 8).',
      'A shared climatic niche is a condition for the interaction to persist under climate change; an unshared one anticipates a <b>mismatch</b>: the plant could lose its pollinator in part of its range (Block 8).'],
    ref: 'Warren et al. 2008; Broennimann et al. 2012',
  });

  E('squashbees', {
    t: ['Las abejas de la calabaza: <i>Xenoglossa</i> y <i>Peponapis</i>', 'Squash bees: <i>Xenoglossa</i> and <i>Peponapis</i>'],
    what: ['Abejas solitarias de la tribu Eucerini especializadas en el polen de las cucurbitáceas, sobre todo de <i>Cucurbita</i>. En la clasificación filogenómica de Freitas et al. (2023), <i>Peponapis</i> pasa a ser subgénero de <i>Xenoglossa</i>: <i>Xenoglossa</i> (<i>Peponapis</i>).',
      'Solitary bees of the tribe Eucerini specialised in the pollen of cucurbits, above all <i>Cucurbita</i>. In the phylogenomic classification of Freitas et al. (2023), <i>Peponapis</i> becomes a subgenus of <i>Xenoglossa</i>: <i>Xenoglossa</i> (<i>Peponapis</i>).'],
    read: ['Muchas bases de datos, GBIF incluido, siguen aceptando <i>Peponapis</i> como género. La app busca los dos nombres y, si lo pides, los reúne bajo el nombre actual y guarda el original de cada registro, para que no se pierda ni se duplique nada.',
      'Many databases, GBIF included, still accept <i>Peponapis</i> as a genus. The app searches both names and, if asked, merges them under the current name while keeping each record\'s original one, so nothing is lost or duplicated.'],
    care: ['Que sean especialistas de <i>Cucurbita</i> hace de su relación con <i>Sechium</i> una pregunta abierta y atractiva, no un hecho: por eso vale la pena medir el solapamiento y buscar visitas registradas.',
      'That they are <i>Cucurbita</i> specialists makes their relationship with <i>Sechium</i> an open and attractive question, not a fact: that is why it is worth measuring the overlap and looking for recorded visits.'],
    ref: 'Hurd & Linsley 1964; Freitas et al. 2023',
  });

  E('wildcultivated', {
    t: ['Silvestre, cultivado y escapado', 'Wild, cultivated and escaped'],
    what: ['En casi cualquier cultivo, la mayoría de los registros de GBIF son plantas sembradas: parcelas, huertos, jardines, invernaderos. Su distribución refleja la agricultura, no el nicho natural. Las poblaciones silvestres y los parientes silvestres del cultivo (por ejemplo <i>Sechium edule</i> subsp. <i>sylvestre</i> frente al chayote de huerto, o las calabazas silvestres frente a las sembradas) son los que informan de la relación natural con sus polinizadores.',
      'In almost any crop, most GBIF records are planted individuals: fields, gardens, backyards, greenhouses. Their distribution reflects agriculture, not the natural niche. Wild populations and crop wild relatives (for instance <i>Sechium edule</i> subsp. <i>sylvestre</i> against garden chayote, or wild squashes against planted ones) are the ones that inform about the natural relationship with their pollinators.'],
    read: ['La app separa lo cultivado por el campo de «medios de establecimiento» (cuando existe) y por palabras en la localidad o las notas (cultivado, huerto, traspatio, mercado…). Revisa la lista de lo marcado antes de descartarlo.',
      'The app separates cultivated material by the "establishment means" field (when present) and by words in the locality or notes (cultivated, garden, backyard, market…). Review the flagged list before discarding it.'],
    care: ['Mezclar registros cultivados y silvestres infla la distribución de la planta hacia zonas donde se siembra, y con ella el solapamiento aparente con cualquier abeja de zonas agrícolas.',
      'Mixing cultivated and wild records inflates the plant\'s distribution towards areas where it is grown, and with it the apparent overlap with any bee of farming areas.'],
    ref: 'Klein et al. 2007; Lira-Saade 1996',
  });

  /* =====================================================================
     Block 3 · cleaning and taxonomy
     ===================================================================== */
  E('cleaning', {
    t: ['Depurar registros de presencia', 'Cleaning occurrence records'],
    what: ['Revisar cada registro contra reglas que detectan lo que no puede ser cierto (coordenadas imposibles o de relleno), lo dudoso (imprecisión, redondeo, fechas raras) y lo que no representa a la población que se estudia (fósiles, colecciones vivas, plantas sembradas). No hay una depuración correcta universal: depende de la pregunta, y por eso cada regla se elige.',
      'Checking every record against rules that detect what cannot be true (impossible or placeholder coordinates), what is doubtful (imprecision, rounding, odd dates) and what does not represent the population being studied (fossils, living collections, planted individuals). There is no universally correct cleaning: it depends on the question, which is why each rule is chosen.'],
    read: ['En estudios con datos de GBIF es común perder entre 20 y 60 % de los registros. Perder mucho no es malo: malo es no decir cuánto ni por qué. El reporte de este bloque da la frase para los métodos con cada número.',
      'In studies with GBIF data it is common to lose between 20 and 60 % of the records. Losing many is not bad: failing to say how many and why is. This block\'s report gives the sentence for the methods with every number.'],
    scaleTitle: ['Registros conservados', 'Records kept'],
    scale: [
      S(null, 0.3, ['revisa las reglas', 'review the rules'], 'warn', ['¿alguna quita de más?', 'is one removing too much?']),
      S(0.3, 0.8, ['habitual', 'usual'], 'good'),
      S(0.8, null, ['datos limpios o reglas laxas', 'clean data or lax rules'], 'ok'),
    ],
    conv: true,
    care: ['Depura antes de adelgazar o de agrupar en celdas, y nunca con la vista puesta en el resultado que quieres obtener.',
      'Clean before thinning or gridding, and never with an eye on the result you want to get.'],
    ref: 'Chapman 2005; Zizka et al. 2020',
  });
  E('centroidrule', {
    t: ['Centroides de país y de estado', 'Country and state centroids'],
    what: ['Cuando una colección solo sabe el país o el estado de un ejemplar, a veces le pone las coordenadas de su centro. Esos registros forman montones en un solo punto y fabrican «presencias» en lugares donde nadie colectó.',
      'When a collection only knows the country or state of a specimen, it sometimes gives it the coordinates of its centre. Those records pile up on a single point and fabricate "presences" where nobody collected.'],
    read: ['La app calcula los centros de cada país y de cada estado de México a partir de sus contornos, con dos definiciones que circulan como relleno: el centroide de área y el centro del rectángulo envolvente. El «centro de México» (23.63° N, 102.55° W) que aparece en muchas bases es el segundo.',
      'The app computes the centres of every country and every Mexican state from their outlines, with two definitions that circulate as placeholders: the area centroid and the centre of the bounding box. The "centre of Mexico" (23.63° N, 102.55° W) seen in many databases is the second.'],
    care: ['Un pueblo real puede estar a pocos kilómetros de un centroide. Con 5 km el riesgo es pequeño; revisa la lista de marcados antes de ampliar la distancia.',
      'A real town can lie a few kilometres from a centroid. At 5 km the risk is small; check the flagged list before widening the distance.'],
    ref: 'Chapman 2005; Zizka et al. 2020',
  });
  E('livingcoll', {
    t: ['Colecciones vivas', 'Living collections'],
    what: ['Registros de plantas en jardines botánicos, bancos de germoplasma de campo o colecciones de trabajo. Dicen dónde se conserva la planta, no dónde vive la población silvestre ni dónde la visitan sus polinizadores naturales.',
      'Records of plants in botanical gardens, field genebanks or working collections. They say where the plant is conserved, not where the wild population lives or where its natural pollinators visit it.'],
    care: ['Pueden ser muchos: una sola colección de campo con cientos de accesiones aparece como un punto muy denso. Si estudias el germoplasma, consérvalos; si estudias la distribución natural, quítalos.',
      'They can be many: a single field collection with hundreds of accessions shows up as a very dense point. If you study the germplasm, keep them; if you study the natural distribution, remove them.'],
  });
  E('unit', {
    t: ['Unidad de análisis', 'Unit of analysis'],
    what: ['Lo que los bloques siguientes comparan: las entradas de tu lista (un género como <i>Bombus</i> es una sola unidad que reúne a todas sus especies) o cada especie por separado.',
      'What the following blocks compare: the entries of your list (a genus such as <i>Bombus</i> is a single unit gathering all its species) or each species separately.'],
    read: ['Por entradas conviene cuando la pregunta es de grupo funcional («¿coinciden las abejas de la calabaza con la planta?») o cuando cada especie tiene pocos registros. Por especies, cuando las especies de un género difieren en área o temporada y quieres saber cuál coincide.',
      'By entries suits a functional-group question ("do the squash bees coincide with the plant?") or when each species has few records. By species, when the species of a genus differ in range or season and you want to know which one coincides.'],
    care: ['Con muy pocos registros por especie (menos de 10–15), los índices de solapamiento y las pruebas pierden potencia: une en la entrada.',
      'With very few records per species (under 10–15), overlap indices and tests lose power: merge into the entry.'],
  });

  /* =====================================================================
     Block 5 · spatial co-occurrence
     ===================================================================== */
  E('cellsize', {
    t: ['Tamaño de celda', 'Cell size'],
    what: ['La rejilla convierte puntos en sitios: dos registros «coinciden» si caen en la misma celda. El tamaño define la pregunta: con celdas de 0.1° (unos 11 km) se pregunta si comparten paisaje; con celdas de 1° (unos 110 km), si comparten región.',
      'The grid turns points into sites: two records "coincide" if they fall in the same cell. The size defines the question: with 0.1° cells (about 11 km) it asks whether they share a landscape; with 1° cells (about 110 km), whether they share a region.'],
    read: ['Una abeja solitaria forrajea a unos cientos de metros o pocos kilómetros de su nido; un abejorro, a varios kilómetros. Celdas de 0.1–0.25° están cerca de esa escala; celdas mayores miden más bien distribuciones que se solapan. La figura de sensibilidad repite la prueba con cinco tamaños: si el veredicto se sostiene, es robusto.',
      'A solitary bee forages a few hundred metres to a few kilometres from its nest; a bumblebee, several kilometres. Cells of 0.1–0.25° are close to that scale; larger cells rather measure overlapping distributions. The sensitivity figure repeats the test with five sizes: if the verdict holds, it is robust.'],
    care: ['Con celdas muy finas y pocos registros casi nada coincide y los pares quedan sin clasificar; con celdas enormes casi todo coincide. Ninguno de los extremos informa.',
      'With very fine cells and few records almost nothing coincides and pairs stay unclassified; with huge cells almost everything coincides. Neither extreme informs.'],
    ref: 'Veech 2013; Gotelli 2000',
  });
  E('fdr', {
    t: ['Comparaciones múltiples (tasa de falsos descubrimientos)', 'Multiple comparisons (false discovery rate)'],
    what: ['Con 6 plantas y 5 visitantes se prueban 30 pares; a α = 0.05 se esperaría uno o dos «significativos» aunque no hubiera ninguna asociación. El ajuste de Benjamini y Hochberg controla la proporción esperada de falsos positivos entre los pares que se declaran asociados.',
      'With 6 plants and 5 visitors, 30 pairs are tested; at α = 0.05 one or two "significant" ones would be expected even with no association at all. The Benjamini–Hochberg adjustment controls the expected proportion of false positives among the pairs declared associated.'],
    read: ['Reporta los dos valores de p; usa el ajustado para decidir. Si solo te interesa un par elegido de antemano por la hipótesis (por ejemplo, tu planta y su polinizador conocido), el p sin ajustar de ese par es el que corresponde.',
      'Report both p-values; use the adjusted one to decide. If you only care about one pair chosen beforehand by the hypothesis (say, your plant and its known pollinator), that pair\'s unadjusted p is the right one.'],
    ref: 'Benjamini & Hochberg 1995',
  });
  E('nntest', {
    t: ['Prueba de la distancia al vecino más cercano', 'Nearest-neighbour distance test'],
    what: ['No necesita rejilla: mide, desde cada punto de la planta, qué tan lejos está el registro más cercano del visitante, y compara la mediana con la de muchas simulaciones en las que el visitante se coloca al azar entre los sitios muestreados del estudio.',
      'It needs no grid: from each plant point it measures how far the nearest visitor record is, and compares the median with that of many simulations in which the visitor is placed at random among the sampled sites of the study.'],
    read: ['p (más cerca) < 0.05: el visitante aparece más cerca de la planta de lo que el muestreo por sí solo explicaría; p (más lejos) < 0.05: más lejos, como si se evitaran o vivieran en partes distintas del área muestreada. La proporción de puntos con visitante a 10 km o menos es una cifra fácil de comunicar.',
      'p (closer) < 0.05: the visitor appears closer to the plant than sampling alone would explain; p (farther) < 0.05: farther, as if they avoided each other or lived in different parts of the sampled area. The share of points with a visitor within 10 km is an easy figure to communicate.'],
    care: ['Con pocos puntos del visitante, la distancia se infla aunque viva junto a la planta: es falta de registros, no de abejas.',
      'With few visitor points, the distance inflates even if it lives next to the plant: it is a lack of records, not of bees.'],
    ref: 'Davison & Hinkley 1997; Phillips et al. 2009',
  });
  E('hull', {
    t: ['Envolvente convexa', 'Convex hull'],
    what: ['El polígono convexo más pequeño que contiene todos los puntos de una unidad: la forma más simple de dibujar su área de distribución. Su área se calcula sobre la esfera.',
      'The smallest convex polygon that contains every point of a unit: the simplest way to draw its range. Its area is computed on the sphere.'],
    read: ['La cobertura dice qué parte del área de la planta cae dentro del área del visitante. Es descriptiva: no tiene prueba y exagera las áreas con puntos aislados o formas alargadas.',
      'The cover says what part of the plant\'s area falls inside the visitor\'s area. It is descriptive: it has no test and it exaggerates areas with isolated points or elongated shapes.'],
    care: ['Un solo registro lejano estira la envolvente cientos de kilómetros. Revisa el mapa del Bloque 4 antes de citar un área.',
      'A single distant record stretches the hull by hundreds of kilometres. Check the Block 4 map before quoting an area.'],
    ref: 'Andrew 1979; Chamberlain & Duquette 2007',
  });

  /* =====================================================================
     Block 6 · phenology and elevation
     ===================================================================== */
  E('phenoeffort', {
    t: ['Corregir la fenología por esfuerzo', 'Correcting phenology for effort'],
    what: ['El número de registros de un mes refleja también cuándo se sale al campo: temporadas de colecta, vacaciones, lluvias que cierran caminos. La corrección divide los registros de la unidad en cada mes entre los de todo el grupo objetivo en ese mes, y vuelve a normalizar.',
      'The number of records in a month also reflects when people go into the field: collecting seasons, holidays, rains that close roads. The correction divides the unit\'s records in each month by those of the whole target group in that month, and normalises again.'],
    read: ['Si el perfil corregido cuenta la misma historia que el crudo, el calendario es robusto. Si cambia mucho, el crudo reflejaba más al colector que a la especie.',
      'If the corrected profile tells the same story as the raw one, the calendar is robust. If it changes a lot, the raw one reflected the collector more than the species.'],
    care: ['Los meses con menos de cinco registros en todo el estudio se dejan en cero al corregir, porque dividir entre casi nada fabrica picos.',
      'Months with fewer than five records across the whole study are set to zero when correcting, because dividing by almost nothing fabricates peaks.'],
    ref: 'Phillips et al. 2009; Morellato et al. 2010',
  });
  E('flowering', {
    t: ['Registros con flor', 'Records with flowers'],
    what: ['Un ejemplar de herbario o una fotografía de una planta puede estar en flor, en fruto o solo con hojas. Algunos registros lo dicen en su «condición reproductiva» (sobre todo las observaciones verificadas); la mayoría no.',
      'A herbarium specimen or a photograph of a plant can be in flower, in fruit or only with leaves. Some records say so in their "reproductive condition" (above all verified observations); most do not.'],
    read: ['Cuando hay suficientes, usar solo los registros con flor da el calendario de floración propiamente dicho; con todos los registros se obtiene el calendario de presencia, que se parece al de floración en plantas que se colectan casi siempre fértiles.',
      'When there are enough, using only records with flowers gives the flowering calendar proper; with all records one gets the presence calendar, which resembles the flowering one in plants that are nearly always collected fertile.'],
    care: ['Si activas el filtro y quedan muy pocos registros, la fecha media se vuelve inestable: compara ambas versiones.',
      'If you switch the filter on and very few records remain, the mean date becomes unstable: compare both versions.'],
  });

  /* =====================================================================
     Block 7 · environmental niche
     ===================================================================== */
  E('layers', {
    t: ['Capas ambientales', 'Environmental layers'],
    what: ['Rejillas con un valor por celda: temperatura, precipitación, estacionalidad, altitud, suelos. Las más usadas son las 19 variables bioclimáticas de las bases climáticas globales (medias de 1970–2000 o de 1981–2010), a resoluciones de 10′ (unos 18 km), 5′, 2.5′ o 30″ (casi 1 km).',
      'Grids with one value per cell: temperature, precipitation, seasonality, elevation, soils. The most used are the 19 bioclimatic variables of the global climate databases (averages of 1970–2000 or 1981–2010), at resolutions of 10′ (about 18 km), 5′, 2.5′ or 30″ (almost 1 km).'],
    read: ['Elige una resolución acorde a la precisión de tus registros: con registros de GBIF de precisión desconocida, 2.5′ o 5′ suele ser razonable; 30″ solo tiene sentido con coordenadas de GPS. Todas las capas deben estar en grados (latitud y longitud), no en metros.',
      'Choose a resolution in line with the precision of your records: with GBIF records of unknown precision, 2.5′ or 5′ is usually reasonable; 30″ only makes sense with GPS coordinates. Every layer must be in degrees (latitude and longitude), not metres.'],
    care: ['Cita la base de datos y su versión, y descárgala tú: sus licencias no permiten que otros programas la redistribuyan. Las capas de práctica del programa son ficticias: sirven para aprender los Bloques 7 y 8, nunca para publicar.',
      'Cite the database and its version, and download it yourself: their licences do not allow other programs to redistribute it. The program’s practice layers are fictional: they are for learning Blocks 7 and 8, never for publishing.'],
    ref: 'Broennimann et al. 2012',
  });
  E('background', {
    t: ['El fondo (ambiente disponible)', 'The background (available environment)'],
    what: ['Las celdas contra las que se compara lo que las especies usan: el ambiente que estaba a su alcance. Define el espacio ambiental (los componentes principales se calculan sobre él) y corrige las densidades: un clima muy común en la región recibe menos peso que uno raro.',
      'The cells against which what the species use is compared: the environment within their reach. It defines the environmental space (the principal components are computed on it) and corrects the densities: a climate very common in the region gets less weight than a rare one.'],
    read: ['Un fondo cercano a los registros (200 km es un valor usual) compara con lo que las especies pudieron alcanzar; uno demasiado amplio incluye ambientes que nunca tuvieron a su alcance y hace parecer los nichos más parecidos de lo que son.',
      'A background close to the records (200 km is a usual value) compares with what the species could reach; one that is too wide includes environments never within their reach and makes the niches look more alike than they are.'],
    care: ['Cambiar el fondo cambia D. Decláralo en los métodos y, si puedes, reporta el resultado con dos fondos.',
      'Changing the background changes D. State it in the methods and, if you can, report the result with two backgrounds.'],
    ref: 'Broennimann et al. 2012; Phillips et al. 2009',
  });
  E('pcaenv', {
    t: ['Espacio ambiental por componentes principales', 'Environmental space by principal components'],
    what: ['Las variables climáticas del fondo, estandarizadas, se resumen en dos ejes que recogen la mayor parte de su variación. Cada registro se proyecta sobre esos ejes con sus propios valores. El círculo de correlación dice qué variable empuja hacia dónde.',
      'The climate variables of the background, standardised, are summarised in two axes that gather most of their variation. Each record is projected onto those axes with its own values. The correlation circle says which variable pushes towards where.'],
    read: ['La varianza explicada por el plano indica cuánto del ambiente se ve en la figura: por encima de 60–70 % el plano es un buen resumen; por debajo, parte de la diferencia entre nichos puede estar en ejes que no se muestran (el análisis variable por variable ayuda a verla).',
      'The variance explained by the plane indicates how much of the environment is seen in the figure: above 60–70 % the plane is a good summary; below, part of the difference between niches may lie on axes not shown (the variable-by-variable analysis helps to see it).'],
    ref: 'Broennimann et al. 2012',
  });
  E('nichecorr', {
    t: ['Densidad de registros o corregida por el ambiente', 'Record density or density corrected by the environment'],
    what: ['La densidad de los registros en el plano ambiental puede usarse tal cual o dividida entre la densidad del ambiente disponible. Dividir corrige que un clima muy común en la región acumule registros solo por ser común, pero amplifica los bordes del ambiente disponible, donde hay pocas celdas y un solo registro pesa mucho.',
      'The density of records on the environmental plane can be used as it is or divided by the density of the available environment. Dividing corrects for a climate very common in the region piling up records just for being common, but it amplifies the edges of the available environment, where few cells exist and a single record weighs a lot.'],
    read: ['Si las dos versiones dan D parecidas y las mismas conclusiones en las pruebas, el resultado es robusto. Si difieren mucho, mira en la figura si la diferencia viene de unos pocos registros en los bordes.',
      'If both versions give similar D and the same test conclusions, the result is robust. If they differ a lot, check in the figure whether the difference comes from a few records at the edges.'],
    care: ['Declara en los métodos cuál usaste.', 'State in the methods which one you used.'],
    ref: 'Broennimann et al. 2012',
  });
  E('nichetests', {
    t: ['Pruebas de equivalencia y de similitud', 'Equivalency and similarity tests'],
    what: ['<b>Equivalencia</b>: se mezclan los registros de las dos unidades y se reparten al azar en dos grupos del tamaño original, muchas veces. Si la D real es menor que casi todas las simuladas, los dos nichos no son intercambiables. <b>Similitud</b>: el nicho del visitante se desplaza a un lugar al azar del ambiente disponible, conservando su forma. Si la D real es mayor que casi todas, los nichos se parecen más de lo que el ambiente por sí solo explicaría.',
      '<b>Equivalency</b>: the records of both units are pooled and split at random into two groups of the original sizes, many times. If the real D is lower than almost all simulated ones, the two niches are not interchangeable. <b>Similarity</b>: the visitor\'s niche is moved to a random place of the available environment, keeping its shape. If the real D is higher than almost all, the niches are more alike than the environment alone would explain.'],
    read: ['La combinación más informativa para una interacción: «no equivalentes» (no ocupan exactamente los mismos climas) pero «más similares que al azar» (comparten más de lo esperado). Eso sostiene que el visitante sigue a la planta en el espacio climático.',
      'The most informative combination for an interaction: "not equivalent" (they do not occupy exactly the same climates) but "more similar than chance" (they share more than expected). That supports the visitor following the plant in climate space.'],
    care: ['Con 100 repeticiones el menor p posible es 0.0099; usa 500 para el resultado final. Con pocos registros (menos de 20–30 por unidad) ambas pruebas tienen poca potencia.',
      'With 100 replicates the smallest possible p is 0.0099; use 500 for the final result. With few records (fewer than 20–30 per unit) both tests have little power.'],
    ref: 'Warren et al. 2008; Broennimann et al. 2012',
  });

  /* =====================================================================
     Block 8 · potential distribution
     ===================================================================== */
  E('sdmmodels', {
    t: ['Los tres modelos de idoneidad', 'The three suitability models'],
    what: ['<b>Envolvente bioclimática</b>: idóneo lo que cae dentro del intervalo de valores de los registros en todas las variables; la más sencilla y la más conservadora. <b>Distancia de Mahalanobis</b>: qué tan lejos está una celda del centro climático de los registros, teniendo en cuenta cómo covarían las variables. <b>Logística con fondo</b>: contrasta las celdas con registros contra las celdas del fondo, con términos lineales y cuadráticos; es la más flexible y la única que usa el fondo, por lo que corrige el sesgo si el fondo es el grupo objetivo.',
      '<b>Bioclimatic envelope</b>: suitable is what falls within the range of values of the records on every variable; the simplest and the most conservative. <b>Mahalanobis distance</b>: how far a cell lies from the climatic centre of the records, accounting for how the variables covary. <b>Background logistic</b>: contrasts cells with records against background cells, with linear and quadratic terms; the most flexible and the only one using the background, so it corrects the bias when the background is the target group.'],
    read: ['Para comparar planta y visitantes, usa el mismo modelo, las mismas variables y el mismo fondo para todos: el desajuste es una comparación, y solo es justa si las reglas son iguales.',
      'To compare plant and visitors, use the same model, the same variables and the same background for all: the mismatch is a comparison, and it is only fair if the rules are equal.'],
    care: ['Estos modelos son deliberadamente sencillos y transparentes. Para un análisis de distribución a fondo (varios algoritmos, ensambles, validación espacial) usa un programa dedicado; el Bloque 8 está pensado para el desajuste planta–visitante, no para competir con esos programas.',
      'These models are deliberately simple and transparent. For an in-depth distribution analysis (several algorithms, ensembles, spatial validation) use a dedicated program; Block 8 is meant for the plant–visitor mismatch, not to compete with those programs.'],
    ref: 'Nix 1986; Farber & Kadmon 2003; Phillips et al. 2009; Elith et al. 2011',
  });
  E('auc', {
    t: ['AUC (área bajo la curva ROC)', 'AUC (area under the ROC curve)'],
    what: ['La probabilidad de que una celda con registro reciba una idoneidad más alta que una celda del fondo tomada al azar. Se calcula con los registros que el modelo no vio (validación cruzada).',
      'The probability that a cell with a record receives a higher suitability than a background cell taken at random. It is computed with records the model did not see (cross-validation).'],
    scaleTitle: ['AUC de validación', 'Validation AUC'],
    scale: [
      S(null, 0.6, ['casi al azar', 'nearly random'], 'bad'),
      S(0.6, 0.7, ['pobre', 'poor'], 'warn'),
      S(0.7, 0.8, ['aceptable', 'fair'], 'ok'),
      S(0.8, 0.9, ['buena', 'good'], 'good'),
      S(0.9, null, ['excelente', 'excellent'], 'good'),
    ],
    conv: true,
    care: ['Con datos de solo presencia, el AUC depende del tamaño del fondo: un fondo enorme la infla. Compara modelos con el mismo fondo, no contra números de otros artículos.',
      'With presence-only data, the AUC depends on the size of the background: a huge background inflates it. Compare models with the same background, not against numbers from other papers.'],
    ref: 'Swets 1988; Lobo et al. 2008',
  });
  E('tss', {
    t: ['TSS (estadístico de habilidad verdadera)', 'TSS (true skill statistic)'],
    what: ['Sensibilidad + especificidad − 1 con el umbral elegido: cuánto mejor que el azar separa el mapa binario los registros de validación del fondo. Va de −1 a 1; 0 es azar.',
      'Sensitivity + specificity − 1 at the chosen threshold: how much better than chance the binary map separates the validation records from the background. It runs from −1 to 1; 0 is chance.'],
    scaleTitle: ['TSS', 'TSS'],
    scale: [
      S(null, 0.2, ['pobre', 'poor'], 'bad'),
      S(0.2, 0.4, ['regular', 'fair'], 'warn'),
      S(0.4, 0.6, ['bueno', 'good'], 'ok'),
      S(0.6, null, ['muy bueno', 'very good'], 'good'),
    ],
    conv: true,
    ref: 'Allouche et al. 2006',
  });
  E('threshold', {
    t: ['Umbral de idoneidad', 'Suitability threshold'],
    what: ['El valor a partir del cual una celda se declara idónea en el mapa binario. <b>Máximo TSS</b>: el que mejor separa registros de fondo. <b>10 % de presencias</b>: deja fuera el 10 % de registros menos idóneos (tolera algunos errores de ubicación). <b>Presencia mínima</b>: incluye a todos los registros; el más amplio.',
      'The value from which a cell is declared suitable on the binary map. <b>Maximum TSS</b>: the one that best separates records from background. <b>10th percentile of presences</b>: leaves out the 10 % least suitable records (tolerates some location errors). <b>Minimum presence</b>: includes every record; the widest.'],
    care: ['El área de desajuste cambia con el umbral. Usa la misma regla para la planta y los visitantes, y considera mostrar el resultado con dos reglas.',
      'The mismatch area changes with the threshold. Use the same rule for the plant and the visitors, and consider showing the result with two rules.'],
    ref: 'Liu et al. 2005',
  });
  E('mismatch', {
    t: ['Desajuste planta–visitante', 'Plant–visitor mismatch'],
    what: ['Las celdas donde el ambiente es idóneo para la planta pero para ninguno de los visitantes potenciales elegidos. Es la parte del área de la planta que dependería de otros visitantes, o que quedaría sin polinización si la relación fuera exclusiva.',
      'The cells where the environment is suitable for the plant but for none of the chosen potential visitors. It is the part of the plant\'s range that would depend on other visitors, or be left without pollination if the relationship were exclusive.'],
    read: ['Se reporta como porcentaje del área idónea de la planta. Su cambio con el clima futuro dice si el cambio climático separaría a la planta de sus visitantes (desajuste espacial) o los acercaría.',
      'It is reported as a percentage of the plant\'s suitable area. Its change under the future climate says whether climate change would separate the plant from its visitors (spatial mismatch) or bring them together.'],
    care: ['Es un desajuste potencial, basado en idoneidad ambiental: no considera dispersión, barreras, uso del suelo ni la conducta de los visitantes.',
      'It is a potential mismatch, based on environmental suitability: it does not consider dispersal, barriers, land use or the visitors\' behaviour.'],
    ref: 'Schweiger et al. 2008; Kerr et al. 2015',
  });
  E('futureclimate', {
    t: ['Proyección a clima futuro', 'Projection to a future climate'],
    what: ['El modelo ajustado con el clima actual se aplica a las mismas variables calculadas para un periodo futuro (por ejemplo 2041–2060) según un modelo climático y una trayectoria de emisiones.',
      'The model fitted with the current climate is applied to the same variables computed for a future period (for instance 2041–2060) under a climate model and an emissions pathway.'],
    read: ['Usa varios modelos climáticos y al menos dos trayectorias, y reporta el intervalo: un solo modelo climático no es una predicción.',
      'Use several climate models and at least two pathways, and report the range: a single climate model is not a prediction.'],
    care: ['Donde el clima futuro sale del intervalo de los registros, el modelo extrapola. La app lo marca para el clima actual; en el futuro esa zona suele crecer.',
      'Where the future climate leaves the range of the records, the model extrapolates. The app flags it for the current climate; in the future that zone usually grows.'],
    ref: 'Elith et al. 2010',
  });

  /* =====================================================================
     Block 9 · interaction network
     ===================================================================== */
  E('publishedlinks', {
    t: ['Visitas observadas e interacciones publicadas', 'Observed visits and published interactions'],
    what: ['Tus observaciones traen <b>cuántas</b> visitas hizo cada visitante a cada planta, en sitios y fechas conocidos: permiten medir especialización y completitud. Las interacciones publicadas solo dicen que el vínculo existe en algún lugar y momento: sirven para la estructura de la red (quién con quién), no para su intensidad.',
      'Your observations carry <b>how many</b> visits each visitor made to each plant, at known sites and dates: they allow measuring specialisation and completeness. Published interactions only say that the link exists somewhere at some time: they serve the structure of the network (who with whom), not its intensity.'],
    care: ['Mezclar las dos fuentes da una red de estructura: la app entonces cuenta cada registro publicado como una visita y no calcula H₂′ ni d′, que suponen conteos comparables.',
      'Mixing both sources gives a structural network: the app then counts each published record as one visit and does not compute H₂′ or d′, which assume comparable counts.'],
  });
  E('connectance', {
    t: ['Conectancia', 'Connectance'],
    what: ['La proporción de todas las combinaciones planta–visitante posibles que se observaron: vínculos / (plantas × visitantes).', 'The proportion of all possible plant–visitor combinations that were observed: links / (plants × visitors).'],
    read: ['Baja en redes grandes y alta en redes pequeñas, casi por aritmética: compara conectancias solo entre redes de tamaño parecido.', 'Low in large networks and high in small ones, almost by arithmetic: compare connectances only between networks of similar size.'],
    scaleTitle: ['Conectancia', 'Connectance'],
    scale: [S(null, 0.15, ['dispersa', 'sparse'], 'ok'), S(0.15, 0.4, ['habitual', 'usual'], 'good'), S(0.4, null, ['densa (red pequeña o generalista)', 'dense (small or generalist network)'], 'ok')],
    conv: true,
    ref: 'Jordano 1987',
  });
  E('nodf', {
    t: ['Anidamiento (NODF)', 'Nestedness (NODF)'],
    what: ['Una red está anidada cuando los especialistas visitan subconjuntos de las plantas que visitan los generalistas. NODF mide ese solapamiento con decrecimiento del llenado, de 0 (nada anidado) a 100 (perfectamente anidado).', 'A network is nested when specialists visit subsets of the plants visited by generalists. NODF measures that overlap with decreasing fill, from 0 (not nested) to 100 (perfectly nested).'],
    read: ['Las redes de polinización suelen estar anidadas. El número por sí solo no dice mucho: se compara con redes nulas que conservan el grado de cada especie (z > 2: más anidada que al azar).', 'Pollination networks are usually nested. The number alone says little: it is compared with null networks that keep each species\' degree (z > 2: more nested than chance).'],
    ref: 'Almeida-Neto et al. 2008; Bascompte et al. 2003',
  });
  E('h2', {
    t: ['Especialización de la red (H₂′)', 'Network specialisation (H₂′)'],
    what: ['Qué tan exclusivas son las interacciones, dados los totales de visitas de cada planta y cada visitante: 0 cuando cada visitante reparte sus visitas en proporción a lo que cada planta recibe (red generalista), 1 cuando cada uno se concentra en sus socios exclusivos.', 'How exclusive the interactions are, given the visit totals of each plant and each visitor: 0 when each visitor spreads its visits in proportion to what each plant receives (generalist network), 1 when each concentrates on exclusive partners.'],
    read: ['Al estandarizar por los totales, no depende del tamaño ni del esfuerzo de muestreo, y se puede comparar entre estudios.', 'Being standardised by the totals, it does not depend on size or sampling effort, and can be compared between studies.'],
    scaleTitle: ['H₂′', 'H₂′'],
    scale: [S(null, 0.3, ['generalista', 'generalist'], 'ok'), S(0.3, 0.6, ['intermedia', 'intermediate'], 'good'), S(0.6, null, ['especializada', 'specialised'], 'good')],
    conv: true,
    ref: 'Blüthgen et al. 2006',
  });
  E('dprime', {
    t: ['Especialización de cada especie (d′)', 'Species specialisation (d′)'],
    what: ['Qué tanto se aparta una especie de visitar (o ser visitada) en proporción a la disponibilidad de sus socios: 0 = oportunista, 1 = especialista extremo.', 'How much a species departs from visiting (or being visited) in proportion to the availability of its partners: 0 = opportunistic, 1 = extreme specialist.'],
    read: ['Una abeja especialista de las cucurbitáceas debería tener d′ alto en una red con muchas otras flores; la abeja melífera, bajo.', 'A cucurbit-specialist bee should have a high d′ in a network with many other flowers; the honey bee, a low one.'],
    scaleTitle: ["d′", "d′"],
    scale: [S(null, 0.3, ['generalista', 'generalist'], 'ok'), S(0.3, 0.6, ['intermedia', 'intermediate'], 'good'), S(0.6, null, ['especialista', 'specialist'], 'good')],
    conv: true,
    ref: 'Blüthgen et al. 2006',
  });
  E('strength', {
    t: ['Fuerza de una especie', 'Species strength'],
    what: ['La suma de las dependencias de sus socios: para un visitante, la suma, sobre las plantas que visita, de la fracción de las visitas de cada planta que él aporta. Mide qué tan importante es para las plantas de la red.', 'The sum of its partners\' dependences: for a visitor, the sum, over the plants it visits, of the fraction of each plant\'s visits that it provides. It measures how important it is for the plants of the network.'],
    read: ['Un visitante con fuerza cercana al número de plantas que visita es su visitante principal en todas ellas; uno con fuerza baja es secundario aunque visite muchas.', 'A visitor with strength close to the number of plants it visits is their main visitor in all of them; one with low strength is secondary even if it visits many.'],
    ref: 'Bascompte et al. 2006',
  });
  E('modularity', {
    t: ['Modularidad', 'Modularity'],
    what: ['Si la red se divide en grupos (módulos) de plantas y visitantes que interactúan más entre sí que con el resto. Q va de 0 (sin módulos) a 1.', 'Whether the network splits into groups (modules) of plants and visitors that interact more among themselves than with the rest. Q runs from 0 (no modules) to 1.'],
    read: ['Los módulos sugieren gremios: por ejemplo, las cucurbitáceas con sus abejas especialistas en un módulo y las flores abiertas con moscas y abejas generalistas en otro. Compara Q con redes nulas antes de interpretarlos.', 'Modules suggest guilds: for instance, cucurbits with their specialist bees in one module and open flowers with flies and generalist bees in another. Compare Q with null networks before interpreting them.'],
    care: ['El algoritmo busca la mejor partición con reinicios al azar; en redes grandes dos corridas pueden dar módulos ligeramente distintos con Q casi igual.', 'The algorithm searches the best partition with random restarts; in large networks two runs can give slightly different modules with almost the same Q.'],
    ref: 'Barber 2007; Liu & Murata 2010; Beckett 2016',
  });
  E('nullmodels', {
    t: ['Modelos nulos de redes', 'Network null models'],
    what: ['Redes simuladas que conservan lo que se considera dado —cuántas plantas visita cada visitante, cuántas visitas recibe cada planta— y lo reparten al azar. Si la red real se aparta de ellas, la estructura no se explica solo por esos totales.', 'Simulated networks that keep what is taken as given —how many plants each visitor visits, how many visits each plant receives— and distribute it at random. If the real network departs from them, its structure is not explained by those totals alone.'],
    read: ['z = (observado − media nula) / desviación nula; |z| > 2 suele leerse como significativo. Para el anidamiento se usa el modelo de bola curva (grados fijos); para H₂′ y la modularidad cuantitativa, el reparto al azar de las visitas individuales con totales fijos.', 'z = (observed − null mean) / null deviation; |z| > 2 is usually read as significant. For nestedness the curveball model (fixed degrees) is used; for H₂′ and quantitative modularity, the random allocation of individual visits with fixed totals.'],
    ref: 'Strona et al. 2014; Patefield 1981',
  });
  E('completeness', {
    t: ['Completitud del muestreo de visitantes', 'Completeness of visitor sampling'],
    what: ['Cuántos visitantes distintos se registraron frente a cuántos se estima que hay (Chao1, a partir de los que se vieron una y dos veces). La curva de rarefacción muestra si el número de visitantes sigue subiendo con más observación.', 'How many distinct visitors were recorded against how many are estimated to exist (Chao1, from those seen once and twice). The rarefaction curve shows whether the number of visitors keeps rising with more observation.'],
    scaleTitle: ['Visitantes observados / Chao1', 'Observed visitors / Chao1'],
    scale: [S(null, 0.5, ['muy incompleto', 'very incomplete'], 'bad'), S(0.5, 0.8, ['incompleto', 'incomplete'], 'warn'), S(0.8, 0.95, ['bueno', 'good'], 'ok'), S(0.95, null, ['casi completo', 'nearly complete'], 'good')],
    conv: true,
    care: ['Chao1 es un mínimo del total, no el total: con muchos visitantes vistos una sola vez la estimación es inestable.', 'Chao1 is a minimum of the total, not the total: with many visitors seen only once the estimate is unstable.'],
    ref: 'Chao 1987; Chacoff et al. 2012',
  });

  /* =====================================================================
     figures, report and package (Block 10, and every figure of the app)
     ===================================================================== */
  E('mapstudio', {
    t: ['Estudio de mapa', 'Map studio'],
    what: ['Un editor completo del mapa en ocho pestañas: fondo y límites, encuadre y recorte, textos y fuentes, elementos (flecha del norte en ocho diseños, escala gráfica en ocho formatos, leyenda, retícula, marco), datos (puntos, calor, rejillas, envolventes), colores, estilos listos y exportación. El mapa base es vectorial y lo dibuja el programa: no depende de internet ni de imágenes de terceros.',
      'A complete map editor in eight tabs: background and boundaries, framing and clip, texts and fonts, elements (north arrow in eight designs, scale bar in eight formats, legend, graticule, frame), data (points, heat, grids, hulls), colours, ready-made looks and export. The base map is vector and drawn by the program: it does not depend on the internet or on third-party images.'],
    read: ['Elige primero el tamaño de salida en «Exportar» (por ejemplo, una columna de revista): la vista toma esa forma y lo que ves es lo que se descarga. El GeoTIFF se abre en su lugar en un sistema de información geográfica; la escala numérica 1:n corresponde al papel elegido.',
      'Choose the output size in "Export" first (for instance, a journal column): the view takes that shape and what you see is what is downloaded. The GeoTIFF opens in place in a geographic information system; the 1:n ratio corresponds to the chosen paper.'],
    care: ['Un mapa para revista casi nunca necesita color: prueba el estilo «Blanco y negro», que distingue las unidades por forma.', 'A journal map rarely needs colour: try the "Black and white" look, which tells units apart by shape.'],
  });
  E('figedit', {
    t: ['Editar una figura', 'Editing a figure'],
    what: ['El botón ✎ de cada figura abre su editor: cualquier texto se reescribe, cambia de tamaño, de estilo o de color, o se oculta; cualquier color se sustituye; la familia tipográfica, el tamaño general del texto, el grosor de las líneas, el tamaño de los puntos, la rejilla, el fondo y el color de los ejes se ajustan. El botón ⤓ la exporta.',
      'The ✎ button of every figure opens its editor: any text can be rewritten, resized, restyled, recoloured or hidden; any colour replaced; the font family, overall text size, line width, point size, grid, background and axis colour adjusted. The ⤓ button exports it.'],
    read: ['Los cambios se guardan por figura y se vuelven a aplicar cuando la figura se recalcula; aparecen en la exportación, en el catálogo del Bloque 10, en el informe y en el paquete. El estudio de figuras de la barra superior cambia la paleta y la tipografía de todas a la vez.',
      'Changes are kept per figure and applied again when the figure is recomputed; they appear in the export, the Block 10 catalogue, the report and the package. The figure studio of the top bar changes the palette and font of all at once.'],
    care: ['Un texto se reconoce por su redacción original: si cambias el idioma, sus textos son otros y se editan aparte.', 'A text is recognised by its original wording: if you change the language, its texts are different ones and are edited separately.'],
  });
  E('figformat', {
    t: ['PNG, JPG o SVG: cuál pedir', 'PNG, JPG or SVG: which to ask for'],
    what: ['<b>SVG</b> es la figura como dibujo: líneas y textos que se agrandan sin perder nitidez y se editan en cualquier programa de dibujo vectorial. <b>PNG</b> es una imagen de píxeles sin pérdida, con transparencia posible: la opción segura para revistas y tesis. <b>JPG</b> comprime con pérdida y no tiene transparencia; solo conviene cuando lo exige el destino.',
      '<b>SVG</b> is the figure as a drawing: lines and text that scale without losing sharpness and can be edited in any vector drawing program. <b>PNG</b> is a lossless pixel image, transparency possible: the safe choice for journals and theses. <b>JPG</b> compresses with loss and has no transparency; it only makes sense when the destination demands it.'],
    scaleTitle: ['Regla práctica', 'Rule of thumb'],
    scale: [
      S(null, null, ['SVG para editar o para la versión final vectorial', 'SVG to edit or for the final vector version'], 'good'),
      S(null, null, ['PNG a 300–600 ppp para enviar a revista o imprimir', 'PNG at 300–600 dpi to submit or print'], 'good'),
      S(null, null, ['JPG solo si el destino lo exige', 'JPG only if the destination demands it'], 'ok'),
    ],
    conv: true,
    read: ['Las revistas suelen pedir TIFF o EPS: cualquier editor de imágenes convierte el PNG a TIFF sin pérdida, y el SVG a EPS o PDF. Los colores exportados son los del estilo activo, resueltos: la figura ya no depende de la app.',
      'Journals often ask for TIFF or EPS: any image editor converts the PNG to TIFF without loss, and the SVG to EPS or PDF. The exported colours are those of the active style, resolved: the figure no longer depends on the app.'],
  });

  E('dpi', {
    t: ['Resolución (puntos por pulgada)', 'Resolution (dots per inch)'],
    what: ['Cuántos píxeles tendrá la imagen por cada pulgada impresa. Más resolución no añade información al dibujo (que es vectorial): añade nitidez a la impresión y peso al archivo.',
      'How many pixels the image will have per printed inch. More resolution adds no information to the drawing (which is vector): it adds sharpness to the print and weight to the file.'],
    scaleTitle: ['Puntos por pulgada', 'Dots per inch'],
    scale: [
      S(null, 150, ['pantalla, diapositivas, borradores', 'screen, slides, drafts'], 'ok'),
      S(150, 300, ['impresión de oficina, tesis', 'office printing, theses'], 'good'),
      S(300, 600, ['lo que piden casi todas las revistas', 'what almost every journal asks for'], 'good', ['300 ppp para medios tonos, 600–1200 para arte lineal', '300 dpi for halftones, 600–1200 for line art']),
      S(600, null, ['carteles y ampliaciones', 'posters and enlargements'], 'ok', ['archivos de decenas de MB', 'files of tens of MB']),
    ],
    conv: true,
    care: ['Una imagen chica ampliada en el procesador de textos se ve borrosa aunque tenga muchos ppp: exporta al tamaño final o usa SVG.',
      'A small image enlarged in the word processor looks blurry however many dpi it has: export at the final size or use SVG.'],
  });

  E('reportmethods', {
    t: ['Métodos redactados a partir de lo calculado', 'Methods written from what was computed'],
    what: ['La sección de métodos del informe no es una plantilla: se arma con lo que realmente se corrió. Si depuraste 312 registros duplicados, lo dice con ese número; si la coocurrencia usó celdas de 0.25° y el universo del grupo objetivo, lo dice; un método que no se usó no aparece, y las referencias son solo las de los métodos que sí.',
      'The methods section of the report is not a template: it is assembled from what was actually run. If 312 duplicate records were removed, it says so with that number; if co-occurrence used 0.25° cells and the target-group universe, it says so; a method that was not used does not appear, and the references are only those of the methods that were.'],
    read: ['Léela antes de copiarla al artículo y añade lo que la app no puede saber: por qué elegiste los taxones, quién identificó los ejemplares, la fecha de descarga y el DOI de la descarga de GBIF si la hiciste por su portal.',
      'Read it before pasting it into the paper and add what the app cannot know: why you chose the taxa, who identified the specimens, the download date and the DOI of the GBIF download if you made it through their portal.'],
    care: ['GBIF pide citar cada descarga con su DOI. Las consultas que hace la app por su interfaz de programación no generan uno: para el artículo final, repite la descarga en el portal de GBIF con los mismos filtros y cita ese DOI.',
      'GBIF asks for each download to be cited with its DOI. The queries the app makes through its programming interface do not generate one: for the final paper, repeat the download on the GBIF portal with the same filters and cite that DOI.'],
  });

  E('reproducible', {
    t: ['Qué hace reproducible un estudio de distribución', 'What makes a distribution study reproducible'],
    what: ['Tres cosas: los <b>datos</b> tal como entraron al cálculo (los registros ya depurados, no los crudos), los <b>parámetros</b> de cada paso (reglas de depuración, tamaño de celda, universo del modelo nulo, variables, semillas de las permutaciones) y la <b>versión</b> del programa. El paquete del Bloque 10 guarda las tres.',
      'Three things: the <b>data</b> as they entered the computation (the cleaned records, not the raw ones), the <b>parameters</b> of every step (cleaning rules, cell size, universe of the null model, variables, seeds of the permutations) and the <b>version</b> of the program. The Block 10 package stores all three.'],
    ref: 'Sandve et al. 2013; Wilkinson et al. 2016; Zizka et al. 2020',
  });

  /* which entries each block's guide lists */
  Object.assign(Help.BLOCK_KEYS, {
    1: ['occurrence', 'cooccurnotinteraction', 'samplingbias', 'hypergeo', 'ses', 'schoenerD', 'hellingerI', 'pianka', 'circular', 'rayleigh', 'nicheoverlap', 'squashbees', 'wildcultivated'],
    2: ['occurrence', 'cooccurnotinteraction', 'samplingbias', 'squashbees', 'wildcultivated'],
    3: ['cleaning', 'centroidrule', 'livingcoll', 'wildcultivated', 'squashbees', 'unit'],
    4: ['mapstudio', 'figedit', 'occurrence'],
    5: ['cooccurnotinteraction', 'samplingbias', 'hypergeo', 'ses', 'cellsize', 'fdr', 'jaccard', 'nntest', 'hull'],
    6: ['circular', 'rayleigh', 'phenoeffort', 'flowering', 'schoenerD', 'hellingerI', 'pianka'],
    7: ['layers', 'background', 'pcaenv', 'nichecorr', 'nicheoverlap', 'schoenerD', 'hellingerI', 'nichetests'],
    8: ['sdmmodels', 'samplingbias', 'auc', 'tss', 'threshold', 'mismatch', 'futureclimate'],
    9: ['publishedlinks', 'connectance', 'nodf', 'h2', 'dprime', 'strength', 'modularity', 'nullmodels', 'completeness'],
    10: ['figedit', 'figformat', 'dpi', 'reportmethods', 'reproducible'],
  });

  /* labels the app prints, in either language, and the entry each belongs to (matched by prefix) */
  Object.assign(Help.LABELS, {
    'd de schoener': 'schoenerD', "schoener's d": 'schoenerD', 'schoener': 'schoenerD',
    'i de warren': 'hellingerI', "warren's i": 'hellingerI', 'hellinger': 'hellingerI',
    'pianka': 'pianka',
    'jaccard': 'jaccard', 'sørensen': 'jaccard', 'sorensen': 'jaccard', 'simpson': 'jaccard', 'cobertura': 'jaccard', 'cover': 'jaccard',
    'eef': 'ses', 'ses': 'ses',
    'p (menos)': 'hypergeo', 'p (less)': 'hypergeo', 'p (más)': 'hypergeo', 'p (more)': 'hypergeo', 'esperado': 'hypergeo', 'expected': 'hypergeo', 'compartidos': 'hypergeo', 'shared': 'hypergeo',
    'r̄': 'circular', 'fecha media': 'circular', 'mean date': 'circular', 'de circular': 'circular', 'circular sd': 'circular',
    'rayleigh': 'rayleigh', 'conectancia': 'connectance', 'connectance': 'connectance', 'anidamiento': 'nodf', 'nestedness': 'nodf', 'especialización h₂′': 'h2', 'specialisation h₂′': 'h2', 'modularidad': 'modularity', 'modularity': 'modularity', 'fuerza': 'strength', 'strength': 'strength', 'd′': 'dprime', 'completitud': 'completeness', 'completeness': 'completeness', 'chao1': 'completeness', 'cobertura de': 'completeness', 'auc': 'auc', 'tss': 'tss', 'umbral': 'threshold', 'threshold': 'threshold', 'omisión': 'threshold', 'omission': 'threshold',
    'unidad': 'unit', 'unit': 'unit', 'quitados': 'cleaning', 'removed': 'cleaning', 'conservados': 'cleaning', 'kept': 'cleaning',
  });
})();
