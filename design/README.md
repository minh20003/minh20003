# design/: how the profile README is generated

`../README.md` and `../assets/*.svg` are generated. Do not edit them by hand.

```sh
cd design
npm install      # fonts (@fontsource/inter, @fontsource/instrument-serif) + opentype.js
make             # prep-images.py -> build.mjs -> gen-readme.mjs   (needs node 18+, python3 with Pillow)
```

The output is deterministic: a fresh checkout rebuilds `../README.md` and `../assets/` byte for byte.

## Change a project card
1. Open `build.mjs` and find the card function: `linguaflow(W)`, `nexora(W)` or `sport(W)`. `W` is 800 (desktop) or 360 (mobile); `const D = W > 500` switches the layout.
2. Edit the text, bullets or chip list in that function (chips: `{ key: 'python', label: 'Python' }`, logos live in `vendor/logos.json`). Update the `desc` string at the top of the function with the same facts: it is also the README `alt`.
3. Link strips under the cards are the `bar-*` entries at the bottom of `build.mjs` (labels, captions, descriptions); the URLs are in `gen-readme.mjs`.
4. `make`, then look at the result in a real browser (`make check TOOLS=<folder with validate.py and render.mjs>` runs the validator and writes preview PNGs to the repo root; `*.png` is git-ignored).
5. Commit `README.md`, `assets/` and your edits to `design/` together.

Files: `build.mjs` (every SVG), `lib.mjs` (drawing primitives), `textuse.mjs` + `vendor/textpath.mjs` (outlined text), `paths.mjs` (resource locations), `gen-readme.mjs` (README), `prep-images.py` (artwork crop), `NOTES.md` (design rules, palette, type scale, trade-offs).
