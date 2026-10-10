# PollinationPro · Validación contra R

El motor de cálculo del programa se compara, número por número, con paquetes de R escritos por otras personas.
Cada guion de referencia (`ref_*.R`) genera sus datos con semilla fija, calcula con R y deja datos y resultados en
un archivo `ref_*.js`. La página `index.html` de esta carpeta corre el código del programa (`js/*.js`, sin la
interfaz) sobre esos mismos datos y compara. Se abre con doble clic; todo debe salir en verde.

**Resultado: 34 299 comparaciones, 0 en desacuerdo** (R 4.4.2; informe completo en `reporte.txt`).

| Sección | Guion de referencia | Paquetes de R | Qué se compara | Comparaciones |
|---|---|---|---|---|
| Motor numérico | `numerico/ref_numerico.R` | stats, ks 1.15.1 | log Γ, coeficientes binomiales, normal, gamma y beta incompletas, ji cuadrada, F, hipergeométrica; media, desviación, cuantiles, ancho de banda de Silverman, Benjamini-Hochberg; densidades de núcleo en una y dos dimensiones; componentes principales (valores, vectores, puntajes) | 12 044 |
| Bloque 5 · Coocurrencia | `block5/ref_block5.R` | cooccur 1.3, stats, vegan 2.6.10, geosphere 1.6.8, sf 1.1.0, grDevices | celdas ocupadas y compartidas, esperadas y probabilidades del modelo de Veech en tres tamaños de celda; Jaccard, Sørensen, Simpson; ajuste por pruebas múltiples y veredictos; distancias en la esfera; prueba del vecino más cercano; envolvente convexa, su área y la parte compartida | 1 205 |
| Bloque 6 · Fenología y altitud | `block6/ref_block6.R` | circular 0.5.2, CircStats 0.2.6, dismo 1.3.16, spaa 0.2.5 | día del año; vector medio, fecha media y desviación circular; Rayleigh; concentración κ; Watson-Williams; D de Schoener, I de Warren y O de Pianka de los perfiles mensuales, con y sin corrección por esfuerzo; amplitud de Levins; desfase; clases de altitud | 1 473 |
| Bloque 7 · Capas | `block7/ref_capas.R` | terra 1.8.29 | lectura de 11 variantes de GeoTIFF (reales de 32 y 64 bits, enteros de 8, 16 y 32; sin comprimir, LZW, Deflate y PackBits; con predictor horizontal y de reales; en franjas y en mosaico), completas y recortadas; rejilla ASCII; valor en un punto (celda y bilineal) | 16 467 |
| Bloque 7 · Nichos | `block7/ref_block7.R` | stats, ks, dismo, ecospat 4.1.2 | ejes del espacio ambiental, anchos de banda, ambiente disponible; D e I entre 10 pares, con y sin corrección por el ambiente; concordancia con ecospat | 72 |
| Bloque 8 · Distribuciones potenciales | `block8/ref_block8.R` | dismo, stats, glmnet 4.1.8, pROC 1.18.5, terra, geosphere | envolvente climática; idoneidad de Mahalanobis; coeficientes e idoneidad de la logística penalizada; AUC; umbrales, sensibilidad, especificidad y TSS máxima; área de las celdas | 2 040 |
| Bloque 9 · Redes | `block9/ref_block9.R` | bipartite 2.24, vegan, SpadeR 0.1.1 | conectancia, NODF (total, plantas, visitantes), H₂ y H₂′, grado, grado normalizado, fuerza y d′ de 155 especies en 7 redes; modularidad Q; modelos nulos de totales fijos; Chao1 y rarefacción | 998 |

## Correr

```
powershell -ExecutionPolicy Bypass -File validation\correr.ps1
```

rehace las referencias con R y escribe `reporte.txt`. Con `-SoloComparar` usa las referencias ya calculadas (no
hace falta R). Para ver el informe en pantalla basta abrir `validation/index.html`.

## Tres clases de comparación

