// 构建期数据管线：校验三份策展数据 → 生成前端消费的 JSON 与文章静态拷贝
// data/canon.csv + data/dialogues.csv + data/thinkers/*.md
//   → src/data/generated/{questions,thinkers,atlas,meta}.json + public/thinkers/*.md
// 任何数据错误在此处失败并指出位置。详见 REFACTOR.md §2.3
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DATA = join(ROOT, 'data')
const GEN = join(ROOT, 'src/data/generated')
const PUB_THINKERS = join(ROOT, 'public/thinkers')

const fail = (msg) => { console.error(`✗ 数据校验失败: ${msg}`); process.exit(1) }

// ---------- CSV 解析（数据无引号字段，迁移脚本已保证） ----------
function readCsv(file) {
  const lines = readFileSync(join(DATA, file), 'utf8').trim().split('\n')
  const header = lines[0].split(',')
  return lines.slice(1).map((l, i) => {
    const cells = l.split(',')
    if (cells.length !== header.length) fail(`${file} 第 ${i + 2} 行: 列数 ${cells.length} ≠ ${header.length}`)
    return Object.fromEntries(header.map((h, j) => [h, cells[j]]))
  })
}

const rows = readCsv('canon.csv')
const dialogueRows = readCsv('dialogues.csv')
const blurbs = JSON.parse(readFileSync(join(DATA, 'blurbs.json'), 'utf8'))

// ---------- 聚合思想家 ----------
const thinkers = new Map()
const questionMeta = new Map() // id → { name, sections: Map(id → {name, disciplines: Map(name → [slug])}) }

for (const [i, r] of rows.entries()) {
  const line = i + 2
  const qid = Number(r.big_question_id)
  const birthNum = Number(r.birth_year_num)
  if (!r.thinker_slug) fail(`canon.csv 第 ${line} 行: 缺 thinker_slug`)
  if (!Number.isFinite(birthNum)) fail(`canon.csv 第 ${line} 行: birth_year_num 非数字`)

  if (!questionMeta.has(qid)) questionMeta.set(qid, { name: r.big_question_name, sections: new Map() })
  const q = questionMeta.get(qid)
  if (q.name !== r.big_question_name) fail(`canon.csv 第 ${line} 行: Q${qid} 名称不一致`)
  if (!q.sections.has(r.section_id)) q.sections.set(r.section_id, { name: r.section_name, disciplines: new Map() })
  const sec = q.sections.get(r.section_id)
  if (!sec.disciplines.has(r.discipline)) sec.disciplines.set(r.discipline, [])

  let t = thinkers.get(r.thinker_slug)
  if (!t) {
    t = {
      slug: r.thinker_slug, nameZh: r.thinker_name_zh, nameEn: r.thinker_name_en,
      birthYear: r.birth_year, deathYear: r.death_year,
      birthNum, deathNum: r.death_year_num === '' ? null : Number(r.death_year_num),
      nationality: r.nationality, wikipediaUrl: r.wikipedia_url,
      isAnonymous: r.is_anonymous === 'true', yearEstimated: r.year_estimated === 'true',
      questions: [], books: [], hasEssay: false, dialogues: [],
    }
    thinkers.set(t.slug, t)
  } else if (t.nameZh !== r.thinker_name_zh || t.birthYear !== r.birth_year || t.nationality !== r.nationality) {
    fail(`canon.csv 第 ${line} 行: ${r.thinker_slug} 元数据与先前行不一致`)
  }
  if (!t.questions.includes(qid)) t.questions.push(qid)
  if (!sec.disciplines.get(r.discipline).includes(t.slug)) sec.disciplines.get(r.discipline).push(t.slug)
  t.books.push({
    titleZh: r.book_title_zh, titleEn: r.book_title_en, order: Number(r.book_order),
    minimum: r.is_minimum_list === 'true', coauthored: r.is_coauthored === 'true',
    questionId: qid, sectionId: r.section_id, sectionName: r.section_name, discipline: r.discipline,
  })
}

for (const t of thinkers.values()) {
  t.questions.sort((a, b) => a - b)
  t.books.sort((a, b) => a.questionId - b.questionId || a.order - b.order)
  // 星等：一等 = 有必读书目；其余按著作数
  const bookCount = t.books.length
  t.magnitude = t.books.some((b) => b.minimum) ? 1 : bookCount >= 3 ? 2 : bookCount === 2 ? 3 : 4
}

