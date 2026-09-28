/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — reading and writing tables, with no library.

   Real files come from spreadsheets and bring everything: quotes, commas
   inside place names, line breaks inside a cell, a byte-order mark and, one
   time in three, Windows-1252 instead of UTF-8. An .xlsx workbook is a zip of
   XML parts: it is unzipped with the browser's own DecompressionStream and
   read with its XML parser. Coordinates arrive as decimals, with a decimal
   comma, or as degrees–minutes–seconds with hemisphere letters; dates as
   ISO, as day/month/year, or split in three columns. All of that is read
   here, once, for every block. */

(function () {

  /* ---------------- text ---------------- */
  function decodeText(buf) {
    const u8 = new Uint8Array(buf);
    if (u8[0] === 0xFF && u8[1] === 0xFE) return new TextDecoder('utf-16le').decode(u8).replace(/^﻿/, '');
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, ''); }
    catch (e) { return new TextDecoder('windows-1252').decode(u8); }   // a "CSV" saved by a Spanish-locale spreadsheet
  }

  /* the separator is the one that splits every line into the same number of
     fields (outside quotes), not simply the most frequent character */
  function splitLine(line, d) {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === d) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  }
  function detectDelimiter(text) {
    const sample = text.split(/\r?\n/).filter(l => l.trim() !== '').slice(0, 25);
    if (!sample.length) return ',';
    let best = ',', bestScore = -1;
    for (const d of ['\t', ';', ',', '|']) {
      const counts = sample.map(l => splitLine(l, d).length);
      const first = counts[0];
      if (first < 2) continue;
      const consistent = counts.filter(c => c === first).length / counts.length;
      const score = consistent * 10 + Math.min(first, 40) / 40;
      if (score > bestScore) { bestScore = score; best = d; }
    }
    return best;
  }
  /* a column name in the style of a spreadsheet: A, B, … Z, AA, AB… */
  function columnName(i) {
    let s = '';
    for (let n = i; n >= 0; n = Math.floor(n / 26) - 1) s = String.fromCharCode(65 + (n % 26)) + s;
    return s;
  }
  /* the full parser: line breaks inside quoted cells are allowed; returns the
     raw matrix, without deciding whether the first row is a header */
  function parseMatrix(text, delim) {
    let t = String(text ?? '');
    if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
    const d = delim || detectDelimiter(t);
    const rows = [];
    let row = [], cur = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (q) {
        if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else if (ch === '"' && cur === '') q = true;
      else if (ch === d) { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); cur = ''; rows.push(row); row = []; }
      else if (ch !== '\r') cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return { delim: d, matrix: rows.filter(r => r.some(c => String(c).trim() !== '')) };
  }

  /* does the first row hold titles? A header rarely has numbers, dates or
     codes in the columns where the data below do; text above text says
     nothing either way and is not counted */
  const isNum = v => v !== '' && isFinite(String(v).replace(',', '.').replace(/\s/g, ''));
  function shape(v) {
    const s = String(v ?? '').trim();
    if (s === '') return 'empty';
    if (isNum(s)) return 'num';
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s) || /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(s)) return 'date';
    if (/\d/.test(s) && /[a-záéíóúñ]/i.test(s)) return 'code';
    return 'text';
  }
  function looksLikeHeader(matrix) {
    if (!matrix || !matrix.length) return false;
    const top = matrix[0].map(c => String(c ?? '').trim());
    const data = matrix.slice(1, 9);
    if (!data.length) return top.every(c => c !== '' && !isNum(c));
    let differ = 0, informative = 0;
    for (let c = 0; c < top.length; c++) {
      const below = data.map(r => shape(r[c])).filter(f => f !== 'empty');
      if (!below.length) continue;
      const freq = {};
      below.forEach(f => { freq[f] = (freq[f] || 0) + 1; });
      const common = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
      if (common === 'text') continue;
      informative++;
      if (shape(top[c]) !== common) differ++;
    }
    if (informative) return differ / informative > 0.5;
    return top.every(c => c !== '' && !isNum(c)) && new Set(top.map(c => c.toLowerCase())).size === top.length;
  }
  /* matrix → {headers, rows as objects}; header: true | false | 'auto' */
  function toObjects(matrix, header) {
    const useHeader = header === 'auto' || header == null ? looksLikeHeader(matrix) : !!header;
    const width = Math.max(0, ...matrix.map(r => r.length));
    let headers;
    if (useHeader) {
      headers = Array.from({ length: width }, (_, i) => String(matrix[0][i] ?? '').trim() || `${T('Columna', 'Column')} ${columnName(i)}`);
      const seen = {};
      headers.forEach((h, i) => { if (seen[h] == null) seen[h] = 0; else { seen[h]++; headers[i] = `${h} (${seen[h] + 1})`; } });
    } else headers = Array.from({ length: width }, (_, i) => `${T('Columna', 'Column')} ${columnName(i)}`);
    const body = useHeader ? matrix.slice(1) : matrix;
    const rows = body.map(r => { const o = {}; headers.forEach((h, i) => { o[h] = String(r[i] ?? '').trim(); }); return o; });
    return { header: useHeader, headers, rows };
  }

  /* ---------------- writing ---------------- */
  function cell(v, d) {
    const s = String(v ?? '');
    return /["\n\r]|^\s|\s$/.test(s) || s.includes(d) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCSV(rows, columns, delim) {
    const d = delim || ',';
    const cols = columns && columns.length ? columns : Object.keys(rows[0] || {});
    const head = cols.map(c => cell(typeof c === 'object' ? c.label : c, d)).join(d);
    const body = rows.map(r => cols.map(c => cell(typeof c === 'object' ? (c.get ? c.get(r) : r[c.key]) : r[c], d)).join(d));
    return '﻿' + [head, ...body].join('\r\n') + '\r\n';
  }

  /* ---------------- .xlsx ---------------- */
  function xerr(es, en) { const e = new Error(en); e.html = L2(es, en); return e; }
  async function readXlsx(buf) {
    if (typeof DecompressionStream === 'undefined') throw xerr('este navegador no puede abrir archivos .xlsx; guarda la hoja como CSV o actualiza el navegador', 'this browser cannot open .xlsx files; save the sheet as CSV or update the browser');
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw xerr('no es un archivo .xlsx válido', 'not a valid .xlsx file');
    const n = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const entries = {}, dec = new TextDecoder();
    for (let i = 0; i < n; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      entries[dec.decode(u8.subarray(p + 46, p + 46 + nl))] = { method: dv.getUint16(p + 10, true), csize: dv.getUint32(p + 20, true), lho: dv.getUint32(p + 42, true) };
      p += 46 + nl + xl + cl;
    }
    async function part(name) {
      const e = entries[name]; if (!e) return null;
      const start = e.lho + 30 + dv.getUint16(e.lho + 26, true) + dv.getUint16(e.lho + 28, true), data = u8.subarray(start, start + e.csize);
      if (e.method === 0) return dec.decode(data);
      if (e.method !== 8) throw xerr('compresión no admitida en el .xlsx', 'unsupported compression in the .xlsx');
      return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    }
    const xml = s => new DOMParser().parseFromString(s, 'application/xml');
    const wb = await part('xl/workbook.xml');
    if (!wb) throw xerr('no es un archivo .xlsx válido (falta el libro)', 'not a valid .xlsx file (workbook missing)');
    const rels = xml((await part('xl/_rels/workbook.xml.rels')) || '<r/>'), relTarget = {};
    for (const r of rels.getElementsByTagName('Relationship')) {
      let t = r.getAttribute('Target') || '';
      t = t.startsWith('/') ? t.slice(1) : 'xl/' + t;
      relTarget[r.getAttribute('Id')] = t.replace('xl/xl/', 'xl/');
    }
    const RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const sheets = [...xml(wb).getElementsByTagName('sheet')].map((s, i) => ({
      name: s.getAttribute('name') || ('Sheet' + (i + 1)),
      path: relTarget[s.getAttributeNS(RNS, 'id') || s.getAttribute('r:id')] || ('xl/worksheets/sheet' + (i + 1) + '.xml'),
    }));
    let shared = [];
    const ss = await part('xl/sharedStrings.xml');
    if (ss) shared = [...xml(ss).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent).join(''));
    const colIndex = ref => { let c = 0; for (const ch of ref.replace(/[^A-Z]/gi, '').toUpperCase()) c = c * 26 + ch.charCodeAt(0) - 64; return c - 1; };
    async function sheetRows(sheet) {
      const doc = xml((await part(sheet.path)) || '<worksheet/>'), rows = [];
      for (const r of doc.getElementsByTagName('row')) {
        const ri = (+r.getAttribute('r') || rows.length + 1) - 1, row = [];
        for (const c of r.getElementsByTagName('c')) {
          const ci = c.getAttribute('r') ? colIndex(c.getAttribute('r')) : row.length, t = c.getAttribute('t');
          const v = c.getElementsByTagName('v')[0];
          let val = '';
          if (t === 'inlineStr') val = [...c.getElementsByTagName('t')].map(x => x.textContent).join('');
          else if (v) val = t === 's' ? (shared[+v.textContent] ?? '') : v.textContent;
          row[ci] = val;
        }
        while (rows.length < ri) rows.push([]);
        rows[ri] = Array.from(row, x => x ?? '');
      }
      return rows.filter(r => r.some(c => String(c).trim() !== ''));
    }
    return { sheets, sheetRows };
  }

  /* any file → a list of sheets, each a raw matrix */
  async function readAny(file) {
    const buf = await file.arrayBuffer();
    const u8 = new Uint8Array(buf);
    if (/\.xlsx$/i.test(file.name) || (u8[0] === 0x50 && u8[1] === 0x4B)) {
      const x = await readXlsx(buf);
      const out = [];
      for (const s of x.sheets) out.push({ name: s.name, matrix: await x.sheetRows(s) });
      return out;
    }
    const pm = parseMatrix(decodeText(buf));
    return [{ name: file.name, matrix: pm.matrix, delim: pm.delim }];
  }

  /* ---------------- coordinates ---------------- */
  /* decimal degrees, decimal comma, or degrees–minutes–seconds with hemisphere
     letters (N S E W, and O for oeste) before or after */
  function parseCoord(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    let s = String(v == null ? '' : v).trim();
    if (!s) return null;
    s = s.replace(/[−–—]/g, '-').replace(/ /g, ' ');
    let sign = 1, m;
    if ((m = s.match(/^([NSEWO])\s*(.*)$/i)) && /\d/.test(m[2])) { if (/[SWO]/i.test(m[1])) sign = -1; s = m[2]; }
    else if ((m = s.match(/^(.*?\d)\s*([NSEWO])$/i))) { if (/[SWO]/i.test(m[2])) sign = -1; s = m[1]; }
    else if ((m = s.match(/^(.*?\d[^a-z]*?)\s*([NSEWO])\b/i)) && /[°'′"″]/.test(m[1])) { if (/[SWO]/i.test(m[2])) sign = -1; s = m[1]; }
    if ((m = s.match(/^(-?\d+(?:[.,]\d+)?)\s*[°º]\s*(?:(\d+(?:[.,]\d+)?)\s*['′’]\s*)?(?:(\d+(?:[.,]\d+)?)\s*(?:"|″|''|”)?\s*)?$/))) {
      const f = x => (x == null ? 0 : parseFloat(x.replace(',', '.')));
      const deg = f(m[1]), out = Math.abs(deg) + f(m[2]) / 60 + f(m[3]) / 3600;
      return (deg < 0 ? -1 : sign) * out;
    }
    if ((m = s.match(/^(-?\d+)\s+(\d+(?:[.,]\d+)?)(?:\s+(\d+(?:[.,]\d+)?))?$/)) && parseFloat(m[2].replace(',', '.')) < 60) {
      const out = Math.abs(parseFloat(m[1])) + parseFloat(m[2].replace(',', '.')) / 60 + (m[3] ? parseFloat(m[3].replace(',', '.')) / 3600 : 0);
      return (m[1].startsWith('-') ? -1 : sign) * out;
    }
    if (/\d\s+\d/.test(s)) return null;
    s = s.replace(/\s/g, '');
    if (s.indexOf(',') >= 0 && s.indexOf('.') < 0) s = s.replace(',', '.');
    if (!/^-?\d+(\.\d+)?([eE]-?\d+)?$/.test(s)) return null;
    const x = parseFloat(s);
    if (!isFinite(x)) return null;
    return sign < 0 && x > 0 ? -x : x;
  }
  function parseNumber(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    let s = String(v).trim().replace(/[−–—]/g, '-').replace(/\s/g, '');
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else if (s.indexOf(',') >= 0 && s.indexOf('.') < 0) s = s.replace(',', '.');
    s = s.replace(/(m|msnm|masl|m\.s\.n\.m\.)$/i, '');
    const x = parseFloat(s);
    return isFinite(x) && /^-?[\d.]+(e-?\d+)?$/i.test(s) ? x : null;
  }

  /* ---------------- dates ----------------
     Returns {y, m, d} with m or d possibly null (a record may give only the
     year and the month). Accepted: 2021-09-14, 2021-09, 2021/9/14,
     14/09/2021, 14-09-2021, 14.09.2021, a GBIF interval "2021-09-01/2021-09-30"
     (its first day), and a spreadsheet serial number. */
  function parseDate(v, order) {
    if (v == null || v === '') return null;
    if (typeof v === 'number' || /^\d{5}(\.\d+)?$/.test(String(v).trim())) {
      const serial = Math.floor(+v);                         // days since 1899-12-30
      if (serial > 20000 && serial < 80000) { const dt = fromDayNumber(serial - 25569); return { y: dt.y, m: dt.m, d: dt.d }; }
    }
    let s = String(v).trim().split('/').length === 2 && /^\d{4}-/.test(String(v).trim()) ? String(v).trim().split('/')[0] : String(v).trim();
    s = s.replace(/T.*$/, '');
    let m;
    if ((m = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/))) return valid(+m[1], +m[2], m[3] ? +m[3] : null);
    if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) {
      let y = +m[3]; if (y < 100) y += y < 50 ? 2000 : 1900;
      const a = +m[1], b = +m[2];
      if (order === 'mdy' || (a <= 12 && b > 12)) return valid(y, a, b);
      return valid(y, b, a);
    }
    if ((m = s.match(/^(\d{4})$/))) return valid(+m[1], null, null);
    return null;
  }
  function valid(y, m, d) {
    if (!(y > 1500 && y < 2200)) return null;
    if (m != null && !(m >= 1 && m <= 12)) return null;
    if (d != null && m != null && !(d >= 1 && d <= daysInMonth(y, m))) return null;
    return { y, m: m ?? null, d: d ?? null };
  }

  window.TableIO = { decodeText, detectDelimiter, splitLine, columnName, parseMatrix, looksLikeHeader, toObjects, toCSV, readXlsx, readAny, parseCoord, parseNumber, parseDate };
})();
