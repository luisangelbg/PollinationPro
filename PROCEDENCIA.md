# Procedencia de PollinationPro

Este documento dice, elemento por elemento, qué partes de PollinationPro son
obra propia y cuáles no lo son, de dónde salen estas últimas y en qué situación
quedan. Se escribió para acompañar el registro de la obra ante el INDAUTOR y
para que cualquiera pueda comprobar lo que aquí se afirma sin tener que creerlo.

Última revisión: 27 de septiembre de 2026 (versión 1.2.1).

---

## 1. En una frase

PollinationPro no contiene código de nadie más. Contiene métodos estadísticos
publicados —citados a su publicación original en el propio código, en la
portada y en el informe— y los contornos de los países y de los estados de
México de Natural Earth, que son de dominio público. No trae ningún dato de
terceros: los registros de GBIF, las interacciones publicadas y las capas
climáticas las descarga o las elige el usuario cuando usa el programa.

**Para el formulario del INDAUTOR: marcar solo «Es primigenia».** El programa
no adapta, traduce ni compila otra obra.

---

## 2. Lo que el programa no tiene

- **Ninguna biblioteca de terceros.** Ni de gráficas, ni de mapas, ni de
  estadística, ni de lectura de archivos. Las figuras son SVG dibujado por
  `js/plotkit.js`, `js/art.js` y cada bloque; los mapas los dibuja el
  programa con sus propios contornos (`js/geo.js`); el lector de GeoTIFF
  (`js/raster.js`) y el de hojas de cálculo `.xlsx` (`js/tableio.js`) están
  escritos desde las especificaciones públicas de esos formatos; el paquete
  `.zip` lo escribe `js/zip.js` byte a byte. La descompresión Deflate la hace
  el propio navegador (`DecompressionStream`); la LZW del formato TIFF está
  escrita en `js/raster.js`.
- **Nada que se cargue de la red al abrir.** `index.html` no apunta a ningún
  servidor externo: el ícono está incrustado y todos los archivos son locales.
  Solo cuando el usuario lo pide, el programa consulta dos servicios públicos:
  GBIF (`api.gbif.org`) y Global Biotic Interactions
  (`api.globalbioticinteractions.org`). Lo que devuelven se queda en la
  computadora del usuario.
- **Código minificado, empaquetado o pegado.** No hay carpeta `vendor/`, ni
  `node_modules/`, ni paso de compilación.
- **Datos de terceros.** Los datos de práctica (`js/examples.js`) son
  **ficticios**: los genera el programa con un generador de números
  aleatorios con semilla, alrededor de centros inventados; los nombres de los
  taxones son reales para que el ejemplo se lea como un estudio, pero ningún
  punto, fecha ni conteo reproduce una observación real, y así lo dicen la
  app y el informe.
- **Capas climáticas.** El programa no trae ninguna capa de terceros. Las bases climáticas
  globales no permiten redistribuir sus archivos; el usuario las descarga una
  vez desde su sitio y las elige en el Bloque 7. Las **capas de práctica**
  (Bloques 7 y 8) no son datos de nadie: las genera `js/examples.js` en el
  momento, con reglas simples sobre un relieve inventado, y son obra propia.
  La carpeta `tools/local/`,
  si existe en la computadora del autor, guarda capas usadas solo para
  probar, está excluida del repositorio (`.gitignore`) y **no forma parte de
  la obra ni del ejemplar**.

---

## 3. Contornos geográficos (datos de dominio público)

**Dónde:** `data/mexico-states.js` (las 32 entidades federativas, del conjunto
admin-1 a escala 1:10 millones, simplificadas) y `data/world.js` (los países,
del conjunto admin-0 a escala 1:110 millones). **Fuente:** Natural Earth
(naturalearthdata.com), que declara todos sus datos de **dominio público**.
Los mismos archivos usan BioModellingPro, SciMetricsPro y GermplasmPro, del
mismo autor. **Situación:** se pueden incluir y redistribuir sin restricción;
se mencionan por cortesía. Son datos, no código, y no forman parte del
ejemplar del programa.

---

## 4. Métodos publicados

Cada método está escrito en JavaScript por el autor a partir de su publicación
original, que se cita en el comentario del archivo, en la ficha de ayuda y en
el informe. Una fórmula o un algoritmo publicado no es objeto de derecho de
autor; su escritura en un programa sí lo es, y es propia.

| Archivo | Métodos | Publicaciones |
|---|---|---|
| `js/engine.js` | funciones especiales, hipergeométrica, índices de solapamiento, estadística circular, kernel, ACP, geometría esférica, rarefacción, Chao1, ajuste de p | Press et al. 2007; Veech 2013; Schoener 1968; Warren et al. 2008; Pianka 1973; Levins 1968; Hurlbert 1978; Zar 2010; Fisher 1993; Silverman 1986; Andrew 1979; Sutherland y Hodgman 1974; Chamberlain y Duquette 2007; Hurlbert 1971; Chao 1987; Benjamini y Hochberg 1995; Davison y Hinkley 1997 |
| `js/clean.js` | depuración de registros | Chapman 2005; Zizka et al. 2020 |
| `js/cooc.js` | coocurrencia, grupo objetivo, vecino más cercano | Veech 2013; Phillips et al. 2009 |
| `js/pheno.js` | fenología circular | Batschelet 1981; Zar 2010; Morellato et al. 2010 |
| `js/niche.js` | nicho en el espacio ambiental | Broennimann et al. 2012; Warren et al. 2008 |
| `js/sdm.js` | envolvente, Mahalanobis, logística con fondo, AUC, TSS | Nix 1986; Farber y Kadmon 2003; Phillips et al. 2009; Allouche et al. 2006; Liu et al. 2005; Elith et al. 2010 |
| `js/network.js` | NODF, H₂′, d′, modularidad, fuerza, modelos nulos | Almeida-Neto et al. 2008; Blüthgen et al. 2006; Barber 2007; Liu y Murata 2010; Beckett 2016; Bascompte et al. 2006; Strona et al. 2014; Patefield 1981 |
| `js/raster.js` | lectura de GeoTIFF y rejilla ASCII | especificación TIFF 6.0 (Adobe, 1992) y GeoTIFF 1.0 |

**Cómo se comprobó:** `tests/index.html` ejecuta 154 pruebas: valores
publicados (cuantiles normales y de ji cuadrada, distribución F), aritmética
entera exacta (la hipergeométrica), fórmulas cerradas resueltas a mano (D, I,
Pianka, Hurlbert, Chao1, Benjamini–Hochberg, áreas en la esfera), una
implementación independiente en sentido inverso (un codificador LZW contra el
decodificador), archivos GeoTIFF construidos byte por byte, y simulaciones
bajo la hipótesis nula (tasas de rechazo de las pruebas de coocurrencia, de
distancias, de Rayleigh, de Watson–Williams y de equivalencia de nicho).

---

## 5. Nombres de programas y marcas

El programa y su documentación no nombran programas de terceros ni marcas
comerciales. Las bases de datos que el usuario consulta (GBIF, Global Biotic
Interactions) se nombran porque son la fuente de los datos y su cita es
obligatoria. «MaxEnt» aparece solo como parte del título de un artículo de
métodos (Elith et al. 2011) en la lista de referencias.

---

## 6. Autoría

Luis Ángel Barrera-Guzmán (ORCID 0000-0001-8057-2583).
