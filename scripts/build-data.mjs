// 构建期数据管线：校验 data/ 下的书单数据 → 生成前端使用的 src/data/catalog.json
// 任何数据错误都会让构建失败，并指出文件和行号。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { readCsv } from './lib/csv.mjs'

const ROOT = new URL('..', import.meta.url).pathname

export function buildCatalog(dataDir) {
  const errors = []
  const fail = (msg) => errors.push(msg)
  const read = (f) => readCsv(join(dataDir, f)).map((r) => ({ ...r, at: `${f} 第 ${r._row} 行` }))

  const questionRows = read('questions.csv')
  const sectionRows = read('sections.csv')
  const thinkerRows = read('thinkers.csv')
  const bookRows = read('books.csv')
  const placementRows = read('placements.csv')
  const about = readFileSync(join(dataDir, 'about.md'), 'utf8').trim().split(/\n\s*\n/).map((p) => p.trim())

  const len = (s) => [...s].length
  const need = (r, field, min, max) => {
    const n = len(r[field])
    if (n < min || n > max) fail(`${r.at}: ${field} 长度 ${n}，应在 ${min}–${max}`)
  }
  const unique = (rows, key, file) => {
    const seen = new Set()
    for (const r of rows) {
      if (!r[key]) fail(`${r.at}: 缺 ${key}`)
      if (seen.has(r[key])) fail(`${file}: ${key} ${r[key]} 重复`)
      seen.add(r[key])
    }
  }
  unique(questionRows, 'id', 'questions.csv')
  unique(sectionRows, 'id', 'sections.csv')
  unique(thinkerRows, 'slug', 'thinkers.csv')
  unique(bookRows, 'id', 'books.csv')

  // ---------- 思想家 ----------
  const thinkers = {}
  for (const r of thinkerRows) {
    const birthNum = r.birth_num === '' ? null : Number(r.birth_num)
    if (birthNum != null && !Number.isInteger(birthNum)) fail(`${r.at}: birth_num 不是整数`)
    if (r.death_num !== '' && !Number.isInteger(Number(r.death_num))) fail(`${r.at}: death_num 不是整数`)
    need(r, 'line', 10, 32)
    need(r, 'brief', 100, 260)
    thinkers[r.slug] = {
      slug: r.slug,
      name: r.name_zh,
      nameEn: r.name_en,
      birth: r.birth,
      death: r.death,
      year: birthNum,
      nationality: r.nationality,
      wikipedia: r.wikipedia,
      line: r.line,
      brief: r.brief,
      books: [],
    }
  }

  // ---------- 书 ----------
  const books = {}
  for (const r of bookRows) {
    const authors = r.authors.split('|').filter(Boolean)
    if (!authors.length) fail(`${r.at}: 缺作者`)
    for (const a of authors) {
      if (!thinkers[a]) fail(`${r.at}: 作者 ${a} 不在 thinkers.csv`)
      else thinkers[a].books.push(r.id)
    }
    need(r, 'note', 8, 40)
    if (r.credit) need(r, 'credit', 8, 70)
    books[r.id] = { id: r.id, title: r.title, orig: r.orig, note: r.note, credit: r.credit, authors, places: [] }
  }

  // ---------- 问题、章节与书的位置 ----------
  const questions = questionRows.map((r) => {
    need(r, 'summary', 8, 24)
    need(r, 'intro', 80, 320)
    return { id: r.id, name: r.name, summary: r.summary, intro: r.intro, sections: [] }
  })
  const questionById = new Map(questions.map((q) => [q.id, q]))
  const sectionById = new Map()
  for (const r of sectionRows) {
    const q = questionById.get(r.question_id)
    if (!q) { fail(`${r.at}: 问题 ${r.question_id} 不存在`); continue }
    need(r, 'note', 10, 50)
    const s = { id: r.id, name: r.name, note: r.note, groups: [] }
    q.sections.push(s)
    sectionById.set(r.id, { s, q })
  }
  const placed = new Set()
  for (const r of placementRows) {
    const hit = sectionById.get(r.section_id)
    const book = books[r.book_id]
    if (!hit) { fail(`${r.at}: 章节 ${r.section_id} 不存在`); continue }
    if (!book) { fail(`${r.at}: 书 ${r.book_id} 不存在`); continue }
    if (!['true', 'false'].includes(r.must)) fail(`${r.at}: must 只能是 true/false`)
    if (!r.discipline) fail(`${r.at}: 缺学科`)
    const key = `${r.section_id}|${r.book_id}`
    if (placed.has(key)) fail(`${r.at}: 同一本书在 ${r.section_id} 出现两次`)
    placed.add(key)
    const { s, q } = hit
    let g = s.groups.at(-1)
    if (!g || g.name !== r.discipline) {
      if (s.groups.some((x) => x.name === r.discipline)) fail(`${r.at}: 学科「${r.discipline}」在 ${s.id} 里不连续`)
      g = { name: r.discipline, books: [] }
      s.groups.push(g)
    }
    const must = r.must === 'true'
    g.books.push(must ? { id: r.book_id, must } : { id: r.book_id })
    book.places.push({ question: q.id, section: s.id, group: r.discipline, must })
  }
  for (const b of Object.values(books)) if (!b.places.length) fail(`books.csv: ${b.id} 没有出现在任何章节`)
  for (const t of Object.values(thinkers)) if (!t.books.length) fail(`thinkers.csv: ${t.slug} 没有任何书`)
  for (const q of questions) for (const s of q.sections) {
    if (!s.groups.length) fail(`sections.csv: ${s.id} 没有书`)
    if (s.groups.flatMap((g) => g.books).filter((b) => b.must).length > 1) fail(`placements.csv: ${s.id} 的首选超过一本`)
  }

  if (errors.length) {
    const e = new Error(`数据校验失败（${errors.length} 处）:\n` + errors.slice(0, 30).map((m) => `  ✗ ${m}`).join('\n') + (errors.length > 30 ? `\n  …另有 ${errors.length - 30} 处` : ''))
    e.errors = errors
    throw e
  }
  return { about, questions, thinkers, books }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const catalog = buildCatalog(join(ROOT, 'data'))
    mkdirSync(join(ROOT, 'src/data'), { recursive: true })
    writeFileSync(join(ROOT, 'src/data/catalog.json'), JSON.stringify(catalog))
    console.log(`✓ ${catalog.questions.length} 个问题 · ${Object.keys(catalog.thinkers).length} 位思想家 · ${Object.keys(catalog.books).length} 本书`)
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
