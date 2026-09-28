/* Bloque 2: una tabla de presencia pegada y la asignación de sus columnas */
(async () => { await carga(); goStep(2); await W(400); q('#b2OwnTabs [data-kind="presence"]').click();
  const d = q('#b2Paste').closest('details'); d.open = true;
  q('#b2Paste').value = 'especie\tlatitud\tlongitud\tfecha\taltitud\tlocalidad\tcondicion\nSechium edule\t19.1452\t-96.9701\t2024-09-12\t1340\tHuatusco, Ver.\tsilvestre\nSechium edule\t19.1611\t-96.9582\t2024-09-14\t1310\tHuatusco, Ver.\tcultivado\nXenoglossa gabbii\t19.1455\t-96.9712\t2024-09-12\t1345\tHuatusco, Ver.\t\nBombus ephippiatus\t19.1449\t-96.9690\t2024-09-12\t1338\tHuatusco, Ver.\t';
  q('#b2PasteRead').click(); await W(900); const c = tarjeta(2, 3); irA(q('#b2Map'), 20); await W(300); return caja([q('#b2Map')], 8); })()
