/* Bloque 2: las interacciones publicadas de la lista de cucurbitáceas (consulta real) */
(async () => { await W(800); goStep(2); await W(400); q('#b2Presets .preset').click(); await W(500); q('#b2Resolve').click();
  await hasta(() => state.taxa.length && state.taxa.every(t => t.status !== 'new' && t.status !== 'busy'), 60000); await W(500);
  q('#b2Globi').click(); await hasta(() => /registros de interacción|No se pudo/.test(q('#b2GlobiMsg').innerText), 120000); await W(800);
  const c = tarjeta(2, 2); irA(c, 10); await W(300); const rows = c.querySelectorAll('#b2GlobiTable tr'); return caja([c.querySelector('h2'), rows[Math.min(12, rows.length - 1)]], 10); })()
