import { Link } from 'react-router-dom'
import { about, booksOfQuestion, picks, questions, stats } from '../data/catalog'
import { countDone, useShelf } from '../data/shelf'
import { ShelfPill, Top } from '../components/ui'

const STEPS = [
  { no: 1, title: '先读元典', text: '十三部源头之书，后面许多问题的最早说法都在这里', to: '/q/0/0' },
  { no: 2, title: '再读「知识的知识」', text: '关于如何获得、检验和创造知识，是其余问题的工具箱', to: '/q/1/1.1' },
  { no: 3, title: '挑一个你关心的问题', text: '每个问题先读总论，再按每节标出的「先读这本」往下走', to: '#questions' },
]

export default function Home() {
  const shelf = useShelf()
  const picksDone = countDone(shelf, picks.map((p) => p.book.id))
  const [lead, ...rest] = about
  return (
    <>
      <Top title="大问题" sub={`${stats.books} 本书的经典书单`} right={<ShelfPill />} />
      <main className="q-page home">
        <header className="hero">
          <h1>大问题</h1>
          <p className="q-lead">{lead}</p>
        </header>

        <section className="q-sec">
          <h3>从这里开始</h3>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.no}>
                {s.to.startsWith('#') ? (
                  <a href={s.to} className="step">
                    <StepBody {...s} />
                  </a>
                ) : (
                  <Link to={s.to} className="step">
                    <StepBody {...s} />
                  </Link>
                )}
              </li>
            ))}
          </ol>
          <p className="q-meta">
            只想读最少的书？<Link to="/picks" className="inline-link">{stats.picks} 本「先读这本」</Link>
            连起来就是最短路径{picksDone > 0 && `，你已读完 ${picksDone} 本`}。
          </p>
        </section>

        <section className="q-sec" id="questions">
          <h3>十一个问题</h3>
          <ul className="qgrid">
            {questions.map((q) => {
              const ids = booksOfQuestion(q)
              const done = countDone(shelf, ids)
              return (
                <li key={q.id}>
                  <Link to={`/q/${q.id}/${q.sections[0].id}`} className="qcard">
                    <span className="qcard-no q-num">{q.id === '0' ? '元' : q.id}</span>
                    <span className="qcard-name">{q.name}</span>
                    <span className="qcard-sum">{q.summary}</span>
                    <span className="qcard-secs">{q.sections.length > 1 ? q.sections.map((s) => s.name).join(' · ') : '中国 · 古希腊 · 古印度 · 古希伯来'}</span>
                    <span className="qcard-foot q-num">
                      {done ? `读完 ${done} / ${ids.length}` : `${ids.length} 本书`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <footer className="prose home-foot">
          {rest.map((p, i) => (
            <p key={i} className="q-meta">
              {p}
            </p>
          ))}
        </footer>
      </main>
    </>
  )
}

function StepBody({ no, title, text }: { no: number; title: string; text: string }) {
  return (
    <>
      <span className="step-no q-num">{no}</span>
      <span className="step-title">{title}</span>
      <span className="step-text">{text}</span>
    </>
  )
}
