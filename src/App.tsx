import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useBigQuestions, type BigQuestion } from './data'
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

function QuestionCard({ question }: { question: BigQuestion }) {
  // 章节名作为副标题（取第一个章节的名称，或用大问题名称）
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

function LoadingFallback() {
  return (
    <div className="loading">
      <div className="loading-spinner" />
      <span>加载中...</span>
    </div>
  )
}

function App() {
  return (
    <div className="app">
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

      {/* Questions Grid */}
      <section className="questions-preview">
        <h2>十一个大问题</h2>
        <Suspense fallback={<LoadingFallback />}>
          <BigQuestionsGrid />
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
