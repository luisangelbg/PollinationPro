# PollinationPro — validación contra R. Ayudas que comparten los guiones de referencia.
# Cada guion genera sus datos con semilla fija, calcula la referencia con paquetes escritos por otras
# personas y lo deja todo (datos y resultados) en un archivo ref_<nombre>.js que la página
# validation/index.html lee con doble clic, sin servidor.
suppressPackageStartupMessages(library(jsonlite))
escribir <- function(nombre, lista) {
  lista$R <- R.version.string
  txt <- toJSON(lista, digits = I(17), auto_unbox = TRUE, na = "null", null = "null")
  con <- file(paste0("ref_", nombre, ".js"), open = "wb")
  writeLines(sprintf("/* generado por ref_%s.R; no se edita a mano */", nombre), con, useBytes = TRUE)
  writeLines(sprintf("(window.REF = window.REF || {})[\"%s\"] = %s;", nombre, txt), con, useBytes = TRUE)
  close(con)
  cat(sprintf("ref_%s.js  (%.0f KB)\n", nombre, file.size(paste0("ref_", nombre, ".js")) / 1024))
}
ver <- function(...) sapply(c(...), function(p) as.character(packageVersion(p)))
