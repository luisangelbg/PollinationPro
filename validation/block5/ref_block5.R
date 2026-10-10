# PollinationPro — referencia del Bloque 5 (coocurrencia espacial; js/cooc.js y la geometría de js/engine.js).
# Paquetes: cooccur (el modelo probabilístico de Veech 2013, por Griffith, Veech y Marsh), stats (phyper,
# p.adjust), vegan (Jaccard, Sørensen, Simpson), geosphere (distancias y áreas en la esfera), grDevices
# (envolvente convexa) y sf (intersección de polígonos y áreas planas).
# Correr desde esta carpeta:  Rscript ref_block5.R
source("../comun.R")
suppressPackageStartupMessages({ library(cooccur); library(vegan); library(geosphere); library(sf) })
set.seed(20261005)
RT <- 6371.0088                      # radio medio de la Tierra en km (el de la app)
ref <- list(paquetes = ver("cooccur", "vegan", "geosphere", "sf"))

# ---- un estudio simulado: 4 plantas y 5 visitantes con manchas de registros ----
unidad <- function(nombre, rol, n, centros, de) {
  k <- sample(nrow(centros), n, replace = TRUE)
  data.frame(unit = nombre, role = rol, lon = round(centros[k, 1] + rnorm(n, 0, de), 4), lat = round(centros[k, 2] + rnorm(n, 0, de), 4))
}
cen <- cbind(runif(14, -104, -96), runif(14, 17, 23))
reg <- rbind(
  unidad("Planta A", "plant", 260, cen[1:6, ], 0.45), unidad("Planta B", "plant", 120, cen[4:9, ], 0.35),
  unidad("Planta C", "plant", 45, cen[10:12, ], 0.30), unidad("Planta D", "plant", 400, cen, 0.60),
  unidad("Visitante 1", "poll", 180, cen[1:5, ], 0.40), unidad("Visitante 2", "poll", 90, cen[5:9, ], 0.40),
  unidad("Visitante 3", "poll", 30, cen[12:14, ], 0.25), unidad("Visitante 4", "poll", 350, cen, 0.70),
  unidad("Visitante 5", "poll", 60, cen[c(2, 10, 11), ], 0.20))
ref$registros <- reg
plantas <- unique(reg$unit[reg$role == "plant"]); visit <- unique(reg$unit[reg$role == "poll"])

# ---- celdas: Veech, índices de similitud y Benjamini-Hochberg, en tres tamaños de celda ----
alfa <- 0.05
ref$celdas <- lapply(c(0.25, 0.5, 1), function(tam) {
  celda <- paste(floor(reg$lon / tam), floor(reg$lat / tam), sep = "|")
  M <- unclass(table(reg$unit, celda)) > 0                    # unidades x celdas (el universo: el grupo objetivo)
  N <- as.numeric(ncol(M))
  invisible(capture.output(co <- cooccur(M * 1, type = "spp_site", thresh = FALSE, spp_names = TRUE, prob = "hyper")$results))
  bus <- function(a, b) { i <- which((co$sp1_name == a & co$sp2_name == b) | (co$sp1_name == b & co$sp2_name == a)); co[i, ] }
  dj <- as.matrix(vegdist(M * 1, "jaccard", binary = TRUE)); ds <- as.matrix(vegdist(M * 1, "bray", binary = TRUE))
  dsim <- as.matrix(betadiver(M * 1, "sim"))
  pares <- do.call(rbind, lapply(plantas, function(p) do.call(rbind, lapply(visit, function(v) {
    n1 <- as.numeric(sum(M[p, ])); n2 <- as.numeric(sum(M[v, ])); obs <- as.numeric(sum(M[p, ] & M[v, ])); r <- bus(p, v)
    lo <- max(0, n1 + n2 - N); hi <- min(n1, n2); esp <- n1 * n2 / N
    cls <- esp >= 1 && hi > lo && (dhyper(lo, n1, N - n1, n2) <= alfa || dhyper(hi, n1, N - n1, n2) <= alfa)
    data.frame(plant = p, visitor = v, n1 = n1, n2 = n2, shared = obs, exp = esp,
      pLe = phyper(obs, n1, N - n1, n2), pGe = phyper(obs - 1, n1, N - n1, n2, lower.tail = FALSE),
      ses = (obs - esp) / sqrt(n1 * n2 * (N - n1) * (N - n2) / (N^2 * (N - 1))),
      co_obs = r$obs_cooccur, co_exp = r$exp_cooccur, co_plt = r$p_lt, co_pgt = r$p_gt,
      jaccard = 1 - dj[p, v], sorensen = 1 - ds[p, v], simpson = 1 - dsim[p, v], classifiable = cls)
  }))))
  pares$pAdj <- NA
  pares$pAdj[pares$classifiable] <- p.adjust(pmin(1, 2 * pmin(pares$pLe, pares$pGe))[pares$classifiable], "BH")
  pares$verdict <- ifelse(!pares$classifiable, "unclassified", ifelse(pares$pGe < alfa, "positive", ifelse(pares$pLe < alfa, "negative", "random")))
  pares$verdictAdj <- ifelse(!pares$classifiable, "unclassified", ifelse(pares$pAdj < alfa, ifelse(pares$shared > pares$exp, "positive", "negative"), "random"))
  list(size = tam, N = N, pares = pares)
})

