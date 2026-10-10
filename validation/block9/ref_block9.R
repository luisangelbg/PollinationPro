# PollinationPro — referencia del Bloque 9 (redes planta-visitante; js/network.js y el muestreo de js/engine.js).
# Paquetes: bipartite (conectancia, H2', d', grado, fuerza, módulos), vegan (NODF, modelos nulos, rarefacción,
# Chao1) y SpadeR (Chao1 con corrección de sesgo).
# Correr desde esta carpeta:  Rscript ref_block9.R
source("../comun.R")
suppressPackageStartupMessages({ library(bipartite); library(vegan); library(SpadeR) })
set.seed(20261009)
ref <- list(paquetes = ver("bipartite", "vegan", "SpadeR"))

# ---- redes simuladas (plantas en filas, visitantes en columnas, número de visitas) ----
limpia <- function(M) { M <- M[rowSums(M) > 0, colSums(M) > 0, drop = FALSE]; dimnames(M) <- list(paste0("P", seq_len(nrow(M))), paste0("V", seq_len(ncol(M)))); M }
azar <- function(m, n, media) { a <- rlnorm(m); b <- rlnorm(n); limpia(matrix(rpois(m * n, media * outer(a / mean(a), b / mean(b))), m)) }
anidada <- function(m, n) { p <- outer(seq(1, 0.15, length.out = m), seq(1, 0.1, length.out = n)); limpia(matrix(rbinom(m * n, 1, pmin(1, p * 1.3)) * (1 + rpois(m * n, 12 * p)), m)) }
modular <- function(m, n, k) { gr <- rep(1:k, length.out = m); gc <- rep(1:k, length.out = n); p <- outer(gr, gc, function(a, b) ifelse(a == b, 9, 0.35)); limpia(matrix(rpois(m * n, p), m)) }
redes <- list(generalista = azar(6, 11, 6), chica = azar(4, 5, 4), anidada = anidada(8, 12), modular = modular(9, 12, 3),
  dispersa = azar(12, 20, 0.6), grande = azar(15, 30, 2.5), especializada = modular(6, 6, 6))

modulosDe <- function(mod, web) {
  inf <- listModuleInformation(mod)[[2]]
  fr <- integer(nrow(web)); fc <- integer(ncol(web))
  for (k in seq_along(inf)) { fr[match(inf[[k]][[1]], rownames(web))] <- k; fc[match(inf[[k]][[2]], colnames(web))] <- k }
  list(filas = I(fr), columnas = I(fc))
}
# H2fun entrega sus extremos redondeados a tres decimales: la misma función de bipartite, sin ese redondeo
H2exacta <- H2fun
body(H2exacta) <- parse(text = gsub("round\\(([A-Za-z0-9_]+),[[:space:]]*3\\)", "\\1", paste(deparse(body(H2fun)), collapse = "\n")))[[1]]
entropia <- function(M) { p <- M[M > 0] / sum(M); -sum(p * log(p)) }
nSim <- 499
ref$redes <- lapply(names(redes), function(nm) {
  W <- redes[[nm]]; B <- (W > 0) * 1
  nl <- networklevel(W, index = c("connectance", "NODF"))
  nd <- nestednodf(B)$statistic
  h <- H2exacta(W, H2_integer = TRUE)
  dp <- dfun(W); dv <- dfun(t(W))
  sp <- specieslevel(W, index = c("degree", "normalised degree", "species strength"), level = "both")
  mods <- lapply(1:5, function(i) computeModules(W))
  mejor <- mods[[which.max(sapply(mods, function(m) m@likelihood))]]
  # modelos nulos, con el generador de R
  cb <- simulate(vegan::nullmodel(B, "curveball"), nsim = nSim, burnin = 2000, thin = 50)
  nodfNulo <- apply(cb, 3, function(M) nestednodf(M)$statistic[["NODF"]])
  h2Nulo <- NULL
  while (NROW(h2Nulo) < nSim) {
    M <- r2dtable(1, rowSums(W), colSums(W))[[1]]
    if (any(rowSums(M) == 0) || any(colSums(M) == 0)) next
    h2Nulo <- rbind(h2Nulo, c(entropia(M), mean(M > 0)))
  }
  list(nombre = nm, A = unname(W), filas = rownames(W), columnas = colnames(W),
    conectancia = nl[["connectance"]], NODF = nd[["NODF"]], NODFfilas = nd[["N.rows"]], NODFcolumnas = nd[["N.columns"]], NODFbipartite = nl[["NODF"]],
    H2p = h[["H2"]], H2min = h[["H2min"]], H2max = h[["H2max"]], H2 = h[["H2uncorr"]],
    dPlantas = I(unname(dp$dprime)), dPlantasCrudo = I(unname(dp$d)), dPlantasMin = I(unname(dp$dmin)), dPlantasMax = I(unname(dp$dmax)),
    dVisit = I(unname(dv$dprime)), dVisitCrudo = I(unname(dv$d)), dVisitMin = I(unname(dv$dmin)), dVisitMax = I(unname(dv$dmax)),
    gradoPlantas = I(sp$`lower level`$degree), gradoVisit = I(sp$`higher level`$degree),
    gradoNPlantas = I(sp$`lower level`$normalised.degree), gradoNVisit = I(sp$`higher level`$normalised.degree),
    fuerzaPlantas = I(sp$`lower level`$species.strength), fuerzaVisit = I(sp$`higher level`$species.strength),
    Q = mejor@likelihood, modulos = modulosDe(mejor, W),
    nSim = nSim, nodfNuloMedia = mean(nodfNulo), nodfNuloDE = sd(nodfNulo), hNuloMedia = mean(h2Nulo[, 1]), hNuloDE = sd(h2Nulo[, 1]), cNuloMedia = mean(h2Nulo[, 2]), cNuloDE = sd(h2Nulo[, 2]))
})

# ---- ¿qué tan completa es la lista de visitantes? ----
conteos <- list(c(40, 22, 9, 5, 3, 2, 2, 1, 1, 1, 1), c(120, 3, 1), c(7, 7, 6, 5, 5, 4, 2, 2, 1), rpois(30, 1.2), c(15, 9, 4, 4, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1), c(300, 150, 80, 40, 20, 10, 5, 3, 2, 1, 1, 1))
ref$muestreo <- lapply(conteos, function(cc) {
  cc <- cc[cc > 0]; N <- sum(cc)
  ms <- unique(pmax(1, round(seq(1, N, length.out = 12))))
  sp <- tryCatch({ t <- NULL; invisible(capture.output(t <- ChaoSpecies(cc, datatype = "abundance", k = 10, conf = 0.95)$Species_table)); unname(t[grep("Chao1-bc", rownames(t)), 1]) }, error = function(e) NA)
  list(conteos = I(cc), S = length(cc), f1 = sum(cc == 1), f2 = sum(cc == 2), chao1Vegan = unname(estimateR(cc)["S.chao1"]), chao1SpadeR = sp,
    m = I(ms), rarefaccion = I(as.numeric(sapply(ms, function(m) rarefy(cc, m)))))
})

escribir("block9", ref)
