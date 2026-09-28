/* Bloque 2: los filtros de GBIF y el conteo (consulta real) */
(async () => { await W(800); goStep(2); await W(400); q('#b2Presets .preset').click(); await W(500); q('#b2Resolve').click();
  await hasta(() => state.taxa.length && state.taxa.every(t => t.status !== 'new' && t.status !== 'busy'), 60000); await W(500);
  q('#b2Count').click(); await hasta(() => /registros con coordenadas|No se pudo/.test(q('#b2FetchMsg').innerText), 60000); await W(800);
  const c = tarjeta(2, 1); irA(c, 10); await W(300); return caja([c], 2); })()
