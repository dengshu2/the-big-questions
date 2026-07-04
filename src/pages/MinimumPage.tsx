import { Link } from 'react-router-dom'
import { allThinkers, formatYears, getQuestion, qVar } from '../data'
import { useProgress } from '../data/progress'
import { SiteNav } from '../components/SiteNav'
import './MinimumPage.css'

const firstMagnitude = allThinkers
  .filter((t) => t.magnitude === 1)
  .sort((a, b) => a.birthNum - b.birthNum)

export default function MinimumPage() {
  const { statusOf } = useProgress()
  const litCount = firstMagnitude.filter((t) => statusOf(t.slug) === 'read').length
  const pct = Math.round((litCount / firstMagnitude.length) * 100)

  return (
    <>
      <SiteNav />
      <main className="page min-page">
        <header className="min-head">
          <p className="plate-label">First magnitude stars · 图幅十三</p>
          <h1>一等星表</h1>
          <p className="min-sub">
            {firstMagnitude.length} 位拥有必读书目的思想家，按年代升起的顺序排列。
            点亮它们，就点亮了这份书单的主干。
          </p>
          <div className="min-progress">
            <div className="min-progress-bar">
              <i style={{ width: `${pct}%` }} />
            </div>
            <span className="min-progress-text">
              已点亮 {litCount} / {firstMagnitude.length}
            </span>
          </div>
        </header>

        <ol className="min-list">
          {firstMagnitude.map((t) => {
            const lit = statusOf(t.slug) === 'read'
            const minBooks = t.books.filter((b) => b.minimum)
            return (
              <li key={t.slug}>
                <Link to={`/thinker/${t.slug}`} className={lit ? 'min-row lit' : 'min-row'}>
                  <span className="min-star">✦</span>
                  <span className="min-main">
                    <b>{t.nameZh}</b>
                    <small>
                      {formatYears(t)} · {t.nationality}
                    </small>
                    <span className="min-books">
                      {minBooks.map((b, i) => (
                        <em key={i}>《{b.titleZh}》</em>
                      ))}
                    </span>
                  </span>
                  <span className="min-qs">
                    {t.questions.map((qid) => (
                      <span key={qid} className="q-chip" style={{ color: qVar(qid) }}>
                        Q{qid} {getQuestion(qid)?.name}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </main>
    </>
  )
}
