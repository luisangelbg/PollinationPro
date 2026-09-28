/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — global state and shared utilities.
   No ES modules: everything hangs from window so the app also works when
   index.html is opened with a double click (file://). */

/* the version of the app, written once: the report cites it and the page shows
   it, so it cannot drift from one place to another */
const APP_VERSION = "1.2.1";
window.APP_VERSION = APP_VERSION;

const state = {
  /* --- Block 2: what was asked for and what arrived --- */
  taxa: [],          // the study list: {id, name, role:'plant'|'poll', group, key, synonyms:[]}
  raw: [],           // occurrence records as they arrived (GBIF, own files, example)
  interactions: [],  // published plant–visitor links (interaction databases): {plant, visitor, type, n, ref, src}
  visits: [],        // the user's own visit observations: {plant, visitor, n, site, lat, lon, y, m, d, type}
  fetchMeta: {},     // per study-list entry: what was asked of GBIF and what arrived
  /* --- Block 3 --- */
  clean: null,       // {records, report, rules}: the records that go on to the analyses
  /* --- results, one slot per block --- */
  map: null,         // Block 4: the last map drawn
  cooc: null,        // Block 5: spatial co-occurrence
  pheno: null,       // Block 6: phenological and altitudinal overlap
  rasters: null,     // Block 7: environmental layers loaded by the user
  niche: null,       // Block 7: environmental niche overlap
  sdm: null,         // Block 8: potential distributions and mismatch
  network: null,     // Block 9: interaction network and visitor diversity
  report: null,      // Block 10: what the figure studio and the report last built
};
window.state = state;

/* the ten blocks of the app, in navigation order */
const STEPS = [
  { n: 1, es: 'Inicio', en: 'Home', ready: true },
  { n: 2, es: 'Datos', en: 'Data', ready: true },
  { n: 3, es: 'Depuración y taxonomía', en: 'Cleaning and taxonomy', ready: true },
  { n: 4, es: 'Mapa', en: 'Map', ready: true },
  { n: 5, es: 'Coocurrencia', en: 'Co-occurrence', ready: true },
  { n: 6, es: 'Fenología y altitud', en: 'Phenology and elevation', ready: true },
  { n: 7, es: 'Nicho ambiental', en: 'Environmental niche', ready: true },
  { n: 8, es: 'Distribución potencial', en: 'Potential distribution', ready: true },
  { n: 9, es: 'Red de interacciones', en: 'Interaction network', ready: true },
  { n: 10, es: 'Informe', en: 'Report', ready: true },
];

/* ---------------- DOM ---------------- */
function el(id) { return document.getElementById(id); }
function els(sel, root) { return [...(root || document).querySelectorAll(sel)]; }
function mk(tag, attrs, html) {
  const n = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'style') n.setAttribute('style', attrs[k]);
    else if (k.startsWith('on') && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  }
  if (html != null) n.innerHTML = html;
  return n;
}
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/* bilingual inline HTML: both spans are written, CSS shows the active one */
function L2(es, en) { return `<span data-l="es">${es}</span><span data-l="en">${en}</span>`; }
/* Labels shown in capitals would turn km² into KM² and H₂′ into H₂′ with a
   capital letter that means something else: units and symbols keep their own
   case inside an uppercase label. */
function keepGreek(s) {
  return String(s).replace(/(°C|km²|km|d′|H₂′|[Ͱ-Ͽ][²³₀-₉′]*[A-Za-z]{0,3}|[A-Za-z][²³₀-₉′]+|\[[a-z]\]|m s\.n\.m\.|m a\.s\.l\.)/g, '<span class="nc">$1</span>');
}
function svgEl(tag, attrs, text) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  return n;
}
function showMessage(container, type, text) {
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  const div = mk('div', { class: 'msg msg-' + type }, text);
  /* errors and warnings are announced to screen readers */
  if (window.LABG) LABG.messageRole(div, type);
  container.appendChild(div);
  return div;
}
function clearMessages(container) {
  if (typeof container === 'string') container = el(container);
  if (container) container.innerHTML = '';
}
/* A message that belongs above the ones a block has just written (the note of
   an example, the result of an import): it is added and moved to the top. */
