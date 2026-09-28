/* Bloque 4: mapa de calor de los registros, pestaña «Datos» */
(async () => { await carga(); return mapa(4, { extent: 'mexico', mode: 'heat', ramp: 'heat' }); })()
