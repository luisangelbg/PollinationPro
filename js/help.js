/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — interpretation help.

   A number a reader cannot place is not a result. This is a registry of short
   explanations, one per concept or statistic the app prints, each with what it
   measures, how it is read, the scale that says whether a value is low or
   high, and the mistake most commonly made with it.

     Help.badge(key)             the circled question mark to put next to a label
     Help.panel(keys, title)     a collapsible guide listing several entries
     Help.markTable(box, map)    decorates the headers of a table already built
     Help.markTiles(box, map)    the same for the summary tiles
     Help.hydrate(root)          turns every <span data-help="key"> into a badge
     Help.band(key, value)       which band of the scale a computed value falls in
     Help.tag(key, value)        that band as a small coloured chip, ready to print

   The last two are the point. A scale printed in a manual is documentation; a
   scale applied to the number on screen is a decision rule, which is what the
   reader actually needed. Where a scale is a convention rather than a law, the
   entry says so: ecology is full of habits stated as thresholds.

   This file is the machinery; the entries themselves live in js/helpdata.js,
   which adds them with Help.add(key, entry) before the page finishes loading. */

const Help = {};

(function () {

  const two = p => (Array.isArray(p) ? L2(p[0], p[1]) : String(p || ''));
  const num = v => (Math.abs(v) >= 1000 || (v !== 0 && Math.abs(v) < 0.01) ? String(v) : String(+(+v).toFixed(3)));
  /* a band of a scale: from/to may be null for an open end */
  const S = (from, to, label, tone, txt) => ({ from, to, label, tone, txt });
  const HELP = {};
  const E = (key, def) => { HELP[key] = def; return key; };


  /* =====================================================================
     1 · the scale applied to a value
     ===================================================================== */
  const TONE = { good: 'good', ok: 'ok', warn: 'warn', bad: 'bad' };
  function bandRange(b) {
    const lo = b.from == null ? '' : num(b.from), hi = b.to == null ? '' : num(b.to);
    if (lo && hi) return `${lo} – ${hi}`;
    if (lo) return `≥ ${lo}`;
    return `< ${hi}`;
  }
  function bandWidths(scale) {
    const n = scale.length;
    return scale.map(() => 100 / n);
  }
  function band(key, value) {
    const d = HELP[key];
    if (!d || !d.scale || value == null || !isFinite(value)) return null;
    /* the first band that contains the value; an open end matches anything past it */
    for (const b of d.scale) {
      const okLo = b.from == null || value >= b.from;
      const okHi = b.to == null || value < b.to;
      if (okLo && okHi) return b;
    }
    return null;
  }
  function tag(key, value, opts) {
    const b = band(key, value);
    if (!b) return '';
    const o = opts || {};
    return `<span class="help-tag ${TONE[b.tone] || 'ok'}"${o.title ? ` title="${esc(o.title)}"` : ''}>${two(b.label)}</span>`;
  }
  function verdict(key, value) { const b = band(key, value); return b ? T(b.label) : ''; }
  function scaleHTML(d) {
    if (!d.scale) return '';
    const widths = bandWidths(d.scale);
    return `<div class="help-scale-title">${two(d.scaleTitle || ['Escala', 'Scale'])}${d.conv ? ` <span class="help-conv">${two(['convención', 'convention'])}</span>` : ''}</div>` +
      `<div class="help-scale">${d.scale.map((b, i) => `<div class="help-band ${TONE[b.tone] || 'ok'}" style="width:${widths[i]}%"><b>${two(b.label)}</b><span>${bandRange(b)}</span>${b.txt ? `<small>${two(b.txt)}</small>` : ''}</div>`).join('')}</div>`;
  }
  function entryBody(d) {
    return `<p>${two(d.what)}</p>` +
      (d.read ? `<p><b>${two(['Cómo se lee.', 'How it is read.'])}</b> ${two(d.read)}</p>` : '') +
      scaleHTML(d) +
      (d.care ? `<p class="help-care"><b>${two(['Cuidado.', 'Beware.'])}</b> ${two(d.care)}</p>` : '') +
      (d.ref ? `<p class="help-ref">${d.ref}</p>` : '');
  }

  /* =====================================================================
     2 · the badge and its popover
     ===================================================================== */
  function badge(key) {
    if (!HELP[key]) return '';
    return `<button type="button" class="help-badge" data-help-key="${key}" aria-expanded="false" title="${esc(T('Qué significa y cómo se lee', 'What it means and how it is read'))}">?</button>`;
  }
  let pop = null, openBtn = null;
  function ensurePop() {
    if (pop) return pop;
    pop = mk('div', { class: 'help-pop', role: 'dialog', tabindex: '-1' });
    pop.style.display = 'none';
    document.body.appendChild(pop);
    return pop;
  }
  function fillPop(key) {
    const d = HELP[key];
    ensurePop().innerHTML = `<div class="help-pop-head"><h5>${two(d.t)}</h5><button type="button" class="icon-btn fs-x" data-help-close>✕</button></div>${entryBody(d)}`;
  }
  function placePop() {
    if (!pop || !openBtn) return;
    const r = openBtn.getBoundingClientRect();
    const w = Math.min(420, window.innerWidth - 16);
    pop.style.width = w + 'px';
    let left = r.left + window.scrollX - 8;
    if (left + w > window.innerWidth + window.scrollX - 8) left = window.innerWidth + window.scrollX - w - 8;
    pop.style.left = Math.max(8, left) + 'px';
    pop.style.top = (r.bottom + window.scrollY + 8) + 'px';
  }
  let placeTimer = null;
  const schedulePlace = () => { if (placeTimer) cancelAnimationFrame(placeTimer); placeTimer = requestAnimationFrame(placePop); };
  function openPop(btn) {
    const key = btn.dataset.helpKey;
    if (!HELP[key]) return;
    if (openBtn === btn) { closePop(true); return; }
    closePop(false);
    fillPop(key);
    openBtn = btn;
    btn.setAttribute('aria-expanded', 'true');
    pop.style.display = 'block';
    placePop();
    pop.focus({ preventScroll: true });
  }
  function closePop(refocus) {
    if (!pop || pop.style.display === 'none') { openBtn = null; return; }
    pop.style.display = 'none';
    if (openBtn) { openBtn.setAttribute('aria-expanded', 'false'); if (refocus && openBtn.isConnected) openBtn.focus({ preventScroll: true }); }
    openBtn = null;
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('click', e => {
      const close = e.target.closest && e.target.closest('[data-help-close]');
      if (close) { e.preventDefault(); closePop(true); return; }
      const b = e.target.closest && e.target.closest('.help-badge');
      if (b) { e.preventDefault(); e.stopPropagation(); openPop(b); return; }
      if (pop && pop.style.display !== 'none' && !(e.target.closest && e.target.closest('.help-pop'))) closePop(false);
    }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pop && pop.style.display !== 'none') { e.stopPropagation(); closePop(true); } });
    addEventListener('resize', schedulePlace);
    addEventListener('scroll', schedulePlace, true);
    document.addEventListener('langchange', () => { if (openBtn) fillPop(openBtn.dataset.helpKey); });
  }

  /* =====================================================================
     3 · decorating what the blocks already build
     ===================================================================== */
  function candidates(node) {
    const out = [(node.textContent || '').trim()];
    node.querySelectorAll('[data-l]').forEach(s => out.push((s.textContent || '').trim()));
    return out.filter(Boolean).map(s => s.toLowerCase());
  }
  function decorate(nodes, map, prefix) {
    const pairs = Object.keys(map).map(k => [k.trim().toLowerCase(), map[k]]);
    nodes.forEach(n => {
      if (n.dataset.helpDone) return;
      const cand = candidates(n);
      const hit = prefix ? pairs.find(([txt]) => cand.some(c => c.startsWith(txt))) : pairs.find(([txt]) => cand.includes(txt));
      n.dataset.helpDone = '1';
      if (!hit || !HELP[hit[1]]) return;
      n.insertAdjacentHTML('beforeend', badge(hit[1]));
    });
  }
  function markTable(container, map, prefix) {
    if (typeof container === 'string') container = el(container);
    if (container) decorate([...container.querySelectorAll('thead th')], map, prefix);
  }
  function markTiles(container, map, prefix) {
    if (typeof container === 'string') container = el(container);
    if (container) decorate([...container.querySelectorAll('.stat-label, .rd-l')], map, prefix);
  }
  function hydrate(root) {
    (root || document).querySelectorAll('[data-help]:not([data-help-ready])').forEach(n => {
      const key = n.getAttribute('data-help');
      n.setAttribute('data-help-ready', '1');
      if (HELP[key]) n.innerHTML = badge(key);
    });
  }

  /* =====================================================================
     4 · the collapsible guide of a block
     ===================================================================== */
  const GUIDES = {};
  function panel(keys, title) {
    const id = 'helpGuide' + (panel._n = (panel._n || 0) + 1);
    GUIDES[id] = keys.filter(k => HELP[k]);
    return `<details class="acc help-guide" id="${id}">` +
      `<summary>${title ? two(title) : L2('📖 Guía de interpretación de este bloque', '📖 Interpretation guide for this block')}</summary>` +
      `<div class="acc-body"><p class="hint">${L2(
        'Qué mide cada número, en qué escala se lee y cuál es el error más común con él. Las escalas marcadas como convención son costumbres de lectura, no leyes.',
        'What each number measures, on what scale it is read and the commonest mistake made with it. The scales marked as a convention are reading habits, not laws.')}</p><div class="help-guide-grid"></div></div></details>`;
  }
  function fillGuide(det) {
    const box = det.querySelector('.help-guide-grid');
    if (!box || box.dataset.ready) return;
    box.dataset.ready = '1';
    box.innerHTML = (GUIDES[det.id] || []).map(k => `<section class="help-entry"><h5>${two(HELP[k].t)}</h5>${entryBody(HELP[k])}</section>`).join('');
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('toggle', e => {
      if (e.target.classList && e.target.classList.contains('help-guide') && e.target.open) fillGuide(e.target);
    }, true);
  }

  /* =====================================================================
     5 · which entries belong to which block, and installing itself
     ===================================================================== */
  /* which entries belong to which block (a guide per block) and the labels the
     app prints that should carry a badge; both are filled by js/helpdata.js */
  const BLOCK_KEYS = {};
  const LABELS = {};
  function wrapBuilders() {
    if (typeof window === 'undefined') return;
    ['statTiles', 'buildTable'].forEach(name => {
      const orig = window[name];
      if (typeof orig !== 'function' || orig.__helped) return;
      const wrapped = function () {
        const out = orig.apply(this, arguments);
        try {
          const c = typeof arguments[0] === 'string' ? el(arguments[0]) : arguments[0];
          if (c) (name === 'statTiles' ? markTiles : markTable)(c, LABELS, true);
        } catch (e) { /* the help must never break what it decorates */ }
        return out;
      };
      wrapped.__helped = true;
      window[name] = wrapped;
    });
  }
  function install(root) {
    const scope = root || document;
    Object.keys(BLOCK_KEYS).forEach(n => {
      const host = scope.querySelector ? scope.querySelector('#helpGuideHost' + n) || scope.querySelector('#panel-' + n) : null;
      if (!host || host.querySelector(':scope > .help-guide')) return;
      const box = document.createElement('div');
      box.innerHTML = panel(BLOCK_KEYS[n]);
      const node = box.firstElementChild;
      if (node) host.appendChild(node);
    });
    wrapBuilders();
    hydrate(scope);
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => install());
    else install();
  }

  Object.assign(Help, {
    HELP, BLOCK_KEYS, LABELS, add: E, S, install, badge, panel, markTable, markTiles, hydrate, band, tag, verdict, entryBody, scaleHTML,
    keys: () => Object.keys(HELP), _S: S, _E: E, _two: two, _num: num, _bandWidths: bandWidths, _bandRange: bandRange,
  });
  if (typeof window !== 'undefined') window.Help = Help;
})();
