import { Suspense, useMemo, useRef } from 'react'
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

// ==================== Questions Grid ====================

function QuestionCard({ question, data }: { question: BigQuestion; data: CanonRow[] }) {
  const topThinkers = useMemo(() => {
    const thinkerSet = new Set<string>()
    const thinkers: string[] = []
    for (const row of data) {
      if (row.big_question_id === question.id && !thinkerSet.has(row.thinker_name_zh)) {
        thinkerSet.add(row.thinker_name_zh)
        thinkers.push(row.thinker_name_zh)
        if (thinkers.length >= 4) break
      }
    }
    return thinkers
  }, [data, question.id])

  return (
    <Link
      to={`/question/${question.id}`}
      className="question-card"
      style={{ '--card-accent': getAccentColor(question.id) } as React.CSSProperties}
    >
      <div className="question-card-top">
        <div className="question-card-id">Q{question.id}</div>
        <div className="question-card-sections">{question.stats.sectionCount} 章节</div>
      </div>
      <div className="question-card-title">{question.name}</div>
      <div className="question-card-thinkers">
        {topThinkers.map((name, i) => (
          <span key={i} className="question-card-thinker">{name}</span>
        ))}
        {question.stats.thinkerCount > 4 && (
          <span className="question-card-thinker more">+{question.stats.thinkerCount - 4}</span>
        )}
      </div>
      <div className="question-card-meta">
        <span>{question.stats.bookCount} 部著作</span>
        <span>{question.stats.thinkerCount} 位思想家</span>
      </div>
    </Link>
  )
}

function BigQuestionsGrid() {
  const bigQuestions = useBigQuestions()
  const data = useCanonData()

  return (
    <div className="questions-grid">
      {bigQuestions.map((q) => (
        <QuestionCard key={q.id} question={q} data={data.rawRows} />
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
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className="app">
      <SiteNav />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">人类文明经典导览</span>
          <h1 className="hero-title">
            大问题
            <span className="hero-title-en">The Big Questions</span>
          </h1>
          <p className="hero-description">
            从十一个大问题出发，穿越两千五百年人类文明，
            探索 300+ 位思想家与 900+ 部经典著作的智慧图谱。
          </p>

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
        </div>

        {/* Scroll indicator */}
        <button
          className="scroll-indicator"
          onClick={() => contentRef.current?.scrollIntoView({ behavior: 'smooth' })}
          aria-label="向下滚动"
        >
          <span className="scroll-indicator-text">探索大问题</span>
          <svg className="scroll-indicator-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </section>

      {/* Questions Grid */}
      <section className="main-content" ref={contentRef}>
        <div className="section-header-row">
          <h2>十一个大问题</h2>
          <Link to="/minimum" className="section-header-link">查看必读书单 →</Link>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <BigQuestionsGrid />
        </Suspense>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>大问题 · The Big Questions — 人类文明经典元典导览</p>
        <p className="footer-source">
          书单数据整理自
          <a href="https://book.douban.com/subject/36359767/" target="_blank" rel="noopener noreferrer">
            《聪明的阅读者》
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
