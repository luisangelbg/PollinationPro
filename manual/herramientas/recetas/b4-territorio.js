/* Bloque 4: registros por estado y por país */
(async () => { await carga(); goStep(4); await W(1200); const c = tarjeta(4, 1); irA(c, 10); await W(300); return caja([c], 2); })()
