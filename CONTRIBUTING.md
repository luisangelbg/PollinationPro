# Contributing to PollinationPro

Thank you for helping. Reports and proposals are welcome in English or in
Spanish. · Se reciben reportes y propuestas en español o en inglés.

## Report a problem

Open an issue at https://github.com/luisangelbg/PollinationPro/issues. The
**Report a problem** button in the top bar of the app opens one with the
block and the browser already filled in. Please add the version (it is at the
foot of the page).

A report is easiest to act on when it says:

- what you did (the block, the buttons, the options that differ from the
  defaults);
- what you expected and what you got instead (a screenshot helps);
- the data that show it, when they can be shared. The practice study
  (**No internet, or just practising?** in Block 2) is the best way to show a
  problem without sharing your own records.

If a result disagrees with another program, say which program and version,
and attach the smallest input that shows the difference. Disagreements of
that kind are how the validation of this program was built.

## Ask for a feature

Open an issue and describe the question you want to answer with your data,
not only the method. The program is organised around questions (do they
coincide in space, in time, in environment?), and a new method needs a place
among them.

## Change the code

The program is plain HTML, CSS and JavaScript. There is no build step and no
package to install: edit a file and reload the page.

**Where things are**

| Path | What |
|---|---|
| `index.html` | The page: the ten panels and the order in which scripts load |
| `js/engine.js` | The numerical engine shared by every block |
| `js/cooc.js`, `pheno.js`, `niche.js`, `sdm.js`, `network.js` | The engine of Blocks 5 to 9, with no interface code |
| `js/blockN.js` | The interface of each block |
| `js/clean.js`, `gbif.js`, `raster.js` | Cleaning rules, web queries, layer reader |
| `js/helpdata.js` | The help cards |
| `tests/` | Unit tests (`tests/index.html`) |
| `validation/` | Comparisons against R |

**Rules that keep the program what it is**

1. **It must open with a double click.** Everything works from `file://`: no
   modules, no fetching of local files, no server.
2. **No third-party code or data.** No library, no font, no dataset from
   somewhere else. What the program needs, it implements, citing the
   publication of the method in the code. `PROCEDENCIA.md` lists the few
   exceptions; a change that adds one must be discussed first.
3. **Two languages.** Every string the user sees is written in Spanish and in
   English (`L2('…', '…')` for HTML, `T('…', '…')` for plain text,
   `data-l="es"` / `data-l="en"` in `index.html`).
4. **Every number can be traced.** A new method goes in an engine file as a
   pure function, names the publication it follows, and comes with a test.

**Before sending a change**

1. Open `tests/index.html`: every line must be green.
2. If you touched an engine file, open `validation/index.html`: it must still
   read "0 en desacuerdo" (none in disagreement). To rebuild the references
   you need R with the packages listed in `validation/correr.ps1`.
3. Walk through the practice study in both languages and in both themes.
4. Add a line to `CHANGELOG.md`.

Then open a pull request against `main` that says what changed and why. Small,
single-purpose changes are reviewed faster.

## Licence of contributions

The program is distributed under the GNU General Public License, version 3 or
later. By contributing you agree that your contribution is distributed under
the same licence.

## Conduct

Be respectful and assume good faith. Discussion is about the work, not about
the people.
