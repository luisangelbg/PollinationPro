/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — the editor of each figure.

   The figure studio of the top bar restyles every figure at once (palette,
   font, background). This editor works on one figure: every text can be
   rewritten, resized, set in bold or italics, recoloured or hidden; every
   colour the figure uses can be replaced; fonts, line widths, marker sizes,
   grid, background and axis colour can be changed. It needs nothing from the
   module that drew the figure: it reads the SVG as it is.

   The edits are kept per figure (by the id of its SVG) and applied again
   every time the figure is redrawn — when the data or the language change —
   so they are never lost; texts are matched by their original wording and
   colours by their original value. Whatever is on screen is what the export
   menu, the catalogue of Block 10, the report and the package take. */

const FigEdit = {};

(function () {
  const KEY = 'pollinationpro:figedit';
  let E = {};
  try { E = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { E = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(E)); } catch (e) { /* storage blocked */ } };
  const two = (es, en) => L2(es, en);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FONTS = {
    '': ['La del estudio de figuras', 'The figure studio\'s', ''],
    sans: ['Sans', 'Sans', 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'],
    humanist: ['Sans humanista', 'Humanist sans', '"Segoe UI", "Helvetica Neue", Arial, sans-serif'],
    serif: ['Serif', 'Serif', 'Georgia, Cambria, "Times New Roman", serif'],
    classic: ['Serif clásica', 'Classic serif', '"Palatino Linotype", "Book Antiqua", Palatino, serif'],
    condensed: ['Sans estrecha', 'Condensed sans', '"Arial Narrow", "Roboto Condensed", sans-serif'],
    mono: ['Monoespaciada', 'Monospace', 'ui-monospace, Consolas, "Courier New", monospace'],
  };
  const edits = id => (E[id] = E[id] || { texts: {}, colors: {} });
  const has = id => !!E[id];

  /* ---------------- colours as the eye sees them ---------------- */
  const probe = () => { let p = document.getElementById('figEditProbe'); if (!p) { p = mk('span', { id: 'figEditProbe', style: 'display:none' }); document.body.appendChild(p); } return p; };
  function toHex(value, ctxEl) {
    if (!value || value === 'none' || value === 'transparent' || /^url\(/.test(value)) return null;
    let v = value;
    if (/var\(/.test(v)) { const m = v.match(/var\((--[\w-]+)/); v = m ? getComputedStyle(ctxEl || document.documentElement).getPropertyValue(m[1]).trim() : ''; }
    if (!v) return null;
    const p = probe(); p.style.color = ''; p.style.color = v;
    const c = getComputedStyle(p).color;
    const m = c.match(/[\d.]+/g);
    if (!m) return null;
    return '#' + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, '0')).join('');
  }

  /* ---------------- applying the edits to an SVG ---------------- */
  function remember(n, attr, key) { if (!n.hasAttribute(key)) n.setAttribute(key, n.getAttribute(attr) ?? ''); return n.getAttribute(key); }
  function apply(svg) {
    if (!svg || !svg.id || !has(svg.id)) return;
    const ed = E[svg.id];
    svg.__applying = true;
    /* the font of the whole figure */
    const famOn = ed.font && FONTS[ed.font] ? FONTS[ed.font][2] : null;
    /* background */
    let bg = svg.querySelector(':scope > rect[data-fe-bg]');
    if (ed.bg && ed.bg !== 'none') {
      if (!bg) { bg = svgEl('rect', { 'data-fe-bg': '1', x: -2000, y: -2000, width: 8000, height: 8000 }); svg.insertBefore(bg, svg.firstChild); }
      bg.setAttribute('fill', ed.bg === 'white' ? '#ffffff' : ed.bgColor || '#ffffff');
      const vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number);
      bg.setAttribute('x', vb[0]); bg.setAttribute('y', vb[1]); bg.setAttribute('width', vb[2]); bg.setAttribute('height', vb[3]);
    } else if (bg) bg.remove();
    /* texts */
    svg.querySelectorAll('text').forEach(t => {
      const orig = t.hasAttribute('data-fe-t') ? t.getAttribute('data-fe-t') : (t.setAttribute('data-fe-t', t.textContent), t.textContent);
      const fs0 = +remember(t, 'font-size', 'data-fe-fs') || 10;
      const te = ed.texts[orig] || {};
      const ff0 = remember(t, 'font-family', 'data-fe-ff');
      if (famOn) t.setAttribute('font-family', famOn); else if (ff0) t.setAttribute('font-family', ff0); else t.removeAttribute('font-family');
      if (te.t != null && t.textContent !== te.t) t.textContent = te.t;
      else if (te.t == null && t.textContent !== orig) t.textContent = orig;
      t.setAttribute('font-size', (fs0 * (ed.fontScale || 1) * (te.scale || 1)).toFixed(2));
      if (te.bold != null) t.setAttribute('font-weight', te.bold ? 700 : 400); else if (t.hasAttribute('data-fe-fw')) t.setAttribute('font-weight', t.getAttribute('data-fe-fw'));
      remember(t, 'font-weight', 'data-fe-fw');
      if (te.italic != null) t.setAttribute('font-style', te.italic ? 'italic' : 'normal');
      remember(t, 'fill', 'data-fe-fill');
      if (te.color) t.setAttribute('fill', te.color);
      else if (ed.textColor) t.setAttribute('fill', ed.textColor);
      else { const f0 = t.getAttribute('data-fe-fill'); if (f0) t.setAttribute('fill', f0); else t.removeAttribute('fill'); }
      t.style.display = te.hidden ? 'none' : '';
    });
    /* lines, markers, colours */
    svg.querySelectorAll('path, line, rect, circle, polyline, polygon, ellipse').forEach(n => {
      if (n.hasAttribute('data-fe-bg')) return;
      const sw0 = remember(n, 'stroke-width', 'data-fe-sw');
      if (sw0 !== '' && ed.lineScale && ed.lineScale !== 1) n.setAttribute('stroke-width', (+sw0 * ed.lineScale).toFixed(2));
      else if (sw0 !== '') n.setAttribute('stroke-width', sw0);
      if (n.tagName === 'circle') { const r0 = +remember(n, 'r', 'data-fe-r'); n.setAttribute('r', (r0 * (ed.markerScale || 1)).toFixed(2)); }
      ['fill', 'stroke'].forEach(a => {
        const o = remember(n, a, 'data-fe-' + a);
        if (!o) return;
        const mapped = ed.colors[o] || ed.colors[toHex(o, svg) || '~'];
        n.setAttribute(a, mapped || o);
      });
      const cls = n.getAttribute('class') || '';
      if (/art-grid/.test(cls)) n.style.display = ed.grid === false ? 'none' : '';
      if (/art-ax/.test(cls) && !/art-grid/.test(cls) && ed.axisColor) n.setAttribute('stroke', ed.axisColor);
    });
    svg.__applying = false;
  }
  /* an SVG is watched: when its module redraws it, the edits go back on */
  const watched = new WeakSet();
  function watch(svg) {
    if (watched.has(svg)) return;
    watched.add(svg);
    let t = null;
    new MutationObserver(() => { if (svg.__applying) return; clearTimeout(t); t = setTimeout(() => apply(svg), 0); }).observe(svg, { childList: true });
    apply(svg);
  }

  /* ---------------- the panel ---------------- */
  let panel = null, cur = null, tab = 'general';
  function textsOf(svg) {
    const seen = new Map();
    svg.querySelectorAll('text').forEach(t => { const o = t.getAttribute('data-fe-t') ?? t.textContent; if (o.trim() && !seen.has(o)) seen.set(o, t); });
    return [...seen.keys()];
  }
  function colorsOf(svg) {
    const m = new Map();
    svg.querySelectorAll('path, line, rect, circle, polyline, polygon, ellipse, text').forEach(n => {
      if (n.hasAttribute('data-fe-bg')) return;
      ['fill', 'stroke'].forEach(a => {
        const o = n.getAttribute('data-fe-' + a) || n.getAttribute(a);
        if (!o || n.tagName === 'text') return;
        const hx = toHex(o, svg); if (!hx) return;
        if (!m.has(o)) m.set(o, { key: o, hex: hx, n: 0 });
        m.get(o).n++;
      });
    });
    return [...m.values()].sort((a, b) => b.n - a.n).slice(0, 24);
  }
  const row = (lab, ctl) => `<label class="inline-label fe-row"><span>${lab}</span>${ctl}</label>`;
  function body() {
    const svg = document.getElementById(cur), ed = edits(cur);
    if (tab === 'general') {
      return `<div class="fe-grid">
        ${row(two('Familia tipográfica', 'Font family'), `<select data-g="font">${Object.entries(FONTS).map(([k, v]) => `<option value="${k}"${(ed.font || '') === k ? ' selected' : ''}>${T(v[0], v[1])}</option>`).join('')}</select>`)}
        ${row(two('Tamaño de todos los textos', 'Size of every text'), `<input type="range" min="0.6" max="2.2" step="0.05" value="${ed.fontScale || 1}" data-g="fontScale"><b>${(ed.fontScale || 1).toFixed(2)}×</b>`)}
        ${row(two('Grosor de las líneas', 'Line width'), `<input type="range" min="0.3" max="3" step="0.05" value="${ed.lineScale || 1}" data-g="lineScale"><b>${(ed.lineScale || 1).toFixed(2)}×</b>`)}
        ${row(two('Tamaño de los puntos', 'Point size'), `<input type="range" min="0.3" max="3" step="0.05" value="${ed.markerScale || 1}" data-g="markerScale"><b>${(ed.markerScale || 1).toFixed(2)}×</b>`)}
        ${row(two('Color de todos los textos', 'Colour of every text'), `<input type="color" data-g="textColor" value="${ed.textColor || '#1a2419'}"> <label class="checkbox-label"><input type="checkbox" data-g="textColorOn"${ed.textColor ? ' checked' : ''}> ${two('usar', 'use')}</label>`)}
        ${row(two('Color de los ejes', 'Axis colour'), `<input type="color" data-g="axisColor" value="${ed.axisColor || '#8a97a3'}"> <label class="checkbox-label"><input type="checkbox" data-g="axisColorOn"${ed.axisColor ? ' checked' : ''}> ${two('usar', 'use')}</label>`)}
        ${row(two('Fondo', 'Background'), `<select data-g="bg"><option value="none"${!ed.bg || ed.bg === 'none' ? ' selected' : ''}>${T('el del estudio de figuras', 'the figure studio\'s')}</option><option value="white"${ed.bg === 'white' ? ' selected' : ''}>${T('blanco', 'white')}</option><option value="custom"${ed.bg === 'custom' ? ' selected' : ''}>${T('color propio', 'own colour')}</option></select> <input type="color" data-g="bgColor" value="${ed.bgColor || '#ffffff'}">`)}
        <label class="checkbox-label"><input type="checkbox" data-g="grid"${ed.grid === false ? '' : ' checked'}> ${two('Líneas de la rejilla', 'Grid lines')}</label>
      </div>`;
    }
    if (tab === 'texts') {
      const list = textsOf(svg);
      return `<p class="hint">${T('Cada texto de la figura, por su redacción original. Escribe otro texto, cambia su tamaño, su estilo o su color, u ocúltalo.', 'Every text of the figure, by its original wording. Type another text, change its size, style or colour, or hide it.')}</p>
        <div class="fe-texts">${list.map((o, i) => { const te = ed.texts[o] || {}; return `<div class="fe-t" data-i="${i}">
          <input type="text" data-t="t" value="${esc(te.t ?? o)}" title="${esc(o)}">
          <input type="range" min="0.5" max="2.5" step="0.05" value="${te.scale || 1}" data-t="scale" title="${esc(T('tamaño', 'size'))}">
          <button type="button" class="fe-b${te.bold ? ' on' : ''}" data-t="bold"><b>N</b></button><button type="button" class="fe-b${te.italic ? ' on' : ''}" data-t="italic"><i>K</i></button>
          <input type="color" data-t="color" value="${te.color || '#1a2419'}"><button type="button" class="fe-b${te.hidden ? ' on' : ''}" data-t="hidden" title="${esc(T('ocultar', 'hide'))}">⦸</button></div>`; }).join('')}</div>`;
    }
    const cols = colorsOf(svg);
    return `<p class="hint">${T('Los colores que usa la figura, del más al menos frecuente. Cambia cualquiera: se sustituye en toda la figura.', 'The colours the figure uses, from the most to the least frequent. Change any: it is replaced across the figure.')}</p>
      <div class="fe-colors">${cols.map((c, i) => `<label class="fe-c"><input type="color" data-c="${i}" value="${ed.colors[c.key] || c.hex}"><span>${ed.colors[c.key] ? '✓ ' : ''}${c.n} ${T('elementos', 'elements')}</span></label>`).join('')}</div>`;
  }
  let listCache = { texts: [], colors: [] };
  function render() {
    const svg = document.getElementById(cur);
    if (!svg) return hide();
    listCache = { texts: textsOf(svg), colors: colorsOf(svg) };
    panel.querySelector('.fe-body').innerHTML = body();
    panel.querySelectorAll('.fe-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  }
  function ensure() {
    if (panel) return panel;
    panel = mk('div', { class: 'fe-panel fs-panel', id: 'figEditPanel' });
    panel.style.display = 'none';
    panel.innerHTML = `<div class="fs-head"><b>${two('✎ Editar esta figura', '✎ Edit this figure')}</b><button class="icon-btn fs-x" data-fe-close>✕</button></div>
      <div class="fe-tabs"><button type="button" class="fe-tab" data-tab="general">${two('General', 'General')}</button><button type="button" class="fe-tab" data-tab="texts">${two('Textos', 'Texts')}</button><button type="button" class="fe-tab" data-tab="colors">${two('Colores', 'Colours')}</button></div>
      <div class="fe-body"></div>
      <div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" data-fe-reset>${two('Deshacer todos los cambios de esta figura', 'Undo every change to this figure')}</button><button type="button" class="btn btn-ghost btn-sm" data-fe-copy>${two('Copiar el estilo general a todas', 'Copy the general style to all')}</button></div>`;
    document.body.appendChild(panel);
    const commit = () => { save(); const svg = document.getElementById(cur); if (svg) apply(svg); };
    panel.addEventListener('click', e => {
      if (e.target.closest('[data-fe-close]')) return hide();
      const tb = e.target.closest('.fe-tab'); if (tb) { tab = tb.dataset.tab; render(); return; }
      if (e.target.closest('[data-fe-reset]')) {
        const svg = document.getElementById(cur);
        delete E[cur]; save();
        if (svg) { E[cur] = { texts: {}, colors: {} }; apply(svg); delete E[cur]; save(); }
        render(); return;
      }
      if (e.target.closest('[data-fe-copy]')) {
        const g = E[cur] || {};
        document.querySelectorAll('.pg-pane svg[id]').forEach(svg => { if (svg.id === cur || svg.id === 'b4Map') return; const d = edits(svg.id); ['font', 'fontScale', 'lineScale', 'markerScale', 'textColor', 'axisColor', 'bg', 'bgColor', 'grid'].forEach(k => { d[k] = g[k]; }); apply(svg); });
        save(); return;
      }
      const b = e.target.closest('.fe-b');
      if (b) {
        const i = +b.closest('.fe-t').dataset.i, o = listCache.texts[i], te = (edits(cur).texts[o] = edits(cur).texts[o] || {});
        te[b.dataset.t] = !te[b.dataset.t]; b.classList.toggle('on', te[b.dataset.t]); commit();
      }
    });
    const onInput = e => {
      const t = e.target, ed = edits(cur);
      if (t.dataset.g) {
        const g = t.dataset.g;
        if (g === 'textColorOn') ed.textColor = t.checked ? panel.querySelector('[data-g="textColor"]').value : undefined;
        else if (g === 'axisColorOn') ed.axisColor = t.checked ? panel.querySelector('[data-g="axisColor"]').value : undefined;
        else if (g === 'textColor') { if (panel.querySelector('[data-g="textColorOn"]').checked) ed.textColor = t.value; }
        else if (g === 'axisColor') { if (panel.querySelector('[data-g="axisColorOn"]').checked) ed.axisColor = t.value; }
        else if (g === 'grid') ed.grid = t.checked;
        else if (t.type === 'range') { ed[g] = +t.value; const lab = t.nextElementSibling; if (lab) lab.textContent = (+t.value).toFixed(2) + '×'; }
        else ed[g] = t.value;
        commit(); return;
      }
      if (t.dataset.t) {
        const i = +t.closest('.fe-t').dataset.i, o = listCache.texts[i], te = (ed.texts[o] = ed.texts[o] || {});
        if (t.dataset.t === 't') te.t = t.value === o ? undefined : t.value;
        else if (t.dataset.t === 'scale') te.scale = +t.value;
        else if (t.dataset.t === 'color') te.color = t.value;
        commit(); return;
      }
      if (t.dataset.c != null) { const c = listCache.colors[+t.dataset.c]; if (c) { ed.colors[c.key] = t.value; commit(); } }
    };
    panel.addEventListener('input', onInput);
    panel.addEventListener('change', onInput);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
    return panel;
  }
  function show(btn, svg) {
    ensure();
    cur = svg.id;
    watch(svg);
    panel.style.display = 'block';
    const r = btn.getBoundingClientRect();
    panel.style.top = (r.bottom + 6 + window.scrollY) + 'px';
    panel.style.left = Math.max(8, Math.min(r.left + window.scrollX - 300, window.innerWidth - 400)) + 'px';
    render();
  }
  function hide() { if (panel) panel.style.display = 'none'; cur = null; }

  /* every figure gets its ✎ button, and every edited figure is watched */
  function decorate(root) {
    (root || document).querySelectorAll('.pg-pane, [data-fig]').forEach(pane => {
      const svg = pane.querySelector('svg');
      if (!svg || !svg.id || svg.id === 'b4Map' || pane.querySelector(':scope > .fig-ed')) { if (svg && svg.id && has(svg.id)) watch(svg); return; }
      const b = mk('button', { class: 'fig-ed', type: 'button', 'data-es-title': 'Editar esta figura: textos, fuentes, tamaños y colores', 'data-en-title': 'Edit this figure: texts, fonts, sizes and colours' }, '✎');
      b.addEventListener('click', e => { e.stopPropagation(); if (!svg.childElementCount) return; if (cur === svg.id && panel && panel.style.display !== 'none') hide(); else show(b, svg); });
      pane.appendChild(b);
      if (has(svg.id)) watch(svg);
    });
    if (window.I18N) I18N.apply(root || document);
  }
  document.addEventListener('langchange', () => { if (panel && cur) render(); });

  Object.assign(FigEdit, { apply, watch, decorate, show, hide, edits: () => E });
  window.FigEdit = FigEdit;
  /* hook into the export buttons' decoration, which every block calls after drawing */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.Fig && Fig.decorate && !Fig.decorate.__fe) {
      const orig = Fig.decorate;
      Fig.decorate = function (root) { const r = orig.apply(this, arguments); try { decorate(root); } catch (e) { /* never break the page */ } return r; };
      Fig.decorate.__fe = true;
    }
    decorate();
  });
})();
