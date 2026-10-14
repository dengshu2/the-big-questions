import { search } from './Search'

test('按中文名、英文名和书名搜索', () => {
  expect(search('达尔文').thinkers.map((t) => t.slug)).toContain('charles-darwin')
  expect(search('darwin').thinkers.map((t) => t.slug)).toContain('charles-darwin')
  expect(search('物种起源').books.map((b) => b.id)).toContain('charles-darwin-1')
  expect(search('  ').books).toHaveLength(0)
})
