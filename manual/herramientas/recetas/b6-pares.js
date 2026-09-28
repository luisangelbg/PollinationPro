/* Bloque 6: la tabla de todos los pares fenológicos */
(async () => { await carga(); await par6(); const d = q('#b6Pairs').closest('details'); d.open = true; await W(400); irA(d, 10); await W(300); return caja([d], 8); })()
