/* Bloque 6: el fenograma corregido por el esfuerzo mensual del grupo objetivo */
(async () => { await carga(); await par6(); const k = q('#b6Corr'); k.checked = true; k.dispatchEvent(new Event('change')); await W(2000); const c = tarjeta(6, 0); irA(c, 10); await W(300); return caja([c.querySelector('.pg-controls'), q('#b6Tiles'), pane('b6Phenogram')], 10); })()
