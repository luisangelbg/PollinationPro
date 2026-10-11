# Case study · Squashes and squash bees in Mexico

*Versión en español: [LEEME.md](LEEME.md).*

Do squash bees (*Xenoglossa*, including *Peponapis*) coincide with cultivated and wild squashes (*Cucurbita*) in
Mexico in space, time and environment? This case walks through the ten blocks of PollinationPro 1.2.3 with real,
public data. Everything shown here was produced by the app and can be redone with the steps below.

## Data

| Source | What | How much |
|---|---|---|
| GBIF (10 October 2026) | Occurrence records of 13 *Cucurbita* species and of the genera *Xenoglossa* and *Peponapis* in Mexico, with coordinates and without geospatial issues | 10,254 records (`gbif_ids.txt`) from 146 datasets (`conjuntos_gbif.csv`) |
| Biotic interactions database (10 October 2026) | Published flower-visit records for the same list | 1,061 records from 22 sources (`fuentes_interacciones.csv`) |
| WorldClim 2 | 19 bioclimatic variables and elevation, aggregated from 30 arc-seconds to 2.5 arc-minutes | 20 layers |

Records are not redistributed: `gbif_ids.txt` lists their identifiers and `conjuntos_gbif.csv` the datasets to
cite.

**Citation of the records.** GBIF.org (11 October 2026). *GBIF Occurrence Download*.
https://doi.org/10.15468/dl.nd3tcx. This is the portal download with the same filters (the 13 species, the two
bee genera, Mexico, with coordinates and without geospatial issues): 10,247 records from 152 datasets. The
difference from the 10,254 of the app (7 records) comes from the taxonomic list: the portal assigns names with
the Catalogue of Life and the app queries the GBIF backbone taxonomy.

Plants: *C. pepo*, *C. moschata*, *C. argyrosperma*, *C. ficifolia* and *C. maxima* (domesticated);
*C. foetidissima*, *C. digitata*, *C. palmata*, *C. cordata*, *C. pedatifolia*, *C. radicans*, *C. lundelliana* and
*C. okeechobeensis* (wild).

## Steps and options

1. **Block 2.** The list above; country: Mexico; download from GBIF and search published interactions.
2. **Block 3.** Default rules. Cultivated plants: *keep* for the five domesticated species (cultivation is part of
   the question here) and *remove* for the wild ones. Synonym *Peponapis* → *Xenoglossa* on.
3. **Blocks 4 to 6.** Defaults (0.25° cells, target-group universe, uncorrected profiles).
4. **Block 7.** The 20 layers; background within 200 km of the records; 100 replicates.
5. **Block 8.** Background logistic regression, maximum-TSS threshold, target-group background; visitor:
   *Xenoglossa*.
6. **Block 9.** Published interactions only, plants of the list, visitors by genus, 99 null networks.

## Results

**Cleaning.** 6,077 records remain: 5,423 of *Cucurbita* and 654 of *Xenoglossa*. Removed: 3,410 duplicates, 415
at centroids, 185 imprecise, 70 by basis of record, 52 cultivated records of wild species and 45 outside Mexico.

![Cleaned records](fig/fig1_mapa.png)

**Co-occurrence (Block 5).** On 1,237 cells of 0.25°, *Xenoglossa* co-occurs more than expected with *C. pepo*,
*C. ficifolia* and *C. radicans*, and less than expected with *C. digitata* and *C. cordata*, the desert gourds of
the north-west. With 0.5° cells (554 cells) all five domesticated species co-occur more than expected.

![Co-occurrence](fig/fig2_coocurrencia.png)

**Phenology (Block 6).** *Xenoglossa* records centre on 4 September (R̄ = 0.70). The overlap of monthly profiles
ranges from D = 0.77 (*C. pedatifolia*) to 0.40 (*C. lundelliana*); among the domesticated species *C. pepo*
overlaps most (D = 0.62, lag of 34 days).

