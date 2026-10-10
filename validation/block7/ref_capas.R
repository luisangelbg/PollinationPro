# PollinationPro — referencia de la lectura de capas (js/raster.js): GeoTIFF y rejilla ASCII.
# Paquete: terra (escribe cada archivo con GDAL y lo vuelve a leer). Los archivos van dentro de la referencia
# en base 64, para que la página los lea sin servidor.
# Correr desde esta carpeta:  Rscript ref_capas.R
source("../comun.R")
suppressPackageStartupMessages(library(terra))
set.seed(20261070)
ref <- list(paquetes = ver("terra"))
tmp <- tempfile("capas"); dir.create(tmp)

# una capa chica con relieve, huecos y bordes que no caen en grados enteros
nr <- 29; nc <- 37
r0 <- rast(nrows = nr, ncols = nc, xmin = -101.3, xmax = -101.3 + nc * 0.05, ymin = 17.15, ymax = 17.15 + nr * 0.05, crs = "EPSG:4326")
v <- 1500 + 900 * sin(row(matrix(0, nr, nc)) / 5) * cos(col(matrix(0, nr, nc)) / 7) + rnorm(nr * nc, 0, 40)
v[sample(nr * nc, 60)] <- NA
values(r0) <- as.vector(t(v))

variantes <- list(
  list("real de 32 bits, sin comprimir", "FLT4S", c("COMPRESS=NONE")),
  list("real de 32 bits, LZW", "FLT4S", c("COMPRESS=LZW")),
  list("real de 32 bits, LZW con predictor de reales", "FLT4S", c("COMPRESS=LZW", "PREDICTOR=3")),
  list("real de 32 bits, Deflate con predictor de reales, en mosaico", "FLT4S", c("COMPRESS=DEFLATE", "PREDICTOR=3", "TILED=YES", "BLOCKXSIZE=16", "BLOCKYSIZE=16")),
  list("real de 32 bits, PackBits", "FLT4S", c("COMPRESS=PACKBITS")),
  list("real de 64 bits, Deflate", "FLT8S", c("COMPRESS=DEFLATE")),
  list("entero de 16 bits con signo, LZW con predictor horizontal", "INT2S", c("COMPRESS=LZW", "PREDICTOR=2")),
  list("entero de 16 bits con signo, sin comprimir, en mosaico", "INT2S", c("COMPRESS=NONE", "TILED=YES", "BLOCKXSIZE=16", "BLOCKYSIZE=16")),
  list("entero de 32 bits con signo, Deflate con predictor horizontal", "INT4S", c("COMPRESS=DEFLATE", "PREDICTOR=2")),
  list("entero de 16 bits sin signo, LZW", "INT2U", c("COMPRESS=LZW")),
  list("entero de 8 bits, PackBits", "INT1U", c("COMPRESS=PACKBITS")))
caja <- c(-100.93, 17.52, -100.11, 18.21)                     # recorte: oeste, sur, este, norte
ref$caja <- caja
ref$tiff <- lapply(seq_along(variantes), function(k) {
  vv <- variantes[[k]]
  r <- if (vv[[2]] == "INT1U") round((r0 - 500) / 10) else if (vv[[2]] == "FLT4S" || vv[[2]] == "FLT8S") r0 else round(r0)
  f <- file.path(tmp, paste0("capa", k, ".tif"))
  writeRaster(r, f, datatype = vv[[2]], gdal = vv[[3]], overwrite = TRUE)
  b <- rast(f); rc <- crop(b, ext(caja[1], caja[3], caja[2], caja[4]), snap = "out")
  list(nombre = vv[[1]], archivo = base64_enc(readBin(f, "raw", file.size(f))), w = ncol(b), h = nrow(b), x0 = xmin(b), y0 = ymax(b), dx = xres(b), dy = yres(b),
    valores = I(as.numeric(values(b))), recorte = list(w = ncol(rc), h = nrow(rc), x0 = xmin(rc), y0 = ymax(rc), valores = I(as.numeric(values(rc)))))
})

# la misma capa como rejilla ASCII
fa <- file.path(tmp, "capa.asc")
writeRaster(r0, fa, overwrite = TRUE, NAflag = -9999)
ba <- rast(fa)
ref$asc <- list(texto = paste(readLines(fa), collapse = "\n"), w = ncol(ba), h = nrow(ba), x0 = xmin(ba), y0 = ymax(ba), dx = xres(ba), valores = I(as.numeric(values(ba))))

# el valor en un punto: la celda que lo contiene y la interpolación bilineal entre los cuatro centros vecinos
# (solo donde los cuatro existen; en los bordes y junto a un hueco cada programa tiene su propia regla)
b1 <- rast(file.path(tmp, "capa1.tif"))
pts <- cbind(runif(400, xmin(b1), xmax(b1)), runif(400, ymin(b1), ymax(b1)))
cel <- extract(b1, pts, method = "simple")[, 1]
bil <- extract(b1, pts, method = "bilinear")[, 1]
fx <- (pts[, 1] - xmin(b1)) / xres(b1) - 0.5; fy <- (ymax(b1) - pts[, 2]) / yres(b1) - 0.5
x <- floor(fx); y <- floor(fy)
dentro <- x >= 0 & y >= 0 & x + 1 < ncol(b1) & y + 1 < nrow(b1)
M <- matrix(values(b1), nrow = nrow(b1), byrow = TRUE)
completos <- dentro & sapply(seq_len(nrow(pts)), function(i) if (!dentro[i]) FALSE else all(is.finite(M[y[i] + 1:2, x[i] + 1:2])))
ref$puntos <- list(xy = pts, celda = cel, bilineal = ifelse(completos, bil, NA))

escribir("capas", ref)
