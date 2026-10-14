import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { allBooks, allThinkers } from '../data/catalog'
import { BookItem, Top, useOpenBook, useTitle } from '../components/ui'

const LIMIT = 30
const norm = (s: string) => s.toLowerCase().replace(/[\s·・.\-—]/g, '')

/** 思想家按姓名匹配，书按书名匹配；思想家结果直接带出他在书单里的书 */
export function search(query: string) {
  const q = norm(query)
  if (!q) return { thinkers: [], books: [] }
  const thinkers = allThinkers.filter((t) => norm(t.name).includes(q) || norm(t.nameEn).includes(q))
  const books = allBooks.filter((b) => norm(b.title).includes(q) || norm(b.orig).includes(q))
  return { thinkers, books }
}

export default function Search() {
  useTitle('搜索')
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [open, toggle] = useOpenBook()
  const { thinkers, books } = useMemo(() => search(query), [query])
  const autoFocus = typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches

  const onChange = (v: string) => {
    setQuery(v)
    setParams(v ? { q: v } : {}, { replace: true })
  }

  return (
    <>
      <Top title="搜索" back="/" />
      <main className="q-page narrow">
        <input
          className="q-search"
          type="search"
          placeholder="书名或思想家，中英文都可以"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          enterKeyHint="search"
          autoComplete="off"
        />

        {query.trim() && !thinkers.length && !books.length && <p className="q-empty">没有找到「{query.trim()}」，换个写法试试。</p>}

        {thinkers.slice(0, 8).map((t) => (
          <section key={t.slug} className="q-sec">
            <div className="who">
              <p className="author-name">{t.name}</p>
              <p className="q-meta">{t.line}</p>
            </div>
            <ul className="q-rows books">
              {t.books.map((id) => (
                <BookItem key={id} id={id} open={open === id} onToggle={toggle} />
              ))}
            </ul>
          </section>
        ))}
        {thinkers.length > 8 && <p className="q-meta">还有 {thinkers.length - 8} 位思想家，输入更多字可以缩小范围。</p>}

        {books.length > 0 && (
          <section className="q-sec">
            <h3>书名 · {books.length}</h3>
            <ul className="q-rows books">
              {books.slice(0, LIMIT).map((b) => (
                <BookItem key={b.id} id={b.id} open={open === b.id} onToggle={toggle} />
              ))}
            </ul>
            {books.length > LIMIT && <p className="q-meta">只显示前 {LIMIT} 本，输入更多字可以缩小范围。</p>}
          </section>
        )}
      </main>
    </>
  )
}