// ---------- 校验文章与对话 ----------
const essayFiles = readdirSync(join(DATA, 'thinkers')).filter((f) => f.endsWith('.md') && f !== '_prompt.md')
for (const f of essayFiles) {
  const raw = readFileSync(join(DATA, 'thinkers', f), 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) fail(`data/thinkers/${f}: 缺 frontmatter`)
  const slug = (m[1].match(/^slug:\s*(.+)$/m) || [])[1]?.trim()
  if (!slug) fail(`data/thinkers/${f}: frontmatter 缺 slug`)
  if (slug !== f.replace(/\.md$/, '')) fail(`data/thinkers/${f}: slug 与文件名不一致`)
  if (!thinkers.has(slug)) fail(`data/thinkers/${f}: slug 不存在于 canon.csv`)
  thinkers.get(slug).hasEssay = true
}

// 星签（一句话定位）与简志（150~250 字）校验并挂载
for (const [slug, b] of Object.entries(blurbs)) {
  if (!thinkers.has(slug)) fail(`blurbs.json: slug ${slug} 不存在于 canon.csv`)
  if (!b.line || b.line.length < 6 || b.line.length > 45) fail(`blurbs.json: ${slug} 的 line 长度越界`)
  if (b.brief && (b.brief.length < 100 || b.brief.length > 300)) fail(`blurbs.json: ${slug} 的 brief 长度越界`)
  thinkers.get(slug).line = b.line
  if (b.brief) thinkers.get(slug).brief = b.brief
}
const noLine = [...thinkers.keys()].filter((s) => !blurbs[s]?.line)
if (noLine.length) fail(`缺星签: ${noLine.slice(0, 5).join(', ')} 等 ${noLine.length} 位`)

const seenPairs = new Set()
for (const [i, d] of dialogueRows.entries()) {
  const line = i + 2
  if (!thinkers.has(d.from_slug)) fail(`dialogues.csv 第 ${line} 行: from_slug ${d.from_slug} 不存在`)
  if (!thinkers.has(d.to_slug)) fail(`dialogues.csv 第 ${line} 行: to_slug ${d.to_slug} 不存在`)
  if (d.from_slug === d.to_slug) fail(`dialogues.csv 第 ${line} 行: 不能自我对话`)
  if (!['extends', 'refutes'].includes(d.type)) fail(`dialogues.csv 第 ${line} 行: type 必须是 extends/refutes`)
  if (!d.note) fail(`dialogues.csv 第 ${line} 行: 缺 note`)
  const key = [d.from_slug, d.to_slug].sort().join('|')
  if (seenPairs.has(key)) fail(`dialogues.csv 第 ${line} 行: ${key} 重复`)
  seenPairs.add(key)
  thinkers.get(d.from_slug).dialogues.push({ with: d.to_slug, dir: 'out', type: d.type, note: d.note })
  thinkers.get(d.to_slug).dialogues.push({ with: d.from_slug, dir: 'in', type: d.type, note: d.note })
}

// ---------- L0 天球布局 ----------
// 画布 1600×1100。星座中心与半径手工调校（互不重叠已验算），星位 = 种子随机 + 迭代避让
const SKY = { width: 1600, height: 1100 }
const CENTERS = {
  0: { cx: 1050, cy: 450, R: 80 }, 1: { cx: 280, cy: 310, R: 150 }, 2: { cx: 700, cy: 200, R: 145 },
  3: { cx: 1150, cy: 180, R: 135 }, 4: { cx: 1420, cy: 420, R: 140 }, 5: { cx: 1310, cy: 760, R: 145 },
  6: { cx: 960, cy: 850, R: 145 }, 7: { cx: 780, cy: 550, R: 135 }, 8: { cx: 400, cy: 650, R: 205 },
  9: { cx: 640, cy: 930, R: 130 }, 10: { cx: 160, cy: 880, R: 125 },
}
const RADIUS = { 1: 7, 2: 5, 3: 3.5, 4: 2.6 }

