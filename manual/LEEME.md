# Manual de usuario de PollinationPro

El manual se escribe por partes, en HTML, con el mismo estilo que los manuales de PhenologyPro, EconomicsPro,
PhylogenyPro y las demás apps LABG. Primero se hace en español; la versión en inglés se decide al final. Cuando
todas las partes están listas se unen en un solo documento y se imprime a PDF una sola vez.

```
manual/
  manual.css           hoja común: tamaño carta y marco de la portada
  interior.css         páginas interiores: hojas blancas, vivos en verde profundo y negro, un color por bloque
  paginar.js           reparte el contenido en hojas tamaño carta (encabezados, números de página, índice)
  img/                 capturas de pantalla de la app
  herramientas/
    captura.ps1        abre la app, ejecuta una receta y guarda la captura en img/ al doble de resolución
    recetas/           una receta por captura (JS); _comun.js tiene las ayudas que todas comparten
    evaluar.ps1        abre una página sin ventana, ejecuta un guion y escribe el resultado
    huecos.js          guion para evaluar.ps1: el hueco al pie de cada hoja de una parte del manual
    unir-manual.ps1    une la portada y las partes en es/manual-completo.html para imprimir el manual completo
  es/
    00a-portada.html   portada blanca: el año como un círculo con la floración de una planta y el vuelo de su
                       abeja, una flor de cucurbitácea con una abeja de la calabaza, seis sistemas de cultivo y
                       sus visitantes, y cuatro viñetas (coocurrencia, nichos, desajuste, red), todo dibujado con
                       gráficos vectoriales originales y semilla fija
```

Las capturas se toman con la app abierta desde el servidor local o `file://`, en español, tema claro, 1400 píxeles
de ancho, al doble de resolución, con el **estudio de práctica «Cucurbitáceas y abejas de la calabaza»** depurado
con los valores por omisión y, en los Bloques 7 y 8, las **capas de práctica** del programa. Las figuras del
Bloque 2 que muestran GBIF y la base de interacciones son consultas reales del 27 de septiembre de 2026. Todos
los números del manual salen de esas corridas.

## Partes

| Parte | Archivo | Contenido |
|---|---|---|
| 1 | `00a-portada.html` | portada |
| 2 | `00b-introduccion.html` | créditos, índice general, cómo leer el manual e introducción I.1–I.9 |
| 3–12 | `01-bloque1.html` … `10-bloque10.html` | un capítulo por bloque (capítulo N = Bloque N), cada uno con sus avisos |
| 13 | `11-apendices.html` | apéndices A–F: archivos, reglas de decisión, glosario, cuando algo no sale, referencias, licencia y cita |

## Colores por bloque

Los de la app: verde profundo `#1f5a3a` (preliminares), verde `#2e7d4f` (1), oro `#d99a1e` (2), violeta
`#7b5ea7` (3), azul `#2f6fb0` (4), óxido `#b8452f` (5), turquesa `#3aa39a` (6), tierra `#8a6a4a` (7),
rosa `#c0406a` (8), oliva `#8a9a2a` (9), pizarra `#5f6b86` (10) y negro (apéndices).

## Cómo se trabaja

1. Cada parte se abre con doble clic y se ve ya paginada. Se revisa el hueco al pie de cada hoja con
   `evaluar.ps1 -ScriptFile herramientas\huecos.js -Page manual/es/NN-….html`.
2. Las capturas se toman con `captura.ps1 -Receta <nombre> [-Alto 1400]`; cada receta deja en `window.__recorte`
   el recorte que necesita. La herramienta local `tools/local/shot.ps1` abre el navegador sin ventana con un perfil
   limpio y sin el freno de temporizadores de las pestañas de fondo (las recetas del Bloque 10 recorren el estudio
   completo).
3. Al terminar: `powershell -ExecutionPolicy Bypass -File herramientas\unir-manual.ps1 es` desde `manual/`, y se
   imprime `es/manual-completo.html` a PDF con `tools\local\shot.ps1 -Pdf`.
