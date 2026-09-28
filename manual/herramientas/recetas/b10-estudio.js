/* Bloque 10: el estudio de figuras de la barra superior, con la paleta Okabe–Ito */
(async () => { await todo(); window.scrollTo(0, 0); await W(300); q('#figStyleBtn').click(); await W(700); const b = q('#figStylePanel [data-pal="okabe"]'); if (b) b.click(); await W(900); return caja([q('#figStylePanel')], 8); })()