function notice(container, type, text) {
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  const div = showMessage(container, type, text);
  if (div && container.firstChild !== div) container.insertBefore(div, container.firstChild);
  return div;
}

/* ---------------- numbers ----------------
   Numbers use the decimal point and a comma for thousands in both languages. */
function fmtNum(v, d) {
  if (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) return '—';
  const n = Number(v);
  if (!isFinite(n)) return String(v);
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs < 1e-4 || abs >= 1e12) { const e = n.toExponential(d != null ? d : 2); return e.startsWith('-') ? '−' + e.slice(1) : e; }
  const s = n.toLocaleString('en-US', { maximumFractionDigits: d != null ? d : 3 });
  if (/^-0(\.0*)?$/.test(s)) return s.slice(1);
  return s.startsWith('-') ? '−' + s.slice(1) : s;
}
function fmtFixed(v, d) {
  if (v === Infinity) return '∞';
  if (v === -Infinity) return '−∞';
  if (v == null || !isFinite(v)) return '—';
  const s = Number(v).toFixed(d == null ? 2 : d);
  if (/^-0(\.0*)?$/.test(s)) return s.slice(1);
  return s.startsWith('-') ? '−' + s.slice(1) : s;
}
/* 0.1234 → "12.3%" */
function fmtPct(x, d) {
  if (x == null || !isFinite(x)) return '—';
  const s = (x * 100).toLocaleString('en-US', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) + '%';
  return s.startsWith('-') ? '−' + s.slice(1) : s;
}
/* "1 día", "2 días" */
function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }

/* Reads what the user typed in a numeric field: "1,250.5", "12 %", "−3" and
   "(4)" all work; an empty field is null, never 0. */
function parseNum(s) {
  if (s == null) return null;
  if (typeof s === 'number') return isFinite(s) ? s : null;
  let t = String(s).trim().replace(/[\s ]/g, '').replace(/,/g, '');
  if (!t) return null;
  let pct = false;
  if (t.endsWith('%')) { pct = true; t = t.slice(0, -1); }
  if (/^\(.*\)$/.test(t)) t = '-' + t.slice(1, -1);
  t = t.replace(/[−–—]/g, '-');
  const v = Number(t);
  if (!isFinite(v)) return null;
  return pct ? v / 100 : v;
}

/* ---------------- dates ----------------
   Every date in the app is a plain {y, m, d} or an ISO string "YYYY-MM-DD",
   never a JavaScript Date with a time zone attached: an observation date has no
   hour, and a Date built at midnight moves a day back in half the world. */
