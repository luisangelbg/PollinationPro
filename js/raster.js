/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — reading raster layers, with no library.

   Two formats cover what ecologists download:
   · GeoTIFF, following the TIFF 6.0 specification (Adobe 1992) and the
     GeoTIFF 1.0 keys for placing the grid (tie point and pixel scale):
     strips or tiles; no compression, LZW, Deflate or PackBits; horizontal
     and floating-point predictors; 8-, 16-, 32- and 64-bit integers and
     floats; classic and BigTIFF files. The no-data value comes from the
     GDAL_NODATA tag (42113), a plain text number.
   · the ESRI ASCII grid (.asc), a header and rows of numbers.

   Only the window that covers the study area is decoded: a global layer at
   30 arc-seconds has 933 million cells, and the study usually needs a few
   million. Every layer is returned as {w, h, x0, y0, dx, dy, data, nodata}
   with x0, y0 the upper-left corner and data a Float32Array in which
   missing values are NaN. */

const Raster = {};

(function () {

  /* a box edge that falls on a cell edge must not pick up one more cell because
     of floating point: 32.999999 cells is 33, not 32 */
  const cellFloor = v => Math.floor(v + 1e-6), cellCeil = v => Math.ceil(v - 1e-6);

  /* ---------------- decompressors ---------------- */
  /* TIFF's LZW (TIFF 6.0, section 13): codes of 9 to 12 bits, most significant
     bit first, 256 = clear, 257 = end, and the "early change" that widens the
     code one entry before the table fills. */
  function lzw(input, expected) {
    const out = new Uint8Array(expected || input.length * 4);
    let op = 0;
    const dict = new Array(4096);
    const lens = new Int32Array(4096);
    let next = 258, width = 9, bitPos = 0, prev = -1;
    const total = input.length * 8;
    const readCode = () => {
      if (bitPos + width > total) return 257;
      let v = 0;
      for (let i = 0; i < width; i++) {
        const bit = (input[(bitPos + i) >> 3] >> (7 - ((bitPos + i) & 7))) & 1;
        v = (v << 1) | bit;
      }
      bitPos += width;
      return v;
    };
    const emit = seq => { for (let i = 0; i < seq.length; i++) { if (op < out.length) out[op++] = seq[i]; } };
    for (let i = 0; i < 256; i++) { dict[i] = Uint8Array.of(i); lens[i] = 1; }
    for (;;) {
      const code = readCode();
      if (code === 257) break;
      if (code === 256) { next = 258; width = 9; prev = -1; continue; }
      let seq;
      if (prev === -1) { seq = dict[code]; emit(seq); prev = code; continue; }
      if (code < next && dict[code]) {
        seq = dict[code];
        const n = new Uint8Array(dict[prev].length + 1); n.set(dict[prev]); n[n.length - 1] = seq[0];
        dict[next++] = n;
      } else {
        const p = dict[prev];
        seq = new Uint8Array(p.length + 1); seq.set(p); seq[seq.length - 1] = p[0];
        dict[next++] = seq;
      }
      emit(seq);
      prev = code;
      if (next + 1 >= (1 << width) && width < 12) width++;
    }
    return op === out.length ? out : out.subarray(0, op);
  }
  function packBits(input, expected) {
    const out = new Uint8Array(expected);
    let i = 0, o = 0;
    while (i < input.length && o < out.length) {
      const n = (input[i] << 24) >> 24; i++;
      if (n >= 0) { for (let k = 0; k <= n && o < out.length; k++) out[o++] = input[i++]; }
      else if (n !== -128) { const b = input[i++]; for (let k = 0; k < 1 - n && o < out.length; k++) out[o++] = b; }
    }
    return out;
  }
  async function inflate(bytes) {
    if (typeof DecompressionStream === 'undefined') throw new Error('DecompressionStream');
    const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(ds).arrayBuffer());
  }

  /* ---------------- predictors ---------------- */
  /* horizontal differencing (predictor 2), per row, for integers of any size */
  function undoHorizontal(bytes, rowW, spp, bps, little) {
    const bpp = bps / 8, rowBytes = rowW * spp * bpp, rows = Math.floor(bytes.length / rowBytes);
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let r = 0; r < rows; r++) {
      const base = r * rowBytes;
      for (let i = spp; i < rowW * spp; i++) {
        const a = base + i * bpp, b = base + (i - spp) * bpp;
        if (bpp === 1) bytes[a] = (bytes[a] + bytes[b]) & 0xFF;
        else if (bpp === 2) dv.setUint16(a, (dv.getUint16(a, little) + dv.getUint16(b, little)) & 0xFFFF, little);
        else if (bpp === 4) dv.setUint32(a, (dv.getUint32(a, little) + dv.getUint32(b, little)) >>> 0, little);
      }
    }
  }
  /* floating-point predictor (predictor 3, Adobe Photoshop TIFF technical note 3):
     bytes are differenced, and stored most significant byte plane first */
  function undoFloat(bytes, rowW, spp, bps) {
    const bpp = bps / 8, rowBytes = rowW * spp * bpp, rows = Math.floor(bytes.length / rowBytes);
    const tmp = new Uint8Array(rowBytes);
    for (let r = 0; r < rows; r++) {
      const base = r * rowBytes;
      for (let i = spp; i < rowBytes; i++) bytes[base + i] = (bytes[base + i] + bytes[base + i - spp]) & 0xFF;
      const n = rowW * spp;
      for (let i = 0; i < n; i++) for (let b = 0; b < bpp; b++) tmp[i * bpp + b] = bytes[base + (bpp - 1 - b) * n + i];
      bytes.set(tmp, base);
    }
  }

  /* ---------------- TIFF structure ---------------- */
  const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 16: 8, 17: 8, 18: 8 };
  function readIFD(dv, u8) {
    const little = dv.getUint16(0) === 0x4949;
    const magic = dv.getUint16(2, little);
    const big = magic === 43;
    if (magic !== 42 && !big) throw new Error('not a TIFF');
    const u64 = o => Number(dv.getBigUint64(o, little));
    const off = big ? u64(8) : dv.getUint32(4, little);
    const n = big ? u64(off) : dv.getUint16(off, little);
    const tags = {};
    const entry = big ? 20 : 12;
    const start = off + (big ? 8 : 2);
    for (let i = 0; i < n; i++) {
      const p = start + i * entry;
      const tag = dv.getUint16(p, little), type = dv.getUint16(p + 2, little);
      const count = big ? u64(p + 4) : dv.getUint32(p + 4, little);
      const size = (TYPE_SIZE[type] || 1) * count;
      const inline = big ? 8 : 4;
      const vo = size <= inline ? p + (big ? 12 : 8) : (big ? u64(p + 12) : dv.getUint32(p + 8, little));
      const get = k => {
        const o = vo + k * (TYPE_SIZE[type] || 1);
        switch (type) {
          case 1: case 7: return u8[o];
          case 6: return dv.getInt8(o);
          case 3: return dv.getUint16(o, little);
          case 8: return dv.getInt16(o, little);
          case 4: return dv.getUint32(o, little);
          case 9: return dv.getInt32(o, little);
          case 11: return dv.getFloat32(o, little);
          case 12: return dv.getFloat64(o, little);
          case 16: return u64(o);
          case 17: return Number(dv.getBigInt64(o, little));
          case 5: return dv.getUint32(o, little) / dv.getUint32(o + 4, little);
          case 10: return dv.getInt32(o, little) / dv.getInt32(o + 4, little);
          default: return u8[o];
        }
      };
      if (type === 2) tags[tag] = new TextDecoder().decode(u8.subarray(vo, vo + count)).replace(/\0+$/, '');
      else if (count === 1) tags[tag] = get(0);
      else { const a = new Array(Math.min(count, 1e7)); for (let k = 0; k < a.length; k++) a[k] = get(k); tags[tag] = a; }
    }
    return { little, big, tags };
  }

  /* the sample reader for one decoded block */
  function sampleReader(dv, fmt, bps, little) {
    if (fmt === 3) return bps === 64 ? o => dv.getFloat64(o, little) : o => dv.getFloat32(o, little);
    if (fmt === 2) return bps === 8 ? o => dv.getInt8(o) : bps === 16 ? o => dv.getInt16(o, little) : bps === 32 ? o => dv.getInt32(o, little) : o => Number(dv.getBigInt64(o, little));
    return bps === 8 ? o => dv.getUint8(o) : bps === 16 ? o => dv.getUint16(o, little) : bps === 32 ? o => dv.getUint32(o, little) : o => Number(dv.getBigUint64(o, little));
  }

  /* ---------------- reading a GeoTIFF window ---------------- */
  async function readTiff(buf, box) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    const { little, tags } = readIFD(dv, u8);
    const W = tags[256], H = tags[257];
    const bps = Array.isArray(tags[258]) ? tags[258][0] : (tags[258] || 8);
    const comp = tags[259] || 1, pred = tags[317] || 1, spp = tags[277] || 1;
    const fmt = Array.isArray(tags[339]) ? tags[339][0] : (tags[339] || 1);
    if ((tags[284] || 1) !== 1 && spp > 1) throw new Error('planar configuration 2 is not supported');
    const scale = tags[33550], tie = tags[33922];
    if (!scale || !tie) throw new Error('the file carries no georeference (pixel scale and tie point)');
    const dx = scale[0], dy = scale[1];
    /* the tie point may refer to any pixel: move it to the upper-left corner */
    let x0 = tie[3] - tie[0] * dx, y0 = tie[4] + tie[1] * dy;
    /* GeoTIFF raster type: 1 = the value covers the pixel area (the default), 2 = the value sits at the pixel point */
    const keys = tags[34735];
    if (Array.isArray(keys)) for (let i = 4; i < keys.length; i += 4) if (keys[i] === 1025 && keys[i + 3] === 2) { x0 -= dx / 2; y0 += dy / 2; }
    const nodata = tags[42113] != null && String(tags[42113]).trim() !== '' ? parseFloat(tags[42113]) : null;
    /* the window, in pixels */
    let c0 = 0, c1 = W, r0 = 0, r1 = H;
    if (box) {
      c0 = Math.max(0, cellFloor((box[0] - x0) / dx)); c1 = Math.min(W, cellCeil((box[2] - x0) / dx));
      r0 = Math.max(0, cellFloor((y0 - box[3]) / dy)); r1 = Math.min(H, cellCeil((y0 - box[1]) / dy));
      if (c1 <= c0 || r1 <= r0) throw new Error('the layer does not cover the study area');
    }
    const w = c1 - c0, h = r1 - r0;
    const out = new Float32Array(w * h).fill(NaN);
    const tiled = tags[322] != null;
    const bw = tiled ? tags[322] : W, bh = tiled ? tags[323] : (tags[278] || H);
    const offs = [].concat(tiled ? tags[324] : tags[273]), cnts = [].concat(tiled ? tags[325] : tags[279]);
    const across = Math.ceil(W / bw);
    const bpp = bps / 8;
    const decode = async (idx) => {
      const raw = u8.subarray(offs[idx], offs[idx] + cnts[idx]);
      const expected = bw * bh * spp * bpp;
      let bytes;
      if (comp === 1) bytes = new Uint8Array(raw);
      else if (comp === 5) bytes = lzw(raw, expected);
      else if (comp === 8 || comp === 32946) bytes = await inflate(raw);
      else if (comp === 32773) bytes = packBits(raw, expected);
      else throw new Error('compression ' + comp + ' is not supported');
      if (bytes.length < expected) { const b = new Uint8Array(expected); b.set(bytes); bytes = b; }
      if (pred === 2) undoHorizontal(bytes, bw, spp, bps, little);
      else if (pred === 3) undoFloat(bytes, bw, spp, bps);
      return bytes;
    };
    const blocksR0 = Math.floor(r0 / bh), blocksR1 = Math.floor((r1 - 1) / bh);
    const blocksC0 = tiled ? Math.floor(c0 / bw) : 0, blocksC1 = tiled ? Math.floor((c1 - 1) / bw) : 0;
    for (let br = blocksR0; br <= blocksR1; br++) {
      for (let bc = blocksC0; bc <= blocksC1; bc++) {
        const idx = tiled ? br * across + bc : br;
        if (idx >= offs.length || !cnts[idx]) continue;
        const bytes = await decode(idx);
        const bdv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const rd = sampleReader(bdv, fmt, bps, little);
        const rowStart = br * bh, colStart = bc * bw;
        for (let rr = Math.max(r0, rowStart); rr < Math.min(r1, rowStart + bh); rr++) {
          for (let cc = Math.max(c0, colStart); cc < Math.min(c1, colStart + bw); cc++) {
            const o = ((rr - rowStart) * bw + (cc - colStart)) * spp * bpp;
            let v = rd(o);
            if (nodata != null && (v === nodata || (Math.abs(nodata) > 1e30 && Math.abs(v) > 1e30))) v = NaN;
            out[(rr - r0) * w + (cc - c0)] = v;
          }
        }
      }
    }
    return { w, h, x0: x0 + c0 * dx, y0: y0 - r0 * dy, dx, dy, data: out, nodata, info: { W, H, bps, fmt, comp, pred, tiled, bw, bh } };
  }

  /* ---------------- ESRI ASCII grid ---------------- */
  function readAsc(text, box) {
    const lines = text.split(/\r?\n/);
    const head = {};
    let i = 0;
    for (; i < lines.length; i++) {
      const m = lines[i].trim().match(/^([a-zA-Z_]+)\s+(-?[\d.eE+-]+)$/);
      if (!m) break;
      head[m[1].toLowerCase()] = parseFloat(m[2]);
    }
    const W = head.ncols, H = head.nrows, d = head.cellsize;
    if (!W || !H || !d) throw new Error('not an ASCII grid');
    const x0 = head.xllcorner != null ? head.xllcorner : head.xllcenter - d / 2;
    const yll = head.yllcorner != null ? head.yllcorner : head.yllcenter - d / 2;
    const y0 = yll + H * d;
    const nodata = head.nodata_value != null ? head.nodata_value : null;
    let c0 = 0, c1 = W, r0 = 0, r1 = H;
    if (box) {
      c0 = Math.max(0, cellFloor((box[0] - x0) / d)); c1 = Math.min(W, cellCeil((box[2] - x0) / d));
      r0 = Math.max(0, cellFloor((y0 - box[3]) / d)); r1 = Math.min(H, cellCeil((y0 - box[1]) / d));
    }
    const w = c1 - c0, h = r1 - r0;
    const out = new Float32Array(w * h).fill(NaN);
    let row = 0;
    for (; i < lines.length && row < r1; i++) {
      const s = lines[i].trim();
      if (!s) continue;
      if (row >= r0) {
        const vals = s.split(/\s+/);
        for (let c = c0; c < c1; c++) { let v = parseFloat(vals[c]); if (nodata != null && v === nodata) v = NaN; out[(row - r0) * w + (c - c0)] = v; }
      }
      row++;
    }
    return { w, h, x0: x0 + c0 * d, y0: y0 - r0 * d, dx: d, dy: d, data: out, nodata };
  }

  /* ---------------- using a layer ---------------- */
  /* value at a point: bilinear between the four nearest cell centres, falling
     back to the cell itself when a neighbour is missing */
  function valueAt(L, lon, lat, nearest) {
    const fx = (lon - L.x0) / L.dx - 0.5, fy = (L.y0 - lat) / L.dy - 0.5;
    const cx = Math.floor((lon - L.x0) / L.dx), cy = Math.floor((L.y0 - lat) / L.dy);
    if (cx < 0 || cy < 0 || cx >= L.w || cy >= L.h) return NaN;
    const own = L.data[cy * L.w + cx];
    if (nearest) return own;
    const x = Math.floor(fx), y = Math.floor(fy), tx = fx - x, ty = fy - y;
    if (x < 0 || y < 0 || x + 1 >= L.w || y + 1 >= L.h) return own;
    const a = L.data[y * L.w + x], b = L.data[y * L.w + x + 1], c = L.data[(y + 1) * L.w + x], d = L.data[(y + 1) * L.w + x + 1];
    if (!isFinite(a) || !isFinite(b) || !isFinite(c) || !isFinite(d)) return own;
    return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
  }
  /* the grid of the first layer is the common grid; another layer on a
     different grid is resampled onto it (bilinear) */
  function sameGrid(a, b) { return a.w === b.w && a.h === b.h && Math.abs(a.x0 - b.x0) < a.dx * 1e-3 && Math.abs(a.y0 - b.y0) < a.dy * 1e-3 && Math.abs(a.dx - b.dx) < a.dx * 1e-6; }
  function resampleTo(L, ref) {
    const out = new Float32Array(ref.w * ref.h);
    for (let r = 0; r < ref.h; r++) for (let c = 0; c < ref.w; c++) {
      const lon = ref.x0 + (c + 0.5) * ref.dx, lat = ref.y0 - (r + 0.5) * ref.dy;
      out[r * ref.w + c] = valueAt(L, lon, lat);
    }
    return Object.assign({}, ref, { data: out, nodata: null, resampled: true });
  }
  /* summary numbers of a layer */
  function stats(L) {
    let n = 0, mn = Infinity, mx = -Infinity, s = 0;
    for (let i = 0; i < L.data.length; i++) { const v = L.data[i]; if (!isFinite(v)) continue; n++; s += v; if (v < mn) mn = v; if (v > mx) mx = v; }
    return { n, min: mn, max: mx, mean: n ? s / n : NaN };
  }
  const bboxOf = L => [L.x0, L.y0 - L.h * L.dy, L.x0 + L.w * L.dx, L.y0];

  /* a file → a layer, cropped to box */
  async function readFile(file, box) {
    const name = file.name.replace(/\.(tiff?|asc)$/i, '');
    if (/\.asc$/i.test(file.name)) return Object.assign(readAsc(await file.text(), box), { name, file: file.name });
    return Object.assign(await readTiff(await file.arrayBuffer(), box), { name, file: file.name });
  }

  Object.assign(Raster, { lzw, packBits, inflate, undoHorizontal, undoFloat, readIFD, readTiff, readAsc, readFile, valueAt, sameGrid, resampleTo, stats, bboxOf });
  window.Raster = Raster;
})();
