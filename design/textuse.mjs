// Glyph-reuse outlined text: every distinct glyph (font+weight+char) is emitted ONCE as <path id> in <defs>,
// each string is a <g transform="translate scale"> of tiny <use x=".."/> (~28 bytes/glyph instead of ~500).
// Glyph coordinates are integers on a per-font grid: 140 units per em for Inter (only used at <= ~17 px), 180 per em for the serif at sizes <= 48 px and 400 per em for
// larger display type (see EMS / EMSMALL / EMD below). Worst-case rounding is 0.5 grid unit = 0.36% of the font size (< 0.15 px at 40 px serif body, < 0.5 px at 172 px display).
//
//   import { TextUse } from './textuse.mjs'
//   const tx = new TextUse()
//   const a = tx.text('Đinh Quang Minh', { font:'inter', weight:700, size:44, x:40, y:120, fill:'#fff', tracking:-1 })
//   a.svg    -> '<g ...><use .../>...</g>'     a.width -> advance width in px
//   tx.defs()-> '<path id="g0" d="..."/>...'  (put inside <defs>, call AFTER all text() calls)
//
// opts: font, weight, size, x, y, fill (any paint; NOT objectBoundingBox gradients -> see gradient note in recipes.md),
//       tracking, wsEm (extra word space, em), anchor 'start'|'middle'|'end', opacity, attrs (extra attrs on the <g>)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { SH, NM } from './paths.mjs'
const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const opentype = require(path.join(NM, 'opentype.js'))
const fontCache = new Map()
function load(file) {
  if (!fontCache.has(file)) { const b = fs.readFileSync(file); fontCache.set(file, opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))) }
  return fontCache.get(file)
}
function fontList(name, weight, italic) {
  const dir = path.join(NM, '@fontsource', name, 'files'); const out = []
  for (const s of ['latin', 'vietnamese', 'latin-ext']) {
    const f = path.join(dir, `${name}-${s}-${weight}-${italic ? 'italic' : 'normal'}.woff`)
    if (fs.existsSync(f)) out.push(load(f))
  }
  if (!out.length) throw new Error(`no font ${name} ${weight}`)
  return out
}
const EMS = { inter: 140 }, EMD = 400, EMSMALL = 180 // glyph grid, units per em: Inter 140 (used at <= 20 px), serif 180 up to 48 px, serif 400 above (display type keeps the finer grid)
const emOf = (f, size) => EMS[f] || (size <= 48 ? EMSMALL : EMD) // big display type keeps a finer grid
export class TextUse {
  constructor() { this.glyphs = new Map(); this.n = 0 }
  _gid(key, f, g, EM) {
    if (!this.glyphs.has(key)) {
      const d = g.getPath(0, 0, EM).toPathData(0)
      this.glyphs.set(key, { id: 'g' + this.n++, d })
    }
    return this.glyphs.get(key).id
  }
  text(str, o = {}) {
    const { font = 'inter', weight = 400, size = 16, tracking = 0, wsEm = 0, italic = false, x = 0, y = 0, fill = '#fff', anchor = 'start', opacity, attrs = '' } = o
    const fl = fontList(font, weight, italic)
    const EM = emOf(font, size), k = size / EM
    let adv = 0, prev = null; const items = []
    for (const ch of str) {
      const f = fl.find((ff) => ff.charToGlyphIndex(ch) > 0) || fl[0]
      const g = f.charToGlyph(ch); const sc = EM / f.unitsPerEm
      if (prev && prev.f === f) adv += f.getKerningValue(prev.g, g) * sc
      if (ch !== ' ' && g.path && g.path.commands.length) items.push([this._gid(`${font}|${weight}|${italic}|${ch}|${EM}`, f, g, EM), Math.round(adv)])
      adv += g.advanceWidth * sc + tracking / k + (ch === ' ' ? wsEm * EM : 0) // wsEm: extra word space in em
      prev = { f, g }
    }
    const width = (adv - (str.length ? tracking / k : 0)) * k
    const x0 = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x
    const op = opacity != null ? ` fill-opacity="${opacity}"` : ''
    const uses = items.map(([id, ax]) => `<use href="#${id}"${ax ? ` x="${ax}"` : ''}/>`).join('')
    const sc = +k.toFixed(6)
    return { svg: `<g transform="translate(${+x0.toFixed(2)} ${y}) scale(${sc})" fill="${fill}"${op} ${attrs}>${uses}</g>`, width, x: x0 }
  }
  defs() { return [...this.glyphs.values()].map((g) => `<path id="${g.id}" d="${g.d}"/>`).join('') }
}