const MONTHS = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTHS_SHORT = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
function monthName(m, short) { return (short ? MONTHS_SHORT : MONTHS)[I18N.lang][m - 1]; }
function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
function daysInYear(y) { return isLeap(y) ? 366 : 365; }
/* day of the year, 1 = 1 January */
function doy(y, m, d) {
  const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return cum[m - 1] + d + (m > 2 && isLeap(y) ? 1 : 0);
}
/* the inverse: {y, m, d} of a day of the year, allowing it to spill into the next year */
function fromDoy(y, j) {
  while (j > daysInYear(y)) { j -= daysInYear(y); y++; }
  while (j < 1) { y--; j += daysInYear(y); }
  let m = 1;
  while (j > daysInMonth(y, m)) { j -= daysInMonth(y, m); m++; }
  return { y, m, d: j };
}
/* days since 1 January 1970 without any time zone: an integer arithmetic on dates */
function dayNumber(y, m, d) {
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045 - 2440588;
}
function fromDayNumber(n) {
  const J = n + 2440588;
  const f = J + 1401 + Math.floor((Math.floor((4 * J + 274277) / 146097) * 3) / 4) - 38;
  const e = 4 * f + 3, g = Math.floor((e % 1461) / 4), h = 5 * g + 2;
  const d = Math.floor((h % 153) / 5) + 1, m = ((Math.floor(h / 153) + 2) % 12) + 1;
  const y = Math.floor(e / 1461) - 4716 + Math.floor((14 - m) / 12);
  return { y, m, d };
}
function addDays(date, n) { return fromDayNumber(dayNumber(date.y, date.m, date.d) + n); }
function parseISO(s) {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(s || '').trim());
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}
function toISO(date) { return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`; }
/* "12 de marzo de 2026" / "12 March 2026"; short: "12 mar" */
function fmtDate(date, short) {
  if (!date) return '—';
  if (typeof date === 'string') date = parseISO(date);
  if (!date) return '—';
  if (short) return `${date.d} ${monthName(date.m, true)}`;
  return I18N.lang === 'en' ? `${date.d} ${monthName(date.m)} ${date.y}` : `${date.d} de ${monthName(date.m)} de ${date.y}`;
}
/* a day of the year as a short date of a non-leap year: "12 mar" */
function fmtDoy(j) { const dt = fromDoy(2025, Math.round(j)); return `${dt.d} ${monthName(dt.m, true)}`; }

/* ---------------- CSV / downloads ---------------- */
function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function download(content, filename, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = mk('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function slug(s) {
  return String(s || 'pollinationpro').replace(/\.[a-z0-9]{1,5}$/i, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'pollinationpro';
}

/* ---------------- step navigation ---------------- */
const stepBtn = n => document.querySelector('.step-btn[data-step="' + n + '"]');
const stepOn = n => { const b = stepBtn(n); return !!b && !b.disabled; };

function goStep(n) {
  n = String(n);
  els('.step-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + n));
  els('.step-btn').forEach(b => b.classList.toggle('active', b.dataset.step === n));
  document.body.classList.toggle('on-home', n === '1');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const btn = stepBtn(n);
  if (window.LABG) {
    LABG.setCurrentStep(n);                  // aria-current and brought into view
    const s = STEPS.find(x => String(x.n) === n);
    if (s) LABG.announce(T('Bloque ', 'Block ') + s.n + ': ' + T(s.es, s.en));
  } else if (btn && btn.scrollIntoView) btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  document.dispatchEvent(new CustomEvent('stepchange', { detail: { step: Number(n) } }));
  refreshStepMarks();
  refreshStepFooters();
}
function enableStep(n, on) {
  const b = stepBtn(n);
  if (b) b.disabled = (on === false);
  refreshStepMarks();
  refreshStepFooters();
}

/* A block is marked «done» when it is available and its result exists: the
   blocks of this app open as soon as there are records, so availability alone
   would tick blocks that were never run. */
const STEP_DONE = {
  2: () => state.raw.length > 0 || state.visits.length > 0 || state.interactions.length > 0,
  3: () => !!state.clean, 4: () => !!state.map, 5: () => !!state.cooc, 6: () => !!state.pheno,
  7: () => !!state.niche, 8: () => !!state.sdm, 9: () => !!state.network, 10: () => false,
};
function refreshStepMarks() {
  if (!window.LABG) return;
  STEPS.forEach(s => { if (STEP_DONE[s.n]) LABG.markStep(s.n, stepOn(s.n) && STEP_DONE[s.n]() ? 'done' : null); });
}

/* Footer of every block: Previous / Next, with the name of the block. Both
   languages are written side by side, so a change of language needs no redraw. */
function refreshStepFooters() {
  if (!window.LABG) return;
  const order = STEPS.map(s => String(s.n));
  const label = n => { const s = STEPS.find(x => String(x.n) === n); return s.n + ' · ' + L2(esc(s.es), esc(s.en)); };
  els('.step-panel').forEach(p => {
    const n = p.id.replace('panel-', '');
    const i = order.indexOf(n);
    if (i < 0) return;
    let f = p.querySelector(':scope > .step-footer');
    if (!f) {
      f = mk('nav', { class: 'step-footer no-print' });
      f.innerHTML = '<button type="button" class="btn btn-secondary prev"></button><button type="button" class="btn btn-primary next"></button>';
      f.addEventListener('click', e => { const b = e.target.closest('button[data-go]'); if (b && !b.disabled) goStep(b.dataset.go); });
      p.appendChild(f);
    }
    f.setAttribute('aria-label', T('Bloques', 'Blocks'));
    const prev = order.slice(0, i).reverse().find(stepOn);
    const next = order.slice(i + 1).find(s => stepBtn(s));
    const bp = f.querySelector('.prev'), bn = f.querySelector('.next');
    bp.hidden = !prev;
    if (prev) { bp.dataset.go = prev; bp.innerHTML = `← <span><small>${L2('Anterior', 'Previous')}</small>${label(prev)}</span>`; }
    bn.hidden = !next;
    if (next) {
      bn.dataset.go = next; bn.disabled = !stepOn(next);
      bn.innerHTML = `<span><small>${L2('Siguiente', 'Next')}</small>${label(next)}</span> →`;
    }
  });
}

/* The common bar of the LABG Suite: theme button tooltip, shortcuts panel,
   keyboard, warning before closing with data. Only in the app: the tests load
   core.js without labg-core.js. The theme itself is switched by Theme (i18n.js),
   which keeps its own key and the 'themechange' event the blocks listen to. */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.LABG) return;
  LABG.theme.init('pollinationpro:theme');
  const hb = el('helpBtn');
  if (hb) hb.addEventListener('click', () => LABG.showShortcuts());
  LABG.shortcuts([]);
  LABG.bindStepKeys(goStep);
  LABG.guardUnload(() => state.raw.length > 0 || state.visits.length > 0 || state.interactions.length > 0);
  const stepperLabel = () => { const nav = el('stepper'); if (nav) nav.setAttribute('aria-label', T('Bloques', 'Blocks')); };
  document.addEventListener('themechange', () => LABG.theme.paint());
  document.addEventListener('langchange', () => { LABG.theme.paint(); stepperLabel(); refreshStepMarks(); refreshStepFooters(); });
  document.addEventListener('restored', () => { refreshStepMarks(); refreshStepFooters(); });
  /* the stepper is drawn by home.js, which starts after this file */
  setTimeout(() => {
    LABG.theme.paint();
    stepperLabel();
    LABG.setCurrentStep((document.querySelector('.step-btn.active') || { dataset: {} }).dataset.step || '1');
    refreshStepMarks();
    refreshStepFooters();
  }, 0);
});

/* Persisted preferences (figure style, last settings) */
const Prefs = {
  get(k, d) { try { const v = localStorage.getItem('pollinationpro:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pollinationpro:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};

/* ---------------- random numbers ----------------
   Everything stochastic (the virtual landscapes of the laboratories, the
   null models and the permutation tests) draws from a seeded generator, so a run is
   reproducible and its seed can be reported. sfc32 passes the usual
   statistical batteries, unlike a 32-bit linear congruential generator. */
function rng(seed) {
  let a = 0x9e3779b9, b = 0x243f6a88, c = 0xb7e15162, d = (seed >>> 0) ^ 0xdeadbeef;
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 15; i++) next();
  return next;
}
function randn(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback || '#1f6f9f';
}

/* ---------------- small statistics ---------------- */
const Stat = {
  sum: a => a.reduce((x, y) => x + y, 0),
  mean: a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN,
  sd(a) { const m = Stat.mean(a); return a.length > 1 ? Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)) : NaN; },
  min: a => a.length ? Math.min(...a) : NaN,
  max: a => a.length ? Math.max(...a) : NaN,
  /* quantile by linear interpolation (type 7 of Hyndman & Fan, the default of R) */
  quantile(a, q) {
    const s = a.filter(x => isFinite(x)).slice().sort((x, y) => x - y);
    if (!s.length) return NaN;
    const h = (s.length - 1) * q, lo = Math.floor(h), hi = Math.ceil(h);
    return s[lo] + (s[hi] - s[lo]) * (h - lo);
  },
  median: a => Stat.quantile(a, 0.5),
};

/* ---------------- shared result components ---------------- */
/* tiles: [[label, value, sub, level]] or [{label, value, sub, level}] */
function statTiles(container, tiles) {
  if (typeof container === 'string') container = el(container);
  if (!container) return;
  container.innerHTML = '';
  container.classList.add('results-summary');
  tiles.forEach(t => {
    const [label, value, sub, level] = Array.isArray(t) ? t : [t.label, t.value, t.sub, t.level];
    const d = mk('div', { class: 'stat-tile' + (level ? ' ' + level : '') });
    d.innerHTML = `<div class="stat-label">${keepGreek(label)}</div><div class="stat-value">${value}</div>` +
      (sub ? `<div class="stat-sub">${sub}</div>` : '');
    container.appendChild(d);
  });
}
/* columns: [{key, label, get?, fmt?, num?, html?}] */
function buildTable(container, columns, rows, opts) {
  opts = opts || {};
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  container.innerHTML = '';
  const table = mk('table');
  if (opts.className) table.className = opts.className;
  if (opts.caption) table.appendChild(mk('caption', null, opts.caption));
  const thead = mk('thead'), trh = mk('tr');
  columns.forEach(c => {
    const th = mk('th', { class: c.num ? 'num' : null });
    th.innerHTML = c.label != null ? c.label : c.key;
    trh.appendChild(th);
  });
  thead.appendChild(trh); table.appendChild(thead);
  const tbody = mk('tbody');
  const shown = opts.limit ? rows.slice(0, opts.limit) : rows;
  shown.forEach(r => {
    const tr = mk('tr');
    if (r && r._class) tr.className = r._class;
    columns.forEach(c => {
      const td = mk('td', { class: c.num ? 'num' : null });
      let v = c.get ? c.get(r) : r[c.key];
      if (c.html) { td.innerHTML = v == null ? '—' : v; tr.appendChild(td); return; }
      if (c.fmt && v != null && v !== '') v = c.fmt(v);
      td.textContent = (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) ? '—' : v;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  const wrap = mk('div', { class: 'table-scroll' + (opts.scroll ? ' book-scroll' : '') });
  wrap.appendChild(table);
  container.appendChild(wrap);
  if (opts.limit && rows.length > opts.limit) {
    wrap.appendChild(mk('p', { class: 'hint' }, T(`Se muestran ${opts.limit} de ${rows.length} filas.`, `Showing ${opts.limit} of ${rows.length} rows.`)));
  }
  return table;
}

/* ---------------- the study, kept between sessions ----------------
   A study with tens of thousands of records does not fit in the browser's
   small key–value storage, so it goes to its local database (IndexedDB),
   which holds hundreds of megabytes and never leaves the computer. Where the
   browser refuses it (some private windows), the calls fail quietly and the
   project file of Block 2 remains the way to keep the work. */
const Store = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open('pollinationpro', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('kv');
        req.onsuccess = () => { this.db = req.result; resolve(this.db); };
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  },
  async put(key, value) {
    try {
      const db = await this.open();
      await new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(value, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
      return true;
    } catch (e) { return false; }
  },
  async get(key) {
    try {
      const db = await this.open();
      return await new Promise((res, rej) => { const q = db.transaction('kv', 'readonly').objectStore('kv').get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    } catch (e) { return undefined; }
  },
};

Object.assign(window, {
  STEPS, el, els, mk, esc, L2, keepGreek, svgEl, showMessage, clearMessages, notice,
  fmtNum, fmtFixed, fmtPct, plural, parseNum,
  MONTHS, MONTHS_SHORT, monthName, isLeap, daysInMonth, daysInYear, doy, fromDoy, dayNumber, fromDayNumber, addDays, parseISO, toISO, fmtDate, fmtDoy,
  csvEscape, download, slug, goStep, enableStep, Prefs, rng, randn, cssVar, Stat, statTiles, buildTable, Store,
});

/* every place on the page that shows the version reads it from the constant */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.app-v').forEach(n => { n.textContent = APP_VERSION; });
});
