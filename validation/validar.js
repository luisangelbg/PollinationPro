/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — validation against R: the harness.

   Each compare_*.js registers one section in VAL.sections. A section reads
   the reference that its R script wrote (window.REF[name]: the data and what
   R computed from them), runs the app's own engine on the same data and
   calls VAL.check for every number. Nothing here knows about the interface:
   what is compared is what the blocks compute.

   Three kinds of comparison:
   · check — a number against R, with a relative tolerance (and an absolute
     floor for values that should be zero);
   · same — an exact value (a count, a verdict, a set of vertices);
   · mc — a Monte Carlo summary against the same summary simulated in R with
     another random generator: the two may differ by the simulation error, so
     the tolerance is a number of standard errors. */

const VAL = { sections: [], fam: new Map(), bad: [], total: 0, current: '', notes: [] };

(function () {
  function fam(name, kind) {
    const k = VAL.current + ' · ' + name;
    if (!VAL.fam.has(k)) VAL.fam.set(k, { section: VAL.current, name, kind, n: 0, bad: 0, worst: 0, tol: 0 });
    return VAL.fam.get(k);
  }
  const num = v => (v === null || v === undefined ? NaN : +v);
  /* relative error, with an absolute floor */
  VAL.check = function (name, got, want, tol, info, absTol) {
    const f = fam(name, 'num'); f.n++; VAL.total++; f.tol = Math.max(f.tol, tol);
    got = num(got); want = num(want);
    let e;
    if (Number.isNaN(want) && Number.isNaN(got)) e = 0;
    else if (Number.isNaN(want) || Number.isNaN(got)) e = Infinity;
    else if (got === want) e = 0;
    else if (absTol != null && Math.abs(got - want) <= absTol) e = 0;
    else e = Math.abs(got - want) / Math.max(1e-300, Math.abs(want));
    if (e > f.worst) f.worst = e;
    if (!(e <= tol)) { f.bad++; VAL.bad.push(`${f.section} · ${name} [${info || ''}]: app ${got} · R ${want} (error relativo ${e.toExponential(2)})`); }
  };
  /* absolute difference (for probabilities, proportions and indices between 0 and 1) */
  VAL.abs = function (name, got, want, tol, info) {
    const f = fam(name, 'abs'); f.n++; VAL.total++; f.tol = Math.max(f.tol, tol);
    got = num(got); want = num(want);
    const e = Number.isNaN(want) && Number.isNaN(got) ? 0 : Math.abs(got - want);
    if (e > f.worst) f.worst = e;
    if (!(e <= tol)) { f.bad++; VAL.bad.push(`${f.section} · ${name} [${info || ''}]: app ${got} · R ${want} (diferencia ${(+e).toExponential(2)})`); }
  };
  VAL.same = function (name, got, want, info) {
    const f = fam(name, 'same'); f.n++; VAL.total++;
    const a = JSON.stringify(got), b = JSON.stringify(want);
    if (a !== b) { f.bad++; f.worst = 1; VAL.bad.push(`${f.section} · ${name} [${info || ''}]: app ${a} · R ${b}`); }
  };
  /* got and want are means of nA and nB simulations with standard deviation sd */
  VAL.mc = function (name, got, want, se, info, k) {
    const f = fam(name, 'mc'); f.n++; VAL.total++; f.tol = k || 5;
    const e = se > 0 ? Math.abs(got - want) / se : (got === want ? 0 : Infinity);
    if (e > f.worst) f.worst = e;
    if (!(e <= f.tol)) { f.bad++; VAL.bad.push(`${f.section} · ${name} [${info || ''}]: app ${got} · R ${want} (${e.toFixed(1)} errores estándar)`); }
  };
  VAL.note = t => VAL.notes.push(VAL.current + ': ' + t);
  /* jsonlite writes a vector of one element as a scalar */
  VAL.arr = x => (x === null || x === undefined ? [] : [].concat(x));
  /* a data frame arrives as an array of rows; a matrix as an array of arrays */

  VAL.run = async function () {
    for (const s of VAL.sections) {
      VAL.current = s.name;
      try { await s.run(window.REF || {}); }
      catch (e) { VAL.total++; VAL.bad.push(`${s.name}: excepción — ${e && e.stack || e}`); }
    }
    const lines = [];
    const fmt = f => (f.kind === 'same' ? 'idénticos' : f.kind === 'mc' ? `peor: ${f.worst.toFixed(2)} errores estándar (se aceptan ${f.tol})`
      : f.kind === 'abs' ? `mayor diferencia: ${f.worst.toExponential(1)} (se acepta ${f.tol.toExponential(0)})`
      : `mayor error relativo: ${f.worst.toExponential(1)} (se acepta ${f.tol.toExponential(0)})`);
    let sec = '';
    const bySec = new Map();
    VAL.fam.forEach(f => {
      if (f.section !== sec) { sec = f.section; lines.push('', sec, '-'.repeat(sec.length)); }
      lines.push(`  ${f.bad ? '✗' : '✓'} ${f.name}: ${f.n} comparaciones, ${f.bad ? f.bad + ' en desacuerdo, ' : ''}${fmt(f)}`);
      const b = bySec.get(sec) || { n: 0, bad: 0 }; b.n += f.n; b.bad += f.bad; bySec.set(sec, b);
    });
    lines.push('', 'Resumen', '-------');
    bySec.forEach((b, s) => lines.push(`  ${s}: ${b.n} comparaciones, ${b.bad} en desacuerdo`));
    lines.push(`  TOTAL: ${VAL.total} comparaciones, ${VAL.bad.length} en desacuerdo`);
    if (VAL.notes.length) { lines.push('', 'Notas', '-----'); VAL.notes.forEach(n => lines.push('  ' + n)); }
    if (VAL.bad.length) { lines.push('', 'Desacuerdos', '-----------'); VAL.bad.forEach(b => lines.push('  ' + b)); }
    const R = Object.values(window.REF || {})[0];
    const head = [`PollinationPro ${typeof APP_VERSION !== 'undefined' ? APP_VERSION : ''} · validación contra ${R ? R.R : 'R'}`];
    VAL.result = { total: VAL.total, bad: VAL.bad.length, text: head.concat(lines).join('\n'), bySec: [...bySec] };
    return VAL.result;
  };
  window.VAL = VAL;
})();
