/* Bloque 1: la teoría, con el primer desplegable abierto */
(async () => { await W(1200); const acc = document.querySelectorAll('.theory-card .acc'); acc[0].open = true; await W(500); const h = q('#theory'); irA(h, 20); await W(400); return caja([h, acc[0], acc[1]], 8); })()
