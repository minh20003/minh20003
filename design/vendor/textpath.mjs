// Text -> SVG outline helper. Outlined text renders identically on every OS/browser
// (GitHub shows SVGs as <img>, so no web fonts / no system-font guessing).
//
//   import { T, measure } from './textpath.mjs'
//   const r = T('Dinh Quang Minh', { font: 'inter', weight: 700, size: 44, x: 40, y: 120, fill: '#fff', tracking: -1 })
//   r.svg    -> '<path d="..." fill="#fff"/>'   (drop straight into your SVG)
//   r.width  -> advance width in px (use it to lay out chips, centre text, etc.)
//
// opts: font, weight, size, x, y, fill, tracking (px between glyphs), anchor ('start'|'middle'|'end'),
//       italic (bool), attrs (extra attribute string on the <path>), opacity
// fonts: inter, space-grotesk, jetbrains-mono, sora, manrope, plus-jakarta-sans, fraunces,
//        instrument-serif (400 only), dm-serif-display (400 only)
// Check weights available with:  ls node_modules/@fontsource/<font>/files | grep latin-.*normal.woff$
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const opentype = require(path.join(here, '..', 'node_modules/opentype.js'))

const cache = new Map()
function load(file) {
  if (!cache.has(file)) {
    const buf = fs.readFileSync(file)
    cache.set(file, opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)))
  }
  return cache.get(file)
}

const SUBSETS = ['latin', 'vietnamese', 'latin-ext']
function fonts(name, weight, italic) {
  const dir = path.join(here, '..', 'node_modules/@fontsource', name, 'files')
  const style = italic ? 'italic' : 'normal'
  const out = []
  for (const s of SUBSETS) {
    const f = path.join(dir, `${name}-${s}-${weight}-${style}.woff`)
    if (fs.existsSync(f)) out.push(load(f))
  }
  if (!out.length) throw new Error(`no font files for ${name} ${weight} ${style} in ${dir}`)
  return out
}

function layout(str, o) {
  const { font = 'inter', weight = 400, size = 16, tracking = 0, italic = false } = o
  const fl = fonts(font, weight, italic)
  const glyphs = []
  let x = 0, prev = null
  for (const ch of str) {
    let f = fl.find((ff) => ff.charToGlyphIndex(ch) > 0) || fl[0]
    const g = f.charToGlyph(ch)
    const s = size / f.unitsPerEm
    if (prev && prev.f === f) x += f.getKerningValue(prev.g, g) * s
    glyphs.push({ g, f, x, s })
    x += g.advanceWidth * s + tracking
    prev = { g, f }
  }
  return { glyphs, width: x - (glyphs.length ? tracking : 0) }
}

export function measure(str, o = {}) {
  return layout(str, o).width
}

export function T(str, o = {}) {
  const { x = 0, y = 0, size = 16, fill = '#fff', anchor = 'start', attrs = '', opacity } = o
  const { glyphs, width } = layout(str, o)
  const x0 = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x
  let d = ''
  for (const { g, x: gx, s } of glyphs) {
    const p = g.getPath(x0 + gx, y, size)
    d += p.toPathData(2)
  }
  const op = opacity != null ? ` fill-opacity="${opacity}"` : ''
  return { svg: `<path d="${d}" fill="${fill}"${op} ${attrs}/>`, width, x: x0 }
}
