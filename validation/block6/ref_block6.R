# PollinationPro — referencia del Bloque 6 (fenología y altitud; js/pheno.js y la estadística circular de
# js/engine.js).
# Paquetes: circular (media, concentración, Rayleigh, Watson-Williams), CircStats (segunda opinión de Rayleigh),
# dismo (D de Schoener e I de Warren), spaa (Pianka, Schoener, Levins) y stats.
# Correr desde esta carpeta:  Rscript ref_block6.R
source("../comun.R")
suppressPackageStartupMessages({ library(circular); library(CircStats); library(dismo); library(spaa) })
set.seed(20261006)
ref <- list(paquetes = ver("circular", "CircStats", "dismo", "spaa"))
dia_a_angulo <- function(d) 2 * pi * (((d - 0.5) %% 365)) / 365
angulo_a_dia <- function(a) (a %% (2 * pi)) / (2 * pi) * 365 + 0.5

# ---- un estudio simulado: fechas de 4 plantas y 5 visitantes ----
vm <- function(n, mediaDia, kappa) { a <- as.numeric(rvonmises(n, circular(dia_a_angulo(mediaDia)), kappa)) %% (2 * pi); pmin(365, pmax(1, round(angulo_a_dia(a)))) }
fechas <- list(
  list("Planta A", "plant", vm(220, 200, 3)), list("Planta B", "plant", vm(90, 20, 2)),          # B florece en el cambio de año
  list("Planta C", "plant", vm(25, 120, 6)), list("Planta D", "plant", c(vm(70, 90, 5), vm(60, 270, 5))),   # D tiene dos picos
  list("Visitante 1", "poll", vm(300, 215, 2.5)), list("Visitante 2", "poll", vm(60, 350, 1.5)),
  list("Visitante 3", "poll", vm(18, 130, 4)), list("Visitante 4", "poll", sample(1:365, 150, replace = TRUE)),   # 4 vuela todo el año
  list("Visitante 5", "poll", vm(12, 60, 0.8)))
reg <- do.call(rbind, lapply(fechas, function(f) {
  f3 <- as.Date(f[[3]] - 1, origin = "2025-01-01")
  data.frame(unit = f[[1]], role = f[[2]], doy = f[[3]], m = as.integer(format(f3, "%m")), d = as.integer(format(f3, "%d")))
}))
# uno de cada seis registros solo trae el mes: la app le da el día medio del mes
MEDIO <- c(16, 45.5, 75, 105.5, 136, 166.5, 197, 228, 258.5, 289, 319.5, 350)
sinDia <- sample(nrow(reg), nrow(reg) %/% 6)
reg$d[sinDia] <- NA; reg$doy[sinDia] <- MEDIO[reg$m[sinDia]]
# altitud de cada registro
medAlt <- c("Planta A" = 1500, "Planta B" = 900, "Planta C" = 2300, "Planta D" = 1200, "Visitante 1" = 1600, "Visitante 2" = 700, "Visitante 3" = 2400, "Visitante 4" = 1300, "Visitante 5" = 300)
reg$elev <- pmax(0, round(rnorm(nrow(reg), medAlt[reg$unit], 320)))
reg$elev[sample(nrow(reg), 80)] <- NA
ref$registros <- reg
unidades <- unique(reg$unit); plantas <- unique(reg$unit[reg$role == "plant"]); visit <- unique(reg$unit[reg$role == "poll"])

# ---- estadística circular por unidad ----
ref$circular <- lapply(unidades, function(u) {
  a <- circular(dia_a_angulo(reg$doy[reg$unit == u]), units = "radians")
  ry <- rayleigh.test(a); n <- length(a)
  list(unit = u, n = n, R = rho.circular(a), mediaAng = as.numeric(mean.circular(a)) %% (2 * pi),
    mediaDia = angulo_a_dia(as.numeric(mean.circular(a))), de = sd.circular(a), Z = n * rho.circular(a)^2,
    pRayleigh = ry$p.value, pRayleigh2 = r.test(as.numeric(a))$p.value,
    R2 = rho.circular(circular((2 * as.numeric(a)) %% (2 * pi))))
})
# la concentración de una von Mises a partir de R̄: la aproximación de Fisher (la de circular::A1inv)
# y la raíz exacta de I1(κ)/I0(κ) = R̄
rr <- c(0.02, 0.1, 0.3, 0.45, 0.52, 0.54, 0.7, 0.84, 0.86, 0.95, 0.99)
ref$kappa <- list(R = rr, aprox = A1inv(rr),
  exacta = sapply(rr, function(r) uniroot(function(k) besselI(k, 1, TRUE) / besselI(k, 0, TRUE) - r, c(1e-8, 1e4), tol = 1e-14)$root))