- **Un número contra R**, con una tolerancia relativa que el informe muestra junto al mayor error encontrado.
- **Un valor exacto**: un conteo, un veredicto, los vértices de una envolvente.
- **Un resumen de simulaciones**: los modelos nulos usan números al azar y el generador del programa no es el de R.
  Se simula el mismo modelo en los dos y se pide que las medias y las desviaciones difieran menos de cinco errores
  estándar.

## Errores que atrapó la validación

1. **d′ no usaba el máximo publicado.** El programa tomaba como máximo el reparto más desigual que permitían los
   totales de los compañeros; Blüthgen et al. (2006) y bipartite usan ln(T/Aᵢ). El d′ salía más alto, a veces
   varias veces. Ya usa el máximo publicado y coincide con bipartite en las 155 especies.
2. **TSS máxima mal buscada.** El umbral se buscaba entre a lo más 400 candidatos redondeados a cuatro decimales;
   con puntajes muy juntos se quedaba hasta 0.16 por debajo de la TSS máxima. Ahora cada puntaje es candidato y
   coincide con pROC.
3. **Idoneidades de Mahalanobis muy pequeñas se volvían cero.** La cola superior de ji cuadrada se calculaba como
   1 − P y perdía todas las cifras por debajo de 1e-16. Ahora se calcula directamente.
4. **El modelo nulo binario mezclaba poco.** Con cinco intercambios por fila la matriz simulada todavía se
   parecía a la observada (en una red anidada, 0.4 unidades de NODF). Con veinte ya no cambia.
5. **Extremos de H₂′ poco ajustados.** H₂ máxima y mínima se buscan, no se calculan; en una red la máxima del
   programa quedaba por debajo de la de bipartite. Ahora la búsqueda se mejora moviendo visitas sin alterar los
   totales, y sus extremos nunca son peores que los de bipartite.
6. **Módulos.** A la búsqueda se le añadió una etapa de refinamiento; queda a lo más 0.002 de Q por debajo de la
   de bipartite y en una red la supera.

## Diferencias que no son errores

- **Watson-Williams.** El factor de corrección K = 1 + 3/(8κ) admite dos lecturas: Zar (2010, ec. 27.14) y el
  programa toman κ de la media ponderada de los vectores de cada grupo; circular, de la muestra reunida. Con el
  mismo factor los dos F coinciden a 1e-11; con factores distintos difieren hasta 38 % cuando las fechas medias
  están muy separadas (los dos resultados son igual de significativos en esos casos).
- **Rayleigh.** El valor p sale de una aproximación (Zar 2010, ec. 27.4); circular y CircStats usan otra. La mayor
  diferencia fue 0.0009.
- **H₂′.** Como los extremos del programa son más ajustados que los de bipartite en 4 de 7 redes, H₂′ difiere
  hasta 0.0055. Con los extremos de bipartite, la fórmula del programa da exactamente el H₂′ de bipartite.
- **Traslape de nichos frente a ecospat.** ecospat suaviza con otro ancho de banda. Los mismos pasos repetidos en
  R con el ancho de banda del programa coinciden a 0.0005; frente a ecospat la D difiere hasta 0.12, con
  correlación 0.988 entre los 10 pares.
- **Áreas.** El área de una envolvente se mide con lados rectos en longitud y latitud; con lados de círculo
  máximo difiere hasta 0.8 %. El área de las celdas se mide en una esfera; frente al elipsoide WGS84 difiere 0.4 %.
- **Densidades de núcleo.** El programa corta el núcleo gaussiano a cuatro anchos de banda; la diferencia con el
  núcleo completo es menor que 0.0001 del máximo.
- **Normal acumulada.** Usa una aproximación con error relativo menor que 1.2e-7; ningún bloque depende de ella.
- **Chao1.** vegan no lleva el factor (N − 1)/N de Chao et al. (2005); SpadeR sí, y coincide.

## Lo que esta validación no cubre

La depuración de registros del Bloque 3 (reglas sobre las fronteras que trae el programa) y la consulta de
fuentes del Bloque 2 no tienen equivalente directo en R; las cubren las pruebas de `tests/index.html`. Las pruebas
de equivalencia y similitud de nichos y la validación cruzada de los modelos son simulaciones construidas con
piezas que sí se comparan aquí.