# ---- distancias en la esfera ----
i <- sample(nrow(reg), 60); j <- sample(nrow(reg), 60)
extra <- rbind(c(-179.5, 10, 179.5, 10), c(0, 89, 180, 89), c(-99.1, 19.4, -99.1, 19.4), c(-99.1, 19.4, -99.1001, 19.4001), c(10, -45, -170, 45))
A <- rbind(as.matrix(reg[i, c("lon", "lat")]), extra[, 1:2]); B <- rbind(as.matrix(reg[j, c("lon", "lat")]), extra[, 3:4])
ref$haversine <- list(a = unname(A), b = unname(B), km = distHaversine(A, B, r = RT * 1000) / 1000)
pp <- as.matrix(reg[reg$unit == "Planta B", c("lon", "lat")]); pv <- as.matrix(reg[reg$unit == "Visitante 2", c("lon", "lat")])
cercana <- function(P, V) apply(distm(P, V, fun = function(a, b) distHaversine(a, b, r = RT * 1000)) / 1000, 1, min)
ref$cercana <- list(plant = "Planta B", visitor = "Visitante 2", km = cercana(pp, pv))

# ---- la prueba del vecino más cercano: el mismo modelo nulo, simulado aquí con el generador de R ----
pool <- as.matrix(reg[, c("lon", "lat")])
nSim <- 999
ref$vecino <- lapply(list(c("Planta B", "Visitante 2"), c("Planta C", "Visitante 1"), c("Planta A", "Visitante 3")), function(par) {
  P <- as.matrix(reg[reg$unit == par[1], c("lon", "lat")]); V <- as.matrix(reg[reg$unit == par[2], c("lon", "lat")])
  d <- cercana(P, V); med <- median(d)
  nulos <- replicate(nSim, median(cercana(P, pool[sample(nrow(pool), nrow(V)), , drop = FALSE])))
  list(plant = par[1], visitor = par[2], nSim = nSim, mediana = med, dentro = sapply(c(5, 10, 25, 50), function(k) mean(d <= k)),
    nuloMedia = mean(nulos), nuloDE = sd(nulos), nuloMediana = median(nulos),
    pCerca = (sum(nulos <= med) + 1) / (nSim + 1), pLejos = (sum(nulos >= med) + 1) / (nSim + 1))
})

# ---- áreas de distribución: envolvente convexa, su área y la parte compartida ----
# La app traza la envolvente en el plano longitud-latitud y mide el área con la fórmula de Chamberlain y
# Duquette, que es exacta para lados rectos en la proyección cilíndrica equivalente (x = R·λ, y = R·sen φ).
# Referencia 1 (misma definición): sf::st_area del polígono llevado a esa proyección.
# Referencia 2 (otra definición): geosphere::areaPolygon en la esfera, con lados de círculo máximo.
equiv <- function(xy) cbind(RT * xy[, 1] * pi / 180, RT * sin(xy[, 2] * pi / 180))
poli <- function(xy) st_polygon(list(rbind(xy, xy[1, ])))
envol <- function(xy) { xy <- unique(xy); xy[rev(chull(xy)), , drop = FALSE] }       # contra las manecillas
ref$rangos <- lapply(list(c("Planta A", "Visitante 1"), c("Planta B", "Visitante 2"), c("Planta C", "Visitante 3"), c("Planta D", "Visitante 5"), c("Planta C", "Visitante 5")), function(par) {
  P <- as.matrix(reg[reg$unit == par[1], c("lon", "lat")]); V <- as.matrix(reg[reg$unit == par[2], c("lon", "lat")])
  hp <- envol(P); hv <- envol(V)
  it <- st_intersection(poli(hp), poli(hv))
  ci <- if (st_is_empty(it)) NULL else { m <- st_coordinates(it)[, 1:2]; m[-nrow(m), , drop = FALSE] }
  list(plant = par[1], visitor = par[2], hp = unname(hp), hv = unname(hv), nInter = if (is.null(ci)) 0 else nrow(ci),
    areaP = as.numeric(st_area(poli(equiv(hp)))), areaV = as.numeric(st_area(poli(equiv(hv)))),
    areaI = if (is.null(ci)) 0 else as.numeric(st_area(poli(equiv(ci)))),
    geoP = areaPolygon(hp, a = RT * 1000, f = 0) / 1e6, geoV = areaPolygon(hv, a = RT * 1000, f = 0) / 1e6)
})

escribir("block5", ref)