function hashCode(s) { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
function mulberry32(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

const constellations = []
for (const [qid, meta] of [...questionMeta.entries()].sort((a, b) => a[0] - b[0])) {
  const { cx, cy, R } = CENTERS[qid] ?? fail(`Q${qid} 缺星座中心配置`)
  const members = [...thinkers.values()].filter((t) => t.questions[0] === qid)
  const stars = members.map((t) => {
    const rnd = mulberry32(hashCode(t.slug))
    const a = rnd() * Math.PI * 2
    const rr = R * 0.88 * Math.sqrt(rnd())
    return { slug: t.slug, x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr, r: RADIUS[t.magnitude], double: t.questions.length > 1 }
  })
  for (let iter = 0; iter < 200; iter++) {
    for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) {
      const a = stars[i], b = stars[j]
      const min = a.r + b.r + 9
      let dx = b.x - a.x, dy = b.y - a.y
      let d = Math.hypot(dx, dy)
      if (d < min) {
        if (d < 0.01) { dx = 1; dy = 0; d = 1 }
        const push = (min - d) / 2 / d
        a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push
      }
    }
    for (const s of stars) {
      const dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy), max = R * 0.95
      if (d > max) { s.x = cx + (dx / d) * max; s.y = cy + (dy / d) * max }
    }
  }
  // 一等星星名在天球常显：按文本框做矩形避让，防止星名互相叠压
  const mag1 = stars.filter((s) => thinkers.get(s.slug).magnitude === 1)
  const labelHalfW = (slug) => thinkers.get(slug).nameZh.length * 6.6 / 2 + 8
  for (let iter = 0; iter < 80; iter++) {
    let moved = false
    for (let i = 0; i < mag1.length; i++) for (let j = i + 1; j < mag1.length; j++) {
      const a = mag1[i], b = mag1[j]
      const needX = labelHalfW(a.slug) + labelHalfW(b.slug)
      const needY = 26
      let dx = b.x - a.x
      const dy = b.y - a.y
      const ox = needX - Math.abs(dx), oy = needY - Math.abs(dy)
      if (ox > 0 && oy > 0) {
        moved = true
        if (dx === 0) dx = 1
        if (ox / needX < oy / needY) {
          const push = (ox / 2) * Math.sign(dx)
          a.x -= push; b.x += push
        } else {
          const push = (oy / 2) * Math.sign(dy || 1)
          a.y -= push; b.y += push
        }
      }
    }
    if (!moved) break
  }
  // 标签避让后补一轮点避让并收回界内
  for (let iter = 0; iter < 60; iter++) {
    for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) {
      const a = stars[i], b = stars[j]
      const min = a.r + b.r + 9
      let dx = b.x - a.x, dy = b.y - a.y
      let d = Math.hypot(dx, dy)
      if (d < min) {
        if (d < 0.01) { dx = 1; dy = 0; d = 1 }
        const aFixed = thinkers.get(a.slug).magnitude === 1
        const bFixed = thinkers.get(b.slug).magnitude === 1
        const push = (min - d) / d
        if (aFixed && !bFixed) { b.x += dx * push; b.y += dy * push }
        else if (bFixed && !aFixed) { a.x -= dx * push; a.y -= dy * push }
        else { a.x -= dx * push / 2; a.y -= dy * push / 2; b.x += dx * push / 2; b.y += dy * push / 2 }
      }
    }
    for (const s of stars) {
      const dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy), max = R * 1.02
      if (d > max) { s.x = cx + (dx / d) * max; s.y = cy + (dy / d) * max }
    }
  }
  // 座形连线：最亮 ≤8 颗按年代连成折线
  const bright = members
    .sort((a, b) => a.magnitude - b.magnitude || b.books.length - a.books.length)
    .slice(0, Math.min(8, Math.max(4, Math.floor(members.length / 4))))
    .sort((a, b) => a.birthNum - b.birthNum)
    .map((t) => t.slug)
  const lines = bright.slice(1).map((s, i) => [bright[i], s])
  constellations.push({ id: qid, name: meta.name, cx, cy, R, stars, lines })
}

// 双星虚线：从副星座最近的座形亮星连到双星本体
const starPos = new Map(constellations.flatMap((c) => c.stars.map((s) => [s.slug, s])))
const doubleLinks = []
for (const t of thinkers.values()) {
  if (t.questions.length < 2) continue
  const pos = starPos.get(t.slug)
  for (const qid of t.questions.slice(1)) {
    const c = constellations.find((k) => k.id === qid)
    const candidates = new Set(c.lines.flat())
    let best = null, bestD = Infinity
    for (const slug of candidates) {
      const p = starPos.get(slug)
      const d = Math.hypot(p.x - pos.x, p.y - pos.y)
      if (d < bestD) { bestD = d; best = slug }
    }
    if (best) doubleLinks.push({ question: qid, from: best, to: t.slug })
  }
}

