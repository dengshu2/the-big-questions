import { Link, Navigate, useParams } from 'react-router-dom'
import { booksOfQuestion, getQuestion, questions, sectionLabel } from '../data/catalog'
import { countDone, useShelf } from '../data/shelf'
import { BookRow, Progress, ShelfPill, Top } from '../components/ui'

export default function Question() {
  const { id } = useParams()
  const q = getQuestion(id)
  const shelf = useShelf()
  if (!q) return <Navigate to="/" replace />

  const ids = booksOfQuestion(q)
  const idx = questions.indexOf(q)
  const next = questions[idx + 1]
  return (
    <>
      <Top title={q.name} sub={`问题 ${q.id} · ${ids.length} 本书`} back="/" right={<ShelfPill />} />
      <main className="q-page q-enter">
        <div className="q-page-head">
          <h1>{q.name}</h1>
          <p>{q.summary}</p>
        </div>
        <p className="prose-p">{q.intro}</p>
        <Progress done={countDone(shelf, ids)} total={ids.length} />

        {q.sections.map((s) => (
          <section key={s.id} className="q-sec section" id={`s${s.id}`}>
            <div className="section-head">
              <h2>
                {sectionLabel(s.id) && <span className="q-num">{s.id}</span>}
                {s.name}
              </h2>
              <p>{s.note}</p>
            </div>
            {s.groups.map((g) => (
              <div key={g.name} className="group">
                {(s.groups.length > 1 || g.name !== s.name) && <p className="q-day">{g.name}</p>}
                <ul className="q-rows">
                  {g.books.map((b) => (
                    <BookRow key={b.id} id={b.id} must={b.must} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}

        {next && (
          <Link to={`/q/${next.id}`} className="q-btn q-btn--wide">
            下一个问题：{next.name}
          </Link>
        )}
      </main>
    </>
  )
}
