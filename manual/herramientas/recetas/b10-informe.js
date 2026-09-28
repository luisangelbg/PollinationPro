/* Bloque 10: la tarjeta del informe con la vista previa */
(async () => { await todo(); q('#b10Title').value = 'Cucurbitáceas y abejas de la calabaza (práctica)'; q('#b10Title').dispatchEvent(new Event('input')); q('#b10Preview_btn').click(); await hasta(() => q('#b10PreviewWrap').style.display !== 'none', 60000); await W(3000);
  const c = tarjeta(10, 2); irA(c, 10); await W(300); return caja([c], 2); })()
