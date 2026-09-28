/* Bloque 2: la lista del sistema de ejemplo de cucurbitáceas, resuelta en GBIF (consulta real) */
(async () => { await W(800); goStep(2); await W(400); q('#b2Presets .preset').click(); await W(500); q('#b2Resolve').click();
  await hasta(() => state.taxa.length && state.taxa.every(t => t.status !== 'new' && t.status !== 'busy'), 60000); await W(800);
  const c = tarjeta(2, 0); irA(c, 10); await W(300); return caja([c.querySelector('h2'), q('#b2ListMsg')], 10); })()
