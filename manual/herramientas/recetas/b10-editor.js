/* Bloque 10: el editor ✎ abierto sobre el fenograma (Bloque 6), pestaña «Textos» */
(async () => { await carga(); await par6(); const p = pane('b6Phenogram'); irA(p, 20); await W(300); p.querySelector('.fig-ed').click(); await W(700);
  const t = [...document.querySelectorAll('.fe-tab')].find(b => /Textos/.test(b.textContent)); if (t) t.click(); await W(600);
const box = document.querySelector('.fe-tabs').parentElement;
  const a = p.getBoundingClientRect(), b = box.getBoundingClientRect(); window.__recorte = [a.left - 6, Math.min(a.top, b.top) - 6, b.right - a.left + 12, a.bottom - Math.min(a.top, b.top) + 12].map(Math.round).join(','); return window.__recorte; })()