![Phenogram](fig/fig3_fenograma.png)

**Environmental niche (Block 7).** On a background of 101,454 cells, the first two components hold 70.9 % of the
variation (46.3 % and 24.6 %). The niche of *Xenoglossa* resembles that of the domesticated squashes and barely
touches that of the desert gourds.

![Niches of C. pepo and Xenoglossa](fig/fig4_nicho.png)

**Potential distribution and mismatch (Block 8).** Models of the domesticated species and of the bee perform
modestly (cross-validated AUC 0.66 to 0.78); those of the range-restricted wild species do better (0.85 and 0.96).
The area suitable for the plant with no suitable bee grows from the domesticated species to the desert gourds.

![Mismatch for C. pepo](fig/fig5_desajuste.png)

| Species | Cells (0.25°) | Co-occurrence SES | Adjusted p | Phenological D | Lag (days) | Niche D | Suitable area without the bee |
|---|---|---|---|---|---|---|---|
| *C. pepo* | 350 | 3.00 | 0.011 | 0.62 | 34 | 0.749 | 56 % of 543,847 km² |
| *C. moschata* | 361 | 2.15 | 0.076 | 0.54 | 58 | 0.700 | — |
| *C. argyrosperma* | 427 | 1.61 | 0.19 | 0.51 | 64 | 0.623 | 56 % of 555,034 km² |
| *C. ficifolia* | 169 | 4.98 | < 0.001 | 0.47 | 83 | 0.461 | — |
| *C. maxima* | 34 | 0.50 | 0.82 | 0.52 | 56 | 0.740 | — |
| *C. foetidissima* | 309 | −1.15 | 0.37 | 0.59 | 47 | 0.294 | 89 % of 764,314 km² |
| *C. digitata* | 66 | −3.46 | < 0.001 | 0.73 | 31 | 0.131 | — |
| *C. palmata* | 60 | −2.16 | 0.069 | 0.68 | 24 | 0.169 | — |
| *C. cordata* | 73 | −3.65 | < 0.001 | 0.42 | 121 | 0.092 | 96 % of 137,433 km² |
| *C. pedatifolia* | 55 | 1.93 | 0.15 | 0.77 | 18 | 0.258 | — |
| *C. radicans* | 65 | 3.42 | 0.009 | 0.62 | 17 | 0.379 | — |
| *C. lundelliana* | 51 | −1.00 | 0.52 | 0.40 | 141 | 0.191 | — |
| *C. okeechobeensis* | 52 | 0.16 | 1.00 | 0.46 | 82 | 0.464 | — |

*Xenoglossa* occupies 181 cells. Mismatch was computed for four species; "—" means it was not run.

**Interaction network (Block 9).** Published records give a network of 7 *Cucurbita* species and 91 visitor genera
with 126 links (connectance 0.198). Neither nestedness (NODF = 29.3; p = 0.30) nor modularity (Q = 0.459; p = 0.88)
differs from networks drawn at random with the same totals. *Xenoglossa* is the genus with most records (306 of
619) and the one visiting most species (6 of 7), followed by *Apis* (5 species, 47 records). Because these are
published records and not visit counts, the app does not compute H₂′ or d′.

## Reading

Squash bees follow cultivated squashes: they coincide with them in space more than sampling explains and occupy a
similar environment. With the desert gourds of the north-west the opposite holds. That contrast may be biological
or an effect of sampling: bee collections are scarce in Baja California and Sonora, and the target-group universe
discounts effort only in part. The bee models perform modestly, so the mismatch map shows where to look, not where
the pollinator is missing.

## Limits

- Presence-only data with uneven sampling; the absence of a record is not the absence of the species.
- *Xenoglossa* is analysed as a genus; the bee species have different ranges.
- Dates are those of collection or observation and do not separate flowering from fruiting.
- GBIF and the interactions database grow: a later query returns more records than those in `gbif_ids.txt`.
