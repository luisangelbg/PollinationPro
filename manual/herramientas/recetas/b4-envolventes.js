/* Bloque 4: envolventes convexas con puntos, solo el chayote y Xenoglossa */
(async () => { await carga(); goStep(4); await W(800);
  MapStudio.units().forEach(u => { if (!/Sechium edule|Xenoglossa/.test(u.unit)) { const U = Object.assign({}, MapStudio.get().units); U[u.unit] = Object.assign({}, U[u.unit] || {}, { hidden: true }); MapStudio.set('units', U); } });
  await W(300); return mapa(4, { extent: 'mexico', mode: 'hull' }); })()
