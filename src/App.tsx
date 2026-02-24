import { Suspense, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBigQuestions, useCanonData, type BigQuestion } from './data'
import type { CanonRow } from './data/types'
import { SiteNav } from './components/SiteNav'
import './App.css'

const ACCENT_COLORS = [
  'var(--color-accent-gold)',
  'var(--color-accent-blue)',
  'var(--color-accent-emerald)',
  'var(--color-accent-purple)',
  'var(--color-accent-rose)',
]

function getAccentColor(index: number): string {
  return ACCENT_COLORS[index % ACCENT_COLORS.length]
}

// ==================== Search ====================

interface SearchResult {
  row: CanonRow
  questionId: number
  questionName: string
}

function SearchResults({ query }: { query: string }) {
  const data = useCanonData()

  const results: SearchResult[] = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []
    return data.rawRows
      .filter(
        (r) =>
          r.book_title_zh.toLowerCase().includes(q) ||
          r.book_title_en.toLowerCase().includes(q) ||
          r.thinker_name_zh.toLowerCase().includes(q) ||
          r.thinker_name_en.toLowerCase().includes(q)
      )
      .map((r) => ({ row: r, questionId: r.big_question_id, questionName: r.big_question_name }))
  }, [data.rawRows, query])

  // Group by big question
  const groups = useMemo(() => {
    const map = new Map<number, { name: string; results: SearchResult[] }>()
    for (const r of results) {
      if (!map.has(r.questionId)) {
        map.set(r.questionId, { name: r.questionName, results: [] })
      }
      map.get(r.questionId)!.results.push(r)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([id, { name, results: groupResults }]) => ({ id, name, results: groupResults }))
  }, [results])

  if (results.length === 0) {
    return (
      <div className="search-empty">
        <p>未找到与「{query}」相关的著作或思想家</p>
      </div>
    )
  }

  return (
    <div className="search-results">
      <p className="search-result-count">找到 {results.length} 个结果</p>
      {groups.map((group, idx) => (
        <div key={group.id} className="search-group">
          <Link
            to={`/question/${group.id}`}
            className="search-group-title"
            style={{ '--group-accent': getAccentColor(idx) } as React.CSSProperties}
          >
            Q{group.id} · {group.name}
          </Link>
          <div className="search-group-items">
            {group.results.map((r, i) => (
              <div key={i} className="search-item">
                <div className="search-item-book">
                  <span className="search-item-title">{r.row.book_title_zh}</span>
                  {r.row.book_title_en && (
                    <span className="search-item-title-en">{r.row.book_title_en}</span>
                  )}
                </div>
                <div className="search-item-meta">
                  <span>{r.row.thinker_name_zh}</span>
                  {r.row.thinker_name_en && <span className="search-item-name-en">{r.row.thinker_name_en}</span>}
                  {r.row.is_minimum_list && <span className="badge badge-gold">必读</span>}
                  {r.row.is_coauthored && <span className="badge badge-blue">合著</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== Questions Grid ====================

function QuestionCard({ question }: { question: BigQuestion }) {
  const subtitle =
    question.sections.length > 0 ? question.sections[0].name : question.name

  return (
    <Link
      to={`/question/${question.id}`}
      className="question-card"
      style={{ '--card-accent': getAccentColor(question.id) } as React.CSSProperties}
    >
      <div className="question-card-id">Q{question.id}</div>
      <div className="question-card-title">{question.name}</div>
      <p className="question-card-subtitle">{subtitle}</p>
      <div className="question-card-meta">
        <span>{question.stats.bookCount} 部著作</span>
        <span>{question.stats.thinkerCount} 位思想家</span>
      </div>
    </Link>
  )
}

function BigQuestionsGrid() {
  const bigQuestions = useBigQuestions()

  return (
    <div className="questions-grid">
      {bigQuestions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  )
}

// ==================== App ====================

function LoadingFallback() {
  return (
    <div className="loading">
      <div className="loading-spinner" />
      <span>加载中...</span>
    </div>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  return (
    <div className="app">
      <SiteNav />

      {/* Hero Section */}
      <section className="hero">
        <span className="hero-badge">人类文明经典导览</span>
        <h1 className="hero-title">
          大问题
          <span className="hero-title-en">The Big Questions</span>
        </h1>
        <p className="hero-description">
          从十一个大问题出发，穿越两千五百年人类文明，
          探索 300+ 位思想家与 900+ 部经典著作的智慧图谱。
        </p>

        <div className="divider" />

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">11</span>
            <span className="stat-label">大问题</span>
          </div>
          <div className="stat">
            <span className="stat-number">300+</span>
            <span className="stat-label">思想家</span>
          </div>
          <div className="stat">
            <span className="stat-number">920</span>
            <span className="stat-label">经典著作</span>
          </div>
          <div className="stat">
            <span className="stat-number">2500</span>
            <span className="stat-label">年跨度</span>
          </div>
        </div>
      </section>

      {/* Questions Grid + Search */}
      <section className="questions-preview">
        <div className="search-bar-wrapper">
          <div className="search-bar">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="搜索书名、作者名..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="搜索"
            />
            {query && (
              <button
                className="search-clear"
                onClick={() => setQuery('')}
                aria-label="清除搜索"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {!trimmed && <h2>十一个大问题</h2>}

        <Suspense fallback={<LoadingFallback />}>
          {trimmed ? <SearchResults query={trimmed} /> : <BigQuestionsGrid />}
        </Suspense>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>大问题 · The Big Questions — 人类文明经典元典导览</p>
      </footer>
    </div>
  )
}

export default App
