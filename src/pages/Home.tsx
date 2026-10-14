import { Link } from 'react-router-dom'
import { about, booksOfQuestion, picks, questions, stats } from '../data/catalog'
import { countDone, useShelf } from '../data/shelf'
import { Icon, ICONS, ShelfPill, Top } from '../components/ui'

export default function Home() {
  const shelf = useShelf()
  const picksDone = countDone(shelf, picks.map((p) => p.book.id))
  return (
    <>
      <Top title="大问题" sub={`${stats.books} 本书的经典书单`} right={<ShelfPill />} />
      <main className="q-page">
        <div className="q-page-head">
          <h1>大问题</h1>
          <p>
            {stats.questions} 个问题 · {stats.thinkers} 位思想家 · {stats.books} 本书
          </p>
        </div>

        <div className="prose">
          {about.map((p, i) => (
            <p key={i} className={i === about.length - 1 ? 'q-meta' : undefined}>
              {p}
            </p>
          ))}
        </div>

        <Link to="/search" className="q-search search-link">
          <Icon d={ICONS.search} sm />
          搜索书名、思想家
        </Link>

        <section className="q-sec">
          <h3>最短路径</h3>
          <ul className="q-rows">
            <li>
              <Link to="/picks" className="q-row">
                <span className="q-row-main">
                  <span>{stats.picks} 本首选</span>
                  <span>每节一本最适合先读的书</span>
                </span>
                <span className={picksDone ? 'q-st q-st--done' : 'q-st'}>
                  {picksDone}/{stats.picks}
                </span>
                <Icon d={ICONS.next} sm />
              </Link>
            </li>
          </ul>
        </section>

        <section className="q-sec">
          <h3>十一个问题</h3>
          <ul className="q-rows">
            {questions.map((q) => {
              const ids = booksOfQuestion(q)
              const done = countDone(shelf, ids)
              return (
                <li key={q.id}>
                  <Link to={`/q/${q.id}`} className="q-row">
                    <span className="q-no q-num">{q.id}</span>
                    <span className="q-row-main">
                      <span>{q.name}</span>
                      <span>{q.summary}</span>
                    </span>
                    <span className={done ? 'q-st q-st--done' : 'q-st'}>{done ? `${done}/${ids.length}` : ids.length}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </main>
    </>
  )
}
