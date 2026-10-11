# Cambios · Changelog

## 1.2.4 — 10 de octubre de 2026

- Los íconos de la barra de navegación, del estudio de figuras y del botón
  «Animaciones» son ahora propios, dibujados para la LABG Suite; sustituyen a
  un conjunto de íconos de terceros. El programa ya no incluye ningún elemento
  ajeno salvo los contornos geográficos de dominio público, y el archivo de
  licencias de terceros se retiró (`js/labg-navigator.js`,
  `js/labg-figure-studio.js`, `js/labg-fx.js`, `PROCEDENCIA.md`).
- Documentación en inglés: `README.md` (el texto en español pasa a
  `LEEME.md`), `docs/quickstart.md` y `CONTRIBUTING.md`.

## 1.2.3 — 10 de octubre de 2026

- Corregido: la búsqueda de **interacciones publicadas** (Bloque 2) recibía
  una fila por par de taxones, sin estudio ni lugar; ahora pide cada registro
  con su fuente y sus coordenadas. La tabla cuenta registros reales, la
  columna «Fuentes» aparece, y el informe lista las fuentes que hay que citar
  (`js/gbif.js`, `js/block2.js`, `js/report.js`).
- Corregido: con interacciones publicadas, la red se analiza como matriz de
  vínculos (1/0) en todos sus índices; antes la modularidad observada usaba
  los conteos y se comparaba con modelos nulos binarios. H₂′ ya no se anota
  en el informe cuando no hay conteos de visitas (`js/block9.js`).
- **Caso de estudio** con datos reales: *Cucurbita* × *Xenoglossa* en México
  (`casos/cucurbita_xenoglossa/`), con los pasos, las opciones, las cifras y
  las figuras.

## 1.2.2 — 10 de octubre de 2026

- **Validación contra R** (`validation/`): el motor de cálculo se compara
  número por número con paquetes de R escritos por otras personas (cooccur,
  vegan, circular, dismo, ecospat, terra, glmnet, pROC, bipartite y otros):
  34 299 comparaciones, 0 en desacuerdo. `validation/index.html` muestra el
  informe con doble clic; `validation/LEEME.md` explica cada comparación, los
  errores que atrapó y las diferencias que no son errores.
- Corregido: **d′** usaba como máximo el reparto más desigual que permitían
  los totales de los compañeros; ahora usa el máximo publicado por Blüthgen
  et al. (2006), ln(T/Aᵢ). Los valores anteriores salían más altos
  (`js/network.js`).
- Corregido: el umbral de **máxima TSS** se buscaba entre a lo más 400
  candidatos redondeados a cuatro decimales y podía quedar lejos del máximo;
  ahora cada puntaje es candidato (`js/sdm.js`).
- Corregido: la idoneidad de **Mahalanobis** se volvía cero por debajo de
  1e-16; la cola superior de ji cuadrada se calcula ahora directamente
  (`js/engine.js`).
- Corregido: el modelo nulo binario de la red hacía cinco intercambios por
  fila y la matriz simulada aún se parecía a la observada; ahora hace veinte.
- Mejorado: los extremos de **H₂′** se afinan moviendo visitas sin alterar
  los totales, y la búsqueda de **módulos** tiene una etapa de refinamiento.
- En el estudio de práctica las cifras cambian poco y ninguna interpretación
  cambia: H₂′ 0.152 → 0.153; NODF frente al modelo nulo p = 0.2 → 0.26; d′
  de la abeja melífera 0.05 → 0.04; desajuste 426,991 → 431,578 km² (60 %).
- 6 pruebas nuevas (168 en total). Manual actualizado.

## 1.2.1 — 27 de septiembre de 2026

- El DOI de Zenodo (de concepto: 10.5281/zenodo.23004694, que lleva siempre a
  la versión más reciente) en la cita de la portada, en el informe, en
  `README.md`, `CITATION.cff`, `codemeta.json` y en el manual de usuario.
- Publicada en GitHub (`luisangelbg/PollinationPro`, con GitHub Pages) y en la
  LABG Suite.

## 1.2.0 — 27 de septiembre de 2026

- **Capas ambientales de práctica** (`Examples.layers` en `js/examples.js`):
  cuatro capas ficticias para México y Centroamérica a 0.1° —un relieve
  inventado y BIO1, BIO4 y BIO12 derivadas de él con reglas simples— y un
  futuro de práctica más cálido y más seco. Se cargan desde el Bloque 7
  («¿Sin capas o solo para practicar?») y el Bloque 8 («Usar el futuro de
  práctica»), pasan por el mismo lector de rejillas ASCII que las capas del
  usuario y no provienen de ninguna base climática. 7 pruebas nuevas.
- Corregido: una capa con la misma rejilla que la primera salía
  «remuestreada», porque el borde de la ventana caía en 32.99999 celdas y se
  redondeaba hacia abajo (`js/raster.js`, lectores GeoTIFF y ASCII). Prueba
  nueva.
- Corregido: en el laboratorio de coocurrencia (Bloque 1), el «grupo objetivo»
  usaba solo las celdas con registros de las dos especies; ese universo
  empuja la prueba hacia «menos de lo esperado» aunque la verdad sea el azar.
  Ahora incluye los registros de otros taxones del mismo grupo que el
  muestreador levanta donde muestrea, como pide el método, y el mensaje ya
  solo dice que los tres universos coinciden cuando es cierto.
- Corregido: la tarjeta del Bloque 8 en la portada ofrecía importar mapas de
  idoneidad hechos en otro programa, cosa que la app no hace.
