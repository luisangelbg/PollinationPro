/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — the study list: plants on one side, visitors on the other.

   A study list entry is a name the user wants analysed as a unit, at any
   rank: a species (Coffea arabica), a genus (Bombus) or a family. The app
   resolves it to a GBIF key and downloads every record under it.

   PRESETS are ready-made lists for common crop–pollinator systems, so a user
   can see the app work before typing a name; they are starting points, not
   recommendations of which visitors matter. SYNONYM_RULES record taxonomic
   changes that the big databases have not yet absorbed; Block 3 applies them
   only if the user asks. */

const Taxa = {};

(function () {

  /* ---------------- presets ---------------- */
  const PRESETS = [
    { id: 'cucurbits', t: ['Cucurbitáceas de México y abejas de la calabaza', 'Mexican cucurbits and squash bees'],
      s: ['cinco especies de chayote (<i>Sechium</i>) y las calabazas, con <i>Xenoglossa</i> y <i>Peponapis</i>', 'five chayote species (<i>Sechium</i>) and the squashes, with <i>Xenoglossa</i> and <i>Peponapis</i>'],
      plants: ['Sechium edule', 'Sechium compositum', 'Sechium chinantlense', 'Sechium hintonii', 'Sechium mexicanum', 'Cucurbita'],
      polls: ['Xenoglossa', 'Peponapis', 'Apis mellifera'], countries: ['MX'] },
    { id: 'coffee', t: ['Café y abejas', 'Coffee and bees'],
      s: ['<i>Coffea arabica</i> con la abeja melífera y cuatro géneros de abejas sin aguijón', '<i>Coffea arabica</i> with the honey bee and four stingless-bee genera'],
      plants: ['Coffea arabica'], polls: ['Apis mellifera', 'Trigona', 'Melipona', 'Scaptotrigona', 'Partamona'], countries: ['MX', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA'] },
    { id: 'cocoa', t: ['Cacao y mosquitas polinizadoras', 'Cocoa and pollinating midges'],
      s: ['<i>Theobroma cacao</i> con <i>Forcipomyia</i>', '<i>Theobroma cacao</i> with <i>Forcipomyia</i>'],
      plants: ['Theobroma cacao'], polls: ['Forcipomyia'], countries: ['MX', 'GT', 'BZ', 'HN', 'NI', 'CR', 'PA'] },
    { id: 'tomato', t: ['Solanáceas y abejorros', 'Solanaceae and bumblebees'],
      s: ['jitomate y chile con <i>Bombus</i>, que vibra las anteras', 'tomato and pepper with <i>Bombus</i>, which buzzes the anthers'],
      plants: ['Solanum lycopersicum', 'Capsicum annuum'], polls: ['Bombus'], countries: ['MX'] },
    { id: 'avocado', t: ['Aguacate y sus visitantes', 'Avocado and its visitors'],
      s: ['<i>Persea americana</i> con la abeja melífera y abejas sin aguijón', '<i>Persea americana</i> with the honey bee and stingless bees'],
      plants: ['Persea americana'], polls: ['Apis mellifera', 'Trigona', 'Scaptotrigona', 'Nannotrigona'], countries: ['MX'] },
    { id: 'agave', t: ['Agaves y murciélagos nectarívoros', 'Agaves and nectar-feeding bats'],
      s: ['<i>Agave</i> con <i>Leptonycteris</i> y <i>Choeronycteris</i>', '<i>Agave</i> with <i>Leptonycteris</i> and <i>Choeronycteris</i>'],
      plants: ['Agave'], polls: ['Leptonycteris yerbabuenae', 'Leptonycteris nivalis', 'Choeronycteris mexicana'], countries: ['MX', 'US'] },
    { id: 'vanilla', t: ['Vainilla y abejas de las orquídeas', 'Vanilla and orchid bees'],
      s: ['<i>Vanilla planifolia</i> con <i>Euglossa</i> y <i>Melipona</i> (sus polinizadores naturales se siguen discutiendo)', '<i>Vanilla planifolia</i> with <i>Euglossa</i> and <i>Melipona</i> (its natural pollinators are still debated)'],
      plants: ['Vanilla planifolia'], polls: ['Euglossa', 'Melipona'], countries: ['MX', 'GT', 'BZ'] },
  ];

  /* ---------------- taxonomic changes not yet in the big databases ---------------- */
  const SYNONYM_RULES = [
    { from: 'Peponapis', to: 'Xenoglossa', level: 'genus', note: ['Peponapis pasa a subgénero de Xenoglossa', 'Peponapis becomes a subgenus of Xenoglossa'], ref: 'Freitas et al. 2023' },
  ];

  /* ---------------- building entries ---------------- */
  let seq = 0;
  function entry(name, role) {
    return { id: 't' + (++seq) + '_' + slug(name).toLowerCase(), name: String(name).trim(), role, key: null, resolved: null, candidates: [], count: null, fetched: 0, status: 'new' };
  }
  function syncSeq(list) { list.forEach(t => { const n = parseInt(String(t.id).slice(1), 10); if (n > seq) seq = n; }); }
  /* the name shown for an entry: the one resolved by GBIF, or the typed one */
  const label = t => (t && t.resolved ? t.resolved.canonicalName : t ? t.name : '');
  /* an italic name, except for ranks above genus, which are not italicised */
  function italic(name, rank) {
    if (!name) return '';
    const r = String(rank || '').toUpperCase();
    if (r && ['FAMILY', 'ORDER', 'CLASS', 'TRIBE', 'SUBFAMILY', 'SUPERFAMILY'].includes(r)) return esc(name);
    /* "subsp." and "var." stay upright inside an italic name */
    return '<i>' + esc(name).replace(/ (subsp\.|var\.|f\.|sp\.|spp\.|cf\.|aff\.) /g, '</i> $1 <i>') + '</i>';
  }
  const ROLE = { plant: ['Planta', 'Plant'], poll: ['Visitante', 'Visitor'] };

  Object.assign(Taxa, { PRESETS, SYNONYM_RULES, entry, syncSeq, label, italic, ROLE });
  window.Taxa = Taxa;
})();
