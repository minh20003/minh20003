// Concept C, final pass - Editorial Precision. Generates every SVG in ./assets  (node build.mjs)
import fs from 'node:fs'
import path from 'node:path'
import { Svg, C, SERIF, SERIFI, SANS, flow, f1, mix, unesc, CAPS_M } from './lib.mjs'
import { HERE as here, ROOT } from './paths.mjs'

const FINAL = path.join(ROOT, 'assets')
const OUT = path.join(here, 'tmp', 'assets.new') // built here; at the end assets/ is removed and this folder is renamed into its place (a mid-build exception leaves assets/ untouched)
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(path.join(here, 'tmp'), { recursive: true })
const b64 = (f) => fs.readFileSync(path.join(here, 'tmp', f)).toString('base64')
const ALTS = {}
const write = (name, svg) => { fs.writeFileSync(path.join(OUT, name), svg); ALTS[name.replace(/\.svg$/, '')] = unesc((svg.match(/<desc id="d">([\s\S]*?)<\/desc>/) || [, ''])[1]); console.log(name.padEnd(22), (svg.length / 1024).toFixed(1) + ' KB', (svg.match(/viewBox="[^"]*"/) || [''])[0]) }
const rnd = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

// project markers used by the toolkit (facts.md section "Tech to show")
const USED = { python: ['01'], typescript: ['01', '02'], fastapi: ['01'], graph: ['01'], langchain: ['01'], postgresql: ['01'], websocket: ['01'], docker: ['01'], react: ['01', '02'], nextdotjs: ['01', '02'], tailwindcss: ['02'], java: ['03'], php: ['03'], mysql: ['03'], firebase: ['03'], android: ['03'], zego: ['03'], vnpay: ['03'] }

// flowing chips; returns bottom y (top of last row + h)
function chips(s, list, { x, y, maxW, h = 26, gap = 8, size = 13, x1 }) {
  let cx = x1 ?? x, cy = y
  for (const it of list) {
    const w = s.measureChip({ ...it, size, h })
    if (cx > (x1 ?? x) && cx + w > x + maxW + 0.5) { cx = x; cy += h + gap }
    s.chip({ ...it, x: cx, y: cy, size, h }); cx += w + gap
  }
  return cy + h
}
const arrowStroke = (s, cx, cy, a, color, sw = 2.2) => s.add(`<path d="M${f1(cx - a)} ${f1(cy + a)}L${f1(cx + a)} ${f1(cy - a)}M${f1(cx - a * 0.2)} ${f1(cy - a)}H${f1(cx + a)}V${f1(cy + a * 0.2)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`)
const dashList = (s, items, { x, y, w, size, lh, gap, dash = C.verm, fill = C.sub, dx = 18 }) => {
  items.forEach((f) => {
    s.add(`<path d="M${x} ${f1(y - size * 0.3)}h8" stroke="${dash}" stroke-width="1.5"/>`)
    const p = s.para(f, { x: x + dx, y, w: w - dx, size, lh, fill })
    y = p.last + lh + gap
  })
  return y - lh - gap // baseline of the last line
}

// =====================================================================  HERO
function hero(W) {
  const D = W > 500
  const pad = D ? 40 : 24, R = W - pad
  const desc = 'Dinh Quang Minh (Đinh Quang Minh). Software Engineering student. Turning ideas into practical AI applications. Builds backend services and explores applications of LLMs. Based in Hanoi, Vietnam. Studying at FPT University, Japanese BrSE (Bridge SE) track. Training: AI in Action, VinUniversity. Focus: RAG, agentic workflows, real-time systems. Open to AI / Backend internships.'
  const s = new Svg(W, { title: 'Đinh Quang Minh - Software Engineering student, AI and backend', desc, css: `.draw{stroke-dasharray:${R - pad};animation:draw 2.8s cubic-bezier(.3,.6,.2,1) .4s backwards}@keyframes draw{from{stroke-dashoffset:${R - pad}}to{stroke-dashoffset:0}}.ring{transform-box:fill-box;transform-origin:center;opacity:0;animation:ring 3.4s ease-out 1s 3}@keyframes ring{0%{transform:scale(1);opacity:.6}70%,100%{transform:scale(3);opacity:0}}` })
  const gx = D ? 690 : 290, gy = D ? 300 : 175
  s.add(`<circle cx="${gx}" cy="${gy}" r="${D ? 340 : 210}" fill="url(#${s.glowGrad('hero', C.verm, 0.30)})"/>`)

  s.caps('Software Engineering student', pad, D ? 44 : 40, { tr: D ? 1.9 : 1.5 })
  const ry = D ? 62 : 54
  s.rule(pad, R, ry, { cls: 'draw', op: 0.28 })

  // ---- display name
  const NS = D ? 172 : 76, trk = D ? -2.5 : -1
  const b1 = ry + (D ? 22 : 16) + NS * 0.7
  s.t('Đinh Quang', { ...SERIF, size: NS, x: pad - (D ? 6 : 3), y: b1, tracking: trk })
  const b2 = b1 + NS * (D ? 0.99 : 0.97)
  const mw = s.w('Minh', { ...SERIFI, size: NS, tracking: trk })
  const disc = D ? 15 : 8
  let mx = R - mw - (D ? 14 : 8) - disc * 2
  if (!D) mx = Math.min(mx, pad - 3 + s.w('Đinh ', { ...SERIF, size: NS, tracking: trk })) // mobile: "Minh." starts under "Quang", clear of the right edge
  s.t('Minh', { ...SERIFI, size: NS, x: mx, y: b2, tracking: trk })
  const pcx = mx + mw + (D ? 14 : 8) + disc
  s.add(`<circle cx="${f1(pcx)}" cy="${f1(b2 - disc)}" r="${disc}" fill="${C.verm}"/>`)

  const bio = 'Builds backend services and explores applications of LLMs.'
  const tg = 'Turning ideas into practical AI applications'
  const TS = D ? 38 : 27
  let yy
  const drawTag = (y0) => {
    const r = s.para(tg, { x: pad, y: y0, w: W - 2 * pad - 24, size: TS, lh: TS * 1.12, fill: C.ivory, ...SERIFI, tracking: -0.2 })
    const lw = s.w(r.lines[r.lines.length - 1], { ...SERIFI, size: TS, tracking: -0.2 })
    s.add(`<circle cx="${f1(pad + lw + (D ? 9 : 7))}" cy="${f1(r.last - (D ? 5 : 4))}" r="${D ? 4.5 : 3.5}" fill="${C.verm}"/>`)
    return r.last
  }
  if (D) {
    // descriptor sits directly under the first name line (the empty block left of the staggered "Minh"): 20px ivory, the line that answers "what do they do"
    s.para(bio, { x: pad, y: b1 + 52, w: 326, size: 20, lh: 30, fill: C.ivory, balance: true })
    const tl = drawTag(b2 + 60)            // tagline: directly under the name block
    yy = tl + 30
  } else {
    const tl = drawTag(b2 + 46)
    const r = s.para(bio, { x: pad, y: tl + 34, w: W - 2 * pad, size: 16, lh: 24, fill: C.ivory, balance: true })
    yy = r.last + 26
  }
  s.rule(pad, R, yy, { op: 0.14 })

  // ---- facts strip
  const meta = [['Based in', 'Hanoi, Vietnam'], ['Studying', 'FPT University, Japanese\nBridge SE (BrSE) track'], ['Training', 'AI in Action, VinUniversity'], ['Focus', 'RAG, agentic workflows, real-time systems']]
  let fy
  if (D) {
    const cw = [138, 206, 172, 204]; let x = pad, last = 0
    meta.forEach(([l, v], i) => {
      s.caps(l, x, yy + 32, { tr: 1.8, fill: C.mute })
      const n = s.lines(v, { ...SANS(), size: 14, w: cw[i] - 14 }); if (n > 2) console.warn('hero fact wraps to', n, v)
      const p = s.para(v, { x, y: yy + 56, w: cw[i] - 14, size: 14, lh: 20, fill: C.ivory })
      last = Math.max(last, p.last); x += cw[i]
    })
    fy = last
  } else {
    let y = yy
    meta.forEach(([l, v], i) => {
      const vx = pad + 96
      const n = s.lines(v, { ...SANS(), size: 14, w: R - vx })
      const rh = 20 + n * 20 - 4
      s.caps(l, pad, y + 24, { tr: 1.4, fill: C.mute })
      s.para(v, { x: vx, y: y + 24, w: R - vx, size: 14, lh: 20, fill: C.ivory })
      y += rh + 6
      if (i < meta.length - 1) s.rule(pad, R, y - 6, { op: 0.09 })
    })
    fy = y - 12
  }
  // ---- availability status line (full width, foot of the hero)
  const sh = D ? 56 : 46, sy = fy + (D ? 30 : 24)
  s.add(`<rect y="${f1(sy)}" width="${W}" height="${sh}" fill="${C.verm}" fill-opacity=".09"/>`)
  s.rule(0, W, sy, { op: 0.18, color: C.verm })
  const dcx = pad + 6, dcy = sy + sh / 2
  s.add(`<circle class="ring" cx="${dcx}" cy="${f1(dcy)}" r="5" fill="${C.verm}"/><circle cx="${dcx}" cy="${f1(dcy)}" r="5" fill="${C.verm}"/>`)
  if (D) {
    s.t('OPEN TO AI / BACKEND INTERNSHIPS', { ...SANS(500), size: 14, x: pad + 26, y: dcy + 5, fill: C.ivory, tracking: 2.2 })
  } else {
    s.t('OPEN TO AI / BACKEND INTERNSHIPS', { ...SANS(500), size: CAPS_M, x: pad + 22, y: dcy + 4, fill: C.ivory, tracking: 1.0 })
  }
  return s.finish(sy + sh)
}

// ONE gutter everywhere: 8 SVG units (~6-9 css px) between side-by-side tiles AND between vertically stacked blocks.
// Two-up rows (tiles, link strips) are two images of exactly 50% each with NO whitespace between the anchors (gen-readme.mjs).
// The gutter between them is baked in: each half is drawn W wide plus a 4-unit transparent inner margin (left half: right margin, right half: left margin),
// so the pair spans exactly 100% and its outer edges coincide with the 100%-wide cards above and below at every column width.
// Vertically every SVG carries a 4-unit transparent top and bottom margin (Svg M = 4), so stacked images are 8 units apart. Link strips under a card are joined
// the same way (a deliberate 8-unit gap, all four corners rounded) instead of a zero-gap seam, which at fractional device-pixel ratios leaves an unpainted row.
const GUT = 4
const HALF_PAD = (side) => (side === 'l' || side === 'L' ? { padR: GUT } : side === 'r' || side === 'R' ? { padL: GUT } : {})
// =====================================================================  LINK TILE (LinkedIn / GitHub)
function tile(W, label, title, desc, side) {
  const D = W > 300
  const H = D ? 58 : 58
  const s = new Svg(W, { title: desc, desc, rx: D ? 16 : 14, grain: false, ...HALF_PAD(side) })
  const ix = D ? 22 : 16
  s.add(`<rect y="0" width="${W}" height="${H}" fill="${C.ink2}"/>`)
  // block (caps + 10px air + wordmark ascenders) is vertically centred in the 58px tile
  s.caps(label, ix, D ? 19.5 : 20.5, { tr: D ? 1.8 : 1.3 })
  s.t(title, { ...SERIF, size: D ? 27 : 24, x: ix - 1, y: D ? 49.5 : 46.5, tracking: -0.2 })
  s.arrowDisc(W - (D ? 36 : 28), H / 2, D ? 16 : 13)
  return s.finish(H)
}

// =====================================================================  SOLID LINK STRIP (under a card, 8-unit gap)
// side: 'l' | 'r' (halves, text stacked: caps over serif) | 'full' (one line). kind: 'verm' | 'ink'. Top and bottom margins are 4 units (Mt/Mb), corners all rounded.
function bar(W, { label, cap, side, live, kind = 'verm', desc, D }) {
  // halves: 10 units of air below (the strips belong to the card above them, so the gap to the NEXT card is wider than the 8-unit gutter inside the group)
  const seg = side !== 'full'
  const H = seg ? (D ? 60 : 62) : (D ? 52 : 48)
  const verm = kind === 'verm'
  const fg = verm ? C.ink : C.ivory
  const s = new Svg(W, { title: desc, desc, rx: 16, Mb: seg ? 10 : 4, bg: verm ? C.verm : C.ink2, frame: false, spot: false, grain: false, ...HALF_PAD(side), css: live ? `.rg{transform-box:fill-box;transform-origin:center;opacity:0;animation:rg 3.2s ease-out infinite}@keyframes rg{0%{transform:scale(1);opacity:.55}70%,100%{transform:scale(3);opacity:0}}` : '' })
  if (!verm) s.outline = { color: C.ivory, op: 0.2 } // dark strip: hairline round it, so it still reads as a button on GitHub's #0d1117
  const ix = D ? 24 : 16
  if (!seg) {
    const cy = H / 2
    s.t(label, { ...SERIF, size: D ? 27 : 24, x: ix, y: cy + (D ? 9 : 8), fill: fg, tracking: -0.2 })
    if (cap && D) s.caps(cap, W - ix - 30, cy + 4.3, { fill: verm ? '#3a1209' : C.mute, anchor: 'end', tr: 1.6 })
    arrowStroke(s, W - ix - 8, cy, 7, fg)
  } else {
    // caps line over the serif label; the LIVE dot (slow infinite pulse; this strip is tiny and filter-free) sits to the left of both lines
    let x = ix
    if (live) { const r = D ? 4 : 3.5; s.add(`<circle class="rg" cx="${x + r}" cy="${H / 2}" r="${r}" fill="${fg}"/><circle cx="${x + r}" cy="${H / 2}" r="${r}" fill="${fg}"/>`); x += D ? 22 : 18 }
    s.caps(cap, x, D ? 24 : 26, { fill: verm ? '#2b0d06' : C.mute, tr: D ? 1.6 : 1.1 })
    s.t(label, { ...SERIF, size: D ? 26 : 23, x, y: D ? 49 : 52, fill: fg, tracking: -0.2 })
    arrowStroke(s, W - ix - (D ? 8 : 4), D ? H / 2 : 40, D ? 7 : 6, fg, D ? 2.2 : 2)
  }
  return s.finish(H)
}

// =====================================================================  SLIM SECTION LABEL
function label(W, num, text, right, desc) {
  const D = W > 500
  const pad = D ? 40 : 24
  const s = new Svg(W, { title: `${num} ${text}`, desc, rx: 12, Mt: 14, grain: false, frame: true, spot: false, bg: C.ink2 }) // ink2 + the card hairline, so the pill reads as a container in dark mode too
  const nw = s.t(num + '.', { ...SERIFI, size: D ? 25 : 23, x: pad, y: 22, fill: C.verm })
  const tw = s.caps(text, pad + nw + 12, 19, { fill: C.ivory, tr: 2.1 })
  if (D) {
    const rw = s.caps(right, W - pad, 19, { anchor: 'end', tr: 1.9 })
    s.rule(pad + nw + 12 + tw + 18, W - pad - rw - 18, 14.5, { op: 0.2 })
  } else s.rule(pad + nw + 12 + tw + 14, W - pad, 14.5, { op: 0.2 })
  return s.finish(28)
}

// =====================================================================  LINGUAFLOW
function linguaflow(W) {
  const D = W > 500
  const pad = D ? 40 : 24
  const railW = D ? 156 : 0
  const cx = pad + railW, R = W - pad, cw = R - cx
  const desc = 'LinguaFlow, case study 01. Team project by Group 4U (VinUni AI20K Build Phase, six weeks, four people). My role: Backend plus the knowledge base. Realtime multilingual chat with context-aware AI translation: users chat in their own language and the system translates for each participant. Highlights: real-time translation using recent conversation context; WebSocket reconnection with idempotent delivery; voice messages with transcription. Also: direct and group chat, per-user preferred language, automatic source-language detection, human-approved assistant proposals for tasks and calendar. 53 golden test cases for translation evaluation. Live deployment. Team artwork: the LinguaFlow wordmark, the Vietnamese tagline Dịch tin nhắn đa ngôn ngữ Real-time and a parrot mascot among translation symbols. Stack: Python, FastAPI, LangGraph and LangChain, PostgreSQL with pgvector, WebSocket, JWT, Next.js 16, React 19, TypeScript, Docker.'
  const s = new Svg(W, { title: 'LinguaFlow - team project, realtime multilingual chat with AI translation', desc })
  // very subtle violet-ink wash picked from the artwork (matte, no glow)
  const vw = s.id('vw')
  // radial, userSpaceOnUse, anchored at the top-right corner and fully transparent well inside the card, so no rect edge can ever show
  const wr = D ? 640 : 520
  s.defs.push(`<radialGradient id="${vw}" gradientUnits="userSpaceOnUse" cx="${W}" cy="0" r="${wr}">${[[0, .44], [.25, .3], [.5, .14], [.72, .045], [.88, .01], [1, 0]].map(([o, a]) => `<stop offset="${o}" stop-color="${C.violet}" stop-opacity="${a}"/>`).join('')}</radialGradient>`)
  s.add(`<rect width="${W}" height="${wr + 4}" fill="url(#${vw})"/>`)

  // rail
  if (D) {
    s.t('01', { ...SERIFI, size: 80, x: pad - 2, y: 104, tracking: -1 })
    s.rule(pad, pad + 64, 128, { op: 0.5, color: C.verm, sw: 1.5 })
    s.caps('Team project', pad, 156, { tr: 1.5, fill: C.verm })
    s.caps('Group 4U', pad, 178, { tr: 1.5 })
    s.caps('VinUni AI20K', pad, 200, { tr: 1.5 })
  } else {
    s.t('01', { ...SERIFI, size: 56, x: pad - 1, y: 78, tracking: -1 })
    s.caps('Team project', pad + 78, 50, { tr: 1.5, fill: C.verm })
    s.caps('Group 4U  ·  VinUni AI20K', pad + 78, 70, { tr: 1.2 })
  }
  const TS = D ? 68 : 46
  const tb = D ? 104 : 126
  s.t('LinguaFlow', { ...SERIF, size: TS, x: cx - 2, y: tb, tracking: -1 })
  let y = tb + (D ? 40 : 34)
  const one = 'Users chat in their own language; the system translates for each participant.'
  const r1 = s.para(one, { x: cx, y, w: D ? cw - 40 : cw, size: D ? 25 : 21, lh: D ? 31 : 26, fill: C.ivory, ...SERIFI })
  y = r1.last + (D ? 26 : 24)

  // plate
  const ph = Math.round(cw * 456 / 1200)
  const img = b64(D ? 'lf-d.webp' : 'lf-m.webp')
  const pr = D ? 12 : 10
  s.defs.push(`<clipPath id="pl"><rect x="${cx}" y="${y}" width="${cw}" height="${ph}" rx="${pr}"/></clipPath>`)
  s.add(`<rect x="${cx - 6}" y="${y - 6}" width="${cw + 12}" height="${ph + 12}" rx="${pr + 5}" fill="${C.ivory}" fill-opacity=".03" stroke="${C.ivory}" stroke-opacity=".14"/>`)
  s.add(`<g clip-path="url(#pl)"><image href="data:image/webp;base64,${img}" x="${cx}" y="${y}" width="${cw}" height="${ph}" preserveAspectRatio="xMidYMid slice"/></g>`)
  y += ph + (D ? 30 : 28)
  s.caps('Fig. 1  Team artwork', cx, y - (D ? 8 : 8), { tr: 1.5 })

  // stats: a column in the rail (desktop, drawn after the content column so it can end with it) / 2x2 tiles (mobile)
  const stats = [['4', 'People'], ['6', 'Weeks'], ['53', 'Golden test cases'], ['Backend', 'My role']]
  if (!D) {
    y += 4
    // mobile: 2x2 tiles (number over its full caps label, wrapped if needed); they carry the whole fact, so there is no sentence repeating them
    const gap = 8, tw2 = (cw - gap) / 2, lf = { ...SANS(), size: CAPS_M, tracking: 0.3 }
    const mstats = [stats[0], stats[1], stats[2], ['Backend', 'My role + knowledge base']]
    const nl = mstats.map(([, l]) => s.lines(l.toUpperCase(), { ...lf, w: tw2 - 22 }))
    for (let r = 0; r < 2; r++) {
      const rl = Math.max(nl[2 * r], nl[2 * r + 1]), th = 69 + 15 * (rl - 1)
      for (let c = 0; c < 2; c++) {
        const i = 2 * r + c, x = cx + c * (tw2 + gap)
        s.add(`<rect x="${f1(x)}" y="${y}" width="${f1(tw2)}" height="${th}" rx="9" fill="${C.ivory}" fill-opacity=".045" stroke="${C.ivory}" stroke-opacity=".16"/>`)
        s.t(mstats[i][0], { ...SERIF, size: 34, x: x + 11, y: y + 34 })
        s.para(mstats[i][1].toUpperCase(), { ...lf, x: x + 11, y: y + 55, w: tw2 - 22, lh: 15, fill: C.mute })
      }
      y += th + (r ? 0 : gap)
    }
  }
  y += D ? 14 : 26
  const featTop = y
  s.rule(cx, R, y, { op: 0.14 })
  y += D ? 34 : 34

  // features: the three that matter first, then the rest
  const top3 = ['Real-time translation using recent conversation context', 'WebSocket reconnection with idempotent delivery', 'Voice messages with transcription']
  const rest = ['Direct and group chat', 'Per-user preferred language', 'Automatic source-language detection', 'Human-approved assistant proposals (tasks, calendar)']
  y = dashList(s, top3, { x: cx, y, w: cw, size: D ? 16.5 : 15, lh: D ? 22 : 20, gap: D ? 12 : 7, fill: C.ivory }) + (D ? 34 : 30)
  if (D) {
    const fw = cw / 2; const ys = [y, y]
    rest.forEach((f, i) => { const c = i % 2, x = cx + c * fw; s.add(`<path d="M${x} ${ys[c] - 4}h8" stroke="${C.mute}" stroke-width="1.5"/>`); const p = s.para(f, { x: x + 18, y: ys[c], w: fw - 30, size: 14, lh: 19, fill: C.sub }); ys[c] = p.last + 19 + 10 })
    y = Math.max(ys[0], ys[1]) - 29
  } else { const p = s.para('Also: direct and group chat, per-user preferred language, automatic source-language detection, human-approved assistant proposals (tasks, calendar).', { x: cx, y, w: cw, size: 13.5, lh: 19, fill: C.sub }); y = p.last }
  const list = [
    { key: 'python', label: 'Python' }, { key: 'fastapi', label: 'FastAPI' }, { glyph: 'graph', label: 'LangGraph' }, { key: 'langchain', label: 'LangChain' }, { key: 'postgresql', label: 'PostgreSQL' }, { label: 'pgvector' },
    { glyph: 'ws', label: 'WebSocket' }, { label: 'JWT' }, { key: 'nextdotjs', label: 'Next.js 16' }, { key: 'react', label: 'React 19' }, { key: 'typescript', label: 'TypeScript' }, { key: 'docker', label: 'Docker' },
  ]
  if (!D) {
    y += 30
    s.caps('Stack', cx, y, { tr: 1.8 })
    const bot = chips(s, list, { x: cx, y: y + 14, maxW: cw, h: 27, size: 13 })
    return s.finish(bot + 28)
  }
  // desktop: the rail column and the content column END TOGETHER (contentEnd = last text baseline of the content column). The four stat blocks are spread over
  // that height with one hairline per block at an even pitch; the stack chips then run full width as a footer row under both columns.
  const contentEnd = y
  const top = 218
  const blocks = stats.map(([n, l], i) => {
    const ns = i === 3 ? 38 : 46, lf = { ...SANS(), size: 12.5, tracking: 1 }
    const nl = s.lines(l.toUpperCase(), { ...lf, w: 134 })
    const nb = 22 + ns * 0.74, lb = nb + 24
    const last = lb + (nl - 1) * 16 + (i === 3 ? 20 : 0)
    return { n, l, ns, lf, nb, lb, last }
  })
  const gapB = (contentEnd - top - blocks.reduce((a, b) => a + b.last, 0)) / 3 // equal air between a block's last baseline and the next hairline
  let t0 = top
  blocks.forEach((b, i) => {
    if (i) t0 += blocks[i - 1].last + gapB
    s.rule(pad, pad + 134, t0, { op: 0.16 })
    s.t(b.n, { ...SERIF, size: b.ns, x: pad - 1, y: t0 + b.nb })
    const p = s.para(b.l.toUpperCase(), { x: pad, y: t0 + b.lb, w: 134, size: 12.5, lh: 16, fill: C.mute, ...SANS(500), tracking: 1 })
    if (i === 3) s.t('plus knowledge base', { ...SANS(), size: 13, x: pad, y: p.last + 20, fill: C.mute }) // short caps label + lower-case sub-line: nothing overhangs the 134px hairline
  })
  y = contentEnd + 30
  s.rule(pad, R, y, { op: 0.14 })
  y += 36
  s.caps('Stack', pad, y, { tr: 1.8 })
  const sx = pad + 66
  const bot = chips(s, list, { x: sx, y: y - 19, maxW: R - sx, h: 28, size: 13 })
  return s.finish(bot + 34)
}

// =====================================================================  NEXORA
// o.cell = [w, h] grid cell; o.fadeX = [x0, x1, min] horizontal fade-in (alpha min at x0 -> 1 at x1); o.fadeY = [y0, y1] vertical fade-out (1 at y0 -> 0 at y1).
// The fades keep every node and edge clear of the text blocks (nothing is drawn inside a paragraph).
function lattice(s, ax, ay, aw, ah, seed, focal, o = {}) {
  const [cwid, chei] = o.cell || [56, 54]
  const r = rnd(seed), cols = Math.max(2, Math.round(aw / cwid)), rows = Math.max(2, Math.round(ah / chei))
  const nodes = []
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) nodes.push([ax + (i + 0.15 + r() * 0.7) * (aw / cols), ay + (j + 0.15 + r() * 0.7) * (ah / rows), 2 + r() * 2.2])
  const key = new Set(), edges = []
  nodes.forEach((n, a) => {
    nodes.map((m, b) => [b, (m[0] - n[0]) ** 2 + (m[1] - n[1]) ** 2]).filter(([b]) => b !== a).sort((p, q) => p[1] - q[1]).slice(0, 2 + (r() > 0.55 ? 1 : 0)).forEach(([b]) => { const k = a < b ? a + '-' + b : b + '-' + a; if (!key.has(k)) { key.add(k); edges.push([a, b]) } })
  })
  let fi = 0, best = 1e9
  nodes.forEach((n, i) => { const d = (n[0] - focal[0]) ** 2 + (n[1] - focal[1]) ** 2; if (d < best) { best = d; fi = i } })
  const mk = s.id('mk')
  const rr = Math.max(aw, ah) * 0.7
  s.defs.push(`<radialGradient id="${mk}g" gradientUnits="userSpaceOnUse" cx="${f1(nodes[fi][0])}" cy="${f1(nodes[fi][1])}" r="${f1(rr)}"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="${mk}" maskUnits="userSpaceOnUse" x="${ax}" y="${ay}" width="${aw}" height="${ah}"><rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="url(#${mk}g)"/></mask>`)
  const hf = s.id('hf'), [fx0, fx1, fmin = 0] = o.fadeX || [ax + aw * 0.44, ax + aw * 0.72, 0]
  s.defs.push(`<linearGradient id="${hf}g" gradientUnits="userSpaceOnUse" x1="${f1(fx0)}" y1="0" x2="${f1(fx1)}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="${fmin}"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="${hf}" maskUnits="userSpaceOnUse" x="${ax}" y="${ay}" width="${aw}" height="${ah}"><rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="url(#${hf}g)"/></mask>`)
  const vf = s.id('vf'), [fy0, fy1] = o.fadeY || [ay + ah, ay + ah + 1]
  s.defs.push(`<linearGradient id="${vf}g" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(fy0)}" x2="0" y2="${f1(fy1)}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${vf}" maskUnits="userSpaceOnUse" x="${ax}" y="${ay}" width="${aw}" height="${ah}"><rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="url(#${vf}g)"/></mask>`)
  let art = `<g mask="url(#${mk})"><g mask="url(#${hf})"><g mask="url(#${vf})">`
  edges.forEach(([a, b]) => { art += `<path d="M${f1(nodes[a][0])} ${f1(nodes[a][1])}L${f1(nodes[b][0])} ${f1(nodes[b][1])}" stroke="${C.ivory}" stroke-opacity=".38" stroke-width="1.1" fill="none"/>` })
  nodes.forEach(([px, py, rr], i) => { if (i !== fi) art += `<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(rr)}" fill="${C.ivory}" fill-opacity=".78"/>` })
  art += '</g></g></g>'
  const [fx, fyy] = nodes[fi]
  s.add(`<circle cx="${f1(fx)}" cy="${f1(fyy)}" r="${f1(ah * 0.5)}" fill="url(#${s.glowGrad('nx', C.verm, 0.3)})"/>`)
  s.add(art)
  s.add(`<circle cx="${f1(fx)}" cy="${f1(fyy)}" r="11" fill="none" stroke="${C.verm}" stroke-opacity=".6"/><circle cx="${f1(fx)}" cy="${f1(fyy)}" r="5.5" fill="${C.verm}"/>`)
}
function nexora(W) {
  const D = W > 500
  const pad = D ? 40 : 24
  const railW = D ? 136 : 0
  const cx = pad + railW, R = W - pad, cw = R - cx
  const desc = 'NEXORA FPT, case study 02. Private repository, not linked. Corporate marketing website for NEXORA FPT, an AI and software company in Hanoi founded in 2026. One page, English and Vietnamese, statically generated. Accessibility-minded with a skip link and reduced-motion support. Artwork: a Signal Lattice network of nodes and edges, the visual idea of the site. Lighthouse mobile: Performance 95 to 97, Accessibility 100, Best Practices 100, SEO 100. Stack: Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, Motion.'
  const s = new Svg(W, { title: 'NEXORA FPT - corporate website, private repository', desc })
  // content first (to know the height), art drawn underneath afterwards via insertion at index 0
  const art = new Svg(W, { title: '', desc: '' }); art.uid = 100
  let y
  const body = []
  if (D) {
    s.t('02', { ...SERIFI, size: 80, x: pad - 2, y: 104, tracking: -1 })
    s.rule(pad, pad + 64, 128, { op: 0.5, color: C.verm, sw: 1.5 })
    s.caps('Corporate', pad, 156, { tr: 1.5, fill: C.verm }); s.caps('Website', pad, 178, { tr: 1.5 })
  } else {
    s.t('02', { ...SERIFI, size: 56, x: pad - 1, y: 78, tracking: -1 })
    s.caps('Corporate', pad + 78, 50, { tr: 1.5, fill: C.verm }); s.caps('Website', pad + 78, 70, { tr: 1.5 })
  }
  const tb = D ? 104 : 126
  s.t('NEXORA FPT', { ...SERIF, size: D ? 68 : 46, x: cx - 2, y: tb, tracking: -1 })
  y = tb + (D ? 38 : 32)
  const capSz = D ? 13 : CAPS_M
  const pw = s.w('PRIVATE REPOSITORY', { ...SANS(), size: capSz, tracking: 1.5 }) + 48
  s.add(`<rect x="${cx}" y="${y - 15}" width="${f1(pw)}" height="28" rx="14" fill="${C.verm}" fill-opacity=".08" stroke="${C.verm}" stroke-opacity=".75"/>`)
  s.glyph('lock', cx + 12, y - 8, 14, C.verm, 2)
  s.caps('Private repository', cx + 34, y + 4.3, { tr: 1.5, fill: C.ivory })
  y += D ? 44 : 44
  const ds = 'Corporate marketing website for an AI and software company in Hanoi. One page in English and Vietnamese, statically generated, built with accessibility in mind: skip link and reduced-motion support.'
  const p = s.para(ds, { x: cx, y, w: D ? 420 : cw, size: D ? 16 : 14, lh: D ? 25 : 22, fill: C.sub, balance: true }) // balanced: no one-word last line
  y = p.last + (D ? 30 : 28)
  // lower band (Lighthouse + stack) spans the full card width from the left margin: the rail column holds only the numeral + labels, so no dead column is left under it
  const bx = pad, bw = R - bx
  s.rule(bx, R, y, { op: 0.14 })
  s.caps('Lighthouse, mobile', bx, y + 26, { tr: 1.8 })
  y += D ? 38 : 36
  const st = [['95-97', 'Performance', 96], ['100', 'Accessibility', 100], ['100', 'Best practices', 100], ['100', 'SEO', 100]]
  const gauge = (x, yy, w, n, l, pc, big) => {
    s.t(n, { ...SERIF, size: big, x: x - 1, y: yy + big * 0.82 })
    const by = yy + big * 0.82 + 14
    s.add(`<path d="M${f1(x)} ${f1(by)}h${f1(w)}" stroke="${C.ivory}" stroke-opacity=".16" stroke-width="2" stroke-linecap="round"/><path d="M${f1(x)} ${f1(by)}h${f1(w * pc / 100)}" stroke="${C.verm}" stroke-width="2" stroke-linecap="round"/>`)
    s.caps(l, x, by + 24, { tr: 1.3, fill: C.sub })
    return by + 24
  }
  if (D) {
    const w4 = (bw - 3 * 28) / 4; let e = 0
    st.forEach(([n, l, pc], i) => { e = gauge(bx + i * (w4 + 28), y, w4, n, l, pc, 52) })
    y = e
  } else {
    // mobile 2x2: caps label ABOVE its numeral and bar (the label can only ever read as the heading of what is below it)
    const w2 = (bw - 20) / 2; let e = 0
    st.forEach(([n, l, pc], i) => {
      const x = bx + (i % 2) * (w2 + 20), by0 = y + 24 + Math.floor(i / 2) * 96
      s.caps(l, x, by0, { tr: 1.3, fill: C.sub })
      s.t(n, { ...SERIF, size: 36, x: x - 1, y: by0 + 40 })
      const bar = by0 + 52
      s.add(`<path d="M${f1(x)} ${f1(bar)}h${f1(w2)}" stroke="${C.ivory}" stroke-opacity=".16" stroke-width="2" stroke-linecap="round"/><path d="M${f1(x)} ${f1(bar)}h${f1(w2 * pc / 100)}" stroke="${C.verm}" stroke-width="2" stroke-linecap="round"/>`)
      e = bar
    })
    y = e
  }
  y += D ? 30 : 26
  const list = [{ key: 'nextdotjs', label: 'Next.js 16' }, { key: 'react', label: 'React 19' }, { key: 'typescript', label: 'TypeScript' }, { key: 'tailwindcss', label: 'Tailwind CSS 4' }, { label: 'Motion' }]
  let bot
  if (D) { s.caps('Stack', bx, y, { tr: 1.8 }); bot = chips(s, list, { x: bx, y: y + 12, maxW: bw, h: 28, size: 13 }) }
  else { s.caps('Stack', bx, y, { tr: 1.8 }); bot = chips(s, list, { x: bx, y: y + 14, maxW: bw, h: 27, size: 13 }) }
  const Hc = bot + (D ? 40 : 30)
  // signal lattice art: big, confident, fades out towards the text
  // desktop: right-hand column only (paragraph ends at x<=596), gone before the Lighthouse hairline. mobile: top-right corner above the title (title cap-top ~y93)
  if (D) lattice(art, 560, 6, 240, 276, 11, [700, 104], { cell: [48, 50], fadeX: [604, 668, 0], fadeY: [206, 276] })
  else lattice(art, 218, 4, 142, 84, 7, [304, 36], { cell: [36, 28], fadeX: [222, 262, 0], fadeY: [58, 86] })
  s.body.unshift(...art.body); s.defs.push(...art.defs)
  return s.finish(Hc)
}

// =====================================================================  SPORTFIELDBOOKINGAPP (app + backend)
function pitch(s, px, py, pw, ph, op, ballX, ballY, D) {
  const sw = D ? 1.3 : 1.1
  const R = Math.min(pw, ph)
  const lines = `<g fill="none" stroke="${C.ivory}" stroke-opacity="${op}" stroke-width="${sw}">
<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="4"/>
<path d="M${px + pw / 2} ${py}V${py + ph}"/><circle cx="${px + pw / 2}" cy="${py + ph / 2}" r="${R * 0.18}"/>
<rect x="${px}" y="${py + ph * 0.2}" width="${pw * 0.16}" height="${ph * 0.6}"/><rect x="${px + pw * 0.84}" y="${py + ph * 0.2}" width="${pw * 0.16}" height="${ph * 0.6}"/>
<rect x="${px}" y="${py + ph * 0.36}" width="${pw * 0.06}" height="${ph * 0.28}"/><rect x="${px + pw * 0.94}" y="${py + ph * 0.36}" width="${pw * 0.06}" height="${ph * 0.28}"/>
<path d="M${px + pw * 0.16} ${py + ph * 0.38}a${R * 0.14} ${R * 0.14} 0 0 1 0 ${ph * 0.24}M${px + pw * 0.84} ${py + ph * 0.38}a${R * 0.14} ${R * 0.14} 0 0 0 0 ${ph * 0.24}"/></g>`
  const bx = px + pw * ballX, by = py + ph * ballY
  s.add(`<circle cx="${f1(bx)}" cy="${f1(by)}" r="${f1(ph * 0.85)}" fill="url(#${s.glowGrad('sp', C.verm, 0.30)})"/>`)
  s.add(lines)
  s.add(`<circle cx="${f1(bx)}" cy="${f1(by)}" r="${D ? 11 : 9}" fill="none" stroke="${C.verm}" stroke-opacity=".55"/><circle cx="${f1(bx)}" cy="${f1(by)}" r="${D ? 5.5 : 4.5}" fill="${C.verm}"/>`)
}
function sport(W) {
  const D = W > 500
  const pad = D ? 40 : 24
  const railW = D ? 136 : 0
  const cx = pad + railW, R = W - pad, cw = R - cx
  const desc = 'SportFieldBookingApp, case study 03. A sports field booking system in two public repositories: an Android app and a PHP backend (REST API). Vietnamese repository description: hệ thống đặt sân tập (sports facility booking system). Android app, built with Java, Android and Firebase: in-app chat with delivered and seen status, one-to-one voice and video calls via ZegoCloud, Firebase sign-in and push notifications. PHP backend with MySQL: REST API modules for bookings, fields, payments via VNPay, reviews and teammates, plus a web admin panel; JWT authentication. Repositories: SportFieldBookingApp (the Android app) and htdocs (the PHP backend).'
  const s = new Svg(W, { title: 'SportFieldBookingApp - sports field booking system: Android app and PHP backend', desc })
  if (D) {
    pitch(s, R - 150, 30, 150, 98, 0.5, 0.7, 0.58, true) // 150x98: >= 60 units clear of the title (ends x~542) and the one-liner (<= x548)
    s.t('03', { ...SERIFI, size: 80, x: pad - 2, y: 104, tracking: -1 })
    s.rule(pad, pad + 64, 128, { op: 0.5, color: C.verm, sw: 1.5 })
    s.caps('Two repos', pad, 156, { tr: 1.1, fill: C.verm }); s.caps('App + backend', pad, 178, { tr: 1.1 })
  } else {
    pitch(s, R - 100, 18, 100, 64, 0.5, 0.7, 0.58, false)
    s.t('03', { ...SERIFI, size: 56, x: pad - 1, y: 78, tracking: -1 })
    s.caps('Two repos', pad + 78, 50, { tr: 1.4, fill: C.verm }); s.caps('App + backend', pad + 78, 70, { tr: 1.4 })
  }
  let y
  const name = 'SportFieldBookingApp'
  if (D) { s.t(name, { ...SERIF, size: 50, x: cx - 2, y: 100, tracking: -0.8 }); y = 144 } else { s.t(name, { ...SERIF, size: 32, x: pad - 1, y: 142, tracking: -0.6 }); y = 180 }
  const p = s.para('A sports field booking system: an Android app and a PHP REST API.', { x: D ? cx : pad, y, w: D ? 372 : W - 2 * pad, size: D ? 25 : 21, lh: D ? 31 : 27, fill: C.ivory, ...SERIFI })
  y = p.last + (D ? 44 : 34)
  const parts = [
    { tag: 'App', sub: 'Android client', facts: ['In-app chat with delivered and seen status', '1:1 voice and video calls via ZegoCloud', 'Firebase sign-in and push notifications'], chips: [{ key: 'java', label: 'Java' }, { key: 'android', label: 'Android' }, { key: 'firebase', label: 'Firebase' }] },
    { tag: 'Backend', sub: 'PHP REST API', facts: ['REST API modules: bookings, fields, payments (VNPay), reviews, teammates', 'Web admin panel for fields, bookings, users and stats', 'JWT authentication'], chips: [{ key: 'php', label: 'PHP' }, { key: 'mysql', label: 'MySQL' }] },
  ]
  // the two columns span the full card width from the left margin (the rail only holds numeral + labels, so no dead column below it)
  const bx = pad, gap = D ? 48 : 0, colW = D ? (R - bx - gap) / 2 : cw
  let yEnd = y
  parts.forEach((pt, i) => {
    const x = D ? bx + i * (colW + gap) : cx, y0 = D ? y : y + i * 0 + (i ? yEnd - y + 30 : 0)
    const lw = s.caps(pt.tag, x, y0, { tr: 2, fill: C.ivory })
    s.caps(pt.sub, x + lw + 12, y0, { tr: 1.5, fill: C.mute })
    s.rule(x, x + colW, y0 + 12, { op: 0.16 })
    let yy = y0 + 40
    yy = dashList(s, pt.facts, { x, y: yy, w: colW, size: D ? 14 : 14, lh: 19.5, gap: 12 })
    const bot = chips(s, pt.chips, { x, y: yy + 20, maxW: colW, h: 26, size: 13 })
    yEnd = Math.max(yEnd, bot)
  })
  return s.finish(yEnd + (D ? 40 : 32))
}

// =====================================================================  TOOLKIT (two-column editorial index)
function stack(W) {
  const D = W > 500
  const pad = D ? 40 : 24, R = W - pad
  const desc = 'Toolkit, with project markers 01 LinguaFlow, 02 NEXORA FPT, 03 SportFieldBookingApp. Languages: primary Python (01), TypeScript (01, 02); also JavaScript, Java (03), PHP (03), Kotlin, C#. AI and backend: primary FastAPI (01), LangGraph (01), PostgreSQL with pgvector (01); also LangChain (01), WebSocket (01), MySQL (03), SQL. Frontend: primary Next.js (01, 02); also React (01, 02), Tailwind CSS (02). Tooling and platforms: Docker (01), Git, Firebase (03), Android (03), ZegoCloud (03), VNPay (03).'
  const s = new Svg(W, { title: 'Toolkit - languages, AI and backend, frontend, tooling, linked to the featured projects', desc })
  const gapC = 44, colW = D ? (R - pad - gapC) / 2 : R - pad
  const PS = D ? 34 : 26, PL = D ? 25 : 19, PH = D ? 44 : 34
  const SS = D ? 14.5 : 14, SL = D ? 17 : 16
  const markers = (key, xr, yb) => { let x = xr; [...(USED[key] || [])].reverse().forEach((m) => { x -= s.marker(m, x, yb) + 4 }) }
  const prim = (x, y, w, it, first) => {
    // y = row top. hairline on top (not under the group header)
    if (!first) s.rule(x, x + w, y, { op: 0.1 })
    const yb = y + PH * 0.7 + (D ? 3 : 2), ly = yb - PL + (D ? 3 : 2)
    const col = it.glyph ? C.verm : it.key === 'postgresql' ? '#7BA3E0' : s.brand(it.key) // PostgreSQL's brand blue is too dark on ink at 25px; one step lighter
    if (it.glyph) s.glyph(it.glyph, x, ly, PL, col, 1.5); else s.logo(it.key, x, ly, PL, col)
    const nw = s.t(it.label, { ...SERIF, size: PS, x: x + PL + (D ? 14 : 11), y: yb, tracking: -0.3 })
    if (it.extra) s.t(it.extra, { ...SANS(), size: D ? 14 : 13, x: x + PL + (D ? 14 : 11) + nw + 8, y: yb - 1, fill: C.sub })
    markers(it.mk || it.key, x + w, yb - 1)
    return y + PH
  }
  const sup = (x, y, w, it) => {
    const yb = y + 18
    let iw = SL
    const lc = it.key === 'mysql' ? C.ivory : C.sub // supporting mono marks: body-text tone; the thin MySQL dolphin goes to full ivory so it does not ghost
    if (it.glyph) s.glyph(it.glyph, x, yb - SL + 2.5, SL, lc, 1.7); else iw = s.logo(it.key, x, yb - SL + 2.5, SL, lc)
    const lx = x + iw + 9
    const nw = s.t(it.label, { ...SANS(), size: SS, x: lx, y: yb, fill: C.sub })
    let mx = lx + nw + 9
    ;(USED[it.mk || it.key] || []).forEach((m) => { mx += s.marker(m, mx + s.markerW(m), yb - 1) + 4 })
    if (mx - 4 > x + w + 0.5) console.warn('stack: item overshoots its column', it.label, f1(mx - 4 - (x + w)), D ? 'D' : 'M')
  }
  const head = (x, y, w, text) => { const lw = s.caps(text, x, y, { tr: 1.9, fill: C.ivory }); s.rule(x + lw + 14, x + w, y - 4, { op: 0.2 }); return y + 12 }
  const group = (x, y0, w, g) => {
    let y = head(x, y0, w, g.label)
    g.prim.forEach((it, i) => { y = prim(x, y, w, it, i === 0) })
    if (g.prim.length) y += 8
    else y += 4
    const sc = g.sub2 ? 2 : 1, cg = D ? 20 : 10, sw = (w - (sc - 1) * cg) / sc
    g.sup.forEach((it, i) => { const c = i % sc, r = Math.floor(i / sc); sup(x + c * (sw + cg), y + r * (D ? 29 : 27), sw, it) })
    return y + Math.ceil(g.sup.length / sc) * (D ? 29 : 27)
  }
  const G = {
    lang: { label: 'Languages', prim: [{ key: 'python', label: 'Python' }, { key: 'typescript', label: 'TypeScript' }], sub2: true, sup: [{ key: 'javascript', label: 'JavaScript' }, { key: 'java', label: 'Java' }, { key: 'php', label: 'PHP' }, { key: 'kotlin', label: 'Kotlin' }, { key: 'csharp', label: 'C#' }] },
    ai: { label: 'AI & backend', prim: [{ key: 'fastapi', label: 'FastAPI' }, { glyph: 'graph', mk: 'graph', label: 'LangGraph' }, { key: 'postgresql', label: 'PostgreSQL', extra: '+ pgvector' }], sub2: true, sup: [{ key: 'langchain', label: 'LangChain' }, { glyph: 'ws', mk: 'websocket', label: 'WebSocket' }, { key: 'mysql', label: 'MySQL' }, { glyph: 'db', label: 'SQL' }] },
    fe: { label: 'Frontend', prim: [{ key: 'nextdotjs', label: 'Next.js' }], sub2: true, sup: [{ key: 'react', label: 'React' }, { key: 'tailwindcss', label: 'Tailwind CSS' }] },
    tool: { label: 'Tooling & platforms', prim: [], sub2: true, sup: [{ key: 'docker', label: 'Docker' }, { key: 'git', label: 'Git' }, { key: 'firebase', label: 'Firebase' }, { key: 'android', label: 'Android' }, { glyph: 'video', mk: 'zego', label: 'ZegoCloud' }, { glyph: 'card', mk: 'vnpay', label: 'VNPay' }] },
  }
  const legend = (x, y) => { // mobile key: caps label, then one row per project in its real casing
    s.caps('Used in', x, y, { tr: 1.6 })
    ;[['01', 'LinguaFlow'], ['02', 'NEXORA FPT'], ['03', 'SportFieldBookingApp']].forEach(([n, t]) => {
      y += 26
      const mw = s.markerW(n); s.marker(n, x + mw, y - 0.5)
      s.t(t, { ...SANS(), size: 14, x: x + s.markerW('03') + 12, y, fill: C.sub })
    })
    return y
  }
  let y
  if (D) {
    const top = 44
    const x1 = pad, x2 = pad + colW + gapC
    const yl = group(x1, top, colW, G.lang)
    const yl2 = group(x1, yl + 32, colW, G.ai)
    let yr = group(x2, top, colW, G.fe)
    yr = group(x2, yr + 32, colW, G.tool)
    // key: ties each marker to its project (fills the right column)
    let ky = head(x2, yr + 32, colW, 'Used in')
    ;[['01', 'LinguaFlow', 'Team project'], ['02', 'NEXORA FPT', 'Private repo'], ['03', 'SportFieldBookingApp', 'App + backend']].forEach(([n, t, m], i) => {
      const yy = ky + 6 + i * 40
      s.t(n, { ...SERIFI, size: 28, x: x2, y: yy + 26, fill: C.verm })
      s.t(t, { ...SERIF, size: 25, x: x2 + 48, y: yy + 25, tracking: -0.2 })
      if (i < 2) s.rule(x2, x2 + colW, yy + 38, { op: 0.08 })
    })
    yr = ky + 6 + 3 * 40 - 4
    y = Math.max(yl2, yr)
    // (legend is also readable as one line in the alt text / description)
  } else {
    const x = pad; y = 44
    y = legend(x, y)
    ;['lang', 'ai', 'fe', 'tool'].forEach((k, i) => { y = group(x, y + (i ? 22 : 40), colW, G[k]) })
  }
  return s.finish(y + (D ? 34 : 26))
}

// =====================================================================  CONNECT (ivory panel)
function connect(W) {
  const D = W > 500
  const pad = D ? 40 : 24, R = W - pad
  const INK = C.ink, DEEP = C.vermDeep
  const css = ''
  const s = new Svg(W, { title: 'Connect - say hello on LinkedIn', desc: 'Connect. Let us build something useful. Open to AI and Backend internship opportunities. Say hello on LinkedIn. Đinh Quang Minh, Hanoi, Vietnam.', css, bg: C.ivory, grainAmp: 9 })
  const S = D ? 84 : Math.min(58, Math.floor((W - 2 * pad - 24) / (s.w('something useful', { ...SERIFI, size: 100, tracking: -0.8 }) / 100)))
  const hy = (D ? 58 : 52) + S * 0.82 + (D ? 16 : 18)
  const ey = hy + S * 0.88
  const w2probe = s.w('something useful', { ...SERIFI, size: S, tracking: D ? -1.6 : -0.8 })
  const disc = D ? 11 : 6
  const fx = pad + w2probe + disc + (D ? 10 : 6), fyc = ey - disc
  // sun glow behind the full stop (stronger than on ink)
  s.add(`<circle cx="${f1(fx)}" cy="${f1(fyc)}" r="${D ? 300 : 190}" fill="url(#${s.glowGrad('ft', C.verm, 0.4)})"/>`)
  s.t('III.', { ...SERIFI, size: D ? 30 : 24, x: pad, y: D ? 62 : 52, fill: DEEP })
  const cwid = s.caps('Connect', pad + (D ? 56 : 46), D ? 60 : 50, { tr: 1.9, fill: INK })
  s.rule(pad + (D ? 56 : 46) + cwid + (D ? 18 : 14), R, D ? 56 : 46, { op: 0.28, color: INK })
  s.t("Let’s build", { ...SERIF, size: S, x: pad - (D ? 4 : 2), y: hy, tracking: D ? -1.6 : -0.8, fill: INK })
  s.t('something useful', { ...SERIFI, size: S, x: pad - (D ? 3 : 1), y: ey, tracking: D ? -1.6 : -0.8, fill: INK })
  s.add(`<circle cx="${f1(fx)}" cy="${f1(fyc)}" r="${disc}" fill="${C.verm}"/>`)
  let y = ey + (D ? 52 : 38)
  const p = s.para('Open to AI / Backend internship opportunities.', { x: pad, y, w: D ? 720 : W - 2 * pad, size: D ? 17 : 15, lh: D ? 27 : 23, fill: '#37332C' })
  y = p.last + (D ? 26 : 28)
  const lab = 'SAY HELLO ON LINKEDIN'
  const lw = s.w(lab, { ...SANS(500), size: 12.5, tracking: 1.6 })
  const bh = D ? 56 : 52, bw = lw + (D ? 96 : 84)
  s.add(`<rect x="${pad}" y="${y}" width="${f1(bw)}" height="${bh}" rx="${bh / 2}" fill="${C.verm}"/>`)
  s.t(lab, { ...SANS(500), size: 12.5, x: pad + (D ? 30 : 26), y: y + bh / 2 + 4.4, fill: INK, tracking: 1.6 })
  arrowStroke(s, pad + bw - (D ? 32 : 28), y + bh / 2, 6.5, INK)
  y += bh + (D ? 34 : 34)
  s.rule(pad, R, y, { op: 0.2, color: INK })
  y += D ? 26 : 26
  s.caps('Đinh Quang Minh  ·  Hanoi, Vietnam', pad, y, { tr: 1.6, fill: C.mute2 })
  return s.finish(y + (D ? 26 : 26))
}
function connectBar(W) {
  const D = W > 500
  return bar(W, { label: 'github.com/minh20003', cap: 'Also on GitHub', side: 'full', kind: 'ink', D, desc: 'GitHub profile github.com/minh20003' })
}

// =====================================================================  EMIT
for (const [W, sfx] of [[800, ''], [360, '-m']]) {
  const D = W > 500
  write(`hero${sfx}.svg`, hero(W))
  const tw = D ? 396 : 176 // + 4 inner margin = 400 / 180 = exactly half of 800 / 360
  write(`tile-linkedin${sfx}.svg`, tile(tw, 'Connect', 'LinkedIn', 'LinkedIn profile of Dinh Quang Minh', 'l'))
  write(`tile-github${sfx}.svg`, tile(tw, 'Code', 'GitHub', 'GitHub profile minh20003', 'r'))
  write(`ch-work${sfx}.svg`, label(W, 'I', 'Selected work', 'Three projects', 'Section I: Selected work. Three projects.'))
  write(`linguaflow${sfx}.svg`, linguaflow(W))
  write(`bar-demo${sfx}.svg`, bar(tw, { label: 'Live demo', cap: 'Try it online', side: 'l', live: true, D, desc: 'LinguaFlow live demo. Try it online.' }))
  write(`bar-source${sfx}.svg`, bar(tw, { label: 'Source code', cap: 'linguaflow-ai', side: 'r', D, desc: 'LinguaFlow source code on GitHub, repository linguaflow-ai.' }))
  write(`nexora${sfx}.svg`, nexora(W))
  write(`sport${sfx}.svg`, sport(W))
  write(`bar-app${sfx}.svg`, bar(tw, D ? { label: 'App repository', cap: 'SportFieldBookingApp', side: 'l', D, desc: 'App repository: SportFieldBookingApp, the Android app of the sports field booking system, on GitHub.' } : { label: 'App repo', cap: 'Android app', side: 'l', D, desc: 'App repo: SportFieldBookingApp, the Android app of the sports field booking system, on GitHub.' }))
  write(`bar-backend${sfx}.svg`, bar(tw, D ? { label: 'Backend repository', cap: 'htdocs / sport-booking-api', side: 'r', D, desc: 'Backend repository: htdocs, folder sport-booking-api, the PHP backend of the sports field booking system, on GitHub.' } : { label: 'Backend repo', cap: 'PHP  ·  htdocs', side: 'r', D, desc: 'Backend repo: htdocs, the PHP backend of the sports field booking system, on GitHub.' }))
  write(`ch-stack${sfx}.svg`, label(W, 'II', 'The toolkit', D ? 'Markers show where it was used' : 'Primary and supporting', 'Section II: The toolkit. Primary and supporting tools, with markers for the project that used them.'))
  write(`stack${sfx}.svg`, stack(W))
  write(`connect${sfx}.svg`, connect(W))
  write(`bar-github${sfx}.svg`, connectBar(W))
}

// one source of truth for the README <img alt> of every card: the SVG <desc> (see gen-readme.mjs)
fs.writeFileSync(path.join(here, 'tmp', 'alts.json'), JSON.stringify(ALTS, null, 1))
fs.rmSync(FINAL, { recursive: true, force: true })
fs.renameSync(OUT, FINAL)
