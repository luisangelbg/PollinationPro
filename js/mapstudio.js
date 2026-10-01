/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — the map studio of Block 4.

   One function, render(size), draws the whole map as an SVG with plain
   colours (no CSS variables inside), from the outlines the app carries: the
   picture on screen and the exported file are the same drawing, only the
   size and the resolution change. Around it, an editor in eight tabs: base
   map, framing and clip, texts and fonts, map elements (north arrow, scale
   bar, legend, graticule, frame), data (points, heat, grid, where plant and
   visitor meet, hulls), colours, ready-made looks and export (PNG, JPEG,
   WebP, SVG, TIFF and GeoTIFF, at screen, sheet or journal-column size).

   The base map is vector, not tiles: no image of any online map is fetched
   or embedded, so the figure is entirely the program's own drawing and the
   app keeps working offline. */

const MapStudio = {};

(function () {
  const KEY = 'pollinationpro:mapstudio';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f1 = v => (+v).toFixed(1);
  const escX = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------------- colours ---------------- */
  function hexRgb(h) {
    h = String(h || '#000000').trim();
    if (h[0] !== '#') { const m = h.match(/[\d.]+/g); return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [0, 0, 0]; }
    h = h.slice(1); if (h.length === 3) h = h.replace(/./g, c => c + c);
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0);
  }
  const rgbHex = (r, g, b) => '#' + [r, g, b].map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');
  const asHex = c => rgbHex(...hexRgb(c));
  const mixHex = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  const lum = h => { const [r, g, b] = hexRgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  const themeVar = (name, fb) => asHex(cssVar('--' + name, fb));
  /* the three classes of the "meet" grid: the shared cells in a strong colour of their own, the
     cells of only one role in pale tints of the plant and visitor colours; the legend uses the same */
  const meetColours = pal => ({ both: asHex(pal[4] || '#b8452f'), plant: mixHex(asHex(pal[0]), '#ffffff', 0.5), poll: mixHex(asHex(pal[1]), '#ffffff', 0.5) });

  /* categorical palettes, eight or more colours each, all the program's own
     except Okabe–Ito, which is the colour-blind-safe set published by its authors */
  const PALETTES = {
    pollen: ['#2e7d4f', '#d99a1e', '#7b5ea7', '#2f6fb0', '#b8452f', '#3aa39a', '#8a6a4a', '#c0406a', '#8a9a2a', '#5f6b86'],
    okabe: ['#0072b2', '#e69f00', '#009e73', '#cc79a7', '#d55e00', '#56b4e9', '#f0e442', '#000000'],
    earth: ['#6b4423', '#a0713b', '#c9a227', '#7d8c3c', '#4a6b3a', '#2e5a50', '#8c5a3c', '#b5793c', '#5c6b47', '#3f4a3c'],
    vivid: ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#008080', '#9a6324', '#800000', '#808000', '#000075'],
    soft: ['#7fb3a3', '#e8b77a', '#a79bcf', '#86aed8', '#df8f7e', '#9fcf9a', '#d3b58f', '#e3a1b9', '#bcc27a', '#9aa3b8'],
    grey: ['#111111', '#555555', '#888888', '#bbbbbb', '#333333', '#777777', '#aaaaaa', '#222222'],
  };
  const PALETTE_NAMES = { pollen: ['PollinationPro', 'PollinationPro'], okabe: ['Okabe–Ito (segura al daltonismo)', 'Okabe–Ito (colour-blind safe)'], earth: ['Tierra', 'Earth'], vivid: ['Vivos', 'Vivid'], soft: ['Suaves', 'Soft'], grey: ['Grises', 'Greys'] };
  /* ramps for densities: stops designed here, light to dark */
  const RAMPS = {
    green: ['#f4f9ef', '#d4ebc4', '#a6d494', '#6db86b', '#3c9750', '#1f7340', '#0e4a2a'],
    amber: ['#fff8e6', '#fde7ad', '#f9c96b', '#ef9d34', '#d4701a', '#a44a10', '#6b2d08'],
    violet: ['#f6f2fb', '#dccfee', '#bba5de', '#9676c9', '#7550ae', '#56338a', '#361c5c'],
    heat: ['#fffce8', '#fde38a', '#f9ad44', '#ef6c2a', '#d43a24', '#9d1b28', '#5c0a26'],
    cool: ['#f2f8fb', '#cfe6ef', '#9ccfe0', '#5fb0c9', '#2f8aaf', '#1d6290', '#113c64'],
    grey: ['#f7f7f7', '#d9d9d9', '#b0b0b0', '#878787', '#5e5e5e', '#383838', '#111111'],
  };
  const RAMP_NAMES = { green: ['Verdes', 'Greens'], amber: ['Ámbar', 'Amber'], violet: ['Violetas', 'Violets'], heat: ['Calor', 'Heat'], cool: ['Fríos', 'Cool'], grey: ['Grises', 'Greys'] };
  function rampAt(stops, t) {
    t = clamp(t, 0, 1) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t));
    return mixHex(stops[i], stops[i + 1], t - i);
  }

  /* ---------------- fonts (generic families only) ---------------- */
  const FONTS = {
    sans: ['Sans (del sistema)', 'Sans (system)', 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'],
    humanist: ['Sans humanista', 'Humanist sans', '"Segoe UI", "Helvetica Neue", Arial, sans-serif'],
    serif: ['Serif', 'Serif', 'Georgia, Cambria, "Times New Roman", serif'],
    classic: ['Serif clásica', 'Classic serif', '"Palatino Linotype", "Book Antiqua", Palatino, serif'],
    condensed: ['Sans estrecha', 'Condensed sans', '"Arial Narrow", "Roboto Condensed", sans-serif'],
    mono: ['Monoespaciada', 'Monospace', 'ui-monospace, Consolas, "Courier New", monospace'],
  };
  const fam = k => (FONTS[k] || FONTS.sans)[2];

  /* ---------------- paper sizes (mm) ---------------- */
  const SIZES = {
    screen: [['Pantalla (960 × 620 px)', 'Screen (960 × 620 px)'], null],
    a4l: [['A4 horizontal (297 × 210 mm)', 'A4 landscape (297 × 210 mm)'], [297, 210]],
    a4p: [['A4 vertical (210 × 297 mm)', 'A4 portrait (210 × 297 mm)'], [210, 297]],
    letterl: [['Carta horizontal (279 × 216 mm)', 'Letter landscape (279 × 216 mm)'], [279.4, 215.9]],
    col1: [['Revista, una columna (85 × 70 mm)', 'Journal, single column (85 × 70 mm)'], [85, 70]],
    col15: [['Revista, columna y media (120 × 90 mm)', 'Journal, 1.5 columns (120 × 90 mm)'], [120, 90]],
    col2: [['Revista, doble columna (175 × 120 mm)', 'Journal, double column (175 × 120 mm)'], [175, 120]],
    slide: [['Diapositiva 16:9 (254 × 143 mm)', 'Slide 16:9 (254 × 143 mm)'], [254, 142.9]],
    custom: [['Personalizado', 'Custom'], null],
  };
  const PX_PER_MM = 96 / 25.4;

  /* ---------------- defaults and looks ---------------- */
  const DEF = {
    /* base */
    bgMode: 'white', bgColor: '#ffffff', sea: '#dcebf2', land: '#f7f5ef', landOther: '#ecebe6', stateLine: '#9aa39a', stateW: 0.6, countryLine: '#6f786f', countryW: 1, showStates: true, showCountries: true,
    stateLabels: 'off', stateLabelSize: 9, stateLabelColor: '#5d6b5a',
    grat: true, gratStep: 'auto', gratColor: '#8a97a3', gratAlpha: 0.5, gratLabels: true, gratSize: 9,
    frameOn: true, frameColor: '#1a2419', frameW: 1,
    /* framing and clip */
    extent: 'auto', margin: 6, states: [], mN: 33, mS: 14, mW: -118.5, mE: -86.5, legendOutside: false,
    clipOn: false, clipTo: 'mexico', clipOutside: 'bg', clipOutline: true, clipColor: '#1a2419', clipW: 1.2,
    /* texts */
    font: 'sans', textColor: '#1a2419', title: '', subtitle: '', credit: '', legendTitle: '',
    titleSize: 20, titleBold: true, titleItalic: false, titlePos: 'tl', subSize: 13, creditSize: 9, creditPos: 'bl', textBox: 'none',
    /* elements */
    north: 'arrow', northPos: 'tr', northSize: 44, northColor: '#1a2419',
    scaleOn: true, scaleStyle: 'alt', scaleUnit: 'km', scalePos: 'bl', scaleSize: 10, scaleThick: 6, scaleSegs: 4,
    legendOn: true, legendPos: 'br', legendBox: 'light', legendSize: 11, legendCols: 1,
    /* data */
    mode: 'points', colorBy: 'unit', radius: 3, fillAlpha: 0.85, outlineW: 0.5, outlineColor: '#ffffff', halo: 0,
    shapePlant: 'circle', shapeVisitor: 'triangle', heatRadius: 18, heatIntensity: 1, gridSize: 0.5, hullAlpha: 0.15,
    /* colours */
    palette: 'pollen', ramp: 'green', units: {},
    /* export */
    size: 'screen', wmm: 180, hmm: 130, dpi: 300, fmt: 'png',
  };
  const LOOKS = [
    { id: 'publication', t: ['Publicación', 'Publication'], d: ['blanco, marco fino, retícula y leyenda clara', 'white, thin frame, graticule and light legend'],
      s: { bgMode: 'white', sea: '#e3eef3', land: '#f7f5ef', landOther: '#ecebe6', grat: true, frameOn: true, font: 'sans', legendBox: 'light', north: 'arrow', scaleStyle: 'alt', radius: 3, outlineColor: '#ffffff', palette: 'pollen', textColor: '#1a2419', stateLine: '#9aa39a', countryLine: '#6f786f', textBox: 'none' } },
    { id: 'bw', t: ['Blanco y negro', 'Black and white'], d: ['grises y formas distintas por unidad, para revistas que cobran el color', 'greys and different shapes per unit, for journals that charge for colour'],
      s: { bgMode: 'white', sea: '#ffffff', land: '#f2f2f2', landOther: '#e6e6e6', grat: true, frameOn: true, palette: 'grey', legendBox: 'outline', north: 'half', scaleStyle: 'stepped', outlineColor: '#ffffff', textColor: '#111111', stateLine: '#8c8c8c', countryLine: '#555555', textBox: 'none' } },
    { id: 'dark', t: ['Presentación oscura', 'Dark presentation'], d: ['fondo oscuro, puntos grandes con halo', 'dark background, large points with halo'],
      s: { bgMode: 'custom', bgColor: '#111a14', sea: '#16211b', land: '#23312a', landOther: '#1c2721', grat: false, frameOn: false, radius: 5, halo: 1.5, outlineColor: '#0b100d', legendBox: 'dark', north: 'rose4', scaleStyle: 'solid', textColor: '#e8efe4', stateLine: '#3f5147', countryLine: '#5b6f63', titleSize: 26, palette: 'vivid', northColor: '#e8efe4', stateLabelColor: '#a0ae9a', gratColor: '#5b6f63', clipColor: '#a0ae9a', frameColor: '#a0ae9a' } },
    { id: 'field', t: ['Guía de campo', 'Field guide'], d: ['tonos tierra, serif, rosa de los vientos', 'earth tones, serif, compass rose'],
      s: { bgMode: 'white', sea: '#dde8e4', land: '#f3ecdc', landOther: '#e8e1d0', grat: true, frameOn: true, frameW: 2, font: 'serif', titleItalic: true, legendBox: 'outline', north: 'rose8', northSize: 58, scaleStyle: 'ruler', palette: 'earth', radius: 4, textColor: '#3b2f22', stateLine: '#b3a58c', countryLine: '#8c7a5c', stateLabels: 'code', textBox: 'none' } },
    { id: 'poster', t: ['Cartel', 'Poster'], d: ['textos y puntos grandes, título en recuadro', 'large texts and points, boxed title'],
      s: { bgMode: 'white', grat: false, frameOn: true, frameW: 2.5, titleSize: 32, subSize: 18, legendSize: 15, scaleSize: 13, radius: 5.5, northSize: 64, textBox: 'light', legendBox: 'light', north: 'circle', scaleStyle: 'alt', palette: 'pollen' } },
    { id: 'minimal', t: ['Solo datos', 'Data only'], d: ['sin mar ni retícula, límites tenues', 'no sea or graticule, faint borders'],
      s: { bgMode: 'white', sea: '#ffffff', land: '#ffffff', landOther: '#fafafa', grat: false, frameOn: false, legendBox: 'none', north: 'minimal', scaleStyle: 'line', stateLine: '#cfd4cf', countryLine: '#a9b0a9', textBox: 'none' } },
  ];

  const LOOK_KEYS = ['bgMode', 'bgColor', 'sea', 'land', 'landOther', 'stateLine', 'stateW', 'countryLine', 'countryW', 'stateLabels', 'stateLabelColor', 'grat', 'gratColor', 'gratAlpha', 'frameOn', 'frameColor', 'frameW', 'font', 'textColor', 'titleSize', 'titleItalic', 'subSize', 'textBox', 'north', 'northSize', 'northColor', 'scaleStyle', 'scaleSize', 'legendBox', 'legendSize', 'radius', 'halo', 'outlineColor', 'palette', 'clipColor'];
  let S = Object.assign({}, DEF);
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* first visit */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } };

  /* ---------------- data ---------------- */
  function records() { return state.clean ? state.clean.records : []; }
  function units() {
    const m = new Map();
    records().forEach(r => { if (!m.has(r.unit)) m.set(r.unit, { unit: r.unit, role: r.role, n: 0 }); m.get(r.unit).n++; });
    const list = [...m.values()].sort((a, b) => (a.role === b.role ? b.n - a.n : a.role === 'plant' ? -1 : 1));
    const pal = PALETTES[S.palette] || PALETTES.pollen;
    const plantDefault = S.palette === 'grey';
    list.forEach((u, i) => {
      const o = S.units[u.unit] || {};
      u.color = o.color || pal[i % pal.length];
      u.shape = o.shape || (plantDefault ? ['circle', 'square', 'triangle', 'diamond', 'cross', 'star'][i % 6] : (u.role === 'plant' ? S.shapePlant : S.shapeVisitor));
      u.hidden = !!o.hidden;
    });
    return list;
  }

  /* ---------------- geometry ---------------- */
  function extentBox(recs) {
    let b;
    if (S.extent === 'mexico') b = GEO.MX_BBOX.slice();
    else if (S.extent === 'world') b = GEO.WORLD_BBOX.slice();
    else if (S.extent === 'states' && S.states.length) b = GEO.MX.filter(s => S.states.includes(s.code)).map(s => s.bbox).reduce((a, c) => GEO.unionBBox(a, c));
    else if (S.extent === 'manual') b = [Math.min(S.mW, S.mE), Math.min(S.mS, S.mN), Math.max(S.mW, S.mE), Math.max(S.mS, S.mN)];
    else b = recs.length ? GEO.bboxOfPoints(recs.map(r => [r.lon, r.lat]), 0.02) : GEO.MX_BBOX.slice();
    const m = S.extent === 'manual' ? 0 : S.margin / 100;
    const dx = (b[2] - b[0]) * m, dy = (b[3] - b[1]) * m;
    return [Math.max(-180, b[0] - dx), Math.max(-89, b[1] - dy), Math.min(180, b[2] + dx), Math.min(89, b[3] + dy)];
  }
  function sizePx() {
    if (S.size === 'screen') return [960, 620];
    const mm = S.size === 'custom' ? [clamp(+S.wmm || 180, 30, 1200), clamp(+S.hmm || 130, 30, 1200)] : SIZES[S.size][1];
    return [Math.round(mm[0] * PX_PER_MM), Math.round(mm[1] * PX_PER_MM)];
  }
  function shapePath(shape, x, y, r) {
    const P = pts => 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join(' L') + 'Z';
    switch (shape) {
      case 'square': return P([[x - r * 0.88, y - r * 0.88], [x + r * 0.88, y - r * 0.88], [x + r * 0.88, y + r * 0.88], [x - r * 0.88, y + r * 0.88]]);
      case 'triangle': return P([[x, y - r * 1.2], [x + r * 1.1, y + r * 0.8], [x - r * 1.1, y + r * 0.8]]);
      case 'diamond': return P([[x, y - r * 1.25], [x + r * 1.05, y], [x, y + r * 1.25], [x - r * 1.05, y]]);
      case 'cross': { const a = r * 0.36, b = r * 1.1; return P([[x - a, y - b], [x + a, y - b], [x + a, y - a], [x + b, y - a], [x + b, y + a], [x + a, y + a], [x + a, y + b], [x - a, y + b], [x - a, y + a], [x - b, y + a], [x - b, y - a], [x - a, y - a]]); }
      case 'star': { const q = []; for (let k = 0; k < 10; k++) { const ang = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.5 : r * 1.3; q.push([x + Math.cos(ang) * rr, y + Math.sin(ang) * rr]); } return P(q); }
      default: return `M${f1(x - r)} ${f1(y)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
    }
  }
  const niceStep = span => { const c = [0.5, 1, 2, 5, 10, 15, 20, 30]; const t = span / 5; return c.find(v => v >= t) || 30; };
  function centroidOf(st) {
    if (window.Clean && Clean.polyCentroid) {
      /* the largest ring, so an archipelago is labelled on its main island */
      let best = null, area = 0;
      st.rings.forEach(r => { const b = GEO.ringsBBox([r]); const a = (b[2] - b[0]) * (b[3] - b[1]); if (a > area) { area = a; best = r; } });
      const c = best && Clean.polyCentroid([best]);
      if (c && isFinite(c[0])) return c;
    }
    return [(st.bbox[0] + st.bbox[2]) / 2, (st.bbox[1] + st.bbox[3]) / 2];
  }

  /* ---------------- the palette of the page ---------------- */
  function ink() {
    if (S.bgMode === 'theme') return { bg: themeVar('card-bg', '#ffffff'), text: themeVar('text', '#1a2419'), muted: themeVar('text-muted', '#5d6b5a') };
    const bg = S.bgMode === 'custom' ? asHex(S.bgColor) : '#ffffff';
    return { bg, text: asHex(S.textColor), muted: mixHex(asHex(S.textColor), bg, 0.35) };
  }

  /* =====================================================================
     RENDER: the whole map as an SVG string
     ===================================================================== */
  let uid = 0;
  function render(opts) {
    const o = opts || {};
    const [W, H] = o.size || sizePx();
    const id = 'ms' + (++uid);
    const C = ink();
    const U = units(), byUnit = new Map(U.map(u => [u.unit, u]));
    const recs = records().filter(r => { const u = byUnit.get(r.unit); return u && !u.hidden; });
    const box = extentBox(recs);
    const k = W / 960;                                      // text and marks scale with the page
    const legW = S.legendOn && S.legendOutside ? Math.round(W * 0.24) : 0;
    const titleH = (S.title ? S.titleSize * k * 1.5 : 0) + (S.subtitle ? S.subSize * k * 1.4 : 0);
    const top = titleH ? titleH + 12 * k : 0;
    const mx = 0, my = top, mw = W - legW, mh = H - top;
    const pr = GEO.projection(box, mw, mh, 0);
    const X = lon => mx + pr.X(lon), Y = lat => my + pr.Y(lat);
    const out = [];
    const push = s => out.push(s);
    push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family='${fam(S.font)}'>`);
    if (S.bgMode !== 'transparent') push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${C.bg}"/>`);
    /* the clip region, as a path */
    let clipD = '';
    if (S.clipOn) {
      const list = S.clipTo === 'states' && S.states.length ? GEO.MX.filter(s => S.states.includes(s.code)) : GEO.MX;
      clipD = list.map(s => ringsPath(s.rings, X, Y)).join('');
      push(`<defs><clipPath id="${id}c"><path d="${clipD}" fill-rule="evenodd"/></clipPath><clipPath id="${id}m"><rect x="${mx}" y="${my}" width="${mw}" height="${mh}"/></clipPath></defs>`);
    } else push(`<defs><clipPath id="${id}m"><rect x="${mx}" y="${my}" width="${mw}" height="${mh}"/></clipPath></defs>`);
    push(`<g clip-path="url(#${id}m)">`);
    /* sea */
    if (!(S.clipOn && S.clipOutside === 'transparent')) push(`<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="${S.clipOn && S.clipOutside === 'bg' ? C.bg : asHex(S.sea)}"/>`);
    push(S.clipOn ? `<g clip-path="url(#${id}c)">` : '<g>');
    if (S.clipOn) push(`<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="${asHex(S.sea)}"/>`);
    /* graticule under the land */
    const gratLines = graticule(box, X, Y, mx, my, mw, mh, k);
    if (S.grat) push(gratLines.lines);
    /* countries, then Mexico by states */
    const wide = box[2] - box[0] > 60;
    GEO.WORLD.forEach(c => {
      if (c.a2 === 'MX' && !wide) return;
      const d = GEO.ringsToPath(c.rings, { X: v => X(v) - 0, Y: v => Y(v) }, box);
      if (!d) return;
      push(`<path d="${d}" fill="${c.a2 === 'MX' ? asHex(S.land) : asHex(S.landOther)}" stroke="${S.showCountries ? asHex(S.countryLine) : 'none'}" stroke-width="${f1(S.countryW * k)}" fill-rule="evenodd" stroke-linejoin="round"/>`);
    });
    if (!wide) GEO.MX.forEach(s => {
      push(`<path d="${ringsPath(s.rings, X, Y)}" fill="${asHex(S.land)}" stroke="${S.showStates ? asHex(S.stateLine) : asHex(S.land)}" stroke-width="${f1(S.stateW * k)}" fill-rule="evenodd" stroke-linejoin="round"/>`);
    });
    /* the Mexican outline drawn on top with the country line, so the border reads over the state lines */
    if (!wide && S.showCountries) {
      const mxw = GEO.WORLD_BY_A2.MX;
      if (mxw) push(`<path d="${GEO.ringsToPath(mxw.rings, { X, Y }, box)}" fill="none" stroke="${asHex(S.countryLine)}" stroke-width="${f1(S.countryW * k)}" stroke-linejoin="round" opacity="0.9"/>`);
    }
    /* data */
    push(dataLayer(recs, U, byUnit, X, Y, mx, my, mw, mh, k));
    push('</g>');
    if (S.clipOn && S.clipOutline) push(`<path d="${outerOutline(S.clipTo === 'states' && S.states.length ? GEO.MX.filter(s => S.states.includes(s.code)) : GEO.MX, X, Y)}" fill="none" stroke="${asHex(S.clipColor)}" stroke-width="${f1(S.clipW * k)}" stroke-linejoin="round" stroke-linecap="round"/>`);
    /* state labels */
    if (S.stateLabels !== 'off' && !wide) GEO.MX.forEach(s => {
      if (S.clipOn && S.clipTo === 'states' && S.states.length && !S.states.includes(s.code)) return;
      const c = centroidOf(s), x = X(c[0]), y = Y(c[1]);
      if (x < mx || x > mx + mw || y < my || y > my + mh) return;
      const lab = S.stateLabels === 'code' ? s.code : s.name;
      push(`<text x="${f1(x)}" y="${f1(y)}" font-size="${f1(S.stateLabelSize * k)}" text-anchor="middle" fill="${asHex(S.stateLabelColor)}" paint-order="stroke" stroke="${asHex(S.land)}" stroke-width="${f1(2 * k)}">${escX(lab)}</text>`);
    });
    push('</g>');
    if (S.grat && S.gratLabels) push(gratLines.labels);
    if (S.frameOn) push(`<rect x="${f1(mx + S.frameW * k / 2)}" y="${f1(my + S.frameW * k / 2)}" width="${f1(mw - S.frameW * k)}" height="${f1(mh - S.frameW * k)}" fill="none" stroke="${asHex(S.frameColor)}" stroke-width="${f1(S.frameW * k)}"/>`);
    /* decorations, not clipped */
    push(titleBlock(W, k, C));
    const area = { x: mx, y: my, w: mw, h: mh };
    if (S.north !== 'off') push(northArrow(area, k, C));
    if (S.scaleOn) push(scaleBar(area, pr, box, k, C));
    if (S.legendOn) push(legend(U, recs, area, W, k, C, legW));
    if (S.credit) push(creditLine(area, k, C));
    push('</svg>');
    const svg = out.join('');
    /* where the picture is on the Earth, for the GeoTIFF: the projection is linear in longitude and latitude */
    const geo = { x0: pr.lonOf(0 - mx), y0: pr.latOf(0 - my), dx: 1 / (pr.kx * pr.scale), dy: 1 / pr.scale, mapOnly: !top && !legW };
    return { svg, W, H, geo, box, pr };
  }
  /* the outer silhouette of a set of states: an edge shared by two states is an
     internal border and appears twice; the silhouette is made of the edges
     that appear once. Cached by the list of states. */
  const outerCache = new Map();
  function outerEdges(list) {
    const key = list.map(s => s.code).join(',');
    if (outerCache.has(key)) return outerCache.get(key);
    const cnt = new Map(), seg = [];
    const q = v => Math.round(v * 1e4);
    list.forEach(s => s.rings.forEach(r => {
      for (let i = 0; i + 3 < r.length; i += 2) {
        const a = q(r[i]) + ',' + q(r[i + 1]), b = q(r[i + 2]) + ',' + q(r[i + 3]);
        if (a === b) continue;
        const kk = a < b ? a + '|' + b : b + '|' + a;
        cnt.set(kk, (cnt.get(kk) || 0) + 1);
        seg.push([kk, r[i], r[i + 1], r[i + 2], r[i + 3]]);
      }
    }));
    /* an edge that appears once is not yet an outer edge: two neighbouring states simplified
       apart do not share their vertices, so their common border also appears once in each. An
       outer edge has land of the chosen states on one side only; a border of this kind has it
       on both. Each side is probed about 3 km off the middle of the edge. */
    const inAny = (lon, lat) => list.some(s => GEO.inBBox(s.bbox, lon, lat) && GEO.pointInRings(s.rings, lon, lat));
    const EPS = 0.03;
    const out = seg.filter(e => {
      if (cnt.get(e[0]) !== 1) return false;
      const [, x1, y1, x2, y2] = e, len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, nx = -(y2 - y1) / len * EPS, ny = (x2 - x1) / len * EPS;
      return !(inAny(mx + nx, my + ny) && inAny(mx - nx, my - ny));
    }).map(e => e.slice(1));
    outerCache.set(key, out);
    return out;
  }
  function outerOutline(list, X, Y) {
    let d = '', lastX = null, lastY = null;
    outerEdges(list).forEach(([x1, y1, x2, y2]) => {
      const a = [X(x1), Y(y1)], b = [X(x2), Y(y2)];
      /* consecutive edges are joined into one line, which keeps the file small */
      if (lastX !== null && Math.abs(a[0] - lastX) < 0.01 && Math.abs(a[1] - lastY) < 0.01) d += 'L' + f1(b[0]) + ' ' + f1(b[1]);
      else d += 'M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1]);
      lastX = b[0]; lastY = b[1];
    });
    return d;
  }
  function ringsPath(rings, X, Y) {
    let d = '';
    rings.forEach(r => { if (r.length < 6) return; for (let i = 0; i < r.length; i += 2) d += (i ? 'L' : 'M') + f1(X(r[i])) + ' ' + f1(Y(r[i + 1])); d += 'Z'; });
    return d;
  }
  function graticule(box, X, Y, mx, my, mw, mh, k) {
    const step = S.gratStep === 'auto' ? niceStep(Math.max(box[2] - box[0], box[3] - box[1])) : +S.gratStep;
    let lines = '', labels = '';
    const col = asHex(S.gratColor), C = ink();
    const fmtDeg = (v, ns) => `${Math.abs(+v.toFixed(2))}°${v === 0 ? '' : ns ? (v > 0 ? 'N' : 'S') : (v > 0 ? 'E' : T('O', 'W'))}`;
    for (let lon = Math.ceil(box[0] / step) * step; lon <= box[2] + 1e-9; lon += step) {
      const x = X(lon);
      lines += `<line x1="${f1(x)}" y1="${f1(my)}" x2="${f1(x)}" y2="${f1(my + mh)}" stroke="${col}" stroke-opacity="${S.gratAlpha}" stroke-width="${f1(0.6 * k)}"/>`;
      if (x > mx + 20 * k && x < mx + mw - 20 * k) labels += `<text x="${f1(x)}" y="${f1(my + mh - 4 * k)}" font-size="${f1(S.gratSize * k)}" text-anchor="middle" fill="${C.muted}" paint-order="stroke" stroke="${C.bg}" stroke-width="${f1(2.5 * k)}">${fmtDeg(lon, false)}</text>`;
    }
    for (let lat = Math.ceil(box[1] / step) * step; lat <= box[3] + 1e-9; lat += step) {
      const y = Y(lat);
      lines += `<line x1="${f1(mx)}" y1="${f1(y)}" x2="${f1(mx + mw)}" y2="${f1(y)}" stroke="${col}" stroke-opacity="${S.gratAlpha}" stroke-width="${f1(0.6 * k)}"/>`;
      if (y > my + 16 * k && y < my + mh - 16 * k) labels += `<text x="${f1(mx + 4 * k)}" y="${f1(y - 3 * k)}" font-size="${f1(S.gratSize * k)}" fill="${C.muted}" paint-order="stroke" stroke="${C.bg}" stroke-width="${f1(2.5 * k)}">${fmtDeg(lat, true)}</text>`;
    }
    return { lines, labels };
  }

  /* ---------------- the data layer ---------------- */
  function dataLayer(recs, U, byUnit, X, Y, mx, my, mw, mh, k) {
    const colourOf = r => (S.colorBy === 'role' ? (r.role === 'plant' ? PALETTES[S.palette][0] : PALETTES[S.palette][1]) : byUnit.get(r.unit).color);
    const R = S.radius * k;
    let s = '';
    if (S.mode === 'heat') return heatImage(recs, X, Y, mx, my, mw, mh, k);
    if (S.mode === 'grid' || S.mode === 'meet') {
      const size = +S.gridSize;
      const cells = new Map();
      recs.forEach(r => { const key = GEO.cellKey(r.lon, r.lat, size); if (!cells.has(key)) cells.set(key, { n: 0, plant: 0, poll: 0 }); const c = cells.get(key); c.n++; c[r.role]++; });
      const max = Math.max(1, ...[...cells.values()].map(c => c.n));
      const stops = RAMPS[S.ramp] || RAMPS.green, pal = PALETTES[S.palette];
      cells.forEach((c, key) => {
        const [x0, y0, x1, y1] = GEO.cellBBox(key, size);
        const X0 = X(x0), X1 = X(x1), Y0 = Y(y1), Y1 = Y(y0);
        const M = meetColours(pal);
        const fill = S.mode === 'meet' ? (c.plant && c.poll ? M.both : c.plant ? M.plant : M.poll) : rampAt(stops, Math.sqrt(c.n / max));
        const op = 0.9;
        s += `<rect x="${f1(X0)}" y="${f1(Y0)}" width="${f1(Math.max(0.5, X1 - X0))}" height="${f1(Math.max(0.5, Y1 - Y0))}" fill="${fill}" fill-opacity="${op}" stroke="#ffffff" stroke-opacity="0.5" stroke-width="${f1(0.3 * k)}"/>`;
      });
      MapStudio._gridMax = max;
      return s;
    }
    if (S.mode === 'hull') {
      U.filter(u => !u.hidden).forEach(u => {
        const pts = recs.filter(r => r.unit === u.unit).map(r => [r.lon, r.lat]);
        const h = Poll.convexHull(pts);
        if (h.length >= 3) s += `<path d="M${h.map(p => f1(X(p[0])) + ' ' + f1(Y(p[1]))).join(' L')}Z" fill="${u.color}" fill-opacity="${S.hullAlpha}" stroke="${u.color}" stroke-width="${f1(1.4 * k)}"/>`;
      });
    }
    /* points (also on top of the hulls), plants first */
    let pts = recs;
    if (pts.length > 15000) { const seen = new Set(); pts = pts.filter(r => { const key = r.unit + '|' + Math.round(r.lon * 100) + '|' + Math.round(r.lat * 100); if (seen.has(key)) return false; seen.add(key); return true; }); }
    pts = pts.slice().sort((a, b) => (a.role === b.role ? 0 : a.role === 'plant' ? -1 : 1));
    const halo = S.halo > 0 ? ink().bg : null;
    pts.forEach(r => {
      const x = X(r.lon), y = Y(r.lat);
      if (x < mx - 10 || y < my - 10 || x > mx + mw + 10 || y > my + mh + 10) return;
      const u = byUnit.get(r.unit);
      const shape = S.colorBy === 'role' ? (r.role === 'plant' ? S.shapePlant : S.shapeVisitor) : u.shape;
      if (halo) s += `<path d="${shapePath(shape, x, y, R + S.halo * k)}" fill="${halo}" fill-opacity="0.6"/>`;
      s += `<path d="${shapePath(shape, x, y, R)}" fill="${colourOf(r)}" fill-opacity="${S.fillAlpha}" stroke="${asHex(S.outlineColor)}" stroke-width="${f1(S.outlineW * k)}"/>`;
    });
    return s;
  }
  /* a kernel density of the points, drawn on a canvas and embedded as an image */
  function heatImage(recs, X, Y, mx, my, mw, mh, k) {
    const cell = 2, gw = Math.ceil(mw / cell), gh = Math.ceil(mh / cell);
    const g = new Float32Array(gw * gh);
    recs.forEach(r => { const i = Math.floor((X(r.lon) - mx) / cell), j = Math.floor((Y(r.lat) - my) / cell); if (i >= 0 && j >= 0 && i < gw && j < gh) g[j * gw + i]++; });
    const sd = Math.max(1, S.heatRadius * k / cell);
    const rad = Math.ceil(3 * sd), ker = [];
    for (let d = -rad; d <= rad; d++) ker.push(Math.exp(-0.5 * (d / sd) ** 2));
    const tmp = new Float32Array(gw * gh), out = new Float32Array(gw * gh);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { let v = 0; for (let d = -rad; d <= rad; d++) { const ii = i + d; if (ii >= 0 && ii < gw) v += g[j * gw + ii] * ker[d + rad]; } tmp[j * gw + i] = v; }
    let max = 0;
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { let v = 0; for (let d = -rad; d <= rad; d++) { const jj = j + d; if (jj >= 0 && jj < gh) v += tmp[jj * gw + i] * ker[d + rad]; } out[j * gw + i] = v; if (v > max) max = v; }
    const cv = document.createElement('canvas'); cv.width = gw; cv.height = gh;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(gw, gh), stops = RAMPS[S.ramp] || RAMPS.green;
    for (let i = 0; i < out.length; i++) {
      const t = max ? Math.min(1, Math.sqrt(out[i] / max) * S.heatIntensity) : 0;
      if (t < 0.03) continue;
      const c = hexRgb(rampAt(stops, t));
      img.data[4 * i] = c[0]; img.data[4 * i + 1] = c[1]; img.data[4 * i + 2] = c[2]; img.data[4 * i + 3] = Math.round(255 * Math.min(1, 0.25 + t));
    }
    ctx.putImageData(img, 0, 0);
    return `<image href="${cv.toDataURL('image/png')}" x="${mx}" y="${my}" width="${gw * cell}" height="${gh * cell}" preserveAspectRatio="none"/>`;
  }

  /* ---------------- decorations ---------------- */
  function boxBehind(x, y, w, h, k, mode) {
    if (mode === 'none') return '';
    const C = ink();
    const fill = mode === 'dark' ? '#111a14' : mode === 'outline' ? C.bg : C.bg;
    const op = mode === 'outline' ? 1 : 0.88;
    return `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(4 * k)}" fill="${fill}" fill-opacity="${op}" stroke="${mode === 'outline' ? asHex(S.frameColor) : mode === 'dark' ? '#2c3a2a' : '#c2cfb8'}" stroke-width="${f1(0.8 * k)}"/>`;
  }
  function titleBlock(W, k, C) {
    if (!S.title && !S.subtitle) return '';
    const anchor = S.titlePos === 'tc' ? 'middle' : S.titlePos === 'tr' ? 'end' : 'start';
    const x = S.titlePos === 'tc' ? W / 2 : S.titlePos === 'tr' ? W - 8 * k : 8 * k;
    let s = '', y = 0;
    if (S.title) { y += S.titleSize * k * 1.2; s += `<text x="${f1(x)}" y="${f1(y)}" font-size="${f1(S.titleSize * k)}" font-weight="${S.titleBold ? 700 : 400}" font-style="${S.titleItalic ? 'italic' : 'normal'}" text-anchor="${anchor}" fill="${C.text}">${escX(S.title)}</text>`; }
    if (S.subtitle) { y += S.subSize * k * 1.35; s += `<text x="${f1(x)}" y="${f1(y)}" font-size="${f1(S.subSize * k)}" text-anchor="${anchor}" fill="${C.muted}">${escX(S.subtitle)}</text>`; }
    return s;
  }
  function corner(area, pos, w, h, k) {
    const pad = 10 * k;
    const x = pos[1] === 'l' ? area.x + pad : pos[1] === 'c' ? area.x + (area.w - w) / 2 : area.x + area.w - w - pad;
    const y = pos[0] === 't' ? area.y + pad : area.y + area.h - h - pad;
    return [x, y];
  }
  function creditLine(area, k, C) {
    const fs = S.creditSize * k, w = S.credit.length * fs * 0.52;
    const [x, y] = corner(area, S.creditPos, w, fs * 1.3, k);
    const adj = S.creditPos === S.scalePos || S.creditPos === S.legendPos ? -(fs * 1.6) : 0;
    return `<text x="${f1(x)}" y="${f1(y + fs + adj)}" font-size="${f1(fs)}" fill="${C.muted}" paint-order="stroke" stroke="${C.bg}" stroke-width="${f1(2.5 * k)}">${escX(S.credit)}</text>`;
  }

  /* north arrows: eight designs */
  const NORTH = { arrow: ['Flecha', 'Arrow'], half: ['Flecha partida', 'Split arrow'], needle: ['Aguja', 'Needle'], triangle: ['Triángulo', 'Triangle'], circle: ['Círculo', 'Circle'], rose4: ['Rosa de 4 puntas', '4-point rose'], rose8: ['Rosa de 8 puntas', '8-point rose'], minimal: ['Mínima', 'Minimal'] };
  function northArrow(area, k, C) {
    const sz = S.northSize * k, col = S.bgMode === 'custom' && lum(ink().bg) < 0.4 && S.northColor === DEF.northColor ? '#e8efe4' : asHex(S.northColor), paper = ink().bg;
    const w = sz * 0.7, h = sz * 1.2;
    const [x, y] = corner(area, S.northPos, w, h, k);
    const cx = x + w / 2, cy = y + h * 0.58, r = sz * 0.42, fs = sz * 0.3;
    const N = (ty) => `<text x="${f1(cx)}" y="${f1(ty)}" font-size="${f1(fs)}" font-weight="700" text-anchor="middle" fill="${col}">N</text>`;
    const star = (n, R1, R2) => { const p = []; for (let i = 0; i < 2 * n; i++) { const a = -Math.PI / 2 + i * Math.PI / n; const rr = i % 2 ? R2 : R1; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return p; };
    const poly = p => 'M' + p.map(q => f1(q[0]) + ' ' + f1(q[1])).join(' L') + 'Z';
    switch (S.north) {
      case 'half': return `<path d="M${f1(cx)} ${f1(cy - r)} L${f1(cx + r * 0.45)} ${f1(cy + r * 0.7)} L${f1(cx)} ${f1(cy + r * 0.35)} Z" fill="${paper}" stroke="${col}" stroke-width="${f1(1.2 * k)}"/><path d="M${f1(cx)} ${f1(cy - r)} L${f1(cx - r * 0.45)} ${f1(cy + r * 0.7)} L${f1(cx)} ${f1(cy + r * 0.35)} Z" fill="${col}"/>` + N(cy - r - 4 * k);
      case 'needle': return `<path d="M${f1(cx)} ${f1(cy - r)} L${f1(cx + r * 0.28)} ${f1(cy)} L${f1(cx)} ${f1(cy + r)} L${f1(cx - r * 0.28)} ${f1(cy)} Z" fill="${paper}" stroke="${col}" stroke-width="${f1(1 * k)}"/><path d="M${f1(cx)} ${f1(cy - r)} L${f1(cx + r * 0.28)} ${f1(cy)} L${f1(cx - r * 0.28)} ${f1(cy)} Z" fill="${col}"/>` + N(cy - r - 4 * k);
      case 'triangle': return `<path d="M${f1(cx)} ${f1(cy - r)} L${f1(cx + r * 0.75)} ${f1(cy + r * 0.8)} L${f1(cx - r * 0.75)} ${f1(cy + r * 0.8)} Z" fill="none" stroke="${col}" stroke-width="${f1(1.6 * k)}"/>` + N(cy + r * 0.55);
      case 'circle': return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${paper}" stroke="${col}" stroke-width="${f1(1.4 * k)}"/><path d="M${f1(cx)} ${f1(cy - r * 0.85)} L${f1(cx + r * 0.3)} ${f1(cy + r * 0.1)} L${f1(cx - r * 0.3)} ${f1(cy + r * 0.1)} Z" fill="${col}"/>` + `<text x="${f1(cx)}" y="${f1(cy + r * 0.72)}" font-size="${f1(fs * 0.85)}" font-weight="700" text-anchor="middle" fill="${col}">N</text>`;
      case 'rose4': return `<path d="${poly(star(4, r, r * 0.28))}" fill="${paper}" stroke="${col}" stroke-width="${f1(1 * k)}"/><path d="M${f1(cx)} ${f1(cy - r)} L${f1(cx + r * 0.28 * 0.707)} ${f1(cy - r * 0.28 * 0.707)} L${f1(cx)} ${f1(cy)} Z M${f1(cx)} ${f1(cy + r)} L${f1(cx - r * 0.2)} ${f1(cy + r * 0.2)} L${f1(cx)} ${f1(cy)} Z M${f1(cx + r)} ${f1(cy)} L${f1(cx + r * 0.2)} ${f1(cy + r * 0.2)} L${f1(cx)} ${f1(cy)} Z M${f1(cx - r)} ${f1(cy)} L${f1(cx - r * 0.2)} ${f1(cy - r * 0.2)} L${f1(cx)} ${f1(cy)} Z" fill="${col}"/>` + N(cy - r - 4 * k);
      case 'rose8': return `<path d="${poly(star(8, r * 0.62, r * 0.18))}" fill="${paper}" stroke="${col}" stroke-width="${f1(0.8 * k)}" transform="rotate(22.5 ${f1(cx)} ${f1(cy)})"/><path d="${poly(star(4, r, r * 0.22))}" fill="${col}"/><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r * 0.12)}" fill="${paper}" stroke="${col}" stroke-width="${f1(0.8 * k)}"/>` + N(cy - r - 4 * k);
      case 'minimal': return `<line x1="${f1(cx)}" y1="${f1(cy + r)}" x2="${f1(cx)}" y2="${f1(cy - r * 0.6)}" stroke="${col}" stroke-width="${f1(1.6 * k)}"/><path d="M${f1(cx - r * 0.25)} ${f1(cy - r * 0.35)} L${f1(cx)} ${f1(cy - r * 0.8)} L${f1(cx + r * 0.25)} ${f1(cy - r * 0.35)}" fill="none" stroke="${col}" stroke-width="${f1(1.6 * k)}"/>` + N(cy - r - 2 * k);
      default: return `<path d="M${f1(cx)} ${f1(cy - r)} L${f1(cx + r * 0.5)} ${f1(cy + r * 0.8)} L${f1(cx)} ${f1(cy + r * 0.45)} L${f1(cx - r * 0.5)} ${f1(cy + r * 0.8)} Z" fill="${col}"/>` + N(cy - r - 4 * k);
    }
  }

  /* scale bars: eight designs */
  const SCALES = { alt: ['Bloques alternos', 'Alternating blocks'], stepped: ['Escalonada (dos filas)', 'Stepped (two rows)'], solid: ['Barra sólida', 'Solid bar'], line: ['Línea con topes', 'Line with ends'], ruler: ['Regla', 'Ruler'], dual: ['Kilómetros y millas', 'Kilometres and miles'], text: ['Solo texto', 'Text only'], ratio: ['Escala numérica (1:n)', 'Ratio (1:n)'] };
  function scaleBar(area, pr, box, k, C) {
    const unitKm = S.scaleUnit === 'mi' ? 1.609344 : 1;
    const uName = S.scaleUnit === 'mi' ? 'mi' : 'km';
    const kmPerPx = pr.kmPerPx;
    const target = area.w * 0.22 * kmPerPx / unitKm;
    const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
    let len = nice[0]; nice.forEach(v => { if (v <= target) len = v; });
    const px = len * unitKm / kmPerPx, th = S.scaleThick * k, fs = S.scaleSize * k, col = C.text;
    const segs = clamp(S.scaleSegs, 1, 8);
    const w = px + fs * 3, h = th + fs * 2.6 + (S.scaleStyle === 'dual' ? fs * 1.4 : 0);
    const [x0, y0] = corner(area, S.scalePos, w, h, k);
    const x = x0 + 2 * k, y = y0 + fs * 1.3;
    const lab = (xx, v, yy, anchor) => `<text x="${f1(xx)}" y="${f1(yy)}" font-size="${f1(fs)}" text-anchor="${anchor || 'middle'}" fill="${col}" paint-order="stroke" stroke="${C.bg}" stroke-width="${f1(2.5 * k)}">${v}</text>`;
    let s = '';
    const ratio = () => { const mmPerPx = 25.4 / 96; const n = kmPerPx * 1e6 / mmPerPx; const r = Math.pow(10, Math.floor(Math.log10(n)) - 1); return '1 : ' + (Math.round(n / r) * r).toLocaleString('en-US'); };
    switch (S.scaleStyle) {
      case 'text': return lab(x, `0 — ${len} ${uName}`, y + th, 'start');
      case 'ratio': return lab(x, ratio(), y + th, 'start');
      case 'line': s += `<path d="M${f1(x)} ${f1(y)} v${f1(th)} h${f1(px)} v${f1(-th)}" fill="none" stroke="${col}" stroke-width="${f1(1.3 * k)}"/>` + lab(x, '0', y - 3 * k) + lab(x + px, `${len} ${uName}`, y - 3 * k); break;
      case 'solid': s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(px)}" height="${f1(th)}" fill="${col}"/>` + lab(x + px / 2, `${len} ${uName}`, y - 3 * k); break;
      case 'ruler': s += `<line x1="${f1(x)}" y1="${f1(y + th)}" x2="${f1(x + px)}" y2="${f1(y + th)}" stroke="${col}" stroke-width="${f1(1.3 * k)}"/>`; for (let i = 0; i <= segs; i++) { const xx = x + px * i / segs; s += `<line x1="${f1(xx)}" y1="${f1(y + (i % segs === 0 ? 0 : th * 0.4))}" x2="${f1(xx)}" y2="${f1(y + th)}" stroke="${col}" stroke-width="${f1(1.1 * k)}"/>` + (i === 0 || i === segs || (segs % 2 === 0 && i === segs / 2) ? lab(xx, i === segs ? `${len} ${uName}` : String(+(len * i / segs).toFixed(1)), y - 3 * k, i === segs ? "end" : "middle") : ""); } break;
      case 'stepped': for (let i = 0; i < segs; i++) { const xx = x + px * i / segs; s += `<rect x="${f1(xx)}" y="${f1(y + (i % 2 ? th / 2 : 0))}" width="${f1(px / segs)}" height="${f1(th / 2)}" fill="${col}"/>`; } s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(px)}" height="${f1(th)}" fill="none" stroke="${col}" stroke-width="${f1(0.8 * k)}"/>` + lab(x, '0', y - 3 * k) + lab(x + px, `${len} ${uName}`, y - 3 * k); break;
      case 'dual': {
        s += `<line x1="${f1(x)}" y1="${f1(y + th)}" x2="${f1(x + px)}" y2="${f1(y + th)}" stroke="${col}" stroke-width="${f1(1.3 * k)}"/><line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x)}" y2="${f1(y + th * 2)}" stroke="${col}" stroke-width="${f1(1.3 * k)}"/><line x1="${f1(x + px)}" y1="${f1(y)}" x2="${f1(x + px)}" y2="${f1(y + th)}" stroke="${col}" stroke-width="${f1(1.3 * k)}"/>` + lab(x + px, `${len} ${uName}`, y - 3 * k);
        const other = S.scaleUnit === 'mi' ? 1.609344 : 1 / 1.609344, oName = S.scaleUnit === 'mi' ? 'km' : 'mi';
        let len2 = nice[0]; nice.forEach(v => { if (v * (S.scaleUnit === 'mi' ? 1 : 1.609344) / (S.scaleUnit === 'mi' ? 1.609344 : 1) <= len * 1.0 * (S.scaleUnit === 'mi' ? 1.609344 : 1 / 1.609344) * 0.99 + 1e-9) len2 = v; });
        const px2 = len2 * (oName === 'mi' ? 1.609344 : 1) / kmPerPx;
        s += `<line x1="${f1(x + px2)}" y1="${f1(y + th)}" x2="${f1(x + px2)}" y2="${f1(y + th * 2)}" stroke="${col}" stroke-width="${f1(1.3 * k)}"/>` + lab(x + px2, `${len2} ${oName}`, y + th * 2 + fs);
        void other; break;
      }
      default: for (let i = 0; i < segs; i++) { const xx = x + px * i / segs; s += `<rect x="${f1(xx)}" y="${f1(y)}" width="${f1(px / segs)}" height="${f1(th)}" fill="${i % 2 ? C.bg : col}" stroke="${col}" stroke-width="${f1(0.8 * k)}"/>`; } s += lab(x, '0', y - 3 * k) + lab(x + px, `${len} ${uName}`, y - 3 * k);
    }
    return s;
  }

  /* the legend: units, roles, the density ramp or the three classes of "meet" */
  function legendItems(U, recs) {
    if (S.mode === 'heat') return { ramp: RAMPS[S.ramp], lo: T('baja', 'low'), hi: T('alta', 'high'), label: T('densidad de registros', 'record density') };
    if (S.mode === 'grid') return { ramp: RAMPS[S.ramp], lo: '1', hi: String(MapStudio._gridMax || ''), label: T(`registros por celda de ${S.gridSize}°`, `records per ${S.gridSize}° cell`) };
    const pal = PALETTES[S.palette];
    if (S.mode === 'meet') { const M = meetColours(pal); return { items: [[T('planta y visitante', 'plant and visitor'), M.both, 'square'], [T('solo plantas', 'plants only'), M.plant, 'square'], [T('solo visitantes', 'visitors only'), M.poll, 'square']] }; }
    if (S.colorBy === 'role') return { items: [[T('plantas', 'plants'), pal[0], S.shapePlant], [T('visitantes', 'visitors'), pal[1], S.shapeVisitor]] };
    return { items: U.filter(u => !u.hidden).map(u => [u.unit, u.color, u.shape, true]) };
  }
  function legend(U, recs, area, W, k, C, legW) {
    const L = legendItems(U, recs), fs = S.legendSize * k, lh = fs * 1.55, pad = 8 * k;
    const title = S.legendTitle || (L.label || '');
    let w, h, body = '';
    if (L.ramp) {
      w = Math.max(150 * k, title.length * fs * 0.55 + 2 * pad); h = pad * 2 + (title ? lh : 0) + 14 * k + lh;
    } else {
      const cols = clamp(S.legendCols, 1, 3), rows = Math.ceil(L.items.length / cols);
      const cw = Math.max(...L.items.map(i => i[0].length)) * fs * 0.56 + fs * 2.2;
      w = Math.max(cols * cw, title.length * fs * 0.58) + 2 * pad; h = pad * 2 + (title ? lh : 0) + rows * lh;
    }
    let x, y;
    if (legW) { x = area.x + area.w + 8 * k; y = area.y + 10 * k; w = Math.min(w, legW - 14 * k); }
    else [x, y] = corner(area, S.legendPos, w, h, k);
    const tcol = S.legendBox === 'dark' ? '#e8efe4' : C.text;
    body += boxBehind(x, y, w, h, k, S.legendBox);
    let cy = y + pad;
    if (title) { body += `<text x="${f1(x + pad)}" y="${f1(cy + fs)}" font-size="${f1(fs)}" font-weight="700" fill="${tcol}">${escX(title)}</text>`; cy += lh; }
    if (L.ramp) {
      const bw = w - 2 * pad, gid = 'lg' + (++uid);
      body += `<defs><linearGradient id="${gid}">${L.ramp.map((c, i) => `<stop offset="${(i / (L.ramp.length - 1) * 100).toFixed(0)}%" stop-color="${c}"/>`).join('')}</linearGradient></defs>`;
      body += `<rect x="${f1(x + pad)}" y="${f1(cy + 2 * k)}" width="${f1(bw)}" height="${f1(12 * k)}" fill="url(#${gid})" stroke="${tcol}" stroke-width="${f1(0.5 * k)}"/>`;
      body += `<text x="${f1(x + pad)}" y="${f1(cy + 14 * k + fs + 2 * k)}" font-size="${f1(fs * 0.9)}" fill="${tcol}">${escX(L.lo)}</text><text x="${f1(x + pad + bw)}" y="${f1(cy + 14 * k + fs + 2 * k)}" font-size="${f1(fs * 0.9)}" text-anchor="end" fill="${tcol}">${escX(L.hi)}</text>`;
    } else {
      const cols = clamp(S.legendCols, 1, 3), per = Math.ceil(L.items.length / cols), cw = (w - 2 * pad) / cols;
      L.items.forEach(([lab, col, shape, italic], i) => {
        const cx = x + pad + Math.floor(i / per) * cw, yy = cy + (i % per) * lh + lh / 2;
        body += `<path d="${shapePath(shape, cx + fs * 0.5, yy, fs * 0.38)}" fill="${col}" stroke="${asHex(S.outlineColor)}" stroke-width="${f1(0.5 * k)}"/>`;
        body += `<text x="${f1(cx + fs * 1.3)}" y="${f1(yy + fs * 0.36)}" font-size="${f1(fs)}" font-style="${italic ? 'italic' : 'normal'}" fill="${tcol}">${escX(lab)}</text>`;
      });
    }
    return body;
  }

  /* =====================================================================
     EXPORT
     ===================================================================== */
  function rasterize(R, dpi, fmt) {
    const scale = S.size === 'screen' ? Math.max(1, dpi / 96) : dpi / 96;
    let cw = Math.round(R.W * scale), ch = Math.round(R.H * scale);
    const MAX = 16000; let s = scale;
    if (cw > MAX || ch > MAX) { s = Math.min(MAX / R.W, MAX / R.H); cw = Math.round(R.W * s); ch = Math.round(R.H * s); }
    const url = URL.createObjectURL(new Blob([R.svg], { type: 'image/svg+xml;charset=utf-8' }));
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = cw; c.height = ch;
        const ctx = c.getContext('2d');
        if (fmt === 'jpg' || (fmt !== 'png' && fmt !== 'webp' && S.bgMode === 'transparent')) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch); }
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        resolve({ canvas: c, ctx, scale: s, dpi: Math.round(s * 96) });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg')); };
      img.src = url;
    });
  }
  /* a baseline TIFF, RGBA, uncompressed, with its resolution; with geo = the
     GeoTIFF keys for a longitude–latitude grid on WGS 84 (EPSG 4326) */
  function tiff(ctx, w, h, dpi, geo) {
    const px = ctx.getImageData(0, 0, w, h).data;
    const entries = [[256, 4, 1, w], [257, 4, 1, h], [258, 3, 4, null], [259, 3, 1, 1], [262, 3, 1, 2], [273, 4, 1, null], [277, 3, 1, 4], [278, 4, 1, h], [279, 4, 1, w * h * 4], [282, 5, 1, null], [283, 5, 1, null], [284, 3, 1, 1], [296, 3, 1, 2], [338, 3, 1, 2]];
    if (geo) entries.push([33550, 12, 3, null], [33922, 12, 6, null], [34735, 3, 16, null]);
    entries.sort((a, b) => a[0] - b[0]);
    const ifd = 8, ifdSize = 2 + entries.length * 12 + 4;
    let extra = ifd + ifdSize;
    const offs = {};
    const need = { 258: 8, 282: 8, 283: 8, 33550: 24, 33922: 48, 34735: 32 };
    entries.forEach(e => { if (need[e[0]]) { offs[e[0]] = extra; extra += need[e[0]]; } });
    const dataOff = extra;
    const buf = new ArrayBuffer(dataOff + w * h * 4), dv = new DataView(buf);
    dv.setUint16(0, 0x4949); dv.setUint16(2, 42, true); dv.setUint32(4, ifd, true); dv.setUint16(ifd, entries.length, true);
    entries.forEach(([tag, type, count, val], i) => {
      const p = ifd + 2 + i * 12;
      dv.setUint16(p, tag, true); dv.setUint16(p + 2, type, true); dv.setUint32(p + 4, count, true);
      if (tag === 273) dv.setUint32(p + 8, dataOff, true);
      else if (need[tag]) dv.setUint32(p + 8, offs[tag], true);
      else if (type === 3) dv.setUint16(p + 8, val, true);
      else dv.setUint32(p + 8, val, true);
    });
    [8, 8, 8, 8].forEach((v, i) => dv.setUint16(offs[258] + 2 * i, v, true));
    dv.setUint32(offs[282], Math.round(dpi), true); dv.setUint32(offs[282] + 4, 1, true);
    dv.setUint32(offs[283], Math.round(dpi), true); dv.setUint32(offs[283] + 4, 1, true);
    if (geo) {
      [geo.dx, geo.dy, 0].forEach((v, i) => dv.setFloat64(offs[33550] + 8 * i, v, true));
      [0, 0, 0, geo.x0, geo.y0, 0].forEach((v, i) => dv.setFloat64(offs[33922] + 8 * i, v, true));
      /* GeoKeyDirectory: version 1.1.0, 3 keys — model type geographic, raster = pixel is area, geographic type WGS 84 */
      [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326].forEach((v, i) => dv.setUint16(offs[34735] + 2 * i, v, true));
    }
    new Uint8Array(buf, dataOff).set(px);
    return new Blob([buf], { type: 'image/tiff' });
  }
  async function exportFile() {
    const R = render();
    const name = slug(S.title || T('mapa', 'map'));
    if (S.fmt === 'svg') { download(new Blob([R.svg], { type: 'image/svg+xml;charset=utf-8' }), name + '.svg', 'image/svg+xml'); return { w: R.W, h: R.H }; }
    const r = await rasterize(R, S.dpi, S.fmt);
    const w = r.canvas.width, h = r.canvas.height;
    if (S.fmt === 'tiff' || S.fmt === 'geotiff') {
      const geo = S.fmt === 'geotiff' ? { x0: R.geo.x0, y0: R.geo.y0, dx: R.geo.dx / r.scale, dy: R.geo.dy / r.scale } : null;
      download(tiff(r.ctx, w, h, r.dpi, geo), name + '.tif', 'image/tiff');
      return { w, h, dpi: r.dpi, geo: !!geo, mapOnly: R.geo.mapOnly };
    }
    const type = S.fmt === 'jpg' ? 'image/jpeg' : S.fmt === 'webp' ? 'image/webp' : 'image/png';
    const blob = await new Promise(res => r.canvas.toBlob(res, type, 0.95));
    const ab = await blob.arrayBuffer();
    const bytes = S.fmt === 'png' ? Fig.pngWithDpi(ab, r.dpi) : S.fmt === 'jpg' ? Fig.jpgWithDpi(ab, r.dpi) : new Uint8Array(ab);
    download(new Blob([bytes], { type }), name + '.' + (S.fmt === 'jpg' ? 'jpg' : S.fmt), type);
    return { w, h, dpi: r.dpi };
  }

  /* =====================================================================
     THE EDITOR
     ===================================================================== */
  const two = (es, en) => L2(es, en);
  let host = null, view = null, tabNow = 'base';
  const TABS = [['base', 'Mapa base', 'Base map'], ['frame', 'Encuadre y recorte', 'Framing and clip'], ['text', 'Textos y fuentes', 'Text and fonts'], ['elements', 'Elementos', 'Elements'], ['data', 'Datos', 'Data'], ['colors', 'Colores', 'Colours'], ['looks', 'Estilos', 'Looks'], ['export', 'Exportar', 'Export']];
  const opt = (pairs, cur) => pairs.map(([v, es, en]) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${T(es, en ?? es)}</option>`).join('');
  const ctl = {
    sel: (k, es, en, pairs) => `<label class="inline-label"><span>${T(es, en)}</span><select data-k="${k}">${opt(pairs, S[k])}</select></label>`,
    num: (k, es, en, min, max, step) => `<label class="inline-label"><span>${T(es, en)}</span><input type="number" data-k="${k}" data-num="1" value="${S[k]}" min="${min}" max="${max}" step="${step}" style="width:78px"></label>`,
    range: (k, es, en, min, max, step) => `<label class="inline-label ms-range"><span>${T(es, en)}</span><input type="range" data-k="${k}" data-num="1" value="${S[k]}" min="${min}" max="${max}" step="${step}"><b class="ms-val">${S[k]}</b></label>`,
    check: (k, es, en) => `<label class="checkbox-label"><input type="checkbox" data-k="${k}"${S[k] ? ' checked' : ''}> ${T(es, en)}</label>`,
    color: (k, es, en) => `<label class="inline-label ms-color"><span>${T(es, en)}</span><input type="color" data-k="${k}" value="${asHex(S[k])}"></label>`,
    text: (k, es, en, ph) => `<label class="inline-label ms-wide"><span>${T(es, en)}</span><input type="text" data-k="${k}" value="${escX(S[k])}" placeholder="${escX(ph || '')}"></label>`,
  };
  const POS4 = [['tl', 'Arriba a la izquierda', 'Top left'], ['tr', 'Arriba a la derecha', 'Top right'], ['bl', 'Abajo a la izquierda', 'Bottom left'], ['br', 'Abajo a la derecha', 'Bottom right']];
  const SHAPES = [['circle', 'Círculo', 'Circle'], ['square', 'Cuadrado', 'Square'], ['triangle', 'Triángulo', 'Triangle'], ['diamond', 'Rombo', 'Diamond'], ['cross', 'Cruz', 'Cross'], ['star', 'Estrella', 'Star']];
  const sec = (es, en, body, note) => `<div class="ms-sec"><h4>${T(es, en)}</h4><div class="ms-grid">${body}</div>${note ? `<p class="hint">${note}</p>` : ''}</div>`;

  function paneHTML(tab) {
    switch (tab) {
      case 'base': return sec('Fondo', 'Background',
        ctl.sel('bgMode', 'Fondo de la figura', 'Figure background', [['white', 'Blanco', 'White'], ['theme', 'El del tema de la app', 'The app theme'], ['custom', 'Color propio', 'Custom colour'], ['transparent', 'Transparente', 'Transparent']]) + ctl.color('bgColor', 'Color de fondo', 'Background colour') + ctl.color('sea', 'Mar', 'Sea') + ctl.color('land', 'Tierra de México', 'Land of Mexico') + ctl.color('landOther', 'Tierra de otros países', 'Land of other countries'))
        + sec('Límites', 'Boundaries', ctl.check('showStates', 'Límites de los estados', 'State boundaries') + ctl.color('stateLine', 'Color', 'Colour') + ctl.range('stateW', 'Grosor', 'Width', 0.2, 3, 0.1) + ctl.check('showCountries', 'Límites de los países', 'Country boundaries') + ctl.color('countryLine', 'Color', 'Colour') + ctl.range('countryW', 'Grosor', 'Width', 0.2, 4, 0.1))
        + sec('Nombres de los estados', 'State names', ctl.sel('stateLabels', 'Mostrar', 'Show', [['off', 'No', 'No'], ['code', 'Abreviatura', 'Abbreviation'], ['name', 'Nombre completo', 'Full name']]) + ctl.range('stateLabelSize', 'Tamaño', 'Size', 5, 18, 0.5) + ctl.color('stateLabelColor', 'Color', 'Colour'))
        + sec('Retícula (meridianos y paralelos)', 'Graticule (meridians and parallels)', ctl.check('grat', 'Dibujar la retícula', 'Draw the graticule') + ctl.sel('gratStep', 'Cada', 'Every', [['auto', 'automático', 'automatic'], ['1', '1°'], ['2', '2°'], ['5', '5°'], ['10', '10°'], ['20', '20°']]) + ctl.color('gratColor', 'Color', 'Colour') + ctl.range('gratAlpha', 'Opacidad', 'Opacity', 0.1, 1, 0.05) + ctl.check('gratLabels', 'Etiquetas de grados', 'Degree labels') + ctl.range('gratSize', 'Tamaño de las etiquetas', 'Label size', 6, 16, 0.5))
        + sec('Marco', 'Frame', ctl.check('frameOn', 'Marco alrededor del mapa', 'Frame around the map') + ctl.color('frameColor', 'Color', 'Colour') + ctl.range('frameW', 'Grosor', 'Width', 0.5, 5, 0.25));
      case 'frame': return sec('Encuadre', 'Framing',
        ctl.sel('extent', 'Extensión', 'Extent', [['auto', 'Ajustada a los registros', 'Fitted to the records'], ['mexico', 'México completo', 'Whole Mexico'], ['states', 'Estados elegidos', 'Chosen states'], ['world', 'Mundo', 'World'], ['manual', 'Coordenadas propias', 'Own coordinates']]) + ctl.range('margin', 'Margen alrededor (%)', 'Margin around (%)', 0, 30, 1)
        + (S.extent === 'manual' ? ctl.num('mN', 'Norte (lat.)', 'North (lat.)', -90, 90, 0.5) + ctl.num('mS', 'Sur (lat.)', 'South (lat.)', -90, 90, 0.5) + ctl.num('mW', 'Oeste (lon.)', 'West (lon.)', -180, 180, 0.5) + ctl.num('mE', 'Este (lon.)', 'East (lon.)', -180, 180, 0.5) : '')
        + ctl.check('legendOutside', 'Leyenda fuera del mapa, a la derecha', 'Legend outside the map, on the right'))
        + (S.extent === 'states' || (S.clipOn && S.clipTo === 'states') ? `<div class="ms-sec"><h4>${T('Estados', 'States')}</h4><div class="country-list">${GEO.MX.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => `<label><input type="checkbox" data-state="${s.code}"${S.states.includes(s.code) ? ' checked' : ''}> ${escX(s.name)}</label>`).join('')}</div></div>` : '')
        + sec('Recorte', 'Clip', ctl.check('clipOn', 'Recortar el mapa a México o a los estados elegidos', 'Clip the map to Mexico or to the chosen states') + ctl.sel('clipTo', 'Recortar a', 'Clip to', [['mexico', 'México', 'Mexico'], ['states', 'Estados elegidos', 'Chosen states']]) + ctl.sel('clipOutside', 'Fuera del recorte', 'Outside the clip', [['bg', 'color de fondo', 'background colour'], ['transparent', 'transparente', 'transparent']]) + ctl.check('clipOutline', 'Dibujar el contorno del recorte', 'Draw the outline of the clip') + ctl.color('clipColor', 'Color del contorno', 'Outline colour') + ctl.range('clipW', 'Grosor', 'Width', 0.5, 5, 0.25),
        T('Con el recorte, todo lo que queda fuera del polígono —mar, otros países, puntos— desaparece; el título, la leyenda, la escala y la flecha se dibujan igual.', 'With the clip, everything outside the polygon —sea, other countries, points— disappears; the title, legend, scale bar and arrow are drawn all the same.'));
      case 'text': return sec('Textos', 'Texts', ctl.text('title', 'Título', 'Title') + ctl.text('subtitle', 'Subtítulo', 'Subtitle') + ctl.text('credit', 'Fuente o crédito', 'Source or credit', T('Registros: GBIF (descargado el …)', 'Records: GBIF (downloaded on …)')) + ctl.text('legendTitle', 'Título de la leyenda', 'Legend title'))
        + sec('Tipografía', 'Typography', ctl.sel('font', 'Familia', 'Family', Object.entries(FONTS).map(([k, v]) => [k, v[0], v[1]])) + ctl.color('textColor', 'Color del texto', 'Text colour') + ctl.range('titleSize', 'Tamaño del título', 'Title size', 10, 48, 1) + ctl.check('titleBold', 'Título en negritas', 'Bold title') + ctl.check('titleItalic', 'Título en cursivas', 'Italic title') + ctl.sel('titlePos', 'Título', 'Title', [['tl', 'a la izquierda', 'left'], ['tc', 'centrado', 'centred'], ['tr', 'a la derecha', 'right']]) + ctl.range('subSize', 'Tamaño del subtítulo', 'Subtitle size', 8, 32, 1) + ctl.range('creditSize', 'Tamaño del crédito', 'Credit size', 6, 18, 0.5) + ctl.sel('creditPos', 'Crédito', 'Credit', POS4.concat([['bc', 'Abajo al centro', 'Bottom centre']]).map(p => p)),
          T('Los nombres de las unidades se escriben en cursiva en la leyenda, como corresponde a los nombres científicos.', 'Unit names are written in italics in the legend, as scientific names require.'));
      case 'elements': return `<div class="ms-sec"><h4>${T('Flecha del norte', 'North arrow')}</h4><div class="ms-npick">${['off'].concat(Object.keys(NORTH)).map(n => `<button type="button" class="ms-npick-b${S.north === n ? ' on' : ''}" data-north="${n}">${n === 'off' ? T('Sin flecha', 'None') : T(...NORTH[n])}</button>`).join('')}</div><div class="ms-grid">${ctl.sel('northPos', 'Posición', 'Position', POS4) + ctl.range('northSize', 'Tamaño', 'Size', 20, 110, 1) + ctl.color('northColor', 'Color', 'Colour')}</div></div>`
        + sec('Escala gráfica', 'Scale bar', ctl.check('scaleOn', 'Dibujar la escala', 'Draw the scale bar') + ctl.sel('scaleStyle', 'Formato', 'Format', Object.entries(SCALES).map(([k, v]) => [k, v[0], v[1]])) + ctl.sel('scaleUnit', 'Unidad', 'Unit', [['km', 'kilómetros', 'kilometres'], ['mi', 'millas', 'miles']]) + ctl.sel('scalePos', 'Posición', 'Position', POS4) + ctl.range('scaleSegs', 'Divisiones', 'Divisions', 1, 8, 1) + ctl.range('scaleThick', 'Grosor', 'Thickness', 2, 14, 1) + ctl.range('scaleSize', 'Tamaño del texto', 'Text size', 6, 18, 0.5),
          T('La escala numérica (1:n) se calcula para el tamaño de papel elegido en «Exportar»: cambia si cambias el papel.', 'The ratio (1:n) is computed for the paper size chosen in "Export": it changes if you change the paper.'))
        + sec('Leyenda', 'Legend', ctl.check('legendOn', 'Dibujar la leyenda', 'Draw the legend') + ctl.sel('legendPos', 'Posición', 'Position', POS4) + ctl.sel('legendBox', 'Recuadro', 'Box', [['light', 'claro', 'light'], ['dark', 'oscuro', 'dark'], ['outline', 'solo contorno', 'outline only'], ['none', 'sin recuadro', 'none']]) + ctl.range('legendSize', 'Tamaño del texto', 'Text size', 7, 22, 0.5) + ctl.range('legendCols', 'Columnas', 'Columns', 1, 3, 1));
      case 'data': return sec('Qué se dibuja', 'What is drawn',
        ctl.sel('mode', 'Representación', 'Representation', [['points', 'Puntos', 'Points'], ['heat', 'Mapa de calor (densidad)', 'Heat map (density)'], ['grid', 'Rejilla: registros por celda', 'Grid: records per cell'], ['meet', 'Rejilla: dónde coinciden planta y visitante', 'Grid: where plant and visitor meet'], ['hull', 'Envolventes convexas con puntos', 'Convex hulls with points']]) + ctl.sel('colorBy', 'Color', 'Colour', [['unit', 'por unidad', 'by unit'], ['role', 'por papel (planta / visitante)', 'by role (plant / visitor)']])
        + (S.mode === 'grid' || S.mode === 'meet' ? ctl.sel('gridSize', 'Celda', 'Cell', [['0.1', '0.1°'], ['0.25', '0.25°'], ['0.5', '0.5°'], ['1', '1°'], ['2', '2°']]) : '')
        + (S.mode === 'heat' ? ctl.range('heatRadius', 'Radio', 'Radius', 4, 60, 1) + ctl.range('heatIntensity', 'Intensidad', 'Intensity', 0.4, 3, 0.1) : '')
        + (S.mode === 'hull' ? ctl.range('hullAlpha', 'Opacidad del relleno', 'Fill opacity', 0, 0.6, 0.02) : ''))
        + sec('Puntos', 'Points', ctl.range('radius', 'Tamaño', 'Size', 1, 12, 0.25) + ctl.range('fillAlpha', 'Opacidad', 'Opacity', 0.1, 1, 0.05) + ctl.color('outlineColor', 'Contorno', 'Outline') + ctl.range('outlineW', 'Grosor del contorno', 'Outline width', 0, 3, 0.1) + ctl.range('halo', 'Halo', 'Halo', 0, 4, 0.25) + ctl.sel('shapePlant', 'Forma de las plantas', 'Plant shape', SHAPES) + ctl.sel('shapeVisitor', 'Forma de los visitantes', 'Visitor shape', SHAPES))
        + unitsTable();
      case 'colors': return sec('Paleta de las unidades', 'Unit palette', ctl.sel('palette', 'Paleta', 'Palette', Object.entries(PALETTE_NAMES).map(([k, v]) => [k, v[0], v[1]])) + `<div class="ms-sw">${(PALETTES[S.palette] || []).map(c => `<i style="background:${c}"></i>`).join('')}</div>`)
        + sec('Rampa de densidad', 'Density ramp', ctl.sel('ramp', 'Rampa', 'Ramp', Object.entries(RAMP_NAMES).map(([k, v]) => [k, v[0], v[1]])) + `<div class="ms-sw ms-ramp" style="background:linear-gradient(90deg,${(RAMPS[S.ramp] || RAMPS.green).join(',')})"></div>`)
        + unitsTable() + `<div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" data-act="resetUnits">${two('Volver a los colores de la paleta', 'Back to the palette colours')}</button></div>`;
      case 'looks': return `<div class="ms-looks">${LOOKS.map(l => `<button type="button" class="preset" data-look="${l.id}"><b>${T(...l.t)}</b><small>${T(...l.d)}</small></button>`).join('')}</div>
        <div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" data-act="saveStyle">${two('⤓ Guardar este estilo (.json)', '⤓ Save this style (.json)')}</button>
        <label class="btn btn-ghost btn-sm"><input type="file" accept=".json" data-act="loadStyle" style="display:none">${two('Cargar un estilo…', 'Load a style…')}</label>
        <button type="button" class="btn btn-ghost btn-sm" data-act="reset">${two('Restablecer todo', 'Reset everything')}</button></div>
        <p class="hint">${T('Un estilo aplica fondo, colores, tipografía y elementos de una vez; los textos (título, crédito) y los colores propios de cada unidad se conservan.', 'A look applies background, colours, typography and elements at once; the texts (title, credit) and each unit\'s own colours are kept.')}</p>`;
      case 'export': {
        const [W, H] = sizePx();
        const mm = S.size === 'screen' ? null : [W / PX_PER_MM, H / PX_PER_MM];
        const px = S.size === 'screen' ? [Math.round(W * S.dpi / 96), Math.round(H * S.dpi / 96)] : [Math.round(mm[0] / 25.4 * S.dpi), Math.round(mm[1] / 25.4 * S.dpi)];
        return sec('Archivo', 'File', ctl.sel('fmt', 'Formato', 'Format', [['png', 'PNG'], ['jpg', 'JPEG'], ['webp', 'WebP'], ['svg', 'SVG (vectorial, editable)', 'SVG (vector, editable)'], ['tiff', 'TIFF'], ['geotiff', 'GeoTIFF (con coordenadas)', 'GeoTIFF (georeferenced)']]) + ctl.sel('size', 'Tamaño', 'Size', Object.entries(SIZES).map(([k, v]) => [k, v[0][0], v[0][1]]))
          + (S.size === 'custom' ? ctl.num('wmm', 'Ancho (mm)', 'Width (mm)', 30, 1200, 1) + ctl.num('hmm', 'Alto (mm)', 'Height (mm)', 30, 1200, 1) : '')
          + (S.fmt !== 'svg' ? ctl.sel('dpi', 'Resolución', 'Resolution', [['150', '150 ppp'], ['300', '300 ppp'], ['600', '600 ppp'], ['900', '900 ppp']]) : ''),
          (S.fmt === 'svg' ? T('El SVG guarda cada punto, línea y texto como vector: se abre y se edita en cualquier programa de dibujo.', 'The SVG keeps every point, line and text as a vector: it opens and edits in any drawing program.') : T(`Saldrá de ${px[0].toLocaleString('en-US')} × ${px[1].toLocaleString('en-US')} píxeles${mm ? ` (${mm[0].toFixed(0)} × ${mm[1].toFixed(0)} mm a ${S.dpi} ppp)` : ''}.`, `It will be ${px[0].toLocaleString('en-US')} × ${px[1].toLocaleString('en-US')} pixels${mm ? ` (${mm[0].toFixed(0)} × ${mm[1].toFixed(0)} mm at ${S.dpi} dpi)` : ''}.`))
          + (S.fmt === 'geotiff' ? ' ' + T('El GeoTIFF se abre en un sistema de información geográfica en su lugar (WGS 84, EPSG 4326). Para que el amarre sea exacto en toda la imagen, quita el título y deja la leyenda dentro del mapa.', 'The GeoTIFF opens in a geographic information system in place (WGS 84, EPSG 4326). For an exact fit over the whole image, remove the title and keep the legend inside the map.') : ''))
          + `<div class="btn-row"><button type="button" class="btn btn-primary" data-act="export">${two('⤓ Descargar el mapa', '⤓ Download the map')}</button><span class="hint" data-msg="export" style="margin:0"></span></div>
          <p class="hint">${T('La vista de la izquierda ya tiene la forma del papel elegido: lo que ves es lo que se descarga.', 'The view on the left already has the shape of the chosen paper: what you see is what is downloaded.')}</p>`;
      }
    }
    return '';
  }
  function unitsTable() {
    const U = units();
    return `<div class="ms-sec"><h4>${T('Cada unidad', 'Each unit')}</h4><div class="table-scroll"><table class="map-table"><thead><tr><th>${T('Ver', 'Show')}</th><th>${T('Unidad', 'Unit')}</th><th>${T('Color', 'Colour')}</th><th>${T('Forma', 'Shape')}</th><th class="num">n</th></tr></thead><tbody>` +
      U.map(u => `<tr><td><input type="checkbox" data-unit-show="${escX(u.unit)}"${u.hidden ? '' : ' checked'}></td><td><i>${escX(u.unit)}</i> <span class="role-tag ${u.role}">${T(...Taxa.ROLE[u.role])}</span></td><td><input type="color" data-unit-color="${escX(u.unit)}" value="${asHex(u.color)}"></td><td><select data-unit-shape="${escX(u.unit)}">${opt(SHAPES, u.shape)}</select></td><td class="num">${u.n.toLocaleString('en-US')}</td></tr>`).join('') +
      `</tbody></table></div><div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" data-act="allUnits">${two('Mostrar todas', 'Show all')}</button><button type="button" class="btn btn-ghost btn-sm" data-act="plantsOnly">${two('Solo plantas', 'Plants only')}</button><button type="button" class="btn btn-ghost btn-sm" data-act="visitorsOnly">${two('Solo visitantes', 'Visitors only')}</button></div></div>`;
  }

  /* ---------------- drawing into the page ---------------- */
  let pending = null;
  function redraw() {
    if (!view) return;
    clearTimeout(pending);
    pending = setTimeout(() => {
      const R = render();
      view.innerHTML = R.svg;
      const svg = view.querySelector('svg');
      svg.removeAttribute('width'); svg.removeAttribute('height');
      svg.style.width = '100%'; svg.style.height = 'auto'; svg.style.display = 'block';
      if (window.B4 && B4.afterDraw) B4.afterDraw(R);
    }, 16);
  }
  function renderPane() {
    if (!host) return;                       // not mounted yet: the pane is built on mounting
    const pane = host.querySelector('.ms-pane');
    pane.innerHTML = paneHTML(tabNow);
    host.querySelectorAll('.ms-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tabNow));
  }
  /* the controls that change the layout of the pane itself */
  const REPANE = new Set(['extent', 'clipOn', 'clipTo', 'mode', 'size', 'fmt', 'palette', 'ramp']);
  function set(k, v) {
    S[k] = v; save();
    if (REPANE.has(k)) renderPane();
    redraw();
  }
  function mount(container) {
    host = container;
    host.innerHTML = `<div class="ms-wrap"><div class="ms-view pg-pane" data-fig><div class="pg-title">${two('Mapa', 'Map')}</div><div class="ms-canvas"></div></div>
      <div class="ms-panel"><div class="ms-tabs" role="tablist">${TABS.map(([id, es, en]) => `<button type="button" class="ms-tab" data-tab="${id}">${two(es, en)}</button>`).join('')}</div><div class="ms-pane"></div></div></div>`;
    view = host.querySelector('.ms-canvas');
    host.querySelector('.ms-tabs').addEventListener('click', e => { const b = e.target.closest('.ms-tab'); if (b) { tabNow = b.dataset.tab; renderPane(); } });
    const panel = host.querySelector('.ms-panel');
    panel.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.k && t.type === 'range') { t.nextElementSibling && (t.nextElementSibling.textContent = t.value); S[t.dataset.k] = +t.value; save(); redraw(); }
      else if (t.dataset.k && (t.type === 'color' || t.type === 'text')) { S[t.dataset.k] = t.value; save(); redraw(); }
    });
    panel.addEventListener('change', async e => {
      const t = e.target;
      if (t.dataset.k) {
        if (t.type === 'checkbox') set(t.dataset.k, t.checked);
        else if (t.type === 'range' || t.type === 'color' || t.type === 'text') { /* handled on input */ }
        else set(t.dataset.k, t.dataset.num ? +t.value : t.value);
        return;
      }
      if (t.dataset.state) { S.states = els('[data-state]', panel).filter(i => i.checked).map(i => i.dataset.state); save(); redraw(); return; }
      if (t.dataset.unitShow != null) { unitSet(t.dataset.unitShow, 'hidden', !t.checked); return; }
      if (t.dataset.unitColor != null) { unitSet(t.dataset.unitColor, 'color', t.value); return; }
      if (t.dataset.unitShape != null) { unitSet(t.dataset.unitShape, 'shape', t.value); return; }
      if (t.dataset.act === 'loadStyle' && t.files[0]) {
        try { const o = JSON.parse(await t.files[0].text()); Object.keys(DEF).forEach(k => { if (k in o && typeof o[k] === typeof DEF[k]) S[k] = o[k]; }); save(); renderPane(); redraw(); } catch (err) { /* not a style file */ }
        t.value = '';
      }
    });
    panel.addEventListener('click', async e => {
      const b = e.target.closest('[data-north],[data-look],[data-act]');
      if (!b) return;
      if (b.dataset.north) { S.north = b.dataset.north; save(); renderPane(); redraw(); return; }
      if (b.dataset.look) {
        /* a look starts from the defaults of everything it may touch, so nothing of the previous look lingers */
        const L = LOOKS.find(l => l.id === b.dataset.look);
        LOOK_KEYS.forEach(k2 => { S[k2] = DEF[k2]; });
        Object.assign(S, L.s); save(); renderPane(); redraw(); return;
      }
      const a = b.dataset.act;
      if (a === 'resetUnits') { Object.keys(S.units).forEach(u => { delete S.units[u].color; }); save(); renderPane(); redraw(); }
      else if (a === 'allUnits' || a === 'plantsOnly' || a === 'visitorsOnly') { units().forEach(u => { S.units[u.unit] = Object.assign(S.units[u.unit] || {}, { hidden: a === 'plantsOnly' ? u.role !== 'plant' : a === 'visitorsOnly' ? u.role !== 'poll' : false }); }); save(); renderPane(); redraw(); }
      else if (a === 'reset') { const texts = { title: S.title, subtitle: S.subtitle, credit: S.credit, legendTitle: S.legendTitle }; S = Object.assign({}, DEF, texts, { units: {} }); save(); renderPane(); redraw(); }
      else if (a === 'saveStyle') { const o = Object.assign({}, S); delete o.units; download(JSON.stringify(o, null, 1), 'estilo_de_mapa.json', 'application/json'); }
      else if (a === 'export') {
        const msg = panel.querySelector('[data-msg="export"]');
        b.disabled = true; msg.textContent = T('Preparando…', 'Preparing…');
        try {
          const r = await exportFile();
          msg.innerHTML = r.dpi ? T(`Listo: ${r.w.toLocaleString('en-US')} × ${r.h.toLocaleString('en-US')} px a ${r.dpi} ppp${r.geo && !r.mapOnly ? ' · el título o la leyenda exterior desplazan el amarre: quítalos para un GeoTIFF exacto' : ''}.`, `Done: ${r.w.toLocaleString('en-US')} × ${r.h.toLocaleString('en-US')} px at ${r.dpi} dpi${r.geo && !r.mapOnly ? ' · the title or outside legend shift the fit: remove them for an exact GeoTIFF' : ''}.`) : T('Listo.', 'Done.');
        } catch (err) { msg.textContent = T('No se pudo exportar: ', 'Could not export: ') + (err && err.message || err); }
        finally { b.disabled = false; }
      }
    });
    renderPane(); redraw();
  }
  function unitSet(unit, key, value) {
    S.units[unit] = Object.assign(S.units[unit] || {}, { [key]: value });
    save(); redraw();
  }

  /* =====================================================================
     THE LABG FIGURE STUDIO: the map opens there too, and this studio draws
     it at the output size with the same render() as the Export tab (PNG,
     SVG and GeoTIFF; the figure studio makes the PDF and the TIFF from the
     PNG). Its eight tabs go to the figure studio's inspector.
     ===================================================================== */
  function studioDraw(fmt, o) {
    const [W0, H0] = sizePx();
    const W = o.wmm * PX_PER_MM, H = (o.hmm || o.wmm * H0 / W0) * PX_PER_MM;
    /* the paper of the figure studio: transparent, or white instead of a dark theme or a transparent background */
    const was = S.bgMode;
    if (o.transparent) S.bgMode = 'transparent';
    else if (o.bg === 'white' && (was === 'transparent' || (was === 'theme' && lum(ink().bg) < 0.4))) S.bgMode = 'white';
    let R;
    try { R = render({ size: [W, H] }); } finally { S.bgMode = was; }
    if (fmt === 'svg') {
      const mm = v => +(v / PX_PER_MM).toFixed(3);
      const svg = R.svg.replace(/^<svg([^>]*?) width="[^"]*" height="[^"]*"/, (m, a) => `<svg${a} width="${mm(W)}mm" height="${mm(H)}mm"`);
      return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    }
    let cw = Math.max(1, Math.round(o.wmm / 25.4 * o.dpi)), ch = Math.max(1, Math.round(H / PX_PER_MM / 25.4 * o.dpi));
    const lim = Math.min(1, 16000 / cw, 16000 / ch, Math.sqrt(150e6 / (cw * ch)));
    if (lim < 1) { cw = Math.floor(cw * lim); ch = Math.floor(ch * lim); }
    const url = URL.createObjectURL(new Blob([R.svg], { type: 'image/svg+xml;charset=utf-8' }));
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const c = document.createElement('canvas'); c.width = cw; c.height = ch;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, cw, ch);
        if (fmt === 'geotiff') {
          const sx = cw / W, sy = ch / H;
          resolve(tiff(ctx, cw, ch, Math.round(cw / (o.wmm / 25.4)), { x0: R.geo.x0, y0: R.geo.y0, dx: R.geo.dx / sx, dy: R.geo.dy / sy }));
        } else c.toBlob(b => (b ? resolve(b) : reject(new Error('png'))), 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('svg')); };
      img.src = url;
    });
  }
  const prevHook = window.LABG_FIGSTUDIO && window.LABG_FIGSTUDIO.nativeExport;
  window.LABG_FIGSTUDIO = Object.assign(window.LABG_FIGSTUDIO || {}, {
    nativeExport: rec => {
      const wrap = host && host.querySelector('.ms-wrap');
      const mine = !!(wrap && rec && [rec.el, rec.host].some(n => n && n.isConnected && wrap.contains(n) && n.closest('.ms-view')));
      if (!mine) return typeof prevHook === 'function' ? prevHook(rec) : null;
      return {
        label: T('el estudio de mapas de la app', 'the app’s map studio'),
        formats: ['png', 'svg', 'geotiff'],
        extra: [['geotiff', ['GeoTIFF', 'GeoTIFF']]],
        notes: { geotiff: ['GeoTIFF en WGS 84 (EPSG 4326), para abrirlo en su lugar en un sistema de información geográfica. El título y la leyenda de fuera desplazan el amarre: quítalos para que sea exacto.', 'GeoTIFF on WGS 84 (EPSG 4326), to open in place in a geographic information system. The title and an outside legend shift the fit: remove them for an exact one.'] },
        studioStyles: false,
        lift: false,
        title: () => (S.title || '').trim() || T('Mapa', 'Map'),
        aspect: () => { const [w, h] = sizePx(); return h / w; },   // the shape of the paper chosen in Export
        controls: () => { const p = host && host.querySelector('.ms-panel'); return p ? { node: p, title: ['Estudio del mapa (de la app)', 'Map studio (the app’s)'] } : null; },
        render: (fmt, o) => studioDraw(fmt, o),
      };
    },
  });

  Object.assign(MapStudio, { mount, redraw, render, renderPane, exportFile, tiff, get: () => S, set: (k, v) => set(k, v), units, LOOKS, PALETTES, RAMPS, NORTH, SCALES, shapePath });
  window.MapStudio = MapStudio;
})();
