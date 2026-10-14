// 一次性迁移（v3）：data/canon.csv 拆成规范化的几张表，并按 Wikidata 快照修正事实。
// 保留作来源记录；迁移完成后 data/ 下的新表才是权威数据，不要再运行。
//   输入：scripts/migrate/canon-v2.csv（v2 的原始总表）、scripts/migrate/wikidata-2026-10-14.json
//   输出：data/{questions,sections,thinkers,books,placements}.csv
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readCsv, writeCsv } from '../lib/csv.mjs'

const ROOT = new URL('../..', import.meta.url).pathname
const DATA = join(ROOT, 'data')
const canon = readCsv(new URL('./canon-v2.csv', import.meta.url).pathname)
const wd = JSON.parse(readFileSync(new URL('./wikidata-2026-10-14.json', import.meta.url), 'utf8'))

// ---------- 人工裁定的修正 ----------
// 同一人被录成两个 slug
const MERGE = { 'niccolo-machiavelli-2': 'niccolo-machiavelli' }
// 古人生卒年学界有争议，保留原估算，不跟 Wikidata
const KEEP_YEARS = new Set(['lao-zi', 'mo-zi', 'shi-jia-mu-ni', 'thucydides', 'wang-wei', 'cao-xue-qin'])
const PATCH = {
  'niccolo-machiavelli': { name_zh: '尼科洛·马基雅维利' },
  'sima-qian': { death: '约前86', death_num: '-86' },
  'cao-xue-qin': { birth: '约1715' },
  'benedict-anderson': { nationality: '爱尔兰' },
  'john-hattie': { nationality: '新西兰' },
  'peter-m-gollwitzer': { nationality: '德国' },
  'keith-e-stanovich': { nationality: '美国' },
  // zh 维基同名页是经济学家奈特，改用英文条目
  'zuo-teng-xin-fu': { name_en: 'Nobuo Sato' },
  'frank-h-netter': { name_en: 'Frank H. Netter', wikipedia: 'https://en.wikipedia.org/wiki/Frank_H._Netter' },
  // 匿名作品：原表四条都叫"集体作品/作者不确定"，按作品区分
  'anonymous-zhouyi': { name_zh: '周易作者群' },
  'anonymous-shijing': { name_zh: '诗经作者群' },
  'anonymous-gita': { name_zh: '薄伽梵歌作者群' },
  'anonymous-hebrew-bible': { name_zh: '希伯来圣经作者群' },
}

const fmtYear = (n) => (n < 0 ? `前${-n}` : String(n))

// ---------- 思想家 ----------
const thinkers = new Map()
for (const r of canon) {
  const slug = MERGE[r.thinker_slug] ?? r.thinker_slug
  if (thinkers.has(slug)) continue
  const w = wd[slug]
  const t = {
    slug,
    name_zh: r.thinker_name_zh,
    name_en: r.thinker_name_en,
    birth: r.birth_year,
    death: r.death_year,
    birth_num: r.birth_year_num,
    death_num: r.death_year_num,
    approx: r.year_estimated === 'true' || r.birth_year.startsWith('约') ? 'true' : 'false',
    nationality: r.nationality,
    wikidata: '',
    wikipedia: w ? '' : r.wikipedia_url,
    line: '',
    brief: '',
  }
  if (w && w.qid) {
    t.wikidata = w.qid
    t.wikipedia = w.zhwiki || w.enwiki || ''
    if (!t.name_en && w.en && t.nationality !== '中国') t.name_en = w.en
    if (!KEEP_YEARS.has(slug)) {
      const b = Number(t.birth_num)
      if (w.birth != null && (t.birth_num === '' || Math.abs(w.birth - b) > 1)) {
        t.birth = fmtYear(w.birth); t.birth_num = String(w.birth)
      }
      const d = t.death_num === '' ? null : Number(t.death_num)
      if (w.death != null && (d == null || Math.abs(w.death - d) > 1)) {
        t.death = fmtYear(w.death); t.death_num = String(w.death)
      }
    }
  }
  Object.assign(t, PATCH[slug])
  thinkers.set(slug, t)
}
// 匿名作品：不是人，名字改成作品性质的说明
for (const t of thinkers.values()) if (t.slug.startsWith('anonymous-')) t.name_en = ''

// ---------- 问题与章节 ----------
const questions = new Map()
const sections = new Map()
for (const r of canon) {
  if (!questions.has(r.big_question_id)) questions.set(r.big_question_id, { id: r.big_question_id, name: r.big_question_name, summary: '', intro: '' })
  if (!sections.has(r.section_id)) sections.set(r.section_id, { id: r.section_id, question_id: r.big_question_id, name: r.section_name, note: '' })
}

// ---------- 书与位置 ----------
// 同名同作者 = 同一本书；两位书单内作者同名合著（is_coauthored 且书名相同、同一章节）也合并
const books = new Map() // key → book
const keyOf = new Map() // `${title}|${slug}` → key
const placements = []
const perThinker = new Map()
for (const r of canon) {
  const slug = MERGE[r.thinker_slug] ?? r.thinker_slug
  const title = r.book_title_zh
  let key = keyOf.get(`${title}|${slug}`)
  if (!key && r.is_coauthored === 'true') {
    const partner = canon.find((o) => o !== r && o.book_title_zh === title && o.section_id === r.section_id && o.is_coauthored === 'true')
    if (partner) key = keyOf.get(`${title}|${MERGE[partner.thinker_slug] ?? partner.thinker_slug}`)
  }
  if (!key) {
    const n = (perThinker.get(slug) ?? 0) + 1
    perThinker.set(slug, n)
    key = `${slug}-${n}`
    books.set(key, { id: key, title, orig: r.book_title_en, authors: slug, note: '' })
  } else {
    const b = books.get(key)
    if (!b.authors.split('|').includes(slug)) b.authors += `|${slug}`
    if (!b.orig && r.book_title_en) b.orig = r.book_title_en
  }
  keyOf.set(`${title}|${slug}`, key)
  const dup = placements.find((p) => p.section_id === r.section_id && p.book_id === key)
  if (dup) { if (r.is_minimum_list === 'true') dup.must = 'true'; continue }
  placements.push({ section_id: r.section_id, discipline: r.discipline, book_id: key, must: r.is_minimum_list })
}

writeCsv(join(DATA, 'questions.csv'), ['id', 'name', 'summary', 'intro'], [...questions.values()])
writeCsv(join(DATA, 'sections.csv'), ['id', 'question_id', 'name', 'note'], [...sections.values()])
writeCsv(join(DATA, 'thinkers.csv'), ['slug', 'name_zh', 'name_en', 'birth', 'death', 'birth_num', 'death_num', 'approx', 'nationality', 'wikidata', 'wikipedia', 'line', 'brief'], [...thinkers.values()])
writeCsv(join(DATA, 'books.csv'), ['id', 'title', 'orig', 'authors', 'note'], [...books.values()])
writeCsv(join(DATA, 'placements.csv'), ['section_id', 'discipline', 'book_id', 'must'], placements)

console.log(`✓ ${questions.size} 问题 · ${sections.size} 章节 · ${thinkers.size} 思想家 · ${books.size} 本书 · ${placements.length} 个位置`)
