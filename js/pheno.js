/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — Block 6 engine: when and at what elevation.

   The date of a record becomes a day of the year: its own day when it has
   one, the middle of its month when it only has the month. From those days
   each unit gets a monthly profile, a circular mean and concentration, and
   the Rayleigh test (Zar 2010). Each plant × visitor pair gets the overlap of
   their monthly profiles (Schoener's D, Warren's I, Pianka's O), the lag
   between their mean dates and the Watson–Williams test.

   Sampling effort has seasons too: fieldwork concentrates in some months. A
   profile can therefore be corrected by the effort of the target group — the
   records of every taxon of the study in that month — in the spirit of
   Phillips et al. (2009): p(m) ∝ n_unit(m) / n_all(m).

   Elevation is read from the records that carry it; overlap along the
   gradient is Schoener's D on 100-m classes and kernel densities (Silverman
   1986) for the figure. */

const Pheno = {};

(function () {
  const P = Poll;
  /* day of the year of a record, or null */
  function dayOf(r) {
    if (!r.m || r.m < 1 || r.m > 12) return null;
    if (r.d && r.d >= 1 && r.d <= 31) return doy(2025, r.m, Math.min(r.d, daysInMonth(2025, r.m)));
    return P.MONTH_MID[r.m - 1];
  }
  const monthOf = r => (r.m >= 1 && r.m <= 12 ? r.m : null);

  /* monthly counts of a set of records */
  function monthly(recs) {
    const h = new Array(12).fill(0);
    recs.forEach(r => { const m = monthOf(r); if (m) h[m - 1]++; });
    return h;
  }
  /* the profile of a unit: raw proportions, or divided by the monthly effort */
  function profile(counts, effort, corrected, floor) {
    if (!corrected) return P.normalise(counts);
    const f = floor == null ? 5 : floor;
    return P.normalise(counts.map((c, i) => (effort[i] >= f ? c / effort[i] : 0)));
  }

  /* circular summary of a unit */
  function circular(recs) {
    const days = recs.map(dayOf).filter(x => x != null);
    const ang = days.map(P.doyToAngle);
    if (ang.length < 2) return { n: ang.length, days };
    const m = P.circMean(ang), ry = P.rayleigh(ang);
    /* the doubled angles: a high R̄ there and a low one here betrays two peaks
       six months apart, which the plain mean would hide (Fisher 1993, §2.4) */
    const m2 = P.circMean(ang.map(a => 2 * a));
    return { n: ang.length, days, ang, meanDoy: m.meanDoy, R: m.R, sdDays: m.sdDays, Z: ry.Z, p: ry.p, R2: m2.R, bimodal: m2.R > 0.3 && m2.R > m.R + 0.15, withDay: recs.filter(r => r.d && r.m).length };
  }

  /* a whole analysis: units → profiles and circular stats; pairs → overlaps */
  function analyse(records, opts) {
    const o = Object.assign({ corrected: false, flowersOnly: false, floor: 5 }, opts || {});
    const dated = records.filter(r => monthOf(r));
    const effort = monthly(dated);
    const units = new Map();
    dated.forEach(r => {
      if (o.flowersOnly && r.role === 'plant' && !/flower|flor|anthesis|antesis/i.test(r.repro || '')) return;
      if (!units.has(r.unit)) units.set(r.unit, { unit: r.unit, role: r.role, recs: [] });
      units.get(r.unit).recs.push(r);
    });
    const U = [...units.values()].map(u => {
      const counts = monthly(u.recs);
      return Object.assign(u, { counts, prof: profile(counts, effort, o.corrected, o.floor), circ: circular(u.recs), nTotal: records.filter(r => r.unit === u.unit).length });
    }).sort((a, b) => (a.role === b.role ? b.recs.length - a.recs.length : a.role === 'plant' ? -1 : 1));
    const plants = U.filter(u => u.role === 'plant'), visitors = U.filter(u => u.role === 'poll');
    const pairs = [];
    plants.forEach(p => visitors.forEach(v => {
      const ww = p.circ.ang && v.circ.ang ? P.watsonWilliams([p.circ.ang, v.circ.ang]) : null;
      const both = p.prof.map((x, i) => x >= 0.05 && v.prof[i] >= 0.05);
      pairs.push({
        plant: p.unit, visitor: v.unit,
        D: P.schoenerD(p.prof, v.prof), I: P.hellingerI(p.prof, v.prof), O: P.piankaO(p.prof, v.prof),
        lag: p.circ.meanDoy != null && v.circ.meanDoy != null ? P.doyDiff(p.circ.meanDoy, v.circ.meanDoy) : null,
        wwP: ww ? ww.p : null, wwValid: ww ? ww.valid : false,
        monthsBoth: both.map((b, i) => (b ? i + 1 : 0)).filter(Boolean),
        /* the share of the plant's flowering covered by months when the visitor flies */
        coverPlant: p.prof.reduce((s, x, i) => s + (v.prof[i] > 0 ? x : 0), 0),
      });
    }));
    return { units: U, plants, visitors, pairs, effort, opts: o, nDated: dated.length, nAll: records.length };
  }

  /* ---------------- elevation ---------------- */
  function elevation(records, opts) {
    const o = Object.assign({ step: 100 }, opts || {});
    const withE = records.filter(r => r.elev != null && isFinite(r.elev) && r.elev > -100 && r.elev < 6500);
    const units = new Map();
    withE.forEach(r => { if (!units.has(r.unit)) units.set(r.unit, { unit: r.unit, role: r.role, e: [] }); units.get(r.unit).e.push(r.elev); });
    const all = withE.map(r => r.elev);
    if (!all.length) return { units: [], pairs: [], share: 0 };
    const lo = Math.floor(Math.min(...all) / o.step) * o.step, hi = Math.ceil(Math.max(...all) / o.step) * o.step + o.step;
    const nb = Math.max(1, Math.round((hi - lo) / o.step));
    const U = [...units.values()].map(u => {
      const hist = new Array(nb).fill(0);
      u.e.forEach(x => { hist[Math.min(nb - 1, Math.floor((x - lo) / o.step))]++; });
      const s = u.e.slice().sort((a, b) => a - b);
      return Object.assign(u, { hist, n: u.e.length, min: s[0], max: s[s.length - 1], q25: Stat.quantile(s, 0.25), med: Stat.quantile(s, 0.5), q75: Stat.quantile(s, 0.75), nTotal: records.filter(r => r.unit === u.unit).length });
    }).sort((a, b) => (a.role === b.role ? b.n - a.n : a.role === 'plant' ? -1 : 1));
    const pairs = [];
    U.filter(u => u.role === 'plant').forEach(p => U.filter(u => u.role === 'poll').forEach(v => {
      pairs.push({ plant: p.unit, visitor: v.unit, D: P.schoenerD(p.hist, v.hist), I: P.hellingerI(p.hist, v.hist),
        /* the share of the plant's records inside the visitor's central 90 % */
        inside: (() => { const s = v.e.slice().sort((a, b) => a - b); const a = Stat.quantile(s, 0.05), b = Stat.quantile(s, 0.95); return p.e.filter(x => x >= a && x <= b).length / p.e.length; })() });
    }));
    return { units: U, pairs, lo, hi, step: o.step, share: withE.length / Math.max(1, records.length) };
  }

  Object.assign(Pheno, { dayOf, monthly, profile, circular, analyse, elevation });
  window.Pheno = Pheno;
})();