// ---------- L1 星座内时间轴布局 ----------
// 混合刻度：0.45 线性年份 + 0.55 排名分位 → 稀疏上古与稠密现代都可读；单调保序
// 宽度按人数动态给足呼吸感
const l1 = {}
for (const c of constellations) {
  const members = [...thinkers.values()].filter((t) => t.questions.includes(c.id)).sort((a, b) => a.birthNum - b.birthNum)
  const width = Math.max(2200, members.length * 72 + 480)
  const years = members.map((t) => t.birthNum)
  const minY = years[0], maxY = years[years.length - 1], span = Math.max(1, maxY - minY)
  const xOf = (y) => {
    let lo = 0; while (lo < years.length && years[lo] < y) lo++
    let hi = lo; while (hi < years.length && years[hi] === y) hi++
    const rank = years.length <= 1 ? 0.5 : (lo + hi) / 2 / (years.length - 1)
    return Math.round(width * (0.05 + 0.9 * (0.55 * Math.min(rank, 1) + 0.45 * ((y - minY) / span))))
  }
  const laneLastX = []
  const stars = members.map((t) => {
    const x = xOf(t.birthNum)
    let lane = laneLastX.findIndex((last) => x - last >= 150)
    if (lane === -1) { lane = laneLastX.length; laneLastX.push(x) } else laneLastX[lane] = x
    if (lane > 3) lane = lane % 4
    return { slug: t.slug, x, lane }
  })
  const ticks = [-1000, -500, -300, 0, 300, 600, 900, 1200, 1500, 1700, 1800, 1850, 1900, 1950, 2000]
    .filter((y) => y >= minY - 30 && y <= maxY + 30)
    .map((y) => ({ year: y, x: xOf(y) }))
    .filter((t, i, arr) => i === 0 || t.x - arr[i - 1].x > 110)
  const inQ = new Set(members.map((t) => t.slug))
  const arcs = dialogueRows
    .filter((d) => inQ.has(d.from_slug) && inQ.has(d.to_slug))
    .map((d) => ({ from: d.from_slug, to: d.to_slug, type: d.type, note: d.note }))
  l1[c.id] = { width, stars, ticks, arcs }
}

// ---------- 输出 ----------
rmSync(GEN, { recursive: true, force: true })
mkdirSync(GEN, { recursive: true })
rmSync(PUB_THINKERS, { recursive: true, force: true })
mkdirSync(PUB_THINKERS, { recursive: true })

const questionsOut = [...questionMeta.entries()].sort((a, b) => a[0] - b[0]).map(([id, q]) => {
  const members = [...thinkers.values()].filter((t) => t.questions.includes(id))
  return {
    id, name: q.name,
    thinkerCount: members.length,
    bookCount: members.reduce((n, t) => n + t.books.filter((b) => b.questionId === id).length, 0),
    minimumCount: members.filter((t) => t.books.some((b) => b.minimum && b.questionId === id)).length,
    sections: [...q.sections.entries()].map(([sid, s]) => ({
      id: sid, name: s.name,
      disciplines: [...s.disciplines.entries()].map(([name, slugs]) => ({ name, slugs })),
    })),
  }
})

const thinkersOut = Object.fromEntries([...thinkers.entries()].map(([slug, t]) => [slug, t]))
const meta = {
  thinkerCount: thinkers.size,
  bookCount: rows.length,
  questionCount: questionMeta.size,
  essayCount: essayFiles.length,
  briefCount: [...thinkers.values()].filter((t) => t.brief).length,
  dialogueCount: dialogueRows.length,
  minimumCount: [...thinkers.values()].filter((t) => t.magnitude === 1).length,
  doubleStars: [...thinkers.values()].filter((t) => t.questions.length > 1).map((t) => t.slug),
  yearRange: [Math.min(...[...thinkers.values()].map((t) => t.birthNum)), Math.max(...[...thinkers.values()].map((t) => t.birthNum))],
}

writeFileSync(join(GEN, 'questions.json'), JSON.stringify(questionsOut))
writeFileSync(join(GEN, 'thinkers.json'), JSON.stringify(thinkersOut))
writeFileSync(join(GEN, 'atlas.json'), JSON.stringify({ sky: SKY, constellations, doubleLinks, l1 }))
writeFileSync(join(GEN, 'meta.json'), JSON.stringify(meta))

for (const f of essayFiles) {
  const raw = readFileSync(join(DATA, 'thinkers', f), 'utf8')
  writeFileSync(join(PUB_THINKERS, f), raw.replace(/^---\n[\s\S]*?\n---\n\s*/, ''))
}
writeFileSync(join(PUB_THINKERS, '_prompt.md'), readFileSync(join(DATA, 'thinkers', '_prompt.md')))

console.log(`✓ ${meta.thinkerCount} 思想家 · ${meta.bookCount} 著作 · ${meta.essayCount} 文章 · ${meta.dialogueCount} 对话 · 双星 ${meta.doubleStars.length}`)
console.log(`✓ 生成 src/data/generated/{questions,thinkers,atlas,meta}.json + public/thinkers/`)
