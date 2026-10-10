/* PollinationPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán.
   Free software under the GNU General Public License, version 3; see LICENSE. */
/* PollinationPro — validation of Block 6 (js/pheno.js and the circular
   statistics of js/engine.js) against R. Reference: ref_block6.R. */
VAL.sections.push({ name: 'Bloque 6 · Fenología y altitud', run(REF) {
  const r = REF.block6, P = Poll;
  const recs = r.registros.map(x => ({ unit: x.unit, role: x.role, m: x.m, d: x.d == null ? null : x.d, elev: x.elev == null ? null : x.elev }));

  /* the day of the year the app gives each record is the one R used */
  r.registros.forEach((x, i) => VAL.check('día del año de cada registro', Pheno.dayOf(recs[i]), x.doy, 1e-15, 'registro ' + (i + 1)));

  const an = Pheno.analyse(recs, { corrected: false });
  const anC = Pheno.analyse(recs, { corrected: true });
  VAL.same('registros por mes (esfuerzo)', an.effort, r.esfuerzo, '');
  let worstRay = 0;
  r.circular.forEach(c => {
    const u = an.units.find(x => x.unit === c.unit).circ, m = P.circMean(u.ang);
    VAL.same('circular: n', u.n, c.n, c.unit);
    VAL.check('circular: longitud del vector medio R̄', u.R, c.R, 1e-12, c.unit);
    VAL.check('circular: dirección media (radianes)', m.mean, c.mediaAng, 1e-11, c.unit);
    VAL.check('circular: fecha media (día del año)', u.meanDoy, c.mediaDia, 1e-11, c.unit);
    VAL.check('circular: desviación estándar circular', m.sd, c.de, 1e-11, c.unit);
    VAL.check('Rayleigh: Z = n R̄²', u.Z, c.Z, 1e-11, c.unit);
    /* three published approximations of the same p: Zar's (the app), the series of
       circular and the one of CircStats; they agree to a few thousandths */
    VAL.abs('Rayleigh: p (circular)', u.p, c.pRayleigh, 5e-3, c.unit);
    VAL.abs('Rayleigh: p (CircStats)', u.p, c.pRayleigh2, 5e-3, c.unit);
    worstRay = Math.max(worstRay, Math.abs(u.p - c.pRayleigh));
    VAL.check('circular: R̄ de los ángulos dobles', u.R2, c.R2, 1e-11, c.unit);
  });
  VAL.note(`el valor p de Rayleigh sale de una aproximación (Zar 2010, ec. 27.4); la de circular es otra y la mayor diferencia entre ambas fue ${worstRay.toExponential(1)}.`);
  r.kappa.R.forEach((R, i) => {
    VAL.check('concentración κ (circular::A1inv)', P.kappaFromR(R), r.kappa.aprox[i], 1e-13, 'R̄ = ' + R);
    VAL.check('concentración κ contra la raíz exacta de I₁/I₀', P.kappaFromR(R), r.kappa.exacta[i], 2e-2, 'R̄ = ' + R);
  });

  let worstK = 0;
  r.pares.forEach(w => {
    const info = `${w.plant} × ${w.visitor}`;
    const g = an.pairs.find(x => x.plant === w.plant && x.visitor === w.visitor), gc = anC.pairs.find(x => x.plant === w.plant && x.visitor === w.visitor);
    const a = an.units.find(x => x.unit === w.plant).circ.ang, b = an.units.find(x => x.unit === w.visitor).circ.ang;
    const ww = P.watsonWilliams([a, b]);
    /* the correction factor K = 1 + 3/(8κ): Zar (2010, eq. 27.14) and the app take κ from the weighted
       mean of the groups' vector lengths; circular takes it from the pooled sample. With circular's K
       the app's F must be circular's F */
    VAL.check('Watson-Williams: F con el factor de Zar', ww.F, w.Fzar, 1e-10, info);
    VAL.check('Watson-Williams: F de circular (con su factor)', ww.F * w.Kcir / w.Kzar, w.F, 1e-10, info);
    VAL.same('Watson-Williams: grados de libertad', ww.df2, w.gl2, info);
    VAL.check('Watson-Williams: p', g.wwP, w.pZar, 1e-8, info, 1e-300);
    worstK = Math.max(worstK, Math.abs(w.Fzar / w.F - 1));
    VAL.check('perfil mensual: D de Schoener (dismo)', g.D, w.D, 1e-12, info, 1e-15);
    VAL.check('perfil mensual: D de Schoener (spaa)', g.D, w.D2, 1e-12, info, 1e-15);
    VAL.check('perfil mensual: I de Warren (dismo)', g.I, w.I, 1e-12, info, 1e-15);
    VAL.check('perfil mensual: O de Pianka (spaa)', g.O, w.O, 1e-12, info, 1e-15);
    VAL.check('perfil corregido por esfuerzo: D', gc.D, w.Dc, 1e-12, info, 1e-15);
    VAL.check('perfil corregido por esfuerzo: I', gc.I, w.Ic, 1e-12, info, 1e-15);
    VAL.check('perfil corregido por esfuerzo: O', gc.O, w.Oc, 1e-12, info, 1e-15);
    VAL.check('desfase entre fechas medias (días)', g.lag, w.desfase, 1e-10, info, 1e-10);
  });
  VAL.note(`Watson-Williams: la app usa el factor de corrección de Zar (κ de la media ponderada de los vectores de cada grupo); circular toma κ de la muestra reunida. Con el mismo factor los dos F coinciden; con factores distintos difieren hasta ${(100 * worstK).toFixed(0)} %, cuando las fechas medias están muy separadas.`);
  r.levins.forEach(l => VAL.check('amplitud de Levins B (spaa)', P.levinsB(an.units.find(x => x.unit === l.unit).counts).B, l.B, 1e-13, l.unit));

  const el = Pheno.elevation(recs);
  VAL.same('altitud: límites de las clases', [el.lo, el.hi], r.altRango, '');
  r.altUnidades.forEach(a => {
    const u = el.units.find(x => x.unit === a.unit);
    VAL.same('altitud: registros con dato', u.n, a.n, a.unit);
    [u.min, u.q25, u.med, u.q75, u.max].forEach((v, i) => VAL.check('altitud: mínimo, cuartiles y máximo', v, a.q[i], 1e-13, a.unit));
  });
  r.altPares.forEach(w => {
    const g = el.pairs.find(x => x.plant === w.plant && x.visitor === w.visitor), info = `${w.plant} × ${w.visitor}`;
    VAL.check('altitud: D de Schoener (dismo)', g.D, w.D, 1e-12, info, 1e-15);
    VAL.check('altitud: I de Warren (dismo)', g.I, w.I, 1e-12, info, 1e-15);
    VAL.check('altitud: registros de la planta dentro del 90 % central del visitante', g.inside, w.dentro, 1e-13, info, 1e-15);
  });
} });
