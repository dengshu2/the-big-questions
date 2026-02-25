import { Suspense, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCanonData } from '../data'
import type { CanonRow } from '../data/types'
import { SiteNav } from '../components/SiteNav'
import './MinimumListPage.css'

const ACCENT_COLORS = [
  'var(--color-accent-gold)',
  'var(--color-accent-blue)',
  'var(--color-accent-emerald)',
  'var(--color-accent-purple)',
  'var(--color-accent-rose)',
]

interface ThinkerGroup {
  nameZh: string
  nameEn: string
  nationality: string
  birthYear: string
  deathYear: string
  wikipediaUrl: string
  books: { titleZh: string; titleEn: string; isCoauthored: boolean }[]
}

interface QuestionGroup {
  id: number
  name: string
  thinkers: ThinkerGroup[]
  bookCount: number
}

function groupByQuestionAndThinker(rows: CanonRow[]): QuestionGroup[] {
  const questionMap = new Map<number, { name: string; thinkerMap: Map<string, ThinkerGroup> }>()

  for (const row of rows) {
    if (!questionMap.has(row.big_question_id)) {
      questionMap.set(row.big_question_id, { name: row.big_question_name, thinkerMap: new Map() })
    }
    const q = questionMap.get(row.big_question_id)!

    const thinkerKey = `${row.thinker_name_zh}::${row.discipline}`
    if (!q.thinkerMap.has(thinkerKey)) {
      q.thinkerMap.set(thinkerKey, {
        nameZh: row.thinker_name_zh,
        nameEn: row.thinker_name_en,
        nationality: row.nationality,
        birthYear: row.birth_year,
        deathYear: row.death_year,
        wikipediaUrl: row.wikipedia_url,
        books: [],
      })
    }
    q.thinkerMap.get(thinkerKey)!.books.push({
      titleZh: row.book_title_zh,
      titleEn: row.book_title_en,
      isCoauthored: row.is_coauthored,
    })
  }

  return Array.from(questionMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([id, { name, thinkerMap }]) => {
      const thinkers = Array.from(thinkerMap.values())
      return {
        id,
        name,
        thinkers,
        bookCount: thinkers.reduce((sum, t) => sum + t.books.length, 0),
      }
    })
}

function WikiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.06 14.54L8.41 9.4h1.52l1.58 4.56 1.56-4.56h.7l1.56 4.56L16.91 9.4h1.52l-2.53 7.14h-.7L13.6 12l-1.58 4.54h-.7z" />
    </svg>
  )
}

function formatLifespan(birth: string, death: string): string {
  if (!birth && !death) return ''
  if (birth && !death) return birth
  if (!birth && death) return `?–${death}`
  return `${birth}–${death}`
}

function MinimumListContent() {
  const data = useCanonData()

  const groups = useMemo(() => {
    const minRows = data.rawRows.filter((r) => r.is_minimum_list)
    return groupByQuestionAndThinker(minRows)
  }, [data.rawRows])

  const totalBooks = groups.reduce((sum, g) => sum + g.bookCount, 0)
  const totalThinkers = groups.reduce((sum, g) => sum + g.thinkers.length, 0)

  return (
    <div className="minimum-page page-enter">
      <nav className="breadcrumb">
        <Link to="/">首页</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">必读书单</span>
      </nav>

      <header className="minimum-header">
        <span className="minimum-badge">精选必读</span>
        <h1 className="minimum-title">必读书单</h1>
        <p className="minimum-subtitle">
          从 920 部经典中甄选，覆盖 11 个大问题，汇聚人类文明的核心智慧。
        </p>
        <div className="minimum-stats">
          <span>{totalBooks} 部著作</span>
          <span className="stat-sep">·</span>
          <span>{totalThinkers} 位思想家</span>
          <span className="stat-sep">·</span>
          <span>{groups.length} 个大问题</span>
        </div>
      </header>

      <div className="minimum-groups">
        {groups.map((group, idx) => (
          <div
            key={group.id}
            className="minimum-group"
            style={{ '--group-accent': ACCENT_COLORS[idx % ACCENT_COLORS.length] } as React.CSSProperties}
          >
            <div className="minimum-group-header">
              <Link to={`/question/${group.id}`} className="minimum-group-title-link">
                <span className="minimum-group-badge">Q{group.id}</span>
                <h2 className="minimum-group-title">{group.name}</h2>
              </Link>
              <span className="minimum-group-meta">{group.bookCount} 部</span>
            </div>

            <div className="minimum-thinkers">
              {group.thinkers.map((thinker) => {
                const lifespan = formatLifespan(thinker.birthYear, thinker.deathYear)
                return (
                  <div key={`${thinker.nameZh}-${group.id}`} className="minimum-thinker">
                    <div className="minimum-thinker-header">
                      <div className="minimum-thinker-info">
                        <span className="minimum-thinker-name">{thinker.nameZh}</span>
                        {thinker.wikipediaUrl && (
                          <a
                            href={thinker.wikipediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="thinker-wiki-link"
                            title="查看维基百科"
                          >
                            <WikiIcon />
                          </a>
                        )}
                        {thinker.nameEn && (
                          <span className="minimum-thinker-name-en">{thinker.nameEn}</span>
                        )}
                      </div>
                      <div className="minimum-thinker-meta">
                        {lifespan && <span className="minimum-thinker-lifespan">{lifespan}</span>}
                        <span className="minimum-thinker-nationality">{thinker.nationality}</span>
                      </div>
                    </div>
                    <div className="minimum-books">
                      {thinker.books.map((book, bi) => (
                        <div key={bi} className="minimum-book">
                          <div className="minimum-book-titles">
                            <span className="minimum-book-title-zh">{book.titleZh}</span>
                            {book.titleEn && (
                              <span className="minimum-book-title-en">{book.titleEn}</span>
                            )}
                          </div>
                          {book.isCoauthored && (
                            <span className="badge badge-blue">合著</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <footer className="minimum-footer">
        <Link to="/" className="back-link">← 返回首页</Link>
      </footer>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="loading">
      <div className="loading-spinner" />
      <span>加载中...</span>
    </div>
  )
}

export default function MinimumListPage() {
  return (
    <>
      <SiteNav />
      <Suspense fallback={<LoadingFallback />}>
        <MinimumListContent />
      </Suspense>
    </>
  )
}
