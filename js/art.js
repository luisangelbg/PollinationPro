/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — hand-drawn SVG illustrations.
   Every picture is generated here with CSS-variable colours, so the whole app
   follows the light/dark theme and nothing depends on external images. The
   outline of Mexico is drawn from the state boundaries the app already
   carries (data/mexico-states.js). Each function returns an SVG string. */

(function () {

  const f1 = v => (+v).toFixed(1);
  const V = n => `var(--${n})`;
  const PI = Math.PI;
  function wrap(vb, inner, extra) { return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" ${extra || ''}>${inner}</svg>`; }
  function txt(x, y, s, fill, size, anchor, extra) {
    return `<text x="${f1(x)}" y="${f1(y)}" fill="${fill || V('text-muted')}" font-size="${size || 8}" text-anchor="${anchor || 'start'}" class="art-font" ${extra || ''}>${s}</text>`;
  }
  const line = (x1, y1, x2, y2, stroke, w, extra) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${stroke}" stroke-width="${w || 1}" ${extra || ''}/>`;
  const circ = (cx, cy, r, fill, extra) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="${fill}" ${extra || ''}/>`;
  const rect = (x, y, w, h, fill, extra) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, w))}" height="${f1(Math.max(0, h))}" fill="${fill}" ${extra || ''}/>`;
  const poly = pts => pts.map((p, i) => (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])).join(' ');
  const path = (d, stroke, w, extra) => `<path d="${d}" stroke="${stroke}" stroke-width="${w || 1.4}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}/>`;
  const fillPath = (d, fill, extra) => `<path d="${d}" fill="${fill}" ${extra || ''}/>`;
  /* a small deterministic generator, so a picture is the same on every load */
  function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * PI * v); };

  /* ============================================================
     PIECES
     ============================================================ */

  /* a Sechium leaf: broadly ovate-cordate, with five shallow, angular,
     pointed lobes and an open basal sinus where the petiole enters */
  function leaf(cx, cy, s, rot, tone) {
    const pts = [];
    const n = 90, tips = [0, -0.42 * PI, 0.42 * PI, -0.78 * PI, 0.78 * PI], tipLen = [1, 0.9, 0.9, 0.72, 0.72];
    for (let i = 0; i <= n; i++) {
      const t = -PI * 0.9 + i / n * PI * 1.8;           // angle from the tip; ±π is the base
      let bump = 0;
      tips.forEach((a, k) => { bump = Math.max(bump, tipLen[k] * Math.exp(-Math.abs(t - a) / 0.11)); });
      const body = 0.74 - 0.1 * Math.abs(t) / PI;         // broad blade, a little narrower to the base
      const r = s * (body + 0.24 * bump);
      pts.push([Math.sin(t) * r, -Math.cos(t) * r * 0.95]);
    }
    const d = 'M0 ' + f1(s * 0.3) + ' ' + pts.map(p => 'L' + f1(p[0]) + ' ' + f1(p[1])).join(' ') + ' Z';
    let veins = '';
    tips.forEach((a, k) => {
      veins += line(0, s * 0.2, Math.sin(a) * s * 0.8 * tipLen[k], -Math.cos(a) * s * 0.78 * tipLen[k], V('card-bg'), s * 0.03, 'opacity="0.5" stroke-linecap="round"');
    });
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot || 0)})">${fillPath(d, V(tone || 'leaf'), 'opacity="0.92"')}${veins}</g>`;
  }
  /* a Sechium flower seen from above: five spreading, pointed petals, cream
     with green veins, and a small centre */
  function flower(cx, cy, r, kind) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const a = -PI / 2 + i * 2 * PI / 5;
      const tip = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      const l = [cx + Math.cos(a - 0.36) * r * 0.45, cy + Math.sin(a - 0.36) * r * 0.45];
      const rr = [cx + Math.cos(a + 0.36) * r * 0.45, cy + Math.sin(a + 0.36) * r * 0.45];
      s += fillPath(`M${f1(cx)} ${f1(cy)} Q${f1(l[0])} ${f1(l[1])} ${f1(tip[0])} ${f1(tip[1])} Q${f1(rr[0])} ${f1(rr[1])} ${f1(cx)} ${f1(cy)} Z`, '#f3efcf', `stroke="${V('leaf')}" stroke-width="${f1(r * 0.05)}" stroke-opacity="0.55"`);
      s += line(cx, cy, cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8, V('leaf'), r * 0.035, 'opacity="0.5"');
    }
    s += circ(cx, cy, r * 0.24, kind === 'f' ? V('leaf') : V('gold'));
    /* the staminate flower shows its fused anthers as a golden ring; the pistillate one, the stigma lobes */
    if (kind === 'f') for (let i = 0; i < 3; i++) { const a = i * 2 * PI / 3; s += circ(cx + Math.cos(a) * r * 0.1, cy + Math.sin(a) * r * 0.1, r * 0.07, '#f3efcf'); }
    else s += circ(cx, cy, r * 0.12, V('accent'), 'opacity="0.9"');
    return s;
  }
  /* a chayote fruit: pear-shaped, furrowed, with its cleft tip */
  function fruit(cx, cy, s, rot) {
    const d = `M0 ${f1(-s)} C ${f1(s * 0.35)} ${f1(-s)} ${f1(s * 0.42)} ${f1(-s * 0.35)} ${f1(s * 0.62)} ${f1(s * 0.2)} C ${f1(s * 0.8)} ${f1(s * 0.72)} ${f1(s * 0.4)} ${f1(s * 1.02)} 0 ${f1(s * 0.9)} C ${f1(-s * 0.4)} ${f1(s * 1.02)} ${f1(-s * 0.8)} ${f1(s * 0.72)} ${f1(-s * 0.62)} ${f1(s * 0.2)} C ${f1(-s * 0.42)} ${f1(-s * 0.35)} ${f1(-s * 0.35)} ${f1(-s)} 0 ${f1(-s)} Z`;
    let g = fillPath(d, '#a9cf6e', `stroke="${V('leaf')}" stroke-width="${f1(s * 0.05)}"`);
    [-0.32, 0, 0.32].forEach(k => g += path(`M${f1(k * s * 0.5)} ${f1(-s * 0.8)} Q ${f1(k * s * 1.4)} ${f1(s * 0.2)} ${f1(k * s * 0.6)} ${f1(s * 0.85)}`, V('leaf'), s * 0.045, 'opacity="0.55"'));
    g += path(`M0 ${f1(-s)} l0 ${f1(-s * 0.25)}`, V('leaf'), s * 0.08);
    g += path(`M0 ${f1(s * 0.9)} l0 ${f1(-s * 0.18)}`, V('card-bg'), s * 0.06, 'opacity="0.5"');
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot || 0)})">${g}</g>`;
  }
  /* a tendril: a stem that ends in a coil */
  function tendril(x, y, len, dir, tone) {
    let d = `M${f1(x)} ${f1(y)}`;
    const k = dir || 1;
    for (let i = 1; i <= 30; i++) {
      const t = i / 30;
      if (t < 0.45) d += ` L${f1(x + k * t * len)} ${f1(y - Math.sin(t * PI) * len * 0.25)}`;
      else {
        const a = (t - 0.45) / 0.55 * 3.4 * PI, r = len * 0.16 * (1 - (t - 0.45) / 0.7);
        d += ` L${f1(x + k * (0.45 * len + len * 0.08 + Math.cos(a + PI) * r))} ${f1(y - len * 0.18 + Math.sin(a) * r)}`;
      }
    }
    return path(d, V(tone || 'leaf'), 1.2, 'opacity="0.8"');
  }
  /* a bee seen from above, heading `ang` degrees (0 = right). The squash bees
     are long-horned (Eucerini): the antennae are drawn long. */
  function bee(cx, cy, s, ang, opts) {
    const o = opts || {};
    const body = o.tone || 'accent';
    let g = '';
    /* wings */
    g += `<ellipse cx="${f1(-s * 0.1)}" cy="${f1(-s * 0.55)}" rx="${f1(s * 0.62)}" ry="${f1(s * 0.28)}" fill="${V('card-bg')}" fill-opacity="0.75" stroke="${V('text-muted')}" stroke-width="${f1(s * 0.04)}" stroke-opacity="0.5" transform="rotate(-18 ${f1(-s * 0.1)} ${f1(-s * 0.55)})"/>`;
    g += `<ellipse cx="${f1(-s * 0.1)}" cy="${f1(s * 0.55)}" rx="${f1(s * 0.62)}" ry="${f1(s * 0.28)}" fill="${V('card-bg')}" fill-opacity="0.75" stroke="${V('text-muted')}" stroke-width="${f1(s * 0.04)}" stroke-opacity="0.5" transform="rotate(18 ${f1(-s * 0.1)} ${f1(s * 0.55)})"/>`;
    /* abdomen with pale bands, thorax, head */
    g += `<ellipse cx="${f1(-s * 0.55)}" cy="0" rx="${f1(s * 0.62)}" ry="${f1(s * 0.36)}" fill="${V(body)}"/>`;
    [-0.3, -0.62, -0.92].forEach(x => g += `<ellipse cx="${f1(s * x)}" cy="0" rx="${f1(s * 0.07)}" ry="${f1(s * 0.33)}" fill="#3a2a14" opacity="0.8"/>`);
    g += circ(s * 0.18, 0, s * 0.3, '#4a3518');
    g += circ(s * 0.55, 0, s * 0.2, '#2e2210');
    /* long antennae */
    g += path(`M${f1(s * 0.66)} ${f1(-s * 0.08)} Q ${f1(s * 1.1)} ${f1(-s * 0.3)} ${f1(s * 1.45)} ${f1(-s * 0.55)}`, '#2e2210', s * 0.06);
    g += path(`M${f1(s * 0.66)} ${f1(s * 0.08)} Q ${f1(s * 1.1)} ${f1(s * 0.3)} ${f1(s * 1.45)} ${f1(s * 0.55)}`, '#2e2210', s * 0.06);
    /* pollen on the hind legs */
    if (o.pollen) { g += circ(-s * 0.05, -s * 0.36, s * 0.12, V('gold')); g += circ(-s * 0.05, s * 0.36, s * 0.12, V('gold')); }
    return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(ang || 0)})">${g}</g>`;
  }

  /* the outline of Mexico, projected into a box, from the state boundaries */
  function mexicoPath(x, y, w, h) {
    if (!window.GEO || !GEO.MX.length) return { d: '', X: v => v, Y: v => v };
    const proj = GEO.projection(GEO.MX_BBOX, w, h, 2);
    let d = '';
    GEO.MX.forEach(st => st.rings.forEach(r => {
      if (r.length < 8) return;
      for (let i = 0; i < r.length; i += 2) {
        if (i && i % 6 && i < r.length - 2) continue;       // thin the ring: this is an icon, not a map
        d += (i ? 'L' : 'M') + f1(x + proj.X(r[i])) + ' ' + f1(y + proj.Y(r[i + 1]));
      }
      d += 'Z';
    }));
    return { d, X: lon => x + proj.X(lon), Y: lat => y + proj.Y(lat) };
  }
  /* a year as a clock: 12 month ticks, an arc from day d0 to day d1 */
  function yearClock(cx, cy, r, arcs, labels) {
    let s = circ(cx, cy, r, 'none', `stroke="${V('border-strong')}" stroke-width="1"`);
    const ms = I18N.lang === 'en' ? 'JFMAMJJASOND' : 'EFMAMJJASOND';
    for (let m = 0; m < 12; m++) {
      const a = -PI / 2 + m / 12 * 2 * PI;
      s += line(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, cx + Math.cos(a) * r, cy + Math.sin(a) * r, V('border-strong'), 1);
      if (labels !== false) { const b = a + PI / 12; s += txt(cx + Math.cos(b) * r * 1.2, cy + Math.sin(b) * r * 1.2 + 2.5, ms[m], V('text-muted'), r * 0.2, 'middle'); }
    }
    (arcs || []).forEach(([d0, d1, tone, rr, w]) => {
      const a0 = -PI / 2 + d0 / 365 * 2 * PI, a1 = -PI / 2 + d1 / 365 * 2 * PI, R = r * (rr || 0.75);
      const large = ((d1 - d0 + 365) % 365) > 182.5 ? 1 : 0;
      s += `<path d="M${f1(cx + Math.cos(a0) * R)} ${f1(cy + Math.sin(a0) * R)} A${f1(R)} ${f1(R)} 0 ${large} 1 ${f1(cx + Math.cos(a1) * R)} ${f1(cy + Math.sin(a1) * R)}" stroke="${V(tone)}" stroke-width="${f1(w || r * 0.16)}" fill="none" stroke-linecap="round" opacity="0.85"/>`;
    });
    return s;
  }
  /* a bell-shaped density along x, as a filled path */
  function bell(x0, x1, yBase, h, mu, sd, tone, op) {
    const n = 60;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const x = x0 + i / n * (x1 - x0), z = (x - mu) / sd;
      pts.push([x, yBase - h * Math.exp(-0.5 * z * z)]);
    }
    return fillPath(poly([[x0, yBase]].concat(pts, [[x1, yBase]])) + 'Z', V(tone), `opacity="${op || 0.4}"`) + path(poly(pts), V(tone), 1.6);
  }
  /* a density blob in a plane (niche in environmental space) */
  function blob(cx, cy, rx, ry, rot, tone, op) {
    let s = '';
    [1, 0.7, 0.42].forEach((k, i) => s += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx * k)}" ry="${f1(ry * k)}" transform="rotate(${f1(rot)} ${f1(cx)} ${f1(cy)})" fill="${V(tone)}" opacity="${(op || 0.18) * (i + 1)}"/>`);
    return s;
  }
  /* a bipartite network: plants below, visitors above */
  function bipartite(x0, x1, yTop, yBot, links, nTop, nBot, rTop, rBot) {
    let s = '';
    const xt = i => x0 + (i + 0.5) / nTop * (x1 - x0), xb = j => x0 + (j + 0.5) / nBot * (x1 - x0);
    links.forEach(([i, j, w]) => s += line(xt(i), yTop, xb(j), yBot, V('text-muted'), w || 1, 'opacity="0.45"'));
    for (let i = 0; i < nTop; i++) s += bee(xt(i), yTop - 2, rTop || 6, -90, { tone: i % 3 === 0 ? 'accent' : i % 3 === 1 ? 'gold' : 'soil' });
    for (let j = 0; j < nBot; j++) s += flower(xb(j), yBot + 4, rBot || 7, j % 2 ? 'm' : 'f');
    return s;
  }

  /* ============================================================
     HERO
     ============================================================ */
  function hero() {
    const W = 540, H = 450;
    const r = seeded(20260927);
    let s = `<defs>
      <linearGradient id="ppSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--sky)" stop-opacity="0.16"/><stop offset="100%" stop-color="var(--sky)" stop-opacity="0"/></linearGradient>
      <radialGradient id="ppGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stop-color="var(--gold)" stop-opacity="0.35"/><stop offset="100%" stop-color="var(--gold)" stop-opacity="0"/></radialGradient>
    </defs>`;
    s += rect(0, 0, W, H, 'url(#ppSky)');
    s += txt(26, 28, T('PLANTAS · POLINIZADORES · SOLAPAMIENTO', 'PLANTS · POLLINATORS · OVERLAP'), V('primary'), 11, 'start', 'letter-spacing="1.6" font-weight="700"');
    s += txt(26, 44, T('dónde · cuándo · en qué clima · con quién', 'where · when · in what climate · with whom'), V('text-muted'), 10);

    /* --- the vine along the left and bottom --- */
    s += path('M-10 420 C 60 380, 90 330, 110 270 S 150 170, 210 150', V('leaf'), 3.2, 'opacity="0.85"');
    s += path('M110 270 C 150 300, 200 320, 250 330', V('leaf'), 2.2, 'opacity="0.8"');
    s += tendril(210, 150, 60, 1) + tendril(250, 330, 50, 1) + tendril(80, 340, 44, -1);
    s += leaf(58, 372, 44, -30) + leaf(122, 230, 40, 20) + leaf(176, 176, 30, 45, 'primary') + leaf(210, 318, 34, 70);
    s += fruit(92, 300, 26, 12);
    /* a raceme of male flowers and one female flower, with the bee arriving */
    [[228, 142, 13], [242, 124, 11], [252, 106, 9]].forEach(([x, y, rr]) => s += flower(x, y, rr, 'm'));
    s += circ(160, 262, 34, 'url(#ppGlow)') + flower(160, 262, 16, 'f');
    s += path('M300 70 C 280 110, 240 160, 196 200 S 170 244, 168 250', V('accent'), 1.3, 'stroke-dasharray="3 4" opacity="0.8"');
    s += bee(300, 70, 13, 120, { pollen: true });

    /* --- the map: plant and pollinator records over Mexico --- */
    const mx = mexicoPath(292, 84, 230, 150);
    s += rect(286, 80, 242, 160, V('card-bg'), `rx="10" stroke="${V('border')}" opacity="0.9"`);
    if (mx.d) s += fillPath(mx.d, V('bg-soft'), `stroke="${V('border-strong')}" stroke-width="0.5"`);
    const cloud = (lon, lat, sdx, sdy, n, tone) => {
      let o = '';
      for (let i = 0; i < n; i++) {
        const lo = lon + sdx * gauss(r), la = lat + sdy * gauss(r);
        if (window.GEO && !GEO.stateOf(lo, la)) continue;
        o += circ(mx.X(lo), mx.Y(la), 1.9, V(tone), 'opacity="0.85"');
      }
      return o;
    };
    s += cloud(-97.2, 19.2, 1.4, 1.1, 70, 'primary') + cloud(-99.2, 19.6, 2.8, 1.8, 90, 'accent');
    s += circ(300, 229, 3, V('primary')) + txt(306, 232, T('planta', 'plant'), V('text-muted'), 8);
    s += circ(350, 229, 3, V('accent')) + txt(356, 232, T('polinizador', 'pollinator'), V('text-muted'), 8);

    /* --- the year clock: flowering against activity --- */
    s += rect(286, 252, 116, 118, V('card-bg'), `rx="10" stroke="${V('border')}" opacity="0.9"`);
    s += yearClock(344, 312, 38, [[182, 335, 'primary', 0.72, 6], [213, 305, 'accent', 0.5, 6]]);
    s += txt(344, 364, T('floración y vuelo', 'flowering and flight'), V('text-muted'), 7.5, 'middle');

    /* --- the niche: two densities in environmental space --- */
    s += rect(412, 252, 116, 118, V('card-bg'), `rx="10" stroke="${V('border')}" opacity="0.9"`);
    s += line(424, 352, 518, 352, V('border-strong'), 1) + line(424, 262, 424, 352, V('border-strong'), 1);
    s += blob(458, 312, 26, 16, -25, 'primary') + blob(482, 298, 28, 17, -30, 'accent');
    s += txt(471, 364, T('nicho climático', 'climatic niche'), V('text-muted'), 7.5, 'middle');
    s += txt(492, 272, 'D = 0.54', V('text'), 8, 'middle', 'font-weight="700"');

    /* --- the network strip --- */
    s += rect(286, 380, 242, 52, V('card-bg'), `rx="10" stroke="${V('border')}" opacity="0.9"`);
    s += bipartite(296, 518, 396, 418, [[0, 0, 1.6], [0, 1, 1], [1, 1, 2.2], [1, 2, 1], [2, 2, 1.4], [3, 3, 1.2], [2, 3, 0.8]], 4, 4, 4.2, 5.5);
    s += txt(26, 438, T('la coincidencia es la hipótesis; la visita, la evidencia', 'coincidence is the hypothesis; the visit, the evidence'), V('text-muted'), 9, 'start', 'font-style="italic"');
    return wrap(`0 0 ${W} ${H}`, s);
  }

  /* ============================================================
     BLOCK CARDS — one small picture per block (240 × 112)
     ============================================================ */
  const card = inner => wrap('0 0 240 112', rect(0, 0, 240, 112, V('bg-soft')) + inner);
  function bData() {
    let s = '';
    /* the globe of records and a table */
    s += circ(60, 56, 36, V('card-bg'), `stroke="${V('border-strong')}"`);
    s += `<ellipse cx="60" cy="56" rx="16" ry="36" fill="none" stroke="${V('border-strong')}"/>` + line(24, 56, 96, 56, V('border-strong'), 1) + line(30, 38, 90, 38, V('border-strong'), 0.7) + line(30, 74, 90, 74, V('border-strong'), 0.7);
    const r = seeded(4);
    for (let i = 0; i < 18; i++) s += circ(40 + 40 * r(), 30 + 50 * r(), 2, V(i % 3 ? 'primary' : 'accent'));
    s += rect(120, 18, 104, 76, V('card-bg'), `rx="6" stroke="${V('border')}"`);
    for (let i = 0; i < 5; i++) {
      const y = 32 + i * 13;
      s += circ(130, y, 3, V(i % 2 ? 'accent' : 'primary'));
      s += rect(138, y - 3, 44 + (i % 3) * 8, 5, V('border-strong'), 'rx="2" opacity="0.7"') + rect(196, y - 3, 20, 5, V('border'), 'rx="2"');
    }
    return card(s);
  }
  function bClean() {
    let s = '';
    s += fillPath('M30 20 L130 20 L92 62 L92 92 L68 92 L68 62 Z', V('card-bg'), `stroke="${V('border-strong')}"`);
    const r = seeded(9);
    for (let i = 0; i < 14; i++) s += circ(42 + 76 * r(), 24 + 14 * r(), 2.4, V(i % 4 ? 'primary' : 'danger'), 'opacity="0.85"');
    for (let i = 0; i < 4; i++) s += circ(76 + 8 * (i % 2), 70 + 6 * i, 2.4, V('primary'));
    /* flags */
    [[160, 30, 'danger', T('duplicado', 'duplicate')], [160, 54, 'warning', T('cultivado', 'cultivated')], [160, 78, 'rose', T('(0, 0)', '(0, 0)')]].forEach(([x, y, c, t]) => {
      s += line(x, y - 8, x, y + 8, V('text-muted'), 1.2) + fillPath(`M${x} ${y - 8} l12 4 l-12 4 Z`, V(c));
      s += txt(x + 18, y + 2, t, V('text-muted'), 8.5);
    });
    return card(s);
  }
  function bMap() {
    let s = '';
    const mx = mexicoPath(20, 8, 200, 96);
    if (mx.d) s += fillPath(mx.d, V('card-bg'), `stroke="${V('border-strong')}" stroke-width="0.5"`);
    const r = seeded(21);
    for (let i = 0; i < 40; i++) {
      const lo = -104 + 10 * r(), la = 16 + 6 * r();
      if (window.GEO && !GEO.stateOf(lo, la)) continue;
      s += circ(mx.X(lo), mx.Y(la), 2, V(i % 2 ? 'primary' : 'accent'), 'opacity="0.85"');
    }
    /* north arrow and scale */
    s += fillPath('M214 18 l5 14 l-5 -4 l-5 4 Z', V('text')) + txt(214, 14, 'N', V('text'), 7, 'middle', 'font-weight="700"');
    s += rect(170, 98, 40, 3, V('text')) + rect(190, 98, 20, 3, V('card-bg'), `stroke="${V('text')}" stroke-width="0.6"`);
    return card(s);
  }
  function bCooc() {
    let s = '';
    const r = seeded(33);
    for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) {
      const x = 16 + i * 14, y = 12 + j * 14;
      const a = r() < 0.4, b = r() < 0.35 || (a && r() < 0.5);
      const fill = a && b ? V('gold') : a ? V('primary') : b ? V('accent') : V('card-bg');
      s += rect(x, y, 13, 13, fill, `opacity="${a || b ? 0.8 : 1}" stroke="${V('border')}" stroke-width="0.5"`);
    }
    /* the hypergeometric distribution with the observed value */
    const pts = [];
    for (let k = 0; k <= 12; k++) { const p = Math.exp(-0.5 * ((k - 5) / 1.8) ** 2); pts.push([190 + k * 3.4, 90 - p * 58]); }
    pts.forEach(([x, y]) => s += rect(x - 1.3, y, 2.6, 90 - y, V('text-muted'), 'opacity="0.6"'));
    s += line(190 + 10 * 3.4, 26, 190 + 10 * 3.4, 92, V('gold'), 2);
    s += txt(214, 22, T('obs', 'obs'), V('text'), 7.5, 'middle', 'font-weight="700"');
    return card(s);
  }
  function bPheno() {
    let s = yearClock(64, 56, 38, [[190, 330, 'primary', 0.74, 7], [220, 300, 'accent', 0.5, 7]]);
    s += line(118, 90, 226, 90, V('border-strong'), 1);
    s += bell(118, 226, 90, 44, 160, 18, 'primary', 0.3) + bell(118, 226, 90, 36, 182, 22, 'accent', 0.3);
    s += txt(172, 104, T('altitud', 'elevation'), V('text-muted'), 7.5, 'middle');
    return card(s);
  }
  function bNiche() {
    let s = line(22, 96, 222, 96, V('border-strong'), 1) + line(22, 12, 22, 96, V('border-strong'), 1);
    const r = seeded(51);
    for (let i = 0; i < 120; i++) s += circ(30 + 185 * r(), 16 + 76 * r(), 1.1, V('border-strong'));
    s += blob(96, 56, 44, 24, -20, 'primary', 0.2) + blob(140, 46, 48, 26, -28, 'accent', 0.2);
    s += txt(120, 10, T('ACP del ambiente', 'PCA of the environment'), V('text-muted'), 7.5, 'middle', 'y="108"');
    return card(s);
  }
  let sdmClipN = 0;
  function bSdm() {
    let s = '';
    const clipId = 'bsdmClip' + (++sdmClipN);   /* unique per drawing: the art appears more than once */
    const mx = mexicoPath(10, 8, 150, 96);
    if (mx.d) s += `<clipPath id="${clipId}"><path d="${mx.d}"/></clipPath>`;
    if (mx.d) {
      /* suitability bands clipped to the country */
      let bands = '';
      for (let k = 0; k < 8; k++) bands += `<ellipse cx="${f1(mx.X(-98))}" cy="${f1(mx.Y(19.5))}" rx="${f1(70 - k * 8)}" ry="${f1(34 - k * 4)}" fill="${V('primary')}" opacity="0.12"/>`;
      let bands2 = '';
      for (let k = 0; k < 7; k++) bands2 += `<ellipse cx="${f1(mx.X(-101))}" cy="${f1(mx.Y(21))}" rx="${f1(60 - k * 8)}" ry="${f1(30 - k * 4)}" fill="${V('accent')}" opacity="0.12"/>`;
      s += fillPath(mx.d, V('card-bg'), `stroke="${V('border-strong')}" stroke-width="0.5"`);
      s += `<g clip-path="url(#${clipId})">${bands}${bands2}</g>`;
    }
    s += rect(170, 22, 10, 10, V('primary'), 'opacity="0.6"') + txt(184, 30, T('solo planta', 'plant only'), V('text-muted'), 7.5);
    s += rect(170, 42, 10, 10, V('gold'), 'opacity="0.8"') + txt(184, 50, T('ambos', 'both'), V('text-muted'), 7.5);
    s += rect(170, 62, 10, 10, V('accent'), 'opacity="0.6"') + txt(184, 70, T('solo abeja', 'bee only'), V('text-muted'), 7.5);
    s += txt(170, 92, T('desajuste →', 'mismatch →'), V('danger'), 7.5, 'start', 'font-weight="700"');
    return card(s);
  }
  function bNetwork() {
    return card(bipartite(24, 216, 28, 82, [[0, 0, 2], [0, 1, 1], [1, 1, 3], [1, 2, 1], [2, 2, 1.5], [3, 2, 1], [3, 3, 2.4], [4, 3, 1], [4, 4, 1.4], [2, 0, 0.8]], 5, 5, 6, 7.5));
  }
  function bReport() {
    let s = rect(28, 10, 70, 92, V('card-bg'), `rx="4" stroke="${V('border-strong')}"`);
    for (let i = 0; i < 6; i++) s += rect(36, 20 + i * 8, 50 - (i % 3) * 10, 3, V('border-strong'), 'rx="1.5"');
    s += rect(36, 70, 54, 22, V('bg-soft')) + path('M38 88 L50 80 L60 84 L72 74 L88 76', V('primary'), 1.4);
    s += rect(112, 22, 56, 70, V('card-bg'), `rx="4" stroke="${V('border-strong')}"`) + bell(116, 164, 60, 28, 136, 8, 'accent', 0.35);
    s += rect(182, 30, 40, 50, V('accent'), 'rx="4" opacity="0.85"') + txt(202, 60, '.zip', V('card-bg'), 10, 'middle', 'font-weight="700"');
    return card(s);
  }

  /* ============================================================
     METHOD GALLERY (200 × 124)
     ============================================================ */
  const m = inner => wrap('0 0 200 124', rect(0, 0, 200, 124, V('bg-soft')) + inner);
  function mGbif() {
    let s = circ(56, 62, 34, V('card-bg'), `stroke="${V('border-strong')}"`) + `<ellipse cx="56" cy="62" rx="14" ry="34" fill="none" stroke="${V('border-strong')}"/>`;
    const r = seeded(2);
    for (let i = 0; i < 16; i++) s += circ(36 + 40 * r(), 38 + 48 * r(), 1.9, V('primary'));
    s += path('M100 62 L140 62', V('text-muted'), 1.6) + fillPath('M140 57 l8 5 l-8 5 Z', V('text-muted'));
    for (let i = 0; i < 5; i++) s += rect(154, 34 + i * 12, 34, 6, V(i % 2 ? 'border-strong' : 'primary'), 'rx="2" opacity="0.7"');
    return m(s);
  }
  function mSynonyms() {
    let s = rect(14, 26, 76, 22, V('card-bg'), `rx="5" stroke="${V('border-strong')}"`) + txt(52, 41, 'Peponapis', V('text'), 9, 'middle', 'font-style="italic"');
    s += rect(14, 76, 76, 22, V('card-bg'), `rx="5" stroke="${V('border-strong')}"`) + txt(52, 91, 'Xenoglossa', V('text'), 9, 'middle', 'font-style="italic"');
    s += path('M92 37 C 116 37, 116 62, 132 62', V('accent'), 1.6) + path('M92 87 C 116 87, 116 62, 132 62', V('accent'), 1.6);
    s += rect(132, 50, 58, 24, V('accent'), 'rx="6" opacity="0.2"') + txt(161, 66, 'Xenoglossa', V('text'), 9, 'middle', 'font-style="italic" font-weight="700"');
    return m(s);
  }
  function mClean() { return bClean().replace('viewBox="0 0 240 112"', 'viewBox="0 0 240 112" preserveAspectRatio="xMidYMid meet"'); }
  function mWild() {
    let s = leaf(52, 58, 30, -10) + fruit(60, 86, 14, 8);
    s += rect(112, 30, 72, 64, V('card-bg'), `rx="6" stroke="${V('border-strong')}"`);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) s += rect(120 + j * 15, 40 + i * 16, 12, 10, V('leaf'), 'rx="2" opacity="0.5"');
    s += line(108, 26, 188, 98, V('danger'), 2) + txt(148, 112, T('cultivado', 'cultivated'), V('danger'), 8, 'middle', 'font-weight="700"');
    return m(s);
  }
  function mHyper() {
    let s = '';
    for (let k = 0; k <= 14; k++) {
      const p = Math.exp(-0.5 * ((k - 6) / 2) ** 2);
      s += rect(24 + k * 10, 100 - p * 70, 7, p * 70, V(k >= 11 ? 'gold' : 'text-muted'), `opacity="${k >= 11 ? 0.9 : 0.5}"`);
    }
    s += line(24 + 11 * 10 + 3.5, 20, 24 + 11 * 10 + 3.5, 102, V('accent'), 1.6, 'stroke-dasharray="3 2"');
    s += txt(24 + 11 * 10 + 8, 26, T('observado', 'observed'), V('text'), 8, 'start', 'font-weight="700"');
    s += line(20, 102, 184, 102, V('border-strong'), 1);
    return m(s);
  }
  function mNN() {
    const r = seeded(77);
    let s = '';
    const A = [], B = [];
    for (let i = 0; i < 9; i++) A.push([30 + 140 * r(), 20 + 84 * r()]);
    for (let i = 0; i < 9; i++) B.push([30 + 140 * r(), 20 + 84 * r()]);
    A.forEach(a => {
      let best = B[0], bd = 1e9;
      B.forEach(b => { const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d < bd) { bd = d; best = b; } });
      s += line(a[0], a[1], best[0], best[1], V('text-muted'), 1, 'stroke-dasharray="2 2"');
    });
    A.forEach(a => s += circ(a[0], a[1], 3.2, V('primary')));
    B.forEach(b => s += circ(b[0], b[1], 3.2, V('accent')));
    return m(s);
  }
  function mHull() {
    let s = fillPath('M30 90 L60 30 L110 24 L126 70 L90 104 Z', V('primary'), 'opacity="0.25"') + path('M30 90 L60 30 L110 24 L126 70 L90 104 Z', V('primary'), 1.4);
    s += fillPath('M80 60 L120 20 L176 40 L170 96 L110 104 Z', V('accent'), 'opacity="0.25"') + path('M80 60 L120 20 L176 40 L170 96 L110 104 Z', V('accent'), 1.4);
    s += txt(112, 70, '∩', V('text'), 16, 'middle', 'font-weight="700"');
    return m(s);
  }
  function mCircular() {
    let s = yearClock(70, 62, 40, [], true);
    const a = -PI / 2 + 200 / 365 * 2 * PI;
    s += line(70, 62, 70 + Math.cos(a) * 30, 62 + Math.sin(a) * 30, V('primary'), 2.4) + circ(70 + Math.cos(a) * 30, 62 + Math.sin(a) * 30, 3, V('primary'));
    const r = seeded(8);
    for (let i = 0; i < 20; i++) { const d = 200 + 30 * gauss(r), b = -PI / 2 + d / 365 * 2 * PI; s += circ(70 + Math.cos(b) * 36, 62 + Math.sin(b) * 36, 1.8, V('accent')); }
    s += txt(150, 52, 'R̄ = 0.82', V('text'), 9, 'middle', 'font-weight="700"') + txt(150, 68, 'p < 0.001', V('text-muted'), 8.5, 'middle');
    return m(s);
  }
  function mPhenoOverlap() {
    let s = line(16, 100, 186, 100, V('border-strong'), 1);
    for (let k = 0; k < 12; k++) {
      const a = Math.exp(-0.5 * ((k - 6.5) / 1.6) ** 2), b = Math.exp(-0.5 * ((k - 7.5) / 1.4) ** 2);
      s += rect(20 + k * 14, 100 - a * 70, 6, a * 70, V('primary'), 'opacity="0.75"') + rect(26 + k * 14, 100 - b * 70, 6, b * 70, V('accent'), 'opacity="0.75"');
    }
    return m(s);
  }
  function mElev() {
    let s = line(20, 104, 184, 104, V('border-strong'), 1);
    s += bell(20, 184, 104, 70, 90, 22, 'primary', 0.3) + bell(20, 184, 104, 58, 118, 28, 'accent', 0.3);
    s += fillPath('M20 104 L60 60 L84 76 L118 34 L150 70 L184 50 L184 104 Z', V('border-strong'), 'opacity="0.18"');
    return m(s);
  }
  function mPcaEnv() {
    let s = line(20, 104, 186, 104, V('border-strong'), 1) + line(20, 14, 20, 104, V('border-strong'), 1);
    const r = seeded(15);
    for (let i = 0; i < 90; i++) s += circ(26 + 156 * r(), 18 + 82 * r(), 1, V('border-strong'));
    s += blob(80, 62, 36, 20, -20, 'primary', 0.2) + blob(118, 52, 40, 22, -28, 'accent', 0.2);
    s += path('M40 96 L64 76', V('text'), 1.3) + path('M40 96 L36 70', V('text'), 1.3);
    return m(s);
  }
  function mDI() {
    let s = line(16, 100, 186, 100, V('border-strong'), 1);
    s += bell(16, 186, 100, 70, 80, 20, 'primary', 0.3) + bell(16, 186, 100, 70, 118, 22, 'accent', 0.3);
    s += txt(100, 20, 'D = 0.41   I = 0.67', V('text'), 9.5, 'middle', 'font-weight="700"');
    return m(s);
  }
  function mTests() {
    let s = line(16, 100, 186, 100, V('border-strong'), 1);
    for (let k = 0; k < 20; k++) {
      const h = Math.exp(-0.5 * ((k - 12) / 3) ** 2) * 66;
      s += rect(20 + k * 8, 100 - h, 6, h, V('text-muted'), 'opacity="0.5"');
    }
    s += line(20 + 4 * 8 + 3, 22, 20 + 4 * 8 + 3, 102, V('danger'), 2) + txt(20 + 4 * 8 + 6, 28, T('D real', 'real D'), V('danger'), 8, 'start', 'font-weight="700"');
    s += txt(140, 20, T('nulo', 'null'), V('text-muted'), 8.5, 'middle');
    return m(s);
  }
  function mEnvelope() {
    let s = line(20, 104, 186, 104, V('border-strong'), 1) + line(20, 14, 20, 104, V('border-strong'), 1);
    const r = seeded(5);
    for (let i = 0; i < 40; i++) s += circ(70 + 70 * r(), 30 + 50 * r(), 2, V('primary'), 'opacity="0.8"');
    s += rect(64, 26, 82, 58, 'none', `stroke="${V('accent')}" stroke-width="1.6" stroke-dasharray="4 3"`);
    s += `<ellipse cx="105" cy="55" rx="48" ry="36" fill="none" stroke="${V('primary')}" stroke-width="1.4"/>`;
    return m(s);
  }
  function mMismatch() { return bSdm().replace('viewBox="0 0 240 112"', 'viewBox="0 0 240 112" preserveAspectRatio="xMidYMid meet"'); }
  function mNetwork() { return m(bipartite(20, 180, 30, 92, [[0, 0, 2], [0, 1, 1], [1, 1, 2.4], [2, 2, 1.4], [3, 2, 1], [3, 3, 2]], 4, 4, 6, 7.5)); }
  function mNodf() {
    let s = '';
    const M = [[1, 1, 1, 1, 1], [1, 1, 1, 1, 0], [1, 1, 1, 0, 0], [1, 1, 0, 0, 0], [1, 0, 0, 0, 0]];
    M.forEach((row, i) => row.forEach((v, j) => s += rect(50 + j * 20, 14 + i * 20, 18, 18, v ? V('primary') : V('card-bg'), `rx="2" stroke="${V('border')}" opacity="${v ? 0.85 : 1}"`)));
    s += path('M52 112 Q 110 110 150 20', V('accent'), 1.4, 'stroke-dasharray="3 3"');
    return m(s);
  }
  function mH2() {
    let s = '';
    const M = [[4, 0, 0, 0], [0, 3, 1, 0], [0, 0, 5, 0], [0, 0, 1, 4]];
    M.forEach((row, i) => row.forEach((v, j) => s += rect(56 + j * 22, 14 + i * 22, 20, 20, v ? V('accent') : V('card-bg'), `rx="2" stroke="${V('border')}" opacity="${v ? 0.2 + v / 6 : 1}"`)));
    s += txt(150, 60, "H₂′ = 0.81", V('text'), 9, 'start', 'font-weight="700" x="148"');
    return m(s);
  }
  function mRarefy() {
    let s = line(20, 104, 186, 104, V('border-strong'), 1) + line(20, 14, 20, 104, V('border-strong'), 1);
    const pts = [];
    for (let i = 0; i <= 40; i++) { const x = i / 40; pts.push([20 + x * 160, 104 - 84 * (1 - Math.exp(-3.4 * x))]); }
    s += path(poly(pts), V('primary'), 2);
    s += line(20, 104 - 84 * 0.99, 186, 104 - 84 * 0.99, V('accent'), 1.2, 'stroke-dasharray="4 3"');
    s += txt(150, 30 - 12, 'Chao1', V('accent'), 8.5, 'middle', 'font-weight="700"');
    return m(s);
  }
  function mGrid() { return bCooc().replace('viewBox="0 0 240 112"', 'viewBox="0 0 240 112" preserveAspectRatio="xMidYMid meet"'); }

  /* ============================================================
     THEORY FIGURES
     ============================================================ */
  /* the chain of evidence: from co-occurrence to pollination */
  function figEvidence() {
    const W = 620, H = 150;
    const steps = [
      [T('Coinciden en el espacio', 'Co-occur in space'), T('Bloques 4–5', 'Blocks 4–5'), 'primary'],
      [T('Coinciden en el tiempo', 'Co-occur in time'), T('Bloque 6', 'Block 6'), 'primary'],
      [T('Comparten nicho', 'Share a niche'), T('Bloques 7–8', 'Blocks 7–8'), 'primary'],
      [T('La visita', 'It visits'), T('Bloque 9', 'Block 9'), 'accent'],
      [T('Lleva y deposita polen', 'Carries and deposits pollen'), T('campo', 'field'), 'danger'],
    ];
    let s = rect(0, 0, W, H, V('card-bg'), 'rx="12"');
    steps.forEach(([t1, t2, c], i) => {
      const x = 14 + i * 122;
      s += rect(x, 36, 108, 62, V(c), `rx="10" opacity="${0.12 + i * 0.05}"`) + rect(x, 36, 108, 62, 'none', `rx="10" stroke="${V(c)}" stroke-width="1.4"`);
      s += `<foreignObject x="${x + 4}" y="42" width="100" height="40"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 11px system-ui,sans-serif;text-align:center;color:var(--text);line-height:1.2">${t1}</div></foreignObject>`;
      s += txt(x + 54, 92, t2, V('text-muted'), 9, 'middle');
      if (i < steps.length - 1) s += fillPath(`M${x + 110} 62 l10 5 l-10 5 Z`, V('text-muted'));
    });
    s += txt(14, 22, T('Cada eslabón es necesario; solo el último prueba la polinización.', 'Every link is necessary; only the last one proves pollination.'), V('text'), 11, 'start', 'font-weight="700"');
    s += txt(14, 124, T('← oportunidad de interacción (datos de presencia)', '← opportunity for interaction (presence data)'), V('primary'), 9.5);
    s += txt(W - 14, 124, T('evidencia de interacción →', 'evidence of interaction →'), V('accent'), 9.5, 'end');
    s += txt(W - 14, 140, T('(visitas, carga y depósito de polen)', '(visits, pollen load and deposition)'), V('text-muted'), 9, 'end');
    return wrap(`0 0 ${W} ${H}`, s);
  }
  /* the sampling-bias trap: both species follow the road */
  function figBias() {
    const W = 460, H = 180;
    let s = rect(0, 0, W, H, V('card-bg'), 'rx="12"');
    s += path('M10 150 C 120 120, 200 60, 450 40', V('border-strong'), 10, 'opacity="0.5"');
    s += txt(420, 30, T('carretera', 'road'), V('text-muted'), 9, 'end');
    const r = seeded(99);
    for (let i = 0; i < 26; i++) {
      const t = r(), x = 10 + t * 440, y = 150 - (150 - 40) * Math.pow(t, 0.8) + 14 * gauss(r);
      s += circ(x, y, 3, V(i % 2 ? 'primary' : 'accent'), 'opacity="0.85"');
    }
    s += txt(16, 20, T('Registros de la planta y de la abeja siguen al mismo muestreador', 'Plant and bee records follow the same sampler'), V('text'), 10.5, 'start', 'font-weight="700"');
    s += txt(16, 170, T('→ coinciden «más de lo esperado» si el universo es todo el mapa', '→ they co-occur "more than expected" if the universe is the whole map'), V('text-muted'), 9.5);
    return wrap(`0 0 ${W} ${H}`, s);
  }

  function soon() {
    let s = rect(0, 0, 240, 140, V('bg-soft'), 'rx="12"');
    s += leaf(70, 80, 34, -20) + flower(140, 60, 16, 'm') + flower(180, 90, 12, 'f');
    s += bee(120, 30, 10, 150, { pollen: true });
    return wrap('0 0 240 140', s);
  }
  function logo() {
    return `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g>${flower(12, 19, 10, 'm')}</g>
      <g>${bee(23, 9, 4.6, 145, { pollen: true })}</g>
    </svg>`;
  }

  window.Art = {
    hero, logo, soon,
    bData, bClean, bMap, bCooc, bPheno, bNiche, bSdm, bNetwork, bReport,
    mGbif, mSynonyms, mClean, mWild, mHyper, mNN, mHull, mGrid, mCircular, mPhenoOverlap, mElev,
    mPcaEnv, mDI, mTests, mEnvelope, mMismatch, mNetwork, mNodf, mH2, mRarefy,
    figEvidence, figBias,
    _leaf: leaf, _flower: flower, _fruit: fruit, _bee: bee, _yearClock: yearClock, _mexicoPath: mexicoPath, _bell: bell, _blob: blob, _bipartite: bipartite,
  };
})();