- La columna «Fuentes» de las interacciones publicadas (Bloque 2) solo aparece
  cuando la base devuelve la cita del estudio; la consulta agregada casi nunca
  la trae y la columna salía siempre vacía.
- Mapa de coincidencias (Bloque 4): las celdas con planta y visitante tienen
  un color propio fuerte y las de un solo papel, tonos claros; antes «planta y
  visitante» y «solo visitantes» salían en dos ámbares casi iguales, y la
  leyenda no mostraba la transparencia del mapa.
- Recorte del mapa (Bloque 4): el contorno exterior ya no deja trazos cortos
  dentro del área donde las fronteras simplificadas de dos estados vecinos no
  coinciden punto por punto (se comprueba que el borde tenga tierra de un solo
  lado). Y cambiar una opción del estudio antes de abrir el Bloque 4 ya no da
  error.
- Distancia al visitante más cercano (Bloque 5 e informe): se reportan las dos
  colas, «más cerca» y «más lejos» de lo esperado; antes solo la primera, y un
  visitante más lejos de lo esperado no se señalaba.
- Figuras: las etiquetas de las líneas verticales (observado, esperado, D…) que
  no cabían a la derecha se cortaban en el borde; ahora se escriben a la
  izquierda de la línea. Las de ±1.96 de la sensibilidad a la celda ya no las
  tapa el último punto.
- Estudio de figuras: elegir una paleta cerraba el panel (el clic venía de un
  botón que el panel acababa de redibujar); ahora sigue abierto. La misma
  protección en el menú de exportar de cada figura.
- Las medianas del cuadro «Variable por variable» (Bloque 7) se redondean
  según su tamaño (2,270 mm, 22.7 °C) en vez de llevar siempre tres decimales.
- Manual de usuario en español en `manual/`.

## 1.1.0 — 27 de septiembre de 2026

- **Estudio de mapa** en el Bloque 4 (`js/mapstudio.js`), en ocho pestañas:
  mapa base vectorial (fondo, mar, tierra, límites de estados y países,
  nombres o abreviaturas de los estados, retícula con etiquetas, marco);
  encuadre (ajustado, México, estados elegidos, mundo o coordenadas propias,
  leyenda fuera del mapa) y recorte a México o a estados con su silueta
  exterior; textos y fuentes (título, subtítulo, crédito, título de la
  leyenda, seis familias genéricas, tamaños, negritas, cursivas, color);
  elementos (flecha del norte en ocho diseños, escala gráfica en ocho
  formatos —bloques, escalonada, sólida, línea, regla, km y millas, texto y
  1:n—, leyenda en 1–3 columnas con cuatro recuadros); datos (puntos, mapa de
  calor, rejilla de registros, rejilla de coincidencias, envolventes; seis
  formas; tamaño, opacidad, contorno y halo; color, forma y visibilidad de
  cada unidad); seis paletas y seis rampas propias; seis estilos listos
  (publicación, blanco y negro, presentación oscura, guía de campo, cartel,
  solo datos), guardar y cargar estilos; exportación a PNG, JPEG, WebP, SVG,
  TIFF y GeoTIFF (WGS 84), a tamaño de pantalla, A4, carta, diapositiva,
  columna simple, columna y media, doble columna o a medida, de 150 a 900 ppp.
- **Editor de cada figura** (`js/figedit.js`): botón ✎ en todas las figuras
  con textos editables uno por uno, sustitución de cada color, familia
  tipográfica, tamaño general del texto, grosor de líneas, tamaño de puntos,
  rejilla, fondo y color de ejes; los cambios se conservan al recalcular y
  salen en la exportación, el informe y el paquete.

## 1.0.0 — 27 de septiembre de 2026

Primera versión completa: los diez bloques.

- **Bloque 1** — portada con ilustración propia, teoría, galería de veinte
  métodos, comparación de fuentes de datos, 60 referencias y dos laboratorios
  (coocurrencia con sesgo de muestreo; solapamiento fenológico circular).
- **Bloque 2** — lista de estudio con siete sistemas cultivo–visitante de
  ejemplo; resolución de nombres en GBIF que elige el reino por el papel y
  prefiere el nombre canónico exacto con el rango acorde (evita homónimos:
  *Trigona* la abeja y no el caracol; *Cucurbita* el género y no un fósil);
  descarga paginada con reintentos y conservación de lo descargado si se corta;
  interacciones publicadas en ambas direcciones; importador de registros y de
  visitas con reconocimiento de columnas; datos de práctica ficticios con
  errores sembrados; autoguardado en la base local del navegador.
- **Bloque 3** — quince reglas de depuración, corrección de coordenadas
  invertidas o sin signo, centroides calculados con dos definiciones,
  cultivados por planta, sinónimos, unidad de análisis, reporte para métodos.
- **Bloque 4** — mapa sin internet con rejilla de coincidencias y coropletas.
- **Bloque 5** — coocurrencia hipergeométrica, grupo objetivo, BH,
  sensibilidad a la escala, vecino más cercano, envolventes.
- **Bloque 6** — estadística circular, fenograma, rosa, esfuerzo, altitud.
- **Bloque 7** — lector propio de GeoTIFF (LZW, Deflate, PackBits,
  predictores) y ASCII, nicho en el espacio ambiental con pruebas.
- **Bloque 8** — tres modelos de idoneidad, validación cruzada, desajuste
  planta–visitante actual y futuro, extrapolación.
- **Bloque 9** — red bipartita con índices, modelos nulos y completitud; con
  una sola planta, sus visitantes y la completitud.
- **Bloque 10** — catálogo de figuras, informe con métodos redactados y
  conjuntos de GBIF por citar, paquete `.zip`.
- 154 pruebas.
