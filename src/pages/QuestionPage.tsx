import { Suspense, useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useBigQuestion } from '../data'
import type { Section, Discipline, Thinker } from '../data/types'
import './QuestionPage.css'

function QuestionContent() {
  const { id } = useParams<{ id: string }>()
  const questionId = parseInt(id || '1', 10)
  const question = useBigQuestion(questionId)

  if (!question) {
    return (
      <div className="question-page">
        <div className="question-not-found">
          <h1>未找到该问题</h1>
          <Link to="/" className="back-link">← 返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="question-page">
      <nav className="breadcrumb">
        <Link to="/">首页</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{question.name}</span>
      </nav>

      <header className="question-header">
        <span className="question-badge">Q{question.id}</span>
        <h1 className="question-title">{question.name}</h1>
        <p className="question-stats">
          {question.stats.sectionCount} 个章节 · {question.stats.thinkerCount} 位思想家 · {question.stats.bookCount} 部著作
        </p>
      </header>

      <div className="sections-container">
        {question.sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  )
}

function SectionCard({ section }: { section: Section }) {
  const [expanded, setExpanded] = useState(true)
  const totalBooks = section.disciplines.reduce(
    (sum, d) => sum + d.thinkers.reduce((s, t) => s + t.books.length, 0),
    0
  )
  const totalThinkers = section.disciplines.reduce((sum, d) => sum + d.thinkers.length, 0)

  return (
    <div className="section-card">
      <button className="section-header" onClick={() => setExpanded(!expanded)}>
        <div className="section-header-left">
          <span className={`section-chevron ${expanded ? 'expanded' : ''}`}>
            <ChevronIcon />
          </span>
          <h2 className="section-title">{section.name}</h2>
        </div>
        <span className="section-meta">
          {section.disciplines.length} 学科 · {totalThinkers} 思想家 · {totalBooks} 著作
        </span>
      </button>

      <Collapsible expanded={expanded}>
        <div className="section-content">
          {section.disciplines.map((discipline) => (
            <DisciplineCard key={discipline.id} discipline={discipline} />
          ))}
        </div>
      </Collapsible>
    </div>
  )
}

function DisciplineCard({ discipline }: { discipline: Discipline }) {
  const [expanded, setExpanded] = useState(false)
  const bookCount = discipline.thinkers.reduce((sum, t) => sum + t.books.length, 0)

  return (
    <div className="discipline-card">
      <button className="discipline-header" onClick={() => setExpanded(!expanded)}>
        <div className="discipline-header-left">
          <span className={`discipline-chevron ${expanded ? 'expanded' : ''}`}>
            <ChevronIcon />
          </span>
          <h3 className="discipline-title">{discipline.name}</h3>
        </div>
        <span className="discipline-meta">
          {discipline.thinkers.length} 位思想家 · {bookCount} 部著作
        </span>
      </button>

      <Collapsible expanded={expanded}>
        <div className="discipline-content">
          {discipline.thinkers.map((thinker) => (
            <ThinkerCard key={thinker.id} thinker={thinker} />
          ))}
        </div>
      </Collapsible>
    </div>
  )
}

function ThinkerCard({ thinker }: { thinker: Thinker }) {
  const [expanded, setExpanded] = useState(false)
  const lifespan = formatLifespan(thinker.birthYear, thinker.deathYear)

  return (
    <div className="thinker-card">
      <button className="thinker-header" onClick={() => setExpanded(!expanded)}>
        <div className="thinker-info">
          <span className="thinker-name">{thinker.nameZh}</span>
          {thinker.nameEn && <span className="thinker-name-en">{thinker.nameEn}</span>}
        </div>
        <div className="thinker-meta">
          {lifespan && <span className="thinker-lifespan">{lifespan}</span>}
          <span className="thinker-nationality">{thinker.nationality}</span>
          <span className="thinker-book-count">{thinker.books.length} 部</span>
          <span className={`thinker-chevron ${expanded ? 'expanded' : ''}`}>
            <ChevronIcon />
          </span>
        </div>
      </button>

      <Collapsible expanded={expanded}>
        <div className="thinker-books">
          {thinker.books.map((book) => (
            <div key={book.id} className="book-item">
              <div className="book-info">
                <span className="book-title">{book.titleZh}</span>
                {book.titleEn && <span className="book-title-en">{book.titleEn}</span>}
              </div>
              <div className="book-badges">
                {book.isMinimumList && <span className="badge badge-gold">必读</span>}
                {book.isCoauthored && <span className="badge badge-blue">合著</span>}
              </div>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  )
}

function Collapsible({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(expanded ? 'auto' : 0)

  useEffect(() => {
    if (!contentRef.current) return

    if (expanded) {
      const contentHeight = contentRef.current.scrollHeight
      setHeight(contentHeight)
      const timer = setTimeout(() => setHeight('auto'), 250)
      return () => clearTimeout(timer)
    } else {
      const contentHeight = contentRef.current.scrollHeight
      setHeight(contentHeight)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0))
      })
    }
  }, [expanded])

  return (
    <div
      className="collapsible"
      style={{
        height: height === 'auto' ? 'auto' : `${height}px`,
        overflow: height === 'auto' ? 'visible' : 'hidden',
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function formatLifespan(birth: string, death: string): string {
  if (!birth && !death) return ''
  if (birth && !death) return birth
  if (!birth && death) return `?–${death}`
  return `${birth}–${death}`
}

function LoadingFallback() {
  return (
    <div className="loading">
      <div className="loading-spinner" />
      <span>加载中...</span>
    </div>
  )
}

export default function QuestionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <QuestionContent />
    </Suspense>
  )
}
