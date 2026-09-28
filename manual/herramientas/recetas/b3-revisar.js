/* Bloque 3: revisar las coordenadas corregidas */
(async () => { await carga(); const s = q('#b3Show'); const o = [...s.options].find(o => /corregidas/.test(o.textContent)); s.value = o.value; s.dispatchEvent(new Event('change')); await W(600);
  const h = [...q('#b3Report').querySelectorAll('h3')].find(h => /Revisar/.test(h.textContent)); irA(h, 10); await W(300); return caja([h, q('#b3Records'), q('#b3Next')], 8); })()
