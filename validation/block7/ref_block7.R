# PollinationPro — referencia del Bloque 7 (traslape de nichos ambientales; js/niche.js).
# Paquetes: stats (prcomp, bw.nrd0), ks (densidad de núcleo exacta), dismo (D de Schoener e I de Warren)
# y ecospat (el procedimiento completo de Broennimann et al. 2012, como segunda opinión).
# Correr desde esta carpeta:  Rscript ref_block7.R
source("../comun.R")
suppressPackageStartupMessages({ library(ks); library(dismo); library(ecospat) })
set.seed(20261007)
ref <- list(paquetes = ver("ks", "dismo", "ecospat"))

# ---- un fondo ambiental simulado: 2000 celdas y 4 variables correlacionadas ----
g <- expand.grid(x = seq(0, 1, length.out = 50), y = seq(0, 1, length.out = 40))
temp <- 26 - 14 * g$y + 3 * sin(4 * g$x) + rnorm(nrow(g), 0, 0.6)
bg <- cbind(temp = temp, estac = 150 + 400 * g$x + 60 * g$y + rnorm(nrow(g), 0, 20),
  lluvia = pmax(50, 1800 - 55 * temp + 500 * g$x * g$y + rnorm(nrow(g), 0, 90)), alt = pmax(0, 2600 * g$y + 300 * cos(5 * g$x) + rnorm(nrow(g), 0, 80)))
ref$fondo <- unname(bg)
# cinco unidades: cada una prefiere una temperatura y una lluvia
pref <- list(c(22, 900, 150), c(20, 1100, 90), c(14, 1300, 60), c(24, 700, 200), c(17, 1000, 35))
idx <- lapply(pref, function(p) sample(nrow(bg), p[3], prob = exp(-((bg[, "temp"] - p[1]) / 2.2)^2 - ((bg[, "lluvia"] - p[2]) / 260)^2)))
ref$unidades <- lapply(idx, function(i) I(i - 1))                       # índices de celda, desde 0

# ---- el espacio ambiental, paso por paso como lo describe el bloque ----
R <- 100
pc <- prcomp(bg, scale. = TRUE)
S <- pc$x[, 1:2]
rx <- range(S[, 1]); ry <- range(S[, 2])
caja <- c(rx[1] - 0.05 * diff(rx), rx[2] + 0.05 * diff(rx), ry[1] - 0.05 * diff(ry), ry[2] + 0.05 * diff(ry))
ev <- as.matrix(expand.grid(x = seq(caja[1], caja[2], length.out = R), y = seq(caja[3], caja[4], length.out = R)))
nucleo <- function(P, hx, hy) kde(P, H = diag(c(hx^2, hy^2)), eval.points = ev, binned = FALSE)$estimate
hEnv <- c(bw.nrd0(S[, 1]), bw.nrd0(S[, 2]))
zEnv <- nucleo(S, hEnv[1], hEnv[2])
disp <- zEnv > 0.01 * max(zEnv)
dens <- function(i, corregida) { P <- S[i, ]; z <- nucleo(P, max(bw.nrd0(P[, 1]), 1e-6), max(bw.nrd0(P[, 2]), 1e-6)); z <- ifelse(disp, if (corregida) z / zEnv else z, 0); z / max(z) }
capa <- function(v) raster(matrix(v, nrow = R))
ref$espacio <- list(explicada = (pc$sdev^2 / sum(pc$sdev^2))[1:2], caja = caja, hEnv = hEnv, disponibles = sum(disp), envMax = max(zEnv))

# ---- ecospat: mismos puntajes, su propio suavizado (otro ancho de banda y otra forma de corregir) ----
eco <- lapply(idx, function(i) ecospat.grid.clim.dyn(glob = S, glob1 = S, sp = S[i, ], R = R, th.sp = 0, th.env = 0))
pares <- t(combn(length(idx), 2))
ref$pares <- do.call(rbind, lapply(seq_len(nrow(pares)), function(k) {
  a <- pares[k, 1]; b <- pares[k, 2]
  za <- dens(idx[[a]], FALSE); zb <- dens(idx[[b]], FALSE); zac <- dens(idx[[a]], TRUE); zbc <- dens(idx[[b]], TRUE)
  e <- ecospat.niche.overlap(eco[[a]], eco[[b]], cor = FALSE); ec <- ecospat.niche.overlap(eco[[a]], eco[[b]], cor = TRUE)
  data.frame(a = a - 1, b = b - 1,
    D = nicheOverlap(capa(za), capa(zb), "D", mask = FALSE), I = nicheOverlap(capa(za), capa(zb), "I", mask = FALSE),
    Dc = nicheOverlap(capa(zac), capa(zbc), "D", mask = FALSE), Ic = nicheOverlap(capa(zac), capa(zbc), "I", mask = FALSE),
    ecoD = e$D, ecoI = e$I, ecoDc = ec$D, ecoIc = ec$I)
}))

escribir("block7", ref)
