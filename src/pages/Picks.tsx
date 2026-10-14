import { Link } from 'react-router-dom'
import { picks, questions } from '../data/catalog'
import { countDone, useShelf } from '../data/shelf'
import { BookItem, Progress, ShelfPill, Top, useOpenBook } from '../components/ui'

export default function Picks() {
  const shelf = useShelf()
  const [open, toggle] = useOpenBook()
  return (
    <>
      <Top title="先读这本" sub={`${picks.length} 本`} back="/" right={<ShelfPill />} />
      <main className="q-page narrow">
        <div className="q-page-head">
          <h1>最短路径</h1>
          <p>每节标出的那一本，连起来是读这份书单最少要读的书。点开可以看为什么先读它。</p>
        </div>
        <Progress done={countDone(shelf, picks.map((p) => p.book.id))} total={picks.length} />
        {questions.map((q) => {
          const mine = picks.filter((p) => p.question.id === q.id)
          if (!mine.length) return null
          return (
            <section key={q.id} className="q-sec">
              <h3>
                <Link to={`/q/${q.id}/${q.sections[0].id}`} className="inline-link quiet">
                  {q.id} · {q.name}
                </Link>
              </h3>
              <ul className="q-rows books">
                {mine.map((p) => (
                  <BookItem key={p.section.id} id={p.book.id} here={p.section.id} why={p.section.why} open={open === p.book.id} onToggle={toggle} />
                ))}
              </ul>
            </section>
          )
        })}
      </main>
    </>
  )
}
