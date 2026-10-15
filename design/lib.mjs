// Shared drawing primitives for Concept C (Editorial Precision).
import fs from 'node:fs'
import zlib from 'node:zlib'
import { TextUse } from './textuse.mjs'
import { SH } from './paths.mjs'
import { measure as measureRaw } from './paths.mjs'

export { SH }
// measure() with the same extra word space (wsEm, in em) that TextUse applies, so layout and drawing agree
export const measure = (str, o = {}) => measureRaw(str, o) + (o.wsEm || 0) * (o.size || 16) * (str.split(' ').length - 1)
export const LOGOS = JSON.parse(fs.readFileSync(SH + '/logos.json', 'utf8'))

// ---------- tokens ----------
export const C = {
  ink: '#0C0C0D', ink2: '#141415', ink3: '#1B1B1D',
  ivory: '#F4EFE6', sub: '#CFC9BE', mute: '#A6A196',
  verm: '#FF4D2E', vermDeep: '#C42F14',
  violet: '#2A1A4A', mute2: '#5E584F',
}
export const SERIF = { font: 'instrument-serif', weight: 400 }
export const SERIFI = { font: 'instrument-serif', weight: 400, italic: true, wsEm: 0.08 } // +0.08em word space: italic display lines never collapse into 'practicalAI'
export const SANS = () => ({ font: 'inter', weight: 500 })
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const unesc = (s) => String(s).replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&') // exact inverse of esc()
// smallest caps / marker size: desktop 13, mobile 12.5 (the 360 art is shown at 0.75..2x, so 12.5 stays >= ~9 css px even at a 320 px phone)
export const CAPS_D = 13, CAPS_M = 12.5
export const f1 = (n) => +(+n).toFixed(2)

// ---------- colour helpers ----------
const pr = (h) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16))
export const mix = (a, b, t) => '#' + pr(a).map((v, i) => Math.round(v * (1 - t) + pr(b)[i] * t).toString(16).padStart(2, '0')).join('')
const lum = (h) => { const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); const [r, g, b] = pr(h).map((v) => v / 255); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }

