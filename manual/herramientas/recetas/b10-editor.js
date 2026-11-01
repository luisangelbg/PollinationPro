/* Bloque 10: el editor ✎ abierto sobre el fenograma (Bloque 6), pestaña «Textos» */
(async () => { await carga(); await par6(); const p = pane('b6Phenogram'); irA(p, 20); await W(300); p.querySelector('.fig-ed').click(); await W(700);
  const t = [...document.querySelectorAll('.fe-tab')].find(b => /Textos|Texts/.test(b.textContent)); if (t) t.click(); await W(600);
const box = document.querySelector('.fe-tabs').parentElement;
  const a = p.getBoundingClientRect(), b = box.getBoundingClientRect();
  /* el editor puede abrirse a un lado de la figura o debajo de ella: el recorte abarca la figura y, si queda debajo, los primeros renglones del editor */
  const x0 = Math.min(a.left, b.left), y0 = Math.min(a.top, b.top), x1 = Math.max(a.right, b.right), y1 = b.top > a.bottom - 40 ? b.top + 400 : a.bottom;
  window.__recorte = [x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12].map(Math.round).join(','); return window.__recorte; })()
