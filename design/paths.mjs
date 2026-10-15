// Resource locations. Everything the generator needs lives inside this repo:
//   ./vendor        logos.json, linguaflow-shot.jpg (artwork source), textpath.mjs
//   ./node_modules  fonts (@fontsource/inter, @fontsource/instrument-serif) and opentype.js  (npm install)
// ROOT is the repo root (the parent of design/): README.md and assets/ are written there.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
export const HERE = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(HERE, '..')
export const SH = path.join(HERE, 'vendor')
export const NM = path.join(HERE, 'node_modules')
if (!fs.existsSync(path.join(NM, 'opentype.js'))) throw new Error('node_modules is missing: run `npm install` in design/ first')
export const { measure } = await import(path.join(SH, 'textpath.mjs'))
