# PollinationPro — referencia del Bloque 8 (distribuciones potenciales; js/sdm.js).
# Paquetes: dismo (envolvente climática, distancia de Mahalanobis, evaluación), stats (mahalanobis, pchisq,
# optim), glmnet (regresión logística con penalización de cresta), pROC (AUC y umbral de máxima TSS) y terra
# (área de las celdas).
# Correr desde esta carpeta:  Rscript ref_block8.R
source("../comun.R")
suppressPackageStartupMessages({ library(dismo); library(glmnet); library(pROC); library(terra); library(geosphere) })
set.seed(20261008)
ref <- list(paquetes = ver("dismo", "glmnet", "pROC", "terra", "geosphere"))

# ---- un fondo simulado y dos unidades con sus presencias ----
n <- 1500
g <- data.frame(x = runif(n), y = runif(n))
temp <- 26 - 14 * g$y + 3 * sin(4 * g$x) + rnorm(n, 0, 0.6)
fondo <- cbind(temp = temp, estac = 150 + 400 * g$x + 60 * g$y + rnorm(n, 0, 20),
  lluvia = pmax(50, 1800 - 55 * temp + 500 * g$x * g$y + rnorm(n, 0, 90)), alt = pmax(0, 2600 * g$y + 300 * cos(5 * g$x) + rnorm(n, 0, 80)))
casos <- list(list(nombre = "unidad con 120 presencias", pref = c(21, 950), np = 120), list(nombre = "unidad con 35 presencias", pref = c(15, 1300), np = 35))
lambda <- 1

ref$casos <- lapply(casos, function(cs) {
  ip <- sample(n, cs$np, prob = exp(-((fondo[, "temp"] - cs$pref[1]) / 2.2)^2 - ((fondo[, "lluvia"] - cs$pref[2]) / 260)^2))
  pres <- fondo[ip, ]; bg <- fondo[-ip, ]; prueba <- fondo[sample(n, 300), ]
  k <- ncol(pres)
  # envolvente climática (dismo::bioclim)
  env <- predict(bioclim(pres), prueba)
  # Mahalanobis: la distancia al centroide con stats y la cola superior de ji cuadrada
  d2 <- mahalanobis(prueba, colMeans(pres), cov(pres))

  # logística con términos lineales y cuadráticos de las variables estandarizadas, el fondo pesado para sumar
  # lo que las presencias y penalización de cresta λ en todo menos la ordenada
  todo <- rbind(pres, bg); mu <- colMeans(todo); de <- apply(todo, 2, sd)
  rasgos <- function(X) { Z <- sweep(sweep(X, 2, mu), 2, de, "/"); cbind(Z, Z^2) }
  X <- rasgos(todo); y <- c(rep(1, nrow(pres)), rep(0, nrow(bg))); w <- c(rep(1, nrow(pres)), rep(nrow(pres) / nrow(bg), nrow(bg)))
  lg <- lambda / sum(w)
  gm <- glmnet(X, y, family = "binomial", weights = w, alpha = 0, lambda = lg * c(1000, 100, 10, 3, 1), standardize = FALSE, thresh = 1e-15, maxit = 1e7)
  bGlmnet <- as.numeric(coef(gm, s = lg))
  costo <- function(b) { eta <- b[1] + X %*% b[-1]; -sum(w * (y * eta - log1p(exp(eta)))) + lambda / 2 * sum(b[-1]^2) }
  bOptim <- optim(bGlmnet, costo, method = "BFGS", control = list(reltol = 1e-15, maxit = 5000))$par
  logi <- as.numeric(plogis(cbind(1, rasgos(prueba)) %*% bOptim))
  # evaluación: AUC y TSS de las presencias contra el fondo, con la envolvente como puntaje
  sp <- predict(bioclim(pres), pres); sb <- predict(bioclim(pres), bg)
  sl <- as.numeric(plogis(cbind(1, rasgos(pres)) %*% bOptim)); slb <- as.numeric(plogis(cbind(1, rasgos(bg)) %*% bOptim))
  evalua <- function(p, a) {
    rc <- roc(response = c(rep(1, length(p)), rep(0, length(a))), predictor = c(p, a), levels = c(0, 1), direction = "<", quiet = TRUE)
    t10 <- unname(quantile(p, 0.1, type = 7))
    e <- evaluate(p = p, a = a, tr = t10)
    mejor <- coords(rc, "best", best.method = "youden", ret = c("sensitivity", "specificity"), transpose = FALSE)
    list(p = p, a = a, aucPROC = as.numeric(auc(rc)), aucDismo = evaluate(p = p, a = a)@auc, t10 = t10,
      sens = unname(e@TPR), espec = unname(e@TNR), tssMax = max(mejor$sensitivity + mejor$specificity - 1))
  }
  list(nombre = cs$nombre, pres = unname(pres), fondo = unname(bg), prueba = unname(prueba), lambda = lambda,
    envolvente = env, d2 = unname(d2), mahal = unname(pchisq(d2, k, lower.tail = FALSE)),
    betaGlmnet = bGlmnet, betaOptim = bOptim, logistica = logi, evalEnvolvente = evalua(sp, sb), evalLogistica = evalua(sl, slb))
})

# ---- área de las celdas de una rejilla en grados: terra sobre una esfera del radio de la app y sobre WGS84 ----

RT <- 6371008.8
lat1 <- 29 - (0:59) * 0.25; lat2 <- lat1 - 0.25
# en la esfera: la fórmula exacta de la zona entre dos paralelos y geosphere (cuyos lados son círculos máximos,
# no paralelos: por eso coincide solo hasta la sexta cifra)
zona <- RT^2 * (0.25 * pi / 180) * (sin(lat1 * pi / 180) - sin(lat2 * pi / 180)) / 1e6
geo <- sapply(seq_along(lat1), function(i) areaPolygon(rbind(c(0, lat2[i]), c(0.25, lat2[i]), c(0.25, lat1[i]), c(0, lat1[i])), a = RT, f = 0) / 1e6)
rw <- rast(nrows = 60, ncols = 1, xmin = -100, xmax = -99.75, ymin = 14, ymax = 29, crs = "EPSG:4326")
ref$celdas <- list(y0 = 29, dx = 0.25, dy = 0.25, zona = zona, geosphere = geo, wgs84 = as.numeric(values(cellSize(rw, unit = "km"))))

escribir("block8", ref)
