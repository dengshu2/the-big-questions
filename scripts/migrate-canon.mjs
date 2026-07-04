// 一次性迁移脚本：public/database/canon.csv → data/canon.csv（schema 升级）
// 保留在仓库中作为数据来源的 provenance。详见 REFACTOR.md §2.1
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pinyin } from 'pinyin-pro'

const ROOT = new URL('..', import.meta.url).pathname
const SRC_CSV = join(ROOT, 'public/database/canon.csv')
const SRC_THINKERS = join(ROOT, 'public/database/thinkers')
const OUT_DIR = join(ROOT, 'data')
const OUT_THINKERS = join(OUT_DIR, 'thinkers')

// ---------- 读取 ----------
const lines = readFileSync(SRC_CSV, 'utf8').trim().split('\n')
const header = lines[0].split(',')
const rows = lines.slice(1).map((l, i) => {
  const cells = l.split(',')
  if (cells.length !== header.length) throw new Error(`行 ${i + 2}: 列数 ${cells.length} ≠ ${header.length}`)
  return Object.fromEntries(header.map((h, j) => [h, cells[j]]))
})

const oldIndex = JSON.parse(readFileSync(join(SRC_THINKERS, '_index.json'), 'utf8'))
const nameToSlug = new Map(
  Object.entries(oldIndex.thinkers).map(([slug, v]) => [v.nameZh, slug]),
)

// ---------- slug 生成 ----------
const slugify = (en) =>
  en.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const pinyinSlug = (zh) => pinyin(zh, { toneType: 'none', type: 'array' }).join('-')

const ANON_NAMES = new Set(['集体作品', '作者不确定'])
const anonSlugByBook = { 周易: 'anonymous-zhouyi', 诗经: 'anonymous-shijing', 薄伽梵歌: 'anonymous-gita', 希伯来圣经: 'anonymous-hebrew-bible' }

const used = new Set()
const slugByKey = new Map() // 去重键 → slug；匿名实体按 (名, 书) 独立，其余按中文名唯一
function thinkerKey(r) {
  return ANON_NAMES.has(r.thinker_name_zh) ? `${r.thinker_name_zh}|${r.book_title_zh}` : r.thinker_name_zh
}
function assignSlug(r) {
  const key = thinkerKey(r)
  if (slugByKey.has(key)) return slugByKey.get(key)
  let slug
  if (ANON_NAMES.has(r.thinker_name_zh)) {
    slug = anonSlugByBook[r.book_title_zh]
    if (!slug) throw new Error(`匿名作品缺 slug 映射: ${r.book_title_zh}`)
  } else if (nameToSlug.has(r.thinker_name_zh)) {
    slug = nameToSlug.get(r.thinker_name_zh)
  } else if (r.thinker_name_en) {
    slug = slugify(r.thinker_name_en)
  } else {
    slug = pinyinSlug(r.thinker_name_zh)
  }
  if (!slug) throw new Error(`空 slug: ${r.thinker_name_zh}`)
  let unique = slug, n = 2
  while (used.has(unique)) unique = `${slug}-${n++}`
  used.add(unique)
  slugByKey.set(key, unique)
  return unique
}

// ---------- 年份解析 ----------
// 格式仅 4 种：N / 约N / 前N / 约前N
function parseYear(s) {
  if (!s) return ''
  const m = s.match(/^约?(前)?(\d+)$/)
  if (!m) throw new Error(`无法解析年份: ${s}`)
  return m[1] ? -Number(m[2]) : Number(m[2])
}

