/* Bloque 6: la altitud del par después de completarla con la capa de altitud de práctica (Bloque 7) */
(async () => { await carga(); await capas(false); const s = q('#b7ElevLayer'); s.value = [...s.options].find(o => /Altitud/.test(o.textContent)).value; q('#b7ElevFill').click(); await W(1500);
  await par6(); const c = tarjeta(6, 2); irA(c, 10); await W(300); return caja([c], 2); })()
