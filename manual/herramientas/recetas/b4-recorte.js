/* Bloque 4: encuadre a México con recorte, título y subtítulo */
(async () => { await carga(); return mapa(1, { extent: 'mexico', clipOn: true, title: I18N.lang === 'en' ? 'Cucurbits and squash bees' : 'Cucurbitáceas y abejas de la calabaza', subtitle: I18N.lang === 'en' ? 'Cleaned records · fictitious practice data' : 'Registros depurados · datos de práctica ficticios' }); })()
