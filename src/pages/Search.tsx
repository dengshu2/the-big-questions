import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { allBooks, allThinkers } from '../data/catalog'
import { BookRow, Top } from '../components/ui'

const LIMIT = 30
const norm = (s: string) => s.toLowerCase().replace(/[\s·・.\-—]/g, '')

export function search(query: string) {
  const q = norm(query)
  if (!q) return { thinkers: [], books: [] }
  const thinkers = allThinkers.filter((t) => norm(t.name).includes(q) || norm(t.nameEn).includes(q))
  const books = allBooks.filter((b) => norm(b.title).includes(q) || norm(b.orig).includes(q))
  return { thinkers, books }
}

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const { thinkers, books } = useMemo(() => search(query), [query])
  const autoFocus = typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches

  const onChange = (v: string) => {
    setQuery(v)
    setParams(v ? { q: v } : {}, { replace: true })
  }

  return (
    <>
      <Top title="搜索" back="/" />
      <main className="q-page q-enter">
        <input
          className="q-search"
          type="search"
          placeholder="书名、思想家，中英文都可以"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          enterKeyHint="search"
          autoComplete="off"
        />

        {query.trim() && !thinkers.length && !books.length && <p className="q-empty">没有找到「{query.trim()}」，换个写法试试。</p>}

        {thinkers.length > 0 && (
          <section className="q-sec">
            <h3>思想家 · {thinkers.length}</h3>
            <ul className="q-rows">
              {thinkers.slice(0, LIMIT).map((t) => (
                <li key={t.slug}>
                  <Link to={`/t/${t.slug}`} className="q-row">
                    <span className="q-row-main">
                      <span>{t.name}</span>
                      <span>{t.line}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {books.length > 0 && (
          <section className="q-sec">
            <h3>书 · {books.length}</h3>
            <ul className="q-rows">
              {books.slice(0, LIMIT).map((b) => (
                <BookRow key={b.id} id={b.id} must={b.places.some((p) => p.must)} />
              ))}
            </ul>
            {books.length > LIMIT && <p className="q-meta">只显示前 {LIMIT} 本，输入更多字可以缩小范围。</p>}
          </section>
        )}
      </main>
    </>
  )
}
