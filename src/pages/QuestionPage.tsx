import { Suspense, useState, useRef, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useBigQuestion, useBigQuestions } from '../data'
import type { Section, Discipline, Thinker } from '../data/types'
import { SiteNav } from '../components/SiteNav'
import './QuestionPage.css'

const ACCENT_COLORS = [
  'var(--color-accent-gold)',
  'var(--color-accent-blue)',
  'var(--color-accent-emerald)',
  'var(--color-accent-purple)',
  'var(--color-accent-rose)',
]

function QuestionContent() {
  const { id } = useParams<{ id: string }>()
  const questionId = parseInt(id || '1', 10)
  const question = useBigQuestion(questionId)
  const allQuestions = useBigQuestions()

  // Find prev/next questions
  const { prev, next } = useMemo(() => {
    const idx = allQuestions.findIndex(q => q.id === questionId)
    return {
      prev: idx > 0 ? allQuestions[idx - 1] : null,
      next: idx < allQuestions.length - 1 ? allQuestions[idx + 1] : null,
    }
  }, [allQuestions, questionId])

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

  // If only 1 section, flatten: skip section layer
  const isSingleSection = question.sections.length === 1

  return (
    <div className="question-page page-enter">
      <nav className="breadcrumb">
        <Link to="/">首页</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{question.name}</span>
      </nav>

      <header className="question-header">
        <span className="question-badge" style={{ '--badge-accent': ACCENT_COLORS[question.id % ACCENT_COLORS.length] } as React.CSSProperties}>
          Q{question.id}
        </span>
        <h1 className="question-title">{question.name}</h1>
        <p className="question-stats">
          {question.stats.sectionCount} 个章节 · {question.stats.thinkerCount} 位思想家 · {question.stats.bookCount} 部著作
        </p>
      </header>

      {isSingleSection ? (
        // Flattened: show section name as subtitle, directly show disciplines
        <div className="sections-container flattened">
          <div className="flattened-section-name">{question.sections[0].name}</div>
          <div className="disciplines-direct">
            {question.sections[0].disciplines.map((discipline, idx) => (
              <DisciplineCard
                key={discipline.id}
                discipline={discipline}
                defaultExpanded={idx === 0}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="sections-container">
          {question.sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      )}

      {/* Prev/Next Navigation */}
      <nav className="question-nav">
        {prev ? (
          <Link to={`/question/${prev.id}`} className="question-nav-link prev">
            <span className="question-nav-direction">← 上一个</span>
            <span className="question-nav-title">Q{prev.id} · {prev.name}</span>
          </Link>
        ) : <div />}
        {next ? (
          <Link to={`/question/${next.id}`} className="question-nav-link next">
            <span className="question-nav-direction">下一个 →</span>
            <span className="question-nav-title">Q{next.id} · {next.name}</span>
          </Link>
        ) : <div />}
      </nav>
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
          {section.disciplines.map((discipline, idx) => (
            <DisciplineCard
              key={discipline.id}
              discipline={discipline}
              defaultExpanded={idx === 0 && expanded}
            />
          ))}
        </div>
      </Collapsible>
    </div>
  )
}

function DisciplineCard({ discipline, defaultExpanded = false }: { discipline: Discipline; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const bookCount = discipline.thinkers.reduce((sum, t) => sum + t.books.length, 0)

  // Top 3 thinker names for preview
  const previewThinkers = discipline.thinkers.slice(0, 3).map(t => t.nameZh)
  const remainThinkers = discipline.thinkers.length - 3

  return (
    <div className={`discipline-card ${expanded ? 'is-expanded' : ''}`}>
      <button className="discipline-header" onClick={() => setExpanded(!expanded)}>
        <div className="discipline-header-left">
          <span className={`discipline-chevron ${expanded ? 'expanded' : ''}`}>
            <ChevronIcon />
          </span>
          <h3 className="discipline-title">{discipline.name}</h3>
        </div>
        <div className="discipline-header-right">
          {!expanded && (
            <span className="discipline-preview">
              {previewThinkers.join('、')}
              {remainThinkers > 0 && ` 等${discipline.thinkers.length}人`}
            </span>
          )}
          <span className="discipline-meta">
            {discipline.thinkers.length} 位思想家 · {bookCount} 部著作
          </span>
        </div>
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
    <div className={`thinker-card ${expanded ? 'is-expanded' : ''}`}>
      <button className="thinker-header" onClick={() => setExpanded(!expanded)}>
        <div className="thinker-info">
          <span className="thinker-name">{thinker.nameZh}</span>
          {thinker.wikipediaUrl && (
            <a
              href={thinker.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="thinker-wiki-link"
              title="查看维基百科"
              onClick={(e) => e.stopPropagation()}
            >
              <WikiIcon />
            </a>
          )}
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

function WikiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.06 14.54L8.41 9.4h1.52l1.58 4.56 1.56-4.56h.7l1.56 4.56L16.91 9.4h1.52l-2.53 7.14h-.7L13.6 12l-1.58 4.54h-.7z" />
    </svg>
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
    <>
      <SiteNav />
      <Suspense fallback={<LoadingFallback />}>
        <QuestionContent />
      </Suspense>
    </>
  )
}
