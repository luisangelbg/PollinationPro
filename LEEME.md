# PollinationPro

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23004694.svg)](https://doi.org/10.5281/zenodo.23004694) [![Pruebas](https://github.com/luisangelbg/PollinationPro/actions/workflows/pruebas.yml/badge.svg)](https://github.com/luisangelbg/PollinationPro/actions/workflows/pruebas.yml)

**Plantas, polinizadores y su solapamiento** · *English: [README.md](README.md)*

Plataforma en el navegador para llevar un estudio de plantas y sus visitantes
florales desde los registros de presencia hasta un artículo. Sirve para
**cualquier cultivo, pariente silvestre o planta nativa** y **cualquier grupo
de visitantes** (abejas, abejorros, meliponinos, moscas, mariposas,
murciélagos, aves). Español e inglés, tema claro y oscuro, sin instalar nada
y sin bibliotecas de terceros.


## Cómo abrirla

En línea: https://luisangelbg.github.io/PollinationPro/

Doble clic en `index.html`. Solo la descarga de GBIF y la búsqueda de
interacciones publicadas necesitan internet. Para abrirla desde otro equipo de
la red, ejecuta `Open PollinationPro.bat` (servidor local en el puerto 9750).


## Los diez bloques

1. **Inicio** — portada, teoría y dos laboratorios con el motor real
   (coocurrencia y sesgo de muestreo; solapamiento fenológico).
2. **Datos** — lista de estudio (plantas y visitantes a cualquier nivel
   taxonómico, con siete sistemas de ejemplo), registros de GBIF por país,
   interacciones publicadas, registros propios de presencia y de visitas
   (.csv, .txt, .tsv, .xlsx o pegado), datos de práctica ficticios.
3. **Depuración y taxonomía** — quince reglas (centroides con dos
   definiciones, coordenadas invertidas corregidas, duplicados, imprecisión,
   colecciones vivas, plantas cultivadas decididas por planta…), sinónimos
   (p. ej. *Peponapis* dentro de *Xenoglossa*), unidad de análisis y la frase
   para los métodos.
4. **Mapa** — estudio de mapa sin internet: fondo vectorial propio, ocho
   diseños de flecha y de escala, recorte, estilos, PNG/JPEG/WebP/SVG/TIFF/GeoTIFF
   a tamaño de revista, rejilla de densidad o de coincidencias y coropletas.
5. **Coocurrencia** — prueba exacta de Veech con universo del grupo objetivo,
   ajuste por falsos descubrimientos, sensibilidad al tamaño de celda,
   distancia al vecino más cercano contra un modelo nulo, envolventes.
6. **Fenología y altitud** — estadística circular (fecha media, R̄,
   Rayleigh, Watson–Williams), fenograma, rosa circular, corrección por
   esfuerzo, solapamiento altitudinal.
7. **Nicho ambiental** — lector propio de GeoTIFF y rejilla ASCII (y capas de práctica ficticias), ACP del
   ambiente, D de Schoener, I de Warren, pruebas de equivalencia y
   similitud, análisis variable por variable.
8. **Distribución potencial** — envolvente, Mahalanobis y logística con fondo;
   AUC y TSS por validación cruzada; mapa de desajuste planta–visitante,
   actual y con clima futuro.
9. **Red de interacciones** — conectancia, NODF, H₂′, d′, fuerza, modularidad,
   modelos nulos, visitantes de cada planta y completitud del muestreo.
10. **Informe** — catálogo de figuras editables una por una (✎) (PNG, JPG, SVG hasta 900 ppp), informe
    HTML con métodos redactados a partir de lo calculado y lista de conjuntos
    de GBIF que hay que citar, paquete `.zip` reproducible.

## Manual

`manual/PollinationPro User's Manual.pdf` — manual de usuario en español (111 hojas
tamaño carta): introducción, un capítulo por bloque y apéndices, con capturas del
estudio de práctica. Las partes en HTML están en `manual/es/`.

## Validación

`tests/index.html` ejecuta 168 pruebas contra valores publicados, aritmética
exacta, fórmulas resueltas a mano, implementaciones independientes y
simulaciones bajo la hipótesis nula. Ábrela con doble clic: todo debe salir en
verde.

En cada cambio, GitHub corre solas las pruebas y la validación en un navegador
sin ventana (`.github/workflows/pruebas.yml`); la insignia de arriba muestra el
último resultado.

`validation/` compara el motor de cálculo, número por número, con paquetes de R
escritos por otras personas (cooccur, vegan, geosphere, sf, circular, dismo,
spaa, ecospat, terra, glmnet, pROC, bipartite, SpadeR): **34 299 comparaciones,
0 en desacuerdo**. `validation/index.html` muestra el informe con doble clic y
`validation/LEEME.md` explica cada comparación, los errores que atrapó y las
diferencias que no son errores.

## Caso de estudio

`casos/cucurbita_xenoglossa/` recorre los diez bloques con datos reales: las calabazas (*Cucurbita*) y sus
abejas (*Xenoglossa*) en México, con 10,254 registros de GBIF y 1,061 interacciones publicadas ([LEEME](casos/cucurbita_xenoglossa/LEEME.md)).

## Datos

El programa no trae datos de terceros. Los registros de GBIF y las
interacciones publicadas se consultan cuando el usuario lo pide; cita cada
descarga de GBIF con su DOI. Las capas climáticas las descarga el usuario
desde su fuente; las capas de práctica del Bloque 7 son ficticias y las genera
el propio programa. Los datos de práctica son ficticios. Los contornos
geográficos son de Natural Earth (dominio público). Ver `PROCEDENCIA.md`.

## Cómo citar

Barrera-Guzmán, L.Á. (2026). PollinationPro: a browser-based platform for
analysing plants, pollinators and their overlap with occurrence data
(Version 1.2.4) [Computer software]. Zenodo.
https://doi.org/10.5281/zenodo.23004694

## Licencia

GNU General Public License, versión 3 o posterior (`LICENSE`).

## Cómo contribuir

Los errores y las propuestas se reciben en
https://github.com/luisangelbg/PollinationPro/issues (el botón «Reportar un
problema» de la app abre uno con el bloque y el navegador ya anotados). `CONTRIBUTING.md`
explica cómo probar un cambio antes de enviarlo.

## Uso de inteligencia artificial

El programa se desarrolló con la asistencia de un sistema de IA generativa.
`docs/ai-usage.md` dice con qué herramienta, en qué partes, qué decidió el
autor y cómo se verificaron los resultados.
