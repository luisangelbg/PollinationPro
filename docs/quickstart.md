# Quick start · ten minutes with the practice study

This tour runs the ten blocks of PollinationPro with the practice study that
ships with the program. It needs no internet and no files of your own. The
practice data are fictional: they exist to show what each block does, not to
say anything about real plants or bees.

Names in **bold** are the labels you will see on screen with the interface in
English (the **EN** button in the top bar).

## 0 · Open the program

On line at https://luisangelbg.github.io/PollinationPro/, or download the
repository and double-click `index.html`. The row of numbered buttons at the
top is the path of the study: blocks unlock as the previous ones have what
they need.

## 1 · Home

Block 1 explains the questions the program answers and has two labs that run
the real engine on a virtual landscape. Skip it for now, or try the first lab
to see how uneven sampling can fake a co-occurrence.

## 2 · Data

Go to **2 Data**. In card **1 · The study list**, open **No internet, or just
practising?** and click **Cucurbits and squash bees**.

The program loads a study list (plants and visitors), 2,248 fictional
presence records with seven kinds of error planted on purpose, and 354 rows
of flower visits. Card **5 · What there is** counts them.

With your own study you would type the names instead, click **Resolve the
names in GBIF**, then **Download the records** and, if you want them,
**Search published interactions**.

## 3 · Cleaning and taxonomy

Go to **3 Cleaning and taxonomy** and click **Clean and apply**.

Each rule shows how many records it removed or flagged; 1,856 records remain.
Card **4 · The report** gives a sentence ready for the methods section. Every
rule can be set to remove, to flag only or to be skipped, and cultivated
plants are decided plant by plant.

## 4 · Map

**4 Map** draws the cleaned records. The **Map studio** changes the
background, the symbols, the north arrow and the scale bar, crops the map and
exports it at journal size. Nothing here needs the internet.

## 5 · Co-occurrence

**5 Co-occurrence** tests every plant × visitor pair: do they share more grid
cells than chance would give them? Card **1 · Every pair** is a matrix of
standardised effect sizes; click a cell to see that pair.

For chayote (*Sechium edule*) and *Xenoglossa* the two share 51 cells against
46.0 expected: no more than chance. The same card shows how the answer
changes with the size of the cell, and card **3 · Distance to the nearest
visitor** asks the question without a grid.

## 6 · Phenology and elevation

**6 Phenology and elevation** treats dates as angles, so that December and
January are neighbours. Card **1 · The calendar of every unit** is the
phenogram; card **2 · Plant and visitor** gives the overlap of the two
monthly profiles and the lag between their mean dates (for chayote and
*Xenoglossa*, D = 0.79 and 26 days).

## 7 · Environmental niche

Go to **7 Environmental niche**. In card **1 · Your environmental layers**,
open **No layers, or just practising?** and click **Load the practice
layers**, then **Compute the environmental space**.

The program draws the niches of the chosen plant and visitor on the plane of
the first two principal components of the environment, and reports Schoener's
D, Warren's I and the equivalency and similarity tests. With your own study
you would load GeoTIFF or ASCII grid layers from your disk.

## 8 · Potential distribution

In **8 Potential distribution**, click **Fit and map**.

A few numbers and a map answer the question of the block: how much of the
area suitable for the plant is also suitable for at least one of its
visitors, and where it is not. **Use the practice future (fictional)**
projects the same models onto a warmer, drier climate.

## 9 · Interaction network

**9 Interaction network** builds the plant × visitor matrix from the visit
counts and reports connectance, nestedness (NODF), specialisation (H₂′) and
modularity. Click **Compare against null models** to see whether each index
differs from networks drawn at random with the same totals. Card
**3 · Species** gives degree, strength and d′ for every plant and visitor.

## 10 · Report

**10 Report** gathers everything:

- **2 · Catalogue of figures** lists every figure of the study; each one can
  be edited and exported as PNG, JPG or SVG.
- **3 · Report** writes an HTML report whose methods describe what was
  actually run, with the references it cites; **⤓ Download report .html**
  saves it.
- **4 · Reproducible package** builds a `.zip` with the project, the cleaned
  records, the tables, the figures and the calculation record.

## What next

- The **?** next to every result opens a help card: what the number is, how
  to read it, and the publication it comes from.
- [`casos/cucurbita_xenoglossa/`](../casos/cucurbita_xenoglossa/README.md)
  repeats this tour with real GBIF records and real climate layers.
- To check that the engine computes correctly in your browser, open
  `tests/index.html` (168 tests) and `validation/index.html` (34,299
  comparisons against R).