// 缺年实体的补全/布局估算（display 为空时 UI 显示"生年不详"，num 仅用于星图定位）
// 老子：学界通行传统纪年；匿名作品：成书年代估算；现代作者：活跃年代估算（公开资料无出生年）
const YEAR_FILLS = {
  'lao-zi': { birth: '约前571', birthNum: -571, death: '约前471', deathNum: -471 },
  'anonymous-zhouyi': { birthNum: -800 },
  'anonymous-shijing': { birthNum: -800 },
  'anonymous-gita': { birthNum: -200 },
  'anonymous-hebrew-bible': { birthNum: -600 },
  'richard-dewitt': { birthNum: 1955 },
  'howard-s-friedman': { birthNum: 1950 },
  'rose-anne-kenny': { birthNum: 1958 },
  'philomena-m-bluyssen': { birthNum: 1958 },
}

// ---------- 转换 ----------
const OUT_HEADER = [
  'big_question_id', 'big_question_name', 'section_id', 'section_name', 'discipline',
  'thinker_slug', 'thinker_name_zh', 'thinker_name_en',
  'birth_year', 'birth_year_num', 'death_year', 'death_year_num',
  'nationality', 'is_anonymous', 'year_estimated',
  'book_title_zh', 'book_title_en', 'is_coauthored', 'book_order', 'is_minimum_list',
  'wikipedia_url',
]
const bool = (v) => (v === '是' ? 'true' : 'false')

const outRows = rows.map((r) => {
  const slug = assignSlug(r)
  const isAnon = ANON_NAMES.has(r.thinker_name_zh)
  let birth = r.birth_year, death = r.death_year
  let birthNum = parseYear(birth), deathNum = parseYear(death)
  let estimated = /约/.test(birth + death)
  const fill = YEAR_FILLS[slug]
  if (fill && birthNum === '') {
    birth = fill.birth ?? birth
    birthNum = fill.birthNum
    death = fill.death ?? death
    deathNum = fill.deathNum ?? deathNum
    estimated = true
  }
  if (birthNum === '') throw new Error(`仍缺出生年: ${slug}`)
  return [
    r.big_question_id, r.big_question_name, r.section_id, r.section_name, r.discipline,
    slug, r.thinker_name_zh, r.thinker_name_en,
    birth, birthNum, death, deathNum,
    r.nationality, String(isAnon), String(estimated),
    r.book_title_zh, r.book_title_en, bool(r.is_coauthored), r.book_order, bool(r.is_minimum_list),
    r.wikipedia_url,
  ].join(',')
})

mkdirSync(OUT_THINKERS, { recursive: true })
writeFileSync(join(OUT_DIR, 'canon.csv'), [OUT_HEADER.join(','), ...outRows].join('\n') + '\n')

// ---------- 迁移 md 文章：加 frontmatter slug ----------
const mdFiles = readdirSync(SRC_THINKERS).filter((f) => f.endsWith('.md') && f !== '_prompt.md')
let mdCount = 0
for (const f of mdFiles) {
  const slug = f.replace(/\.md$/, '')
  if (!used.has(slug)) throw new Error(`md 文章的 slug 不在 canon 中: ${slug}`)
  const body = readFileSync(join(SRC_THINKERS, f), 'utf8')
  const withFm = body.startsWith('---\n') ? body : `---\nslug: ${slug}\n---\n\n${body}`
  writeFileSync(join(OUT_THINKERS, f), withFm)
  mdCount++
}
writeFileSync(join(OUT_THINKERS, '_prompt.md'), readFileSync(join(SRC_THINKERS, '_prompt.md')))

// ---------- 报告 ----------
const uniqueThinkers = slugByKey.size
const multi = new Map()
for (const r of rows) {
  const s = slugByKey.get(thinkerKey(r))
  if (!multi.has(s)) multi.set(s, new Set())
  multi.get(s).add(r.big_question_id)
}
const doubles = [...multi.entries()].filter(([, qs]) => qs.size > 1)
console.log(`✓ ${outRows.length} 行 → data/canon.csv`)
console.log(`✓ ${uniqueThinkers} 位思想家（含匿名实体），双星 ${doubles.length} 位`)
console.log(`✓ ${mdCount} 篇文章 + _prompt.md → data/thinkers/`)
console.log('双星:', doubles.map(([s]) => s).join(', '))
