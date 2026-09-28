/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 4: the map of plants and visitors.

   The map and its editor live in js/mapstudio.js; this module places the
   studio in the page, keeps the tables of records by state and by country in
   step with what the map shows, and exports the points shown. No coordinate
   of the study leaves the computer: the outlines travel with the app. */

const B4 = {};

(function () {
  let mounted = false;

  /* the records the map is showing (units hidden in the studio are left out) */
  function shownRecords() {
    if (!state.clean) return [];
    const hidden = new Set(MapStudio.units().filter(u => u.hidden).map(u => u.unit));
    return state.clean.records.filter(r => !hidden.has(r.unit));
  }

  function renderTables() {
    if (!el('b4States') || !el('b4Absent') || !el('b4Countries')) return;
    const recs = shownRecords();
    const U = MapStudio.units().filter(u => !u.hidden);
    const mx = recs.filter(r => r.cc2 === 'MX' && r.st);
    if (mx.length) {
      const bySt = new Map();
      mx.forEach(r => { if (!bySt.has(r.st)) bySt.set(r.st, { st: r.st, name: r.stName, n: 0, u: {} }); const e = bySt.get(r.st); e.n++; e.u[r.unit] = (e.u[r.unit] || 0) + 1; });
      buildTable('b4States', [{ key: 'name', label: T('Estado', 'State') }, { key: 'n', label: T('Registros', 'Records'), num: true }]
        .concat(U.slice(0, 10).map(u => ({ key: u.unit, label: `<i>${esc(u.unit)}</i>`, num: true, get: r => r.u[u.unit] || '' }))), [...bySt.values()].sort((a, b) => b.n - a.n));
      const absent = GEO.MX.filter(s => !bySt.has(s.code)).map(s => s.name);
      el('b4Absent').innerHTML = absent.length ? L2(`Estados sin ningún registro de lo mostrado: ${absent.join(', ')}.`, `States without any record of what is shown: ${absent.join(', ')}.`) : '';
    } else { el('b4States').innerHTML = ''; el('b4Absent').innerHTML = ''; }
    const byC = new Map();
    recs.forEach(r => { const k = r.cc2 || '—'; byC.set(k, (byC.get(k) || 0) + 1); });
    buildTable('b4Countries', [{ key: 'c', label: T('País', 'Country'), get: r => (window.B2 ? B2.countryName(r.c) : r.c) }, { key: 'n', label: T('Registros', 'Records'), num: true }],
      [...byC.entries()].map(([c, n]) => ({ c, n })).sort((a, b) => b.n - a.n));
  }

  /* called by the studio after every drawing */
  function afterDraw(R) {
    const svg = el('b4Studio') && el('b4Studio').querySelector('.ms-canvas svg');
    if (svg) svg.id = 'b4Map';
    state.map = { box: R.box, n: shownRecords().length };
    renderTables();
  }

  function show() {
    if (window.B3) B3.ensure();
    const ok = !!(state.clean && state.clean.records.length);
    el('b4Empty').style.display = ok ? 'none' : '';
    el('b4Body').style.display = ok ? '' : 'none';
    if (!ok) return;
    if (!mounted) { MapStudio.mount(el('b4Studio')); mounted = true; }
    else { MapStudio.renderPane(); MapStudio.redraw(); }
    Fig.decorate(el('panel-4'));
  }

  function wire() {
    if (!el('panel-4')) return;
    els('.soon-art', el('panel-4')).forEach(n => { n.innerHTML = Art.soon(); });
    el('b4Csv').addEventListener('click', () => download(TableIO.toCSV(shownRecords(), ['unit', 'role', 'lat', 'lon', 'cc2', 'stName', 'y', 'm', 'd', 'basis', 'src']), 'puntos_del_mapa.csv', 'text/csv;charset=utf-8'));
    document.addEventListener('stepchange', e => { if (e.detail.step === 4) show(); });
    document.addEventListener('cleanchange', () => { if (document.querySelector('#panel-4.active')) show(); });
    document.addEventListener('langchange', () => { if (mounted && document.querySelector('#panel-4.active')) show(); });
    document.addEventListener('themechange', () => { if (mounted && document.querySelector('#panel-4.active')) MapStudio.redraw(); });
  }
  document.addEventListener('DOMContentLoaded', wire);

  Object.assign(B4, { show, afterDraw, shownRecords, units: () => MapStudio.units(), style: () => MapStudio.get() });
  window.B4 = B4;
})();