// ---------- film grain tile (indexed PNG with alpha palette: ~6 KB) ----------
function crc32(buf) { let c = 0xffffffff; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)) } return (c ^ 0xffffffff) >>> 0 }
function chunk(type, data) { const t = Buffer.from(type); const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, crc]) }
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
export function grainPng(n = 64, amp = 14) {
  const rnd = mulberry(20260);
  const pal = [], trn = []
  for (let i = 0; i < 8; i++) { pal.push(0, 0, 0); trn.push(Math.round(((8 - i) / 8) * amp)) }
  for (let i = 0; i < 8; i++) { pal.push(255, 255, 255); trn.push(Math.round(((i + 1) / 8) * amp)) }
  const raw = Buffer.alloc((n + 1) * n)
  for (let y = 0; y < n; y++) { raw[y * (n + 1)] = 0; for (let x = 0; x < n; x++) raw[y * (n + 1) + 1 + x] = Math.floor(rnd() * 16) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(n, 0); ihdr.writeUInt32BE(n, 4); ihdr[8] = 8; ihdr[9] = 3
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', Buffer.from(pal)), chunk('tRNS', Buffer.from(trn)), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}
const _g = new Map()
const grainUri = (amp = 14) => { if (!_g.has(amp)) _g.set(amp, 'data:image/png;base64,' + grainPng(64, amp).toString('base64')); return _g.get(amp) }

// ---------- path compaction: absolute integer commands -> relative, minimal separators ----------
function relPath(d) {
  if (/[^MLCQZ\d\s.,-]/.test(d)) throw new Error('relPath: unsupported path command/number format in ' + d.slice(0, 80)) // only absolute M L C Q Z with plain numbers (opentype toPathData(0))
  const toks = d.match(/[MLCQZ]|-?\d+(?:\.\d+)?/g) || []
  const N = { M: 2, L: 2, C: 6, Q: 4, Z: 0 }
  let out = '', cx = 0, cy = 0, sx = 0, sy = 0, i = 0, first = true
  let last = ''
  const push = (cmd, vals) => {
    const strs = vals.map(String)
    let s = ''
    if (cmd === last && cmd !== 'm') s = strs[0].startsWith('-') ? '' : ' '; else s = cmd
    strs.forEach((n, k) => { s += (k > 0 && !n.startsWith('-') ? ' ' : '') + n })
    out += s; last = cmd
  }
  while (i < toks.length) {
    const c = toks[i++]; const n = N[c]
    if (c === 'Z') { out += 'z'; last = 'z'; cx = sx; cy = sy; continue }
    const a = toks.slice(i, i + n).map(Number); i += n
    if (c === 'M') { if (first) { push('M', a); first = false } else push('m', [a[0] - cx, a[1] - cy]); cx = sx = a[0]; cy = sy = a[1]; continue }
    const rel = a.map((v, k) => v - (k % 2 === 0 ? cx : cy))
    if (c === 'L' && rel[0] === 0 && rel[1] === 0) continue // zero-length segment
    push(c.toLowerCase(), rel)
    cx = a[n - 2]; cy = a[n - 1]
  }
  return out
}
// ---------- svg builder ----------
export class Svg {
  // Mt / Mb: transparent outer margin top / bottom (0 = flush with the neighbouring image)
  // corners: [tl,tr,br,bl] radii (default all rx); bg: canvas colour; frame: hairline frame; spot: soft top-left light
  // padL / padR: transparent left / right margin inside the SVG (viewBox = W + padL + padR); used to bake the gutter between two side-by-side halves
  constructor(W, { title, desc, M = 4, Mt, Mb, rx = 20, corners, bg, frame = true, spot = true, grainAmp, css = '', grain = true, glow = true, padL = 0, padR = 0 }) {
    this.padL = padL; this.padR = padR
    this.W = W; this.M = M; this.Mt = Mt ?? M; this.Mb = Mb ?? M; this.rx = rx; this.title = title; this.desc = desc
    this.corners = corners || [rx, rx, rx, rx]; this.bg = bg || C.ink; this.frame = frame; this.spot = spot; this.grainAmp = grainAmp ?? 10 // 10/255 alpha: fine film grain, not dirt
    this.tx = new TextUse(); this.body = []; this.defs = []; this.css = css; this.logoIds = new Set(); this.grain = grain; this.glow = glow
    this.uid = 0; this.outline = null // {color, op}: plain 1px hairline round the whole shape (used by flat strips)
  }
  id(p = 'i') { return `${p}${this.uid++}` }
  add(s) { this.body.push(s); return this }
  // text -> returns advance width
  t(str, o = {}) {
    const r = this.tx.text(str, { fill: C.ivory, ...o })
    this.body.push(r.svg); return r.width
  }
  w(str, o = {}) { return measure(str, o) }
  caps(str, x, y, o = {}) {
    const { fill = C.mute, tr = 1.8, anchor = 'start' } = o
    const size = Math.max(this.W > 380 ? CAPS_D : CAPS_M, o.size || 0)
    return this.t(str.toUpperCase(), { ...SANS(), size, x, y, fill, tracking: tr, anchor })
  }
  // greedy word wrap of str (explicit "\n" = forced line break) at width w
  wrap(str, w, size, f) {
    const out = []
    for (const seg of str.split('\n')) {
      let cur = ''
      for (const wd of seg.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (cur && measure(tr, { ...f, size }) > w) { out.push(cur); cur = wd } else cur = tr }
      out.push(cur)
    }
    return out
  }
  // wrapped paragraph; y = first baseline; returns {last, lines}. balance: keep the greedy line count but narrow the measure until the lines are even (no one-word last line)
  para(str, { x, y, w, size = 15, lh = 24, fill = C.sub, balance = false, ...font }) {
    const f = { ...SANS(), ...font }
    let lines = this.wrap(str, w, size, f)
    if (balance && lines.length > 1) {
      const n = lines.length; let lo = w * 0.5, hi = w
      for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (this.wrap(str, mid, size, f).length <= n) hi = mid; else lo = mid }
      lines = this.wrap(str, hi, size, f)
    }
    lines.forEach((l, i) => this.t(l, { ...f, size, x, y: y + i * lh, fill }))
    return { last: y + (lines.length - 1) * lh, lines }
  }
  lines(str, { w, size, ...font }) { return this.wrap(str, w, size, font).length } // count lines only
  // brand logo from logos.json (single colour). fill override. Wide / composite marks are cropped to the part that reads at icon size
  // (php: the ellipse, wide; mysql: the dolphin without its wordmark). Returns the advance width of the mark.
  static CROP = { php: { box: [0, 5.6, 24, 12.8], wide: 1.4 }, mysql: { box: [13.1, 2.8, 10.7, 10.7], wide: 1.3 } }
  logoW(key, size) { const c = Svg.CROP[key]; return c ? size * c.wide : size }
  logo(key, x, y, size, fill) {
    const L = LOGOS[key]
    if (!this.logoIds.has(key)) {
      this.logoIds.add(key)
      if (L.multicolor_svg_inner) this.defs.push(`<g id="lg-${key}">${L.multicolor_svg_inner.replace(/\sfill="[^"]*"/g, '').replace(/ d="([^"]*)"/g, (m, d) => ` d="${d.replace(/(\d*\.\d)\d+/g, '$1')}"`)}</g>`)
      else this.defs.push(`<path id="lg-${key}" d="${L.d.replace(/(\d*\.\d)\d+/g, '$1')}"/>`) // truncate to 1 decimal on a 24 box (delimiters unchanged, so compact arc flags survive)
    }
    const c = Svg.CROP[key]
    if (c) {
      const [bx, by, bw, bh] = c.box, w = size * c.wide, h = w * bh / bw
      this.body.push(`<svg x="${f1(x)}" y="${f1(y + (size - h) / 2)}" width="${f1(w)}" height="${f1(h)}" viewBox="${bx} ${by} ${bw} ${bh}" fill="${fill}"><use href="#lg-${key}"/></svg>`)
      return w
    }
    const k = size / (L.multicolor_svg_inner ? 128 : 24)
    this.body.push(`<use href="#lg-${key}" transform="translate(${f1(x)} ${f1(y)}) scale(${f1(k * 1000) / 1000})" fill="${fill}"/>`)
    return size
  }
  brand(key, fallbackHex) { const h = LOGOS[key]?.hex || fallbackHex; return lum(h) < 0.06 ? C.ivory : '#' + h }
  // custom 24-box stroke glyphs
  glyph(name, x, y, size, color, sw = 1.7) {
    const P = {
      graph: '<circle cx="5" cy="12" r="2.6"/><circle cx="19" cy="5.5" r="2.6"/><circle cx="19" cy="18.5" r="2.6"/><path d="M7.4 11l9.2-4.3M7.4 13l9.2 4.3"/>',
      ws: '<path d="M3 8h15m-4-4 4 4-4 4M21 16H6m4-4-4 4 4 4"/>',
      db: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
      video: '<rect x="3" y="6.5" width="12.5" height="11" rx="2.4"/><path d="M15.5 10.5l5.5-3v9l-5.5-3"/>',
      card: '<rect x="3" y="5.5" width="18" height="13" rx="2.4"/><path d="M3 10h18M6.5 14.5h4"/>',
      lock: '<rect x="5" y="11" width="14" height="10" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    }[name]
    this.body.push(`<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(size / 24 * 1000) / 1000})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${P}</g>`)
  }
  // vermilion disc with an arrow (the "full stop" motif used as a link affordance)
  arrowDisc(cx, cy, r, glow = true) {
    const a = r * 0.36, h = r * 0.15
    if (glow) { const g = this.glowGrad('ad', C.verm, 0.5); this.body.push(`<circle cx="${cx}" cy="${cy}" r="${r * 2.1}" fill="url(#${g})"/>`) }
    this.body.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.verm}"/>`)
    this.body.push(`<path d="M${f1(cx - a)} ${f1(cy + a)}L${f1(cx + a)} ${f1(cy - a)}M${f1(cx - a * 0.2)} ${f1(cy - a)}H${f1(cx + a)}V${f1(cy + a * 0.2)}" fill="none" stroke="${C.ink}" stroke-width="${f1(h * 1.6)}" stroke-linecap="round" stroke-linejoin="round"/>`)
  }
  glowGrad(key, color, peak) {
    const id = `gl-${key}-${peak}-${color.slice(1)}`
    if (!this.defs.some((d) => d.includes(`id="${id}"`))) {
      const stops = [0, .15, .3, .45, .6, .75, .9, 1].map((o) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${o === 1 ? 0 : f1(peak * Math.exp(-3.4 * o * o))}"/>`).join('')
      this.defs.push(`<radialGradient id="${id}">${stops}</radialGradient>`)
    }
    return id
  }
  rule(x1, x2, y, o = {}) {
    const { op = 0.16, cls = '', color = C.ivory, sw = 1 } = o
    this.body.push(`<path ${cls ? `class="${cls}" ` : ''}d="M${f1(x1)} ${f1(y)}H${f1(x2)}" stroke="${color}" stroke-opacity="${op}" stroke-width="${sw}" fill="none"${cls ? ` pathLength="${f1(x2 - x1)}"` : ''}/>`)
  }
  markerW(num) { return this.w(num, { ...SANS(), size: this.W > 380 ? CAPS_D : CAPS_M, tracking: 0.6 }) + 12 }
  // small outlined project marker "01" (right-aligned at xr). returns width
  marker(num, xr, yBase, o = {}) {
    const size = this.W > 380 ? CAPS_D : CAPS_M
    const tw = this.w(num, { ...SANS(), size, tracking: 0.6 })
    const bw = tw + 12, bh = size + 7
    const x = xr - bw
    this.body.push(`<rect x="${f1(x)}" y="${f1(yBase - size - 1.2)}" width="${f1(bw)}" height="${f1(bh)}" rx="${f1(bh / 2)}" fill="${o.fill || C.ivory}" fill-opacity="${o.fo ?? 0.07}" stroke="${o.stroke || C.ivory}" stroke-opacity="${o.so ?? 0.3}"/>`)
    this.t(num, { ...SANS(), size, x: x + 6, y: yBase, fill: o.color || C.ivory, tracking: 0.6 })
    return bw
  }
  // logo / text chip. measureChip() = width without drawing; chip() draws and returns the width. opts: key (logo), glyph, label, x, y (top-left), h, size, col
  measureChip({ key, glyph, label, h = 26, size = 13 }) {
    const ic = key || glyph ? h - 12 : 0
    const iw = key ? this.logoW(key, ic) : ic
    return 10 + (ic ? iw + 5 : 0) + this.w(label, { ...SANS(), size }) + 10
  }
  chip({ key, glyph, label, x, y, h = 26, size = 13, col }) {
    const ic = key || glyph ? h - 12 : 0
    const w = this.measureChip({ key, glyph, label, h, size })
    this.body.push(`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${h}" rx="${h / 2}" fill="${C.ivory}" fill-opacity=".05" stroke="${C.ivory}" stroke-opacity=".24"/>`)
    let tx = x + 10
    if (key) { tx += this.logo(key, tx, y + 6, ic, col || C.sub) + 5 } else if (glyph) { this.glyph(glyph, tx, y + 6, ic, col || C.sub, 1.8); tx += ic + 5 }
    this.t(label, { ...SANS(), size, x: tx, y: y + h / 2 + size * 0.36, fill: C.ivory })
    return w
  }
  // rounded rect path with per-corner radii [tl,tr,br,bl]
  static rr(x, y, w, h, [a, b, c, d]) {
    return `M${f1(x + a)} ${f1(y)}H${f1(x + w - b)}${b ? `A${b} ${b} 0 0 1 ${f1(x + w)} ${f1(y + b)}` : ''}V${f1(y + h - c)}${c ? `A${c} ${c} 0 0 1 ${f1(x + w - c)} ${f1(y + h)}` : ''}H${f1(x + d)}${d ? `A${d} ${d} 0 0 1 ${f1(x)} ${f1(y + h - d)}` : ''}V${f1(y + a)}${a ? `A${a} ${a} 0 0 1 ${f1(x + a)} ${f1(y)}` : ''}Z`
  }
  // finish with card height Hc (content coords). Returns string.
  finish(Hc, name) {
    const { W, Mt, Mb, rx, corners, bg, padL, padR } = this; const H = Hc + Mt + Mb, TW = W + padL + padR
    const light = bg !== C.ink && bg !== C.verm && bg !== C.ink2 && lum(bg) > 0.4
    const hl = light ? C.ink : C.ivory
    const clip = `<clipPath id="cc"><path d="${Svg.rr(0, Mt, W, Hc, corners)}"/></clipPath>`
    const hair = `<linearGradient id="hl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hl}" stop-opacity="${light ? 0.22 : 0.34}"/><stop offset=".35" stop-color="${hl}" stop-opacity=".09"/><stop offset=".7" stop-color="${hl}" stop-opacity=".07"/><stop offset="1" stop-color="${hl}" stop-opacity="${light ? 0.16 : 0.2}"/></linearGradient>`
    const spot = `<radialGradient id="sp" gradientUnits="userSpaceOnUse" cx="${W * 0.12}" cy="${Mt}" r="${W * 0.9}"><stop offset="0" stop-color="${light ? '#fff' : C.ivory}" stop-opacity="${light ? 0.5 : 0.075}"/><stop offset="1" stop-color="${light ? '#fff' : C.ivory}" stop-opacity="0"/></radialGradient>`
    const top = `<linearGradient id="te" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${hl}" stop-opacity="0"/><stop offset=".3" stop-color="${hl}" stop-opacity=".45"/><stop offset=".7" stop-color="${hl}" stop-opacity=".12"/><stop offset="1" stop-color="${hl}" stop-opacity="0"/></linearGradient>`
    const grain = this.grain ? `<pattern id="gr" width="64" height="64" patternUnits="userSpaceOnUse"><image href="${grainUri(this.grainAmp)}" width="64" height="64"/></pattern>` : ''
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TW} ${f1(H)}" width="${TW}" height="${f1(H)}" role="img" aria-labelledby="t d">
<title id="t">${esc(this.title)}</title>
<desc id="d">${esc(this.desc)}</desc>
<style>${this.css}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}</style>
<defs>${clip}${this.frame ? hair + top : ''}${this.spot ? spot : ''}${grain}${this.tx.defs().replace(/ d="([^"]*)"/g, (m, d) => ` d="${relPath(d)}"`)}${this.defs.join('')}</defs>
${padL ? `<g transform="translate(${padL} 0)">` : ''}<g clip-path="url(#cc)">
<rect y="${Mt}" width="${W}" height="${f1(Hc)}" fill="${bg}"/>
${this.spot ? `<rect y="${Mt}" width="${W}" height="${f1(Hc)}" fill="url(#sp)"/>` : ''}
${this.grain ? `<rect y="${Mt}" width="${W}" height="${f1(Hc)}" fill="url(#gr)"/>` : ''}
<g transform="translate(0 ${Mt})">
${this.body.join('\n')}
</g>
</g>
${this.frame ? `<path d="M${rx + 6} ${Mt + 0.5}H${W - rx - 6}" stroke="url(#te)" fill="none"/>
<path d="${Svg.rr(0.5, Mt + 0.5, W - 1, Hc - 1, corners.map((c) => Math.max(0, c - 0.5)))}" fill="none" stroke="url(#hl)"/>` : ''}
${this.outline ? `<path d="${Svg.rr(0.5, Mt + 0.5, W - 1, Hc - 1, corners.map((c) => Math.max(0, c - 0.5)))}" fill="none" stroke="${this.outline.color}" stroke-opacity="${this.outline.op}"/>` : ''}${padL ? '</g>' : ''}
</svg>
`
    return svg
  }
}

// flow layout: items [{w, draw(x,y)}] -> wraps, returns last baseline
export function flow(items, { x, y, maxW, gap, lh }) {
  let cx = x, cy = y
  for (const it of items) {
    if (cx > x && cx + it.w > x + maxW + 0.5) { cx = x; cy += lh }
    it.draw(cx, cy); cx += it.w + gap
  }
  return cy
}
