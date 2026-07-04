import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { atlas, formatYears, getQuestion, getThinker, qVar, questions, type L1Arc } from '../data'
import { useProgress } from '../data/progress'
import { SiteNav } from '../components/SiteNav'
import './ConstellationPage.css'

const STAR_R: Record<number, number> = { 1: 8, 2: 6, 3: 4.5, 4: 3.5 }
const CHART_H = 620
const BASE_Y = 470
const laneY = (lane: number) => 410 - lane * 54

export default function ConstellationPage() {
  const { id } = useParams()
  const qid = Number(id)
  const question = getQuestion(qid)
  const l1 = atlas.l1[String(qid)]
  const { statusOf } = useProgress()
  const [activeArc, setActiveArc] = useState<L1Arc | null>(null)

  const starPos = useMemo(() => {
    if (!l1) return new Map<string, { x: number; y: number }>()
    return new Map(l1.stars.map((s) => [s.slug, { x: s.x, y: laneY(s.lane) }]))
  }, [l1])

  if (!question || !l1) return <Navigate to="/" replace />

  const prev = questions.find((q) => q.id === qid - 1)
  const next = questions.find((q) => q.id === qid + 1)
  const memberSlugs = new Set(l1.stars.map((s) => s.slug))
  const minimumBooks = l1.stars
    .map((s) => getThinker(s.slug)!)
    .flatMap((t) => t.books.filter((b) => b.minimum && b.questionId === qid).map((b) => ({ book: b, thinker: t })))

  return (
    <>
      <SiteNav />
      <main className="page const-page" style={{ ['--qc' as string]: qVar(qid) }}>
        <div className="crumbs">
          <Link to="/">天球</Link>
          <span>/</span>
          <span>星座 Q{qid}</span>
        </div>

        <header className="const-head">
          <p className="plate-label">Constellation {qid} · 图幅 {qid + 2}</p>
          <h1 className="const-title">{question.name}</h1>
          <p className="const-stats">
            {question.thinkerCount} 颗星 · {question.bookCount} 部著作 · 一等星 {question.minimumCount} ·
            对话 {l1.arcs.length} 段
          </p>
        </header>

        {/* ---------- 对话星图（桌面横轴） ---------- */}
        <section className="l1-section">
          <div className="l1-note">
            {activeArc ? (
              <>
                <b className={activeArc.type === 'extends' ? 'arc-tag ext' : 'arc-tag ref'}>
                  {activeArc.type === 'extends' ? '呼应' : '反驳'}
                </b>
                <Link to={`/thinker/${activeArc.from}`}>{getThinker(activeArc.from)?.nameZh}</Link>
                <span className="l1-note-arrow">⟶</span>
                <Link to={`/thinker/${activeArc.to}`}>{getThinker(activeArc.to)?.nameZh}</Link>
                <span className="l1-note-text">{activeArc.note}</span>
              </>
            ) : (
              <span className="l1-note-hint">
                时间自左向右 · <i className="arc-swatch ext" />呼应/延伸 · <i className="arc-swatch ref" />反驳/对立 ·
                触摸弧线读对话
              </span>
            )}
          </div>

          <div className="l1-scroll">
            <svg
              className="l1-svg"
              width={l1.width}
              height={CHART_H}
              viewBox={`0 0 ${l1.width} ${CHART_H}`}
              role="img"
              aria-label={`${question.name}：思想家时间轴与对话弧线`}
            >
              <line className="l1-base" x1={40} y1={BASE_Y} x2={l1.width - 40} y2={BASE_Y} />
              {l1.ticks.map((tk) => (
                <g key={tk.year}>
                  <line className="l1-tick" x1={tk.x} y1={BASE_Y} x2={tk.x} y2={BASE_Y + 10} />
                  <text className="l1-tick-label" x={tk.x} y={BASE_Y + 30}>
                    {tk.year < 0 ? `前${-tk.year}` : tk.year}
                  </text>
                </g>
              ))}

              {l1.arcs.map((a, i) => {
                const p1 = starPos.get(a.from)!
                const p2 = starPos.get(a.to)!
                const mx = (p1.x + p2.x) / 2
                const top = Math.min(p1.y, p2.y) - 70 - Math.min(120, Math.abs(p2.x - p1.x) * 0.045)
                const d = `M ${p1.x} ${p1.y} Q ${mx} ${top} ${p2.x} ${p2.y}`
                const active = activeArc === a
                return (
                  <g key={i}>
                    <path className={`l1-arc ${a.type}${active ? ' active' : ''}`} d={d} />
                    <path
                      className="l1-arc-hit"
                      d={d}
                      onPointerEnter={() => setActiveArc(a)}
                      onClick={() => setActiveArc(a)}
                    />
                  </g>
                )
              })}

              {l1.stars.map((s) => {
                const t = getThinker(s.slug)!
                const y = laneY(s.lane)
                const lit = statusOf(s.slug) === 'read'
                const r = STAR_R[t.magnitude]
                return (
                  <g key={s.slug} className="l1-star-g">
                    <line className="l1-drop" x1={s.x} y1={y + r} x2={s.x} y2={BASE_Y} />
                    <Link to={`/thinker/${s.slug}`}>
                      {lit && <circle className="l1-halo" cx={s.x} cy={y} r={r + 5} />}
                      {t.questions.length > 1 && <circle className="l1-double" cx={s.x} cy={y} r={r + 3.5} />}
                      <circle className={lit ? 'l1-star lit' : t.magnitude === 1 ? 'l1-star mag1' : 'l1-star'} cx={s.x} cy={y} r={r} />
                      <text className="l1-name" x={s.x} y={y - r - 8}>
                        {t.nameZh}
                      </text>
                      <title>
                        {t.nameZh} · {formatYears(t)}
                      </title>
                    </Link>
                  </g>
                )
              })}
            </svg>
          </div>
        </section>

        {/* ---------- 移动端纵向星图册 ---------- */}
        <section className="l1-mobile">
          {l1.stars.map((s) => {
            const t = getThinker(s.slug)!
            const lit = statusOf(s.slug) === 'read'
            const talks = t.dialogues.filter((d) => memberSlugs.has(d.with))
            return (
              <Link to={`/thinker/${s.slug}`} key={s.slug} className="l1m-row">
                <span className="l1m-year">{t.birthYear || '—'}</span>
                <span className={`l1m-dot${lit ? ' lit' : ''}${t.magnitude === 1 ? ' mag1' : ''}`} />
                <span className="l1m-body">
                  <b>{t.nameZh}</b>
                  <small>
                    {t.nationality} · 著作 {t.books.filter((b) => b.questionId === qid).length}
                    {t.magnitude === 1 && ' · ✦ 必读'}
                  </small>
                  {talks.map((d, i) => (
                    <small key={i} className={d.type === 'extends' ? 'l1m-talk ext' : 'l1m-talk ref'}>
                      {d.dir === 'out' ? '⟶' : '⟵'} {d.type === 'extends' ? '呼应' : '反驳'}{' '}
                      {getThinker(d.with)?.nameZh}：{d.note}
                    </small>
                  ))}
                </span>
              </Link>
            )
          })}
        </section>

        {/* ---------- 星区 ---------- */}
        <section className="const-sections">
          <h2 className="const-h2">星区</h2>
          {question.sections.map((sec) => (
            <div key={sec.id} className="const-sec">
              <h3 className="const-sec-name">
                <span className="const-sec-id">{sec.id}</span> {sec.name}
              </h3>
              {sec.disciplines.map((d) => (
                <div key={d.name} className="const-disc">
                  <span className="const-disc-name">{d.name}</span>
                  <span className="const-disc-thinkers">
                    {d.slugs.map((slug) => {
                      const t = getThinker(slug)!
                      const lit = statusOf(slug) === 'read'
                      return (
                        <Link
                          key={slug}
                          to={`/thinker/${slug}`}
                          className={`const-thinker${t.magnitude === 1 ? ' mag-1' : ''}${lit ? ' lit' : ''}`}
                        >
                          {t.magnitude === 1 && '✦ '}
                          {t.nameZh}
                        </Link>
                      )
                    })}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* ---------- 一等星书目 ---------- */}
        {minimumBooks.length > 0 && (
          <section className="const-minimum">
            <h2 className="const-h2">一等星书目 · {minimumBooks.length}</h2>
            <ul className="const-min-list">
              {minimumBooks.map(({ book, thinker }, i) => (
                <li key={i}>
                  <Link to={`/thinker/${thinker.slug}`} className="const-min-thinker">
                    {thinker.nameZh}
                  </Link>
                  <span className="const-min-title">《{book.titleZh}》</span>
                  {book.titleEn && <span className="const-min-en">{book.titleEn}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="const-pager">
          {prev ? (
            <Link to={`/constellation/${prev.id}`} className="btn">
              ← Q{prev.id} {prev.name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/constellation/${next.id}`} className="btn">
              Q{next.id} {next.name} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
    </>
  )
}
