# PollinationPro

**Plantas, polinizadores y su solapamiento · Plants, pollinators and their overlap**

Plataforma en el navegador para llevar un estudio de plantas y sus visitantes
florales desde los registros de presencia hasta un artículo. Sirve para
**cualquier cultivo, pariente silvestre o planta nativa** y **cualquier grupo
de visitantes** (abejas, abejorros, meliponinos, moscas, mariposas,
murciélagos, aves). Español e inglés, tema claro y oscuro, sin instalar nada
y sin bibliotecas de terceros.

A browser-based platform that takes a study of plants and their flower visitors
from occurrence records to a paper. It works for any crop, crop wild relative or
native plant and any group of visitors. Spanish and English, light and dark
theme, nothing to install and no third-party libraries.

## Cómo abrirla · How to open it

Doble clic en `index.html`. Solo la descarga de GBIF y la búsqueda de
interacciones publicadas necesitan internet. Para abrirla desde otro equipo de
la red, ejecuta `Open PollinationPro.bat` (servidor local en el puerto 9750).

Double-click `index.html`. Only the GBIF download and the search for published
interactions need the internet.

## Los diez bloques · The ten blocks

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

## Manual · User manual

`manual/PollinationPro User's Manual.pdf` — manual de usuario en español (111 hojas
tamaño carta): introducción, un capítulo por bloque y apéndices, con capturas del
estudio de práctica. Las partes en HTML están en `manual/es/`.

## Validación · Validation

`tests/index.html` ejecuta 162 pruebas contra valores publicados, aritmética
exacta, fórmulas resueltas a mano, implementaciones independientes y
simulaciones bajo la hipótesis nula. Ábrela con doble clic: todo debe salir en
verde.

## Datos · Data

El programa no trae datos de terceros. Los registros de GBIF y las
interacciones publicadas se consultan cuando el usuario lo pide; cita cada
descarga de GBIF con su DOI. Las capas climáticas las descarga el usuario
desde su fuente; las capas de práctica del Bloque 7 son ficticias y las genera
el propio programa. Los datos de práctica son ficticios. Los contornos
geográficos son de Natural Earth (dominio público). Ver `PROCEDENCIA.md`.

## Cómo citar · How to cite

Barrera-Guzmán, L.Á. (2026). PollinationPro: a browser-based platform for
analysing plants, pollinators and their overlap with occurrence data
(Version 1.2.0) [Computer software].

## Licencia · Licence

GNU General Public License, versión 3 o posterior (`LICENSE`).
