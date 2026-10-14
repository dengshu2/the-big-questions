import { Link, Navigate, useParams } from 'react-router-dom'
import { booksOfQuestion, getQuestion, pickOf, questions, sectionBookIds, sectionLabel } from '../data/catalog'
import { countDone, useShelf } from '../data/shelf'
import { BookItem, Icon, ICONS, PickCard, ShelfPill, Top, useOpenBook } from '../components/ui'

export default function Question() {
  const { id, sec } = useParams()
  const q = getQuestion(id)
  const shelf = useShelf()
  const [open, toggle] = useOpenBook()
  if (!q) return <Navigate to="/" replace />
  const idx = q.sections.findIndex((s) => s.id === sec)
  if (idx < 0) return <Navigate to={`/q/${q.id}/${q.sections[0].id}`} replace />

  const s = q.sections[idx]
  const pick = pickOf(s)
  const prev = q.sections[idx - 1]
  const next = q.sections[idx + 1]
  const nextQ = questions[questions.indexOf(q) + 1]
  const single = q.sections.length === 1
  const all = booksOfQuestion(q)

  return (
    <>
      <Top title={q.name} sub={`读完 ${countDone(shelf, all)} / ${all.length}`} back="/" right={<ShelfPill />} />
      <main className="q-page reader">
        {!single && (
          <nav className="outline" aria-label={`${q.name}的各节`}>
            <p className="outline-q">{q.name}</p>
            <ol>
              {q.sections.map((x) => {
                const ids = sectionBookIds(x)
                return (
                  <li key={x.id}>
                    <Link to={`/q/${q.id}/${x.id}`} className="outline-item" aria-current={x.id === s.id ? 'page' : undefined} replace>
                      <span className="outline-no q-num">{x.id}</span>
                      <span className="outline-name">{x.name}</span>
                      <span className="outline-count q-num">
                        {countDone(shelf, ids) || ''}
                        {countDone(shelf, ids) ? '/' : ''}
                        {ids.length}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </nav>
        )}

        <div className="reader-main">
          {(idx === 0 || single) && (
            <header className="q-intro">
              <h1>{q.name}</h1>
              <p>{q.intro}</p>
            </header>
          )}

          {!single && (
            <div className="stepper">
              {prev ? (
                <Link to={`/q/${q.id}/${prev.id}`} className="q-round" replace aria-label={`上一节：${prev.name}`}>
                  <Icon d={ICONS.prev} />
                </Link>
              ) : (
                <span className="q-round is-off" aria-hidden="true">
                  <Icon d={ICONS.prev} />
                </span>
              )}
              <span className="stepper-mid">
                <span className="q-dots" aria-hidden="true">
                  {q.sections.map((x) => (
                    <i key={x.id} className={x.id === s.id ? 'on' : undefined} />
                  ))}
                </span>
                <span className="q-meta q-num">
                  第 {idx + 1} 节，共 {q.sections.length} 节
                </span>
              </span>
              {next ? (
                <Link to={`/q/${q.id}/${next.id}`} className="q-round" replace aria-label={`下一节：${next.name}`}>
                  <Icon d={ICONS.next} />
                </Link>
              ) : (
                <span className="q-round is-off" aria-hidden="true">
                  <Icon d={ICONS.next} />
                </span>
              )}
            </div>
          )}

          <section className="sec-head">
            <h2>
              {sectionLabel(s.id) && <span className="q-num">{s.id}</span>}
              {s.name}
            </h2>
            <p>{s.note}</p>
          </section>

          {pick ? (
            <PickCard id={pick} why={s.why} here={s.id} open={open === pick} onToggle={toggle} />
          ) : (
            !single && <p className="q-notice">这一节没有标出先读的书，可以从你最感兴趣的一本开始。</p>
          )}

          {s.groups.map((g) => {
            const rest = g.books.filter((b) => b.id !== pick)
            if (!rest.length) return null
            return (
              <section key={g.name} className="q-sec">
                <h3>
                  {pick ? '延伸阅读 · ' : ''}
                  {g.name}
                </h3>
                <ul className="q-rows books">
                  {rest.map((b) => (
                    <BookItem key={b.id} id={b.id} here={s.id} open={open === b.id} onToggle={toggle} />
                  ))}
                </ul>
              </section>
            )
          })}

          <nav className="pager">
            {prev ? (
              <Link to={`/q/${q.id}/${prev.id}`} className="q-btn" replace>
                <Icon d={ICONS.prev} sm />
                {prev.name}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/q/${q.id}/${next.id}`} className="q-btn q-btn--primary" replace>
                下一节：{next.name}
                <Icon d={ICONS.next} sm />
              </Link>
            ) : (
              nextQ && (
                <Link to={`/q/${nextQ.id}/${nextQ.sections[0].id}`} className="q-btn q-btn--primary">
                  下一个问题：{nextQ.name}
                  <Icon d={ICONS.next} sm />
                </Link>
              )
            )}
          </nav>

          {!single && (
            <section className="q-sec sec-list">
              <h3>{q.name}的各节</h3>
              <ul className="q-rows">
                {q.sections.map((x) => {
                  const ids = sectionBookIds(x)
                  const done = countDone(shelf, ids)
                  return (
                    <li key={x.id}>
                      <Link to={`/q/${q.id}/${x.id}`} className="q-row" replace aria-current={x.id === s.id ? 'page' : undefined}>
                        <span className="q-no q-num">{x.id}</span>
                        <span className="q-row-main">
                          <span>{x.name}</span>
                        </span>
                        <span className={done ? 'q-st q-st--done' : 'q-st'}>{done ? `${done}/${ids.length}` : ids.length}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
