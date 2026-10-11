# Nota de reproducibilidad · *Sechium* × *Xenoglossa* en el sur de México

**English summary.** The PollinationPro analysis of the article below was rerun from its GBIF download with the
archived versions of the program. Every count, test and index of the article is reproduced exactly, with one
exception: the cross-validated TSS of the two distribution models is 0.108 and 0.341 with the archived versions
(the article reports 0.111 and 0.333). Version 1.2.2 corrected the search of the maximum-TSS threshold; with it
the areas of the mismatch map change by less than 1 % and the percentages (24 % / 76 %) do not change.

## El artículo

Barrera-Guzmán, L. A., Cadena-Iñiguez, J., Cadena-Zamudio, D. A., Cadena-Zamudio, J. D., & Mojica-Zárate, H. T.
(2026, en prensa). Spatial relationships between wild and cultivated populations of *Sechium* spp. and their
specialist pollinators (*Xenoglossa* Smith, including *Peponapis* Robertson) in southern Mexico: co-occurrence,
phenology and niche overlap. *Agro Productividad*.

El segundo análisis del artículo (coocurrencia, fenología, traslape de nicho y desajuste espacial) se hizo con
PollinationPro. Esta nota dice cómo rehacerlo y qué cifras resultan con cada versión archivada del programa.

## Qué versión se usó

El artículo se corrió con una versión de trabajo anterior a la primera archivada, que el texto llama 1.0.0. Las
versiones con DOI son la 1.2.0, la 1.2.1 (10.5281/zenodo.23004728) y la 1.2.2 (10.5281/zenodo.23289560). Para
reproducir las cifras publicadas se usa la **1.2.1**; para un análisis nuevo, la más reciente.

## Cómo rehacerlo

1. **Registros (Bloque 2).** Lista de estudio: *Sechium edule*, *S. chinantlense*, *S. compositum*, *S. hintonii*
   y *S. mexicanum* como plantas; *Xenoglossa* y *Peponapis* como visitantes. País: México; con coordenadas y sin
   problemas geoespaciales. La descarga del artículo es https://doi.org/10.15468/dl.6kqaks (27 de septiembre de
   2026, 3,570 registros). GBIF crece: una descarga hecha después trae registros nuevos, y para reproducir el
   artículo hay que quedarse con los identificadores de aquella.
2. **Depuración (Bloque 3).** Área de estudio: Chiapas, Guerrero, Oaxaca y Veracruz. Reglas por omisión, con dos
   cambios: «coordenadas redondeadas» y «registros anteriores a 1950» en *quitar* (por omisión solo marcan). El
   sinónimo *Peponapis* → *Xenoglossa* activo; unidad de análisis: la entrada de la lista.
3. **Coocurrencia (Bloque 5).** Celdas de 0.25°, universo del grupo objetivo.
4. **Fenología (Bloque 6).** Perfiles sin corrección por esfuerzo.
5. **Nicho (Bloque 7).** Las 19 variables bioclimáticas de WorldClim 2 y la altitud, a 30 segundos de arco,
   recortadas con el margen por omisión (±3°); fondo a 200 km o menos de los registros; densidad sin corregir.
6. **Distribución potencial (Bloque 8).** Planta: *S. edule*; visitante potencial: *Xenoglossa*; modelo logístico
   con fondo; umbral de máxima TSS; fondo del grupo objetivo.

## Lo que se reproduce exactamente

| Resultado del artículo | Valor |
|---|---|
| Registros depurados | 579: *S. edule* 290, *S. compositum* 38, *S. chinantlense* 28, *S. hintonii* 13, *S. mexicanum* 11, *Xenoglossa* 199 |
| Conjuntos de datos que aportan registros | 44 |
| Coocurrencia (Tabla 3) | universo de 119 celdas; *S. edule*: 82 y 47 celdas, 18 compartidas, 32.4 esperadas, SES = −5.80, p ajustada < 0.001; los otros cuatro pares, iguales a la tabla |
| Fenología (Tabla 4) | n, fecha media, R̄, D, I, O, desfase y Watson-Williams de los seis taxones, iguales a la tabla |
| Fondo ambiental | 609,719 celdas; CP1 = 52.1 %, CP2 = 22.9 % |
| Traslape de nicho (Tabla 5) | D e I de los cinco pares, iguales a la tabla (*S. edule*: D = 0.505, I = 0.806) |
| AUC de validación | *S. edule* 0.587; *Xenoglossa* 0.706 |

El número de registros que quita cada regla sale ligeramente distinto del que da el texto (duplicados 1,855
frente a 1,827; fuera del área 757 frente a 744; cultivados 157 frente a 155): un registro que incumple varias
reglas se cuenta en la primera que lo quita, y ese orden depende de qué reglas están en *quitar*. El conjunto que
queda es el mismo, como muestran las tablas que dependen de él.

## Lo que cambia según la versión

| | Artículo | Versión 1.2.1 | Versión 1.2.2 |
|---|---|---|---|
| TSS de validación, *S. edule* | 0.111 | 0.108 | 0.108 |
| TSS de validación, *Xenoglossa* | 0.333 | 0.341 | 0.341 |
| Umbral de *S. edule* | — | 0.4892 | 0.4892 |
| Umbral de *Xenoglossa* | — | 0.4418 | 0.4468 |
| Área idónea de *S. edule* (km²) | 500,399 | 500,399 | 500,366 |
| Con polinizador potencial | 24 % · 119,875 km² | 24 % · 119,875 km² | 24 % · 119,047 km² |
| Desajuste: planta sin polinizador | 76 % · 380,524 km² | 76 % · 380,524 km² | 76 % · 381,318 km² |

- **TSS.** Las versiones archivadas dan 0.108 y 0.341; los valores del artículo (0.111 y 0.333) provienen de la
  versión de trabajo. La lectura es la misma: desempeño modesto de los dos modelos.
- **Áreas.** La 1.2.2 corrigió la búsqueda del umbral de máxima TSS, que antes redondeaba los candidatos a cuatro
  decimales (ver `validation/LEEME.md`). El umbral de *Xenoglossa* pasa de 0.4418 a 0.4468 y las áreas cambian
  menos de 1 %. Los porcentajes y el mapa de desajuste no cambian.

Ninguna conclusión del artículo depende de estas diferencias.
