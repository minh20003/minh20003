# Editorial Precision: design notes (profile README for Dinh Quang Minh)

Build: `cd design && npm install && make` (= `python3 prep-images.py && node build.mjs && node gen-readme.mjs`; cwd-independent). The generator writes `../README.md` and `../assets/`; never edit those by hand.
Everything it needs is in this folder: `vendor/` (logos.json, linguaflow-shot.jpg, textpath.mjs) and `node_modules/` (@fontsource/inter, @fontsource/instrument-serif, opentype.js; versions pinned by package-lock.json). `paths.mjs` resolves both and throws a clear error when `npm install` was not run.
build.mjs writes every SVG into `tmp/assets.new/`, and only after all of them were written does it `rmSync(assets)` and rename the new folder into place (an exception mid-build leaves `assets/` untouched).
Check: `make check TOOLS=/path/to/folder-with-validate.py-and-render.mjs` (validator must report 0 errors, then Chromium previews `../final-*.png`, which are git-ignored).
README `<img alt>` of the cards (hero, LinguaFlow, NEXORA, Sport, toolkit, connect) is generated from each SVG `<desc>` (build.mjs writes tmp/alts.json, gen-readme.mjs reads it), so alt and desc cannot drift. Alt text describes content, never layout.

## Identity
Warm ink canvas, ivory serif display (Instrument Serif), Inter UI, ONE vermilion accent whose full stop repeats (name, tagline, availability dot, closing headline, link strips), film grain, hairlines, numeral rail 01/02/03. Matte on purpose: no glass, no neon. The only "light" is soft radial glows behind a full stop / focal node.

## Layout rules
- Gutter: ONE value, 8 SVG units (about 6-9 css px), for side-by-side tiles/strips and for vertically stacked blocks. Every SVG has a 4-unit transparent top and bottom margin (`Svg` M = 4); two-up rows are `width="50%"` + `width="50%"` written back to back, with a 4-unit transparent inner margin baked into each half (viewBox 400 / 180 = geometry 396 / 176 + 4).
- Link strips (Live demo / Source code, App / Backend repository, GitHub) are NOT glued to the card above. They are joined by a deliberate 8-unit gap, all four corners rounded (16). Reason: a zero-gap seam between two images leaves one unpainted device-pixel row at fractional DPR (Windows 125/150/175%), visible as a pale hairline on GitHub's light theme. Verified in Chromium at DPR 1 / 1.25 / 1.5 / 1.75 / 2, widths 680 / 712 / 824 / 358, on #00ff00 and #ffffff pages: the band between card and strip is a solid run of page background (>= 6 css px at DPR 1, no stray painted rows), horizontal gutters measure the same.
- Grouping: halves of a link-strip row have 10 units of bottom margin (14 to the next card) because the strips belong to the card above; section labels have 14 units of top margin (18 above, 8 below).
- Cards: padding 40 / 24, radius 20 (tiles 16 / 14, strips 16), hairlines 1px, rail 156 (LinguaFlow) / 136 (NEXORA, Sport). Full-width images 100%, `align="top"`.
- LinguaFlow desktop: rail and content column END TOGETHER. The four stat blocks (4 / 6 / 53 / Backend) are spread over the content height with equal air between a block and the next hairline; the stack chips run full width in a footer row (label "STACK" hangs in the rail column) under both columns.
- Sport desktop: the pitch line-art is 150 x 98, at least 60 units clear of the title and the one-liner. Backend column: JWT is a bullet only (no duplicate chip).

## Hero
Descriptor "Builds backend services and explores applications of LLMs." is the line that answers "what do they do": Inter 20 (desktop) / 16 (mobile) in ivory, clear of "Quang" / "Minh". "BrSE" is spelled out: "FPT University, Japanese / Bridge SE (BrSE) track" (explicit line break, 2 lines on both widths). Availability dot rings 3 cycles then stills (hero is a big SVG: no infinite animation).

