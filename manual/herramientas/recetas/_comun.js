/* Ayudas que captura.ps1 antepone a cada receta. Todas las capturas del manual usan el estudio de práctica
   «Cucurbitáceas y abejas de la calabaza» (ficticio, con semilla fija), depurado con los valores por omisión
   del Bloque 3, y, en los Bloques 7 y 8, las capas de práctica del programa. */
var W = ms => new Promise(r => setTimeout(r, ms));
/* the sticky top bar would cover whatever is scrolled under it: in the captures it scrolls with the page */
(function () { const t = document.querySelector('.topbar'); if (t) t.style.position = 'relative'; })();
var q = s => document.querySelector(s);
var top_ = n => n.getBoundingClientRect().top + window.scrollY;
var irA = (n, off = 96) => window.scrollTo({ top: top_(n) - off, behavior: 'instant' });
/* recorte que abarca varios nodos, con p píxeles de margen; lo lee captura.ps1 */
var caja = (nodos, p = 8) => {
  const rs = nodos.filter(Boolean).map(n => n.getBoundingClientRect());
  const x = Math.max(0, Math.min(...rs.map(r => r.left)) - p), y = Math.max(0, Math.min(...rs.map(r => r.top)) - p);
  window.__recorte = [x, y, Math.max(...rs.map(r => r.right)) + p - x, Math.max(...rs.map(r => r.bottom)) + p - y].map(Math.round).join(',');
  return window.__recorte;
};
var pane = id => document.getElementById(id).closest('.pg-pane');
var tarjeta = (n, i) => document.querySelectorAll('#panel-' + n + ' .card')[i];
var hasta = async (cond, ms = 30000) => { const t0 = Date.now(); while (!cond() && Date.now() - t0 < ms) await W(150); };
/* el estudio de práctica, depurado */
var carga = async () => {
  await W(600);
  goStep(2); await W(300);
  q('#b2PracticeBox').open = true;
  q('[data-example="cucurbits"]').click();
  await hasta(() => state.raw && state.raw.length > 2000); await W(600);
  goStep(3); await W(600);
  q('#b3Run').click();
  await hasta(() => state.clean && state.clean.records.length > 1000); await W(800);
};
/* las capas de práctica y el espacio ambiental (Bloque 7) */
var capas = async (correr = true) => {
  goStep(7); await W(600);
  q('#b7PracticeBox').open = true;
  q('#b7Practice').click();
  await hasta(() => state.rasters && state.rasters.practice); await W(500);
  if (correr) { q('#b7Run').click(); await hasta(() => q('#b7Body2').style.display !== 'none', 60000); await W(1500); }
};
/* los modelos del Bloque 8 */
var modelos = async (futuro = false) => {
  goStep(8); await W(600);
  q('#b8Run').click(); await hasta(() => q('#b8Body2').style.display !== 'none', 90000); await W(1200);
  if (futuro) { q('#b8FutPractice').click(); await hasta(() => q('#b8FutBody').style.display !== 'none', 60000); await W(800); }
};
/* el estudio de mapa del Bloque 4 en una pestaña (0 mapa base … 7 exportar) con algunos cambios */
var mapa = async (tab = 0, cambios = {}, look = null, alto = true) => {
  goStep(4); await W(900);
  if (look) { q('#b4Studio [data-look="' + look + '"]') || [...document.querySelectorAll('#b4Studio .ms-tabs button')][6].click(); await W(300); const b = q('#b4Studio [data-look="' + look + '"]'); if (b) b.click(); await W(500); }
  for (const k in cambios) { MapStudio.set(k, cambios[k]); await W(120); }
  [...document.querySelectorAll('#b4Studio .ms-tabs button')][tab].click(); await W(900);
  const s = q('#b4Studio'); irA(s, 12); await W(400); if (!alto) return caja([s], 4);
  const r = s.getBoundingClientRect(), m = q('#b4Map').closest('.pg-pane').getBoundingClientRect();
  window.__recorte = [r.left - 4, r.top - 4, r.width + 8, m.bottom - r.top + 12].map(Math.round).join(','); return window.__recorte;
};
/* el Bloque 5 con el par chayote × Xenoglossa elegido en la matriz */
var par5 = async (planta = 'Sechium edule', visitante = 'Xenoglossa') => {
  goStep(5); await W(2500);
  const g = q(`#b5Matrix [data-pair="${planta}|${visitante}"]`);
  if (g) g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await W(2500);
};
/* el Bloque 6 con un par elegido */
var par6 = async (planta = 'Sechium edule', visitante = 'Xenoglossa') => {
  goStep(6); await W(2500);
  const a = q('#b6Plant'), b = q('#b6Visitor');
  a.value = planta; a.dispatchEvent(new Event('change')); await W(600);
  b.value = visitante; b.dispatchEvent(new Event('change')); await W(1500);
};
/* el Bloque 9 con los modelos nulos corridos */
var red = async (nulos = true) => {
  goStep(9); await W(2500);
  if (nulos) { q('#b9Null').click(); await hasta(() => !q('#b9Null').disabled && /z =/.test(q('#b9Tiles').innerText), 90000); await W(800); }
};
/* el estudio completo: todos los bloques calculados, para el Bloque 10 */
var todo = async () => {
  await carga();
  await par5(); await par6();
  await capas(true); await modelos(true);
  await red(true);
  goStep(4); await W(1500);
  goStep(10); await W(2500);
};
