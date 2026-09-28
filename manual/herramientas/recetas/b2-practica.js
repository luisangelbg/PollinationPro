/* Bloque 2: la lista con los datos de práctica cargados */
(async () => { await carga(); goStep(2); await W(500); const c = tarjeta(2, 0); const g = c.querySelector('.two-col'); irA(g, 20); await W(300); return caja([g, q('#b2ListMsg'), q('#b2PracticeBox')], 8); })()
