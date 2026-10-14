import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildCatalog } from './build-data.mjs'
import { parseCsv } from './lib/csv.mjs'

const DATA = new URL('../data', import.meta.url).pathname

test('书单数据能通过校验', () => {
  const c = buildCatalog(DATA)
  assert.equal(c.questions.length, 11)
  const picks = c.questions.flatMap((q) => q.sections.flatMap((s) => s.groups.flatMap((g) => g.books.filter((b) => b.must))))
  assert.equal(picks.length, 47)
  // 合著的《组织》只有一本，两位作者都能找到它
  const org = Object.values(c.books).find((b) => b.title === '组织')
  assert.deepEqual(org.authors, ['herbert-simon', 'james-g-march'])
  assert.ok(c.thinkers['james-g-march'].books.includes(org.id))
})

test('坏数据会报出文件和行号', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tbq-'))
  cpSync(DATA, dir, { recursive: true })
  const f = join(dir, 'books.csv')
  writeFileSync(f, readFileSync(f, 'utf8').replace('\nzhuang-zi-1,庄子,,zhuang-zi,', '\nzhuang-zi-1,庄子,,nobody,'))
  assert.throws(() => buildCatalog(dir), /books\.csv 第 2 行: 作者 nobody 不在 thinkers\.csv/)
})

test('CSV 解析支持引号、逗号和换行', () => {
  assert.deepEqual(parseCsv('a,b\n"x, ""y""","1\n2"\n'), [['a', 'b'], ['x, "y"', '1\n2']])
})
