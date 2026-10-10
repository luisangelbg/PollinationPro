# PollinationPro — referencia del motor numérico (js/engine.js y las estadísticas pequeñas de js/core.js).
# Paquetes: stats (distribuciones, cuantiles, p.adjust, bw.nrd0, prcomp) y ks (densidades de núcleo exactas).
# Correr desde esta carpeta:  Rscript ref_numerico.R
source("../comun.R")
suppressPackageStartupMessages(library(ks))
set.seed(20261010)
ref <- list(paquetes = ver("ks"))

# ---- funciones especiales ----
x <- c(0.01, 0.25, 0.5, 0.75, 1, 1.5, 2, 3.7, 10, 25.5, 50, 170, 1000, 1e5)
ref$lgamma <- list(x = x, y = lgamma(x))
nk <- expand.grid(n = c(1, 5, 20, 77, 300, 2000, 50000), k = c(0, 1, 2, 3, 10, 150, 1000))
nk <- nk[nk$k <= nk$n, ]
ref$lchoose <- list(n = nk$n, k = nk$k, y = lchoose(nk$n, nk$k))
x <- seq(-6, 6, by = 0.25)
ref$pnorm <- list(x = x, y = pnorm(x))
p <- c(1e-10, 1e-6, 1e-4, 0.001, 0.01, 0.02425, 0.05, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 0.95, 0.975, 0.99, 0.999, 1 - 1e-6)
ref$qnorm <- list(p = p, y = qnorm(p))
g <- expand.grid(a = c(0.5, 1, 1.5, 2.5, 5, 20, 100), m = c(0.05, 0.3, 0.7, 1, 1.4, 2, 3.5))
g$x <- g$a * g$m
ref$gammaP <- list(a = g$a, x = g$x, y = pgamma(g$x, g$a))
g <- expand.grid(df = c(1, 2, 3, 4, 5, 8, 12, 30), x = c(0.01, 0.5, 1, 2.5, 5, 9.49, 15, 30, 60))
ref$pchisqUpper <- list(x = g$x, df = g$df, y = pchisq(g$x, g$df, lower.tail = FALSE))
g <- expand.grid(x = c(0.001, 0.05, 0.2, 0.5, 0.8, 0.95, 0.999), a = c(0.5, 1, 2, 7.5, 40), b = c(0.5, 1, 3, 12, 150))
ref$betaI <- list(x = g$x, a = g$a, b = g$b, y = pbeta(g$x, g$a, g$b))
g <- expand.grid(f = c(0.1, 0.8, 1, 2.2, 4, 9, 30), d1 = c(1, 2, 3, 6), d2 = c(4, 10, 37, 200, 1500))
ref$pfUpper <- list(f = g$f, d1 = g$d1, d2 = g$d2, y = pf(g$f, g$d1, g$d2, lower.tail = FALSE))

# ---- hipergeométrica: P(j) con N sitios, N1 de la especie 1 y N2 de la especie 2 ----
h <- NULL
for (N in c(10, 40, 137, 600, 5000)) for (f1 in c(0.1, 0.35, 0.8)) for (f2 in c(0.05, 0.5)) {
  N1 <- max(1, round(N * f1)); N2 <- max(1, round(N * f2))
  lo <- max(0, N1 + N2 - N); hi <- min(N1, N2)
  for (j in unique(round(seq(lo, hi, length.out = 5)))) h <- rbind(h, c(j, N, N1, N2))
}
ref$hyper <- list(j = h[, 1], N = h[, 2], N1 = h[, 3], N2 = h[, 4],
  pmf = dhyper(h[, 1], h[, 3], h[, 2] - h[, 3], h[, 4]),
  pLe = phyper(h[, 1], h[, 3], h[, 2] - h[, 3], h[, 4]),
  pGe = phyper(h[, 1] - 1, h[, 3], h[, 2] - h[, 3], h[, 4], lower.tail = FALSE))

# ---- estadísticas pequeñas ----
muestras <- list(rnorm(7), rexp(40), round(rnorm(101, 50, 12)), runif(250), c(rnorm(30), 8, 9.5), rep(c(1, 2, 2, 5), 6))
ref$muestras <- lapply(muestras, function(v) list(x = v, media = mean(v), de = sd(v), mediana = median(v),
  q = unname(quantile(v, c(0.05, 0.1, 0.25, 0.75, 0.95), type = 7)), silverman = bw.nrd0(v)))
ps <- list(runif(12), c(runif(30)^3, runif(10)), c(0.01, 0.01, 0.04, 0.04, 0.5), 0.03, c(1e-8, 0.2, 0.2, 0.9, 1))
ref$bh <- lapply(ps, function(p) list(p = I(p), adj = I(p.adjust(p, "BH"))))

# ---- densidades de núcleo gaussiano, sin agrupar (ks::kde con binned = FALSE) ----
# la app corta el núcleo a 5 anchos de banda en una dimensión y a 4 en dos
k1 <- lapply(list(rnorm(60, 1200, 300), c(rnorm(80, 10, 2), rnorm(40, 22, 3)), rexp(25) * 100), function(v) {
  h <- bw.nrd0(v); lo <- min(v) - 2 * h; hi <- max(v) + 2 * h
  ev <- seq(lo, hi, length.out = 128)
  list(x = v, lo = lo, hi = hi, n = 128, h = h, z = kde(v, h = h, eval.points = ev, binned = FALSE)$estimate)
})
ref$kde1d <- k1
k2 <- lapply(list(c(120, 1), c(400, 2), c(35, 3)), function(par) {
  n <- par[1]
  pts <- if (par[2] == 1) cbind(rnorm(n), rnorm(n, 0, 0.6)) else if (par[2] == 2) cbind(c(rnorm(n / 2, -2), rnorm(n / 2, 2, 0.5)), c(rnorm(n / 2, 1), rnorm(n / 2, -1, 1.5))) else cbind(runif(n, 0, 5), rexp(n))
  hx <- bw.nrd0(pts[, 1]); hy <- bw.nrd0(pts[, 2])
  caja <- c(min(pts[, 1]) - hx, max(pts[, 1]) + hx, min(pts[, 2]) - hy, max(pts[, 2]) + hy)
  R <- 40
  gx <- seq(caja[1], caja[2], length.out = R); gy <- seq(caja[3], caja[4], length.out = R)
  ev <- as.matrix(expand.grid(x = gx, y = gy))             # x corre primero: fila = y, como en la app
  z <- kde(pts, H = diag(c(hx^2, hy^2)), eval.points = ev, binned = FALSE)$estimate
  list(pts = pts, caja = caja, R = R, hx = hx, hy = hy, z = z)
})
ref$kde2d <- k2

# ---- componentes principales de la matriz de correlación (prcomp con scale. = TRUE) ----
pc <- lapply(list(c(200, 4), c(60, 6), c(1500, 3)), function(par) {
  n <- par[1]; p <- par[2]
  A <- matrix(rnorm(p * p), p); X <- matrix(rnorm(n * p), n) %*% A + matrix(rep(runif(p, -5, 50), each = n), n)
  X[, 1] <- X[, 1] * 100                                    # escalas muy distintas
  m <- prcomp(X, scale. = TRUE)
  otros <- matrix(rnorm(5 * p), 5) %*% A
  list(X = X, valores = m$sdev^2, vectores = t(m$rotation), puntajes = m$x, otros = otros, puntajesOtros = predict(m, otros))
})
ref$pca <- pc

escribir("numerico", ref)
