import { Link } from 'react-router-dom'
import { picks, questions, sectionLabel } from '../data/catalog'
import { countDone, useShelf } from '../data/shelf'
import { BookRow, Progress, ShelfPill, Top } from '../components/ui'

export default function Picks() {
  const shelf = useShelf()
  return (
    <>
      <Top title="首选" sub={`${picks.length} 本`} back="/" right={<ShelfPill />} />
      <main className="q-page q-enter">
        <div className="q-page-head">
          <h1>首选</h1>
          <p>每节一本最适合先读的书，连起来就是这份书单的最短路径。</p>
        </div>
        <Progress done={countDone(shelf, picks.map((p) => p.book.id))} total={picks.length} />
        {questions.map((q) => {
          const mine = picks.filter((p) => p.question.id === q.id)
          if (!mine.length) return null
          return (
            <section key={q.id} className="q-sec">
              <h3>
                <Link to={`/q/${q.id}`} className="sec-link">
                  {q.id} · {q.name}
                </Link>
              </h3>
              <ul className="q-rows">
                {mine.map((p) => (
                  <BookRow key={p.book.id + p.section.id} id={p.book.id} />
                ))}
              </ul>
              <p className="q-meta">
                {mine.map((p) => `${sectionLabel(p.section.id)} ${p.section.name}`).join(' · ')}
              </p>
            </section>
          )
        })}
      </main>
    </>
  )
}