# ---- pares planta x visitante: Watson-Williams, traslape de perfiles mensuales, desfase ----
perfil <- function(u, corregido = FALSE, piso = 5) {
  cu <- tabulate(reg$m[reg$unit == u], 12)
  if (!corregido) return(cu)
  esf <- tabulate(reg$m, 12)
  ifelse(esf >= piso, cu / esf, 0)
}
capa <- function(v) raster(matrix(v, nrow = 1))
solape <- function(a, b) c(D = nicheOverlap(capa(a), capa(b), stat = "D", mask = FALSE), I = nicheOverlap(capa(a), capa(b), stat = "I", mask = FALSE),
  O = niche.overlap.pair(a, b, method = "pianka"), D2 = niche.overlap.pair(a, b, method = "schoener"))
ref$pares <- do.call(rbind, lapply(plantas, function(p) do.call(rbind, lapply(visit, function(v) {
  ap <- dia_a_angulo(reg$doy[reg$unit == p]); av <- dia_a_angulo(reg$doy[reg$unit == v])
  ww <- suppressWarnings(watson.williams.test(list(circular(ap), circular(av))))
  # circular toma κ del vector medio de la muestra reunida; Zar (2010, ec. 27.14) y la app, de la media
  # ponderada de los vectores de cada grupo (r_w). El mismo F con el factor de Zar, armado con piezas de circular:
  np <- length(ap); nv <- length(av); N <- np + nv
  sR <- np * rho.circular(circular(ap)) + nv * rho.circular(circular(av)); Rt <- N * rho.circular(circular(c(ap, av)))
  Kzar <- 1 + 3 / (8 * A1inv(sR / N)); Kcir <- 1 + 3 / (8 * A1inv(Rt / N))
  Fzar <- Kzar * (N - 2) * (sR - Rt) / (N - sR)
  s <- solape(perfil(p), perfil(v)); sc <- solape(perfil(p, TRUE), perfil(v, TRUE))
  mp <- angulo_a_dia(as.numeric(mean.circular(circular(ap)))); mv <- angulo_a_dia(as.numeric(mean.circular(circular(av))))
  dd <- abs((mp - mv) %% 365)
  data.frame(plant = p, visitor = v, F = unname(ww$statistic), pWW = ww$p.value, Fzar = Fzar, pZar = pf(Fzar, 1, N - 2, lower.tail = FALSE), Kzar = Kzar, Kcir = Kcir, gl2 = unname(ww$parameter[2]),
    D = s["D"], I = s["I"], O = s["O"], D2 = s["D2"], Dc = sc["D"], Ic = sc["I"], Oc = sc["O"], desfase = min(dd, 365 - dd), row.names = NULL)
}))))
ref$esfuerzo <- tabulate(reg$m, 12)
ref$levins <- lapply(unidades, function(u) { cu <- tabulate(reg$m[reg$unit == u], 12); list(unit = u, B = as.numeric(niche.width(cbind(cu, cu), "levins")[1])) })

# ---- altitud: clases de 100 m ----
conAlt <- reg[!is.na(reg$elev), ]
lo <- floor(min(conAlt$elev) / 100) * 100; hi <- ceiling(max(conAlt$elev) / 100) * 100 + 100
histo <- function(u) { e <- conAlt$elev[conAlt$unit == u]; tabulate(pmin((hi - lo) / 100, floor((e - lo) / 100) + 1), (hi - lo) / 100) }
ref$altUnidades <- lapply(unidades, function(u) { e <- conAlt$elev[conAlt$unit == u]; list(unit = u, n = length(e), q = unname(quantile(e, c(0, 0.25, 0.5, 0.75, 1), type = 7))) })
ref$altPares <- do.call(rbind, lapply(plantas, function(p) do.call(rbind, lapply(visit, function(v) {
  s <- solape(histo(p), histo(v)); ev <- conAlt$elev[conAlt$unit == v]; ep <- conAlt$elev[conAlt$unit == p]
  q <- quantile(ev, c(0.05, 0.95), type = 7)
  data.frame(plant = p, visitor = v, D = s["D"], I = s["I"], dentro = mean(ep >= q[1] & ep <= q[2]), row.names = NULL)
}))))
ref$altRango <- c(lo, hi)

escribir("block6", ref)
