/* Bloque 4: el estilo «Guía de campo» recortado a los estados del sur */
(async () => { await carga(); return mapa(6, { extent: 'states', states: ['OAX', 'CHP', 'VER', 'PUE', 'GRO', 'TAB'], clipOn: true, clipTo: 'states', title: I18N.lang === 'en' ? 'Southern Mexico' : 'Sur de México', stateLabels: 'code' }, 'field'); })()
