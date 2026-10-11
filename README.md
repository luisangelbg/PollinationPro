# PollinationPro

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23004694.svg)](https://doi.org/10.5281/zenodo.23004694) [![Pruebas](https://github.com/luisangelbg/PollinationPro/actions/workflows/pruebas.yml/badge.svg)](https://github.com/luisangelbg/PollinationPro/actions/workflows/pruebas.yml)

**Plants, pollinators and their overlap** · *Español: [LEEME.md](LEEME.md)*

A browser-based platform that takes a study of plants and their flower visitors
from occurrence records to a paper. It works for **any crop, crop wild relative
or native plant** and **any group of visitors** (bees, bumblebees, stingless
bees, flies, butterflies, bats, birds). The interface is in Spanish and
English, with light and dark themes. There is nothing to install and no
third-party library.

## Statement of need

Whether a plant and its pollinators coincide in space, in time and in
environment is usually answered by chaining several packages and scripts:
one to download and clean occurrence records, others for co-occurrence,
circular statistics, niche overlap, distribution models and interaction
networks. That chain is a barrier for botanists, entomologists, agronomists
and students who do not program, and it makes the path from records to
results hard to report. PollinationPro puts the whole path in one page that
opens with a double click, keeps every choice visible, and writes a report
whose methods section is drawn from what was actually run.

## Open it

- **On line:** https://luisangelbg.github.io/PollinationPro/
- **On your computer:** download the repository and double-click `index.html`.
  No server, no installation, no build step. Any current browser works.

Only two actions use the internet, and only when asked: the download of GBIF
records and the search for published interactions. Everything else runs in
the browser, and the data never leave the computer.

To open it from another device on the same network, run
`Open PollinationPro.bat` (Windows; a local server on port 9750).

## Start here

[`docs/quickstart.md`](docs/quickstart.md) walks through the ten blocks in
about ten minutes with the practice study that ships with the program, with no
internet and no files of your own.

[`casos/cucurbita_xenoglossa/`](casos/cucurbita_xenoglossa/README.md) is a
worked example with real data: squashes (*Cucurbita*) and squash bees
(*Xenoglossa*) in Mexico, from 10,254 GBIF records and 1,061 published
interaction records.

## The ten blocks

1. **Home** — theory in plain language and two labs that run the real engine
   (co-occurrence under sampling bias; phenological overlap).
2. **Data** — the study list (plants and visitors at any taxonomic rank, with
   seven example systems), GBIF records by country, published interactions,
   your own presence and visit records (.csv, .txt, .tsv, .xlsx or pasted),
   and fictional practice data.
3. **Cleaning and taxonomy** — fifteen rules (centroids under two
   definitions, swapped coordinates corrected, duplicates, imprecision, living
   collections, cultivated plants decided plant by plant), synonyms (for
   example *Peponapis* within *Xenoglossa*), the unit of analysis, and the
   sentence for the methods.
4. **Map** — a map studio that needs no internet: its own vector background,
   north arrows and scale bars, cropping, styles, export as PNG, JPEG, WebP,
   SVG, TIFF or GeoTIFF at journal size, density and coincidence grids.
5. **Co-occurrence** — the probabilistic test of Veech (2013) with a
   target-group universe, false-discovery-rate adjustment, sensitivity to
   cell size, nearest-neighbour distance against a null model, range overlap.
6. **Phenology and elevation** — circular statistics (mean date, R̄,
   Rayleigh, Watson–Williams), phenogram, circular rose, correction for
   sampling effort, elevational overlap.
7. **Environmental niche** — its own reader for GeoTIFF and ASCII grids (and
   fictional practice layers), PCA of the environment, Schoener's D, Warren's
   I, equivalency and similarity tests, variable-by-variable analysis.
8. **Potential distribution** — climatic envelope, Mahalanobis distance and
   background logistic regression; cross-validated AUC and TSS; the
   plant–visitor mismatch map, current and under a future climate.
9. **Interaction network** — connectance, NODF, H₂′, d′, strength,
   modularity, null models, the visitors of each plant and sampling
   completeness.
10. **Report** — a catalogue of figures, each editable (PNG, JPG, SVG up to
    900 dpi), an HTML report with methods written from what was computed and
    the list of GBIF datasets to cite, and a reproducible `.zip` package.

## Tests and validation

- **Unit tests.** Open `tests/index.html` with a double click: 168 tests
  against published values, exact arithmetic, hand-solved formulas,
  independent implementations and simulations under the null hypothesis.
  Every line must be green.
- **Continuous integration.** On every push and pull request, GitHub runs
  the unit tests and the validation in a headless browser
  (`.github/workflows/pruebas.yml`); the badge above shows the last result.
- **Validation against R.** `validation/` checks the engine, number by
  number, against R packages written by other people (cooccur, vegan,
  geosphere, sf, circular, dismo, spaa, ecospat, terra, glmnet, pROC,
  bipartite, SpadeR): **34,299 comparisons, none in disagreement**. Open
  `validation/index.html` to see the report; `validation/correr.ps1` rebuilds
  the references with R. `validation/LEEME.md` (in Spanish) explains every
  comparison, the errors the validation caught and the differences that are
  not errors.
- **A published analysis, redone.**
  `validation/reproducibilidad/Sechium_Xenoglossa.md` documents how the
  analysis of an article that used the program was rerun from its GBIF
  download.

## Documentation

| Document | Language | What it is |
|---|---|---|
| [`docs/quickstart.md`](docs/quickstart.md) | English | Ten-minute tour with the practice study |
| [`casos/cucurbita_xenoglossa/README.md`](casos/cucurbita_xenoglossa/README.md) | English and Spanish | Worked example with real data |
| `manual/PollinationPro User's Manual.pdf` | Spanish | User manual, 111 pages: one chapter per block, decision rules, glossary |
| Help cards inside the app (the **?** next to each result) | English and Spanish | What each number means and how to read it |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | English | How to report a problem and how to test a change |
| [`CHANGELOG.md`](CHANGELOG.md) | Spanish | What changed in each version |
| [`docs/ai-usage.md`](docs/ai-usage.md) | English and Spanish | How generative AI was used in the development and how the results were verified |

## Data and third-party material

The program ships no third-party data. GBIF records and published
interactions are fetched when the user asks; climate layers are chosen by the
user from their source. The practice records and the practice layers of
Block 7 are fictional and generated by the program itself.

The only third-party material is the outline of countries and Mexican states
(Natural Earth, public domain). Code, figures, icons and practice data are the
author's own work. `PROCEDENCIA.md` (in Spanish) states,
item by item, what is original work.

## How to cite

Barrera-Guzmán, L.Á. (2026). PollinationPro: a browser-based platform for
analysing plants, pollinators and their overlap with occurrence data
(Version 1.2.5) [Computer software]. Zenodo.
https://doi.org/10.5281/zenodo.23004694

The DOI above always resolves to the latest version; each version has its own
DOI on the Zenodo page. Cite the version you used.

## Contributing and support

Problems and proposals go to
https://github.com/luisangelbg/PollinationPro/issues (the **Report a problem**
button of the app opens one with the block and the browser already filled in). See
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licence

GNU General Public License, version 3 or later (`LICENSE`).
