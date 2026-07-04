import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { atlas, formatYears, getQuestion, getThinker, qVar, questions, type L1Arc } from '../data'
import { useProgress } from '../data/progress'
import { SiteNav } from '../components/SiteNav'
import './ConstellationPage.css'

// 放大星座视图：沿用天球 L0 的星位（保持座形连续），
// 按"星点 + 星名 + 年份"的文本框做矩形避让，保证星名互不叠压
const VIEW_W = 1360
const EN_R: Record<number, number> = { 1: 15, 2: 11.5, 3: 9, 4: 7.5 }

interface EnStar {
  slug: string
  x: number
  y: number
  r: number
  double: boolean
  hw: number // 文本框半宽（按星名字数）
}

function useEnlarged(qid: number) {
  return useMemo(() => {
    const c = atlas.constellations.find((k) => k.id === qid)
    if (!c) return null
    const H = Math.max(720, Math.min(1180, 540 + c.stars.length * 8))
    const MX = 120
    const MY = 90
    const xs = c.stars.map((s) => s.x)
    const ys = c.stars.map((s) => s.y)
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2
    const midY = (Math.min(...ys) + Math.max(...ys)) / 2
    const scale = Math.min(
      (VIEW_W - MX * 2) / Math.max(60, Math.max(...xs) - Math.min(...xs)),
      (H - MY * 2) / Math.max(60, Math.max(...ys) - Math.min(...ys)),
    )
    const stars: EnStar[] = c.stars.map((st) => {
      const t = getThinker(st.slug)!
      const chars = t.nameZh.length + (t.magnitude === 1 ? 1.5 : 0)
      return {
        slug: st.slug,
        x: (st.x - midX) * scale + VIEW_W / 2,
        y: (st.y - midY) * scale + H / 2,
        r: EN_R[t.magnitude],
        double: st.double,
        hw: Math.max(42, (chars * (t.magnitude === 1 ? 16 : 14.5)) / 2 + 9),
      }
    })
    // 矩形避让：盒宽 = 星名宽度，盒高 = 星点 + 名 + 年的纵向占位
    const NEED_Y = 66
    for (let iter = 0; iter < 160; iter++) {
      let moved = false
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i], b = stars[j]
          const needX = a.hw + b.hw
          let dx = b.x - a.x
          const dy = b.y - a.y
          const ox = needX - Math.abs(dx)
          const oy = NEED_Y - Math.abs(dy)
          if (ox > 0 && oy > 0) {
            moved = true
            if (dx === 0) dx = 1
            if (ox / needX < oy / NEED_Y) {
              const push = (ox / 2) * Math.sign(dx)
              a.x -= push
              b.x += push
            } else {
              const push = (oy / 2) * Math.sign(dy || 1)
              a.y -= push
              b.y += push
            }
          }
        }
      }
      for (const st of stars) {
        st.x = Math.min(VIEW_W - MX, Math.max(MX, st.x))
        st.y = Math.min(H - MY, Math.max(MY, st.y))
      }
      if (!moved) break
    }
    const pos = new Map(stars.map((st) => [st.slug, st]))
    const lines = c.lines
      .map(([f, t]) => [pos.get(f), pos.get(t)])
      .filter((p): p is [EnStar, EnStar] => !!p[0] && !!p[1])
    return { stars, pos, lines, H }
  }, [qid])
}

/** 弧线控制点：中点向远离画面中心的方向外推 */
function arcPath(a: EnStar, b: EnStar, H: number) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const d = Math.hypot(b.x - a.x, b.y - a.y)
  let nx = -(b.y - a.y) / (d || 1)
  let ny = (b.x - a.x) / (d || 1)
  if ((mx - VIEW_W / 2) * nx + (my - H / 2) * ny < 0) {
    nx = -nx
    ny = -ny
  }
  const push = Math.min(150, 40 + d * 0.22)
  return `M ${a.x} ${a.y} Q ${mx + nx * push} ${my + ny * push} ${b.x} ${b.y}`
}

export default function ConstellationPage() {
  const { id } = useParams()
  const qid = Number(id)
  const question = getQuestion(qid)
  const l1 = atlas.l1[String(qid)]
  const enlarged = useEnlarged(qid)
  const { statusOf } = useProgress()
  const [activeArc, setActiveArc] = useState<L1Arc | null>(null)

  if (!question || !l1 || !enlarged) return <Navigate to="/" replace />

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

        {/* ---------- 放大的星座（桌面） ---------- */}
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
                天球上这一角的放大图 · <i className="arc-swatch ext" />呼应/延伸 · <i className="arc-swatch ref" />反驳/对立 ·
                触摸弧线读对话 · ✦ 一等星
              </span>
            )}
          </div>

          <div className="l1-frame">
            <svg
              className="l1-svg"
              viewBox={`0 0 ${VIEW_W} ${enlarged.H}`}
              role="img"
              aria-label={`${question.name}星座放大图：思想家星位与对话弧线`}
            >
              <g className="l1-graticule" aria-hidden="true">
                <path d={`M -40 ${enlarged.H * 0.32} Q ${VIEW_W / 2} ${enlarged.H * 0.32 - 60} ${VIEW_W + 40} ${enlarged.H * 0.32}`} />
                <path d={`M -40 ${enlarged.H * 0.72} Q ${VIEW_W / 2} ${enlarged.H * 0.72 - 60} ${VIEW_W + 40} ${enlarged.H * 0.72}`} />
              </g>

              {enlarged.lines.map(([a, b], i) => (
                <line key={i} className="l1-const-line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              ))}

              {l1.arcs.map((arc, i) => {
                const a = enlarged.pos.get(arc.from)
                const b = enlarged.pos.get(arc.to)
                if (!a || !b) return null
                const d = arcPath(a, b, enlarged.H)
                const active = activeArc === arc
                return (
                  <g key={i}>
                    <path className={`l1-arc ${arc.type}${active ? ' active' : ''}`} d={d} />
                    <path
                      className="l1-arc-hit"
                      d={d}
                      onPointerEnter={() => setActiveArc(arc)}
                      onClick={() => setActiveArc(arc)}
                    />
                  </g>
                )
              })}

              {enlarged.stars.map((s) => {
                const t = getThinker(s.slug)!
                const lit = statusOf(s.slug) === 'read'
                const labelY = s.y + s.r + 19
                const yearY = labelY + 15
                return (
                  <g key={s.slug} className="l1-star-g">
                    <Link to={`/thinker/${s.slug}`}>
                      {lit && <circle className="l1-halo" cx={s.x} cy={s.y} r={s.r + 6} />}
                      {s.double && <circle className="l1-double" cx={s.x} cy={s.y} r={s.r + 4.5} />}
                      <circle
                        className={lit ? 'l1-star lit' : t.magnitude === 1 ? 'l1-star mag1' : 'l1-star'}
                        cx={s.x}
                        cy={s.y}
                        r={s.r}
                      />
                      <text className={t.magnitude === 1 ? 'l1-name mag1' : 'l1-name'} x={s.x} y={labelY}>
                        {t.magnitude === 1 ? '✦ ' : ''}
                        {t.nameZh}
                      </text>
                      <text className="l1-year" x={s.x} y={yearY}>
                        {t.birthYear || '—'}
                      </text>
                      <title>
                        {t.nameZh} · {formatYears(t)} · {t.line}
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
                    {t.line}
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