## Animation hygiene
Any animation repaints the whole SVG, so only small filter-free SVGs animate: the hero rule draw (once) and availability ring (3 cycles), and the LIVE dot on the "Live demo" strip, a slow infinite pulse (3.2s; the strip is tiny and has no filters). The base state is the finished still frame; `prefers-reduced-motion` disables every animation. All big cards are static.

## Link strips (captions)
Desktop: Live demo / TRY IT ONLINE, Source code / LINGUAFLOW-AI, App repository / SPORTFIELDBOOKINGAPP, Backend repository / HTDOCS / SPORT-BOOKING-API (the real repo names; "htdocs" is the XAMPP web root, the project is in sport-booking-api/). Mobile halves are 176 wide: "App repo / ANDROID APP", "Backend repo / PHP · HTDOCS" (the full repo name does not fit at the 11.5 minimum).

## Palette
| token | hex | use | contrast on ink |
|---|---|---|---|
| ink | #0C0C0D | canvas | |
| ink2 | #141415 | link tiles, dark strip | |
| ivory | #F4EFE6 | display type, values, hairlines (14-34% alpha), closing panel | 16.6 |
| sub | #CFC9BE | body text | 11.9 |
| mute | #A6A196 | every small caps label, rail meta, captions | 7.6 (6.7 on ink3) |
| vermilion | #FF4D2E | the one accent; ink text on it = 5.9 | 5.9 |
| vermilion deep | #C42F14 | "III." on the ivory panel only | 4.9 on ivory |
| panel text | #37332C / #5E584F | body / caps on ivory | 11 / 6.1 |
| violet ink | #2A1A4A | LinguaFlow wash only | |

## Type scale (viewBox 800 desktop / 360 mobile; link halves 400 / 180; all text outlined, glyph reuse)
Display 172 / 76 (Instrument Serif, italic "Minh"); tagline serif italic 38 / 27; project title serif 68 / 46 (Sport 50 / 32); one-liner serif italic 25 / 21; toolkit primary serif 34 / 26; hero descriptor Inter 20 / 16; body Inter 16 / 14-15 (never below 14 desktop, 13.5 mobile); values 14; chips 13; caps labels 13 desktop / 12.5 mobile (strip captions 11.5-13) with +1.0..+2.1 tracking.
Glyph grid (textuse.mjs): 140 units per em for Inter, 180 per em for the serif at <= 48 px, 400 per em for larger display type. Paths are compacted to relative commands; `wsEm` adds 0.08em word space to serif italic lines.

## Breakpoint trade-off (recorded, deliberately unchanged)
One breakpoint, `BP` = 1011px in gen-readme.mjs. GitHub keeps its profile sidebar beside the README from ~768px, so the README column is only ~340-380px at 768 and ~560px at 1011; the 800-unit art would render at 0.4-0.7 there (13px text = 5-9px). So viewport <= 1011 uses the 360-unit art (scale ~0.75 at a 320 phone, ~1.0 at 390, ~1.5 at the 548px column of a 1000px window, up to ~1.9 at 767px single-column); >= 1012 uses the 800-unit art (column >= ~560, scale >= 0.7). Cost: tablet pages are tall (~6.8k px) and the phone layout is large but crisp. A third art set does not fit the 750 KB budget. Also out of scope and unchanged: text size at a 320px phone minimum, dead space in the right half of the Connect panel.

## Robustness / budgets
- Grain: 64px tile, 10/255 alpha on dark cards (9 on the ivory panel); strips, tiles and labels carry none.
- Size: webp artwork q58 (1000px desktop / 720px mobile, ~20 / 13 KB). Largest SVG linguaflow.svg ~87 KB (budget 120); assets total ~690 KB (budget 750).
- Measured page height (CSS px, Chromium): desktop profile view (712px column) ~3.4k; repo view (888px column) ~3.9k; mobile 390px ~4.5k.
- NEXORA FPT is private: never linked, never screenshotted. Project 03 is a two-repository system, no claim of authorship, deployment, users or metrics.
