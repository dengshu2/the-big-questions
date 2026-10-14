import { Link, Navigate, useParams } from 'react-router-dom'
import { doubanUrl, formatYears, getBook, getQuestion, getSection, getThinker, sectionLabel } from '../data/catalog'
import { setStatus, STATUS_LABEL, STATUSES, useShelf } from '../data/shelf'
import { Icon, ICONS, ShelfPill, Top } from '../components/ui'

export default function Book() {
  const { id } = useParams()
  const book = getBook(id)
  const shelf = useShelf()
  if (!book) return <Navigate to="/" replace />

  const status = shelf[book.id]?.status
  const firstQ = getQuestion(book.places[0].question)
  return (
    <>
      <Top title={`《${book.title}》`} sub={firstQ?.name} back={`/q/${book.places[0].question}`} right={<ShelfPill />} />
      <main className="q-page q-enter">
        <div className="q-page-head">
          <h1>《{book.title}》</h1>
          {book.orig && <p className="orig">{book.orig}</p>}
        </div>
        <p className="q-lead">{book.note}</p>
        {book.credit && <p className="q-notice">{book.credit}</p>}

        <section className="q-sec">
          <h3>阅读状态</h3>
          <div className="q-seg" role="group" aria-label="阅读状态">
            {STATUSES.map((s) => (
              <button
                key={s}
                aria-pressed={status === s}
                onClick={() => setStatus(book.id, status === s ? null : s)}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </section>

        <section className="q-sec">
          <h3>{book.credit ? '书单所列人物' : '作者'}</h3>
          <ul className="q-rows">
            {book.authors.map((a) => {
              const t = getThinker(a)
              if (!t) return null
              return (
                <li key={a}>
                  <Link to={`/t/${a}`} className="q-row">
                    <span className="q-row-main">
                      <span>{t.name}</span>
                      <span>{t.line}</span>
                      <span>{formatYears(t)}</span>
                    </span>
                    <Icon d={ICONS.next} sm />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="q-sec">
          <h3>在书单中的位置</h3>
          <ul className="q-rows">
            {book.places.map((p) => {
              const hit = getSection(p.section)
              if (!hit) return null
              return (
                <li key={p.section}>
                  <Link to={`/q/${p.question}#s${p.section}`} className="q-row">
                    <span className="q-row-main">
                      <span>{hit.question.name}</span>
                      <span>
                        {sectionLabel(p.section)} {hit.section.name} · {p.group}
                      </span>
                    </span>
                    {p.must && <span className="pick-tag">首选</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <a className="q-link ext-link" href={doubanUrl(book.title)} target="_blank" rel="noreferrer">
          在豆瓣查找这本书 <Icon d={ICONS.out} sm />
        </a>
      </main>
    </>
  )
}
