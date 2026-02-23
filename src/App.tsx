import './App.css'

// The 11 Big Questions from canon.csv
const BIG_QUESTIONS = [
  { id: 0, name: '元典', subtitle: '人类文明十三经', sections: 1, thinkers: 10, books: 13 },
  { id: 1, name: '知识的知识', subtitle: '如何认识世界与自己', sections: 5, thinkers: 39, books: 116 },
  { id: 2, name: '如何理解世界', subtitle: '从宇宙到微观的探索', sections: 5, thinkers: 38, books: 100 },
  { id: 3, name: '如何理解历史', subtitle: '在时间长河中寻找规律', sections: 5, thinkers: 27, books: 68 },
  { id: 4, name: '如何理解时代', subtitle: '权力、技术与文明的演进', sections: 5, thinkers: 33, books: 79 },
  { id: 5, name: '如何理解社会', subtitle: '人与人之间的连接与博弈', sections: 5, thinkers: 38, books: 102 },
  { id: 6, name: '如何理解组织', subtitle: '从管理到创业的智慧', sections: 5, thinkers: 38, books: 87 },
  { id: 7, name: '如何理解家庭', subtitle: '发展、依恋与爱的科学', sections: 5, thinkers: 33, books: 96 },
  { id: 8, name: '如何理解人性', subtitle: '认知、语言与文学的三重奏', sections: 5, thinkers: 56, books: 148 },
  { id: 9, name: '如何理解身体', subtitle: '从基因到环境的健康之路', sections: 5, thinkers: 28, books: 60 },
  { id: 10, name: '如何理解信仰', subtitle: '从儒道释到心灵哲学', sections: 5, thinkers: 22, books: 55 },
]

const ACCENT_COLORS = [
  'var(--color-accent-gold)',
  'var(--color-accent-blue)',
  'var(--color-accent-emerald)',
  'var(--color-accent-purple)',
  'var(--color-accent-rose)',
  'var(--color-accent-gold)',
  'var(--color-accent-blue)',
  'var(--color-accent-emerald)',
  'var(--color-accent-purple)',
  'var(--color-accent-rose)',
  'var(--color-accent-gold)',
]

function App() {
  return (
    <div className="app">
      {/* Hero Section */}
      <section className="hero">
        <span className="hero-badge">
          ✦ 人类文明经典导览
        </span>
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
        <div className="questions-grid">
          {BIG_QUESTIONS.map((q) => (
            <div
              className="question-card"
              key={q.id}
              style={{ '--card-accent': ACCENT_COLORS[q.id] } as React.CSSProperties}
            >
              <div className="question-card-id">Q{q.id}</div>
              <div className="question-card-title">{q.name}</div>
              <p style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-4)'
              }}>
                {q.subtitle}
              </p>
              <div className="question-card-meta">
                <span>📚 {q.books} 部著作</span>
                <span>🧠 {q.thinkers} 位思想家</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>大问题 · The Big Questions — 人类文明经典元典导览</p>
      </footer>
    </div>
  )
}

export default App
