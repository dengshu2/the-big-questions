import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { atlas, formatYears, getQuestion, getThinker, qVar, questions, type L1Arc } from '../data'
import { useProgress } from '../data/progress'
import { SiteNav } from '../components/SiteNav'
import './ConstellationPage.css'

// 放大星座视图：沿用天球 L0 的星位（保持座形连续），放大 + 避让后全员星名常显
const VIEW_W = 1360
const VIEW_H = 880
const MARGIN = 110
const EN_R: Record<number, number> = { 1: 15, 2: 11.5, 3: 9, 4: 7.5 }

interface EnStar {
  slug: string
  x: number
  y: number
  r: number
  double: boolean
  labelUp: boolean
}

function useEnlarged(qid: number) {
  return useMemo(() => {
    const c = atlas.constellations.find((k) => k.id === qid)
    if (!c) return null
    const s = Math.min((VIEW_W - MARGIN * 2) / (2 * c.R), (VIEW_H - MARGIN * 2) / (2 * c.R))
    const stars: EnStar[] = c.stars.map((st, i) => ({
      slug: st.slug,
      x: (st.x - c.cx) * s + VIEW_W / 2,
      y: (st.y - c.cy) * s + VIEW_H / 2,
      r: EN_R[getThinker(st.slug)!.magnitude],
      double: st.double,
      labelUp: i % 2 === 0,
    }))
    // 二次避让：放大后为星名留出空间
    const gap = c.stars.length > 60 ? 30 : 40
    for (let iter = 0; iter < 80; iter++) {
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i], b = stars[j]
          const min = a.r + b.r + gap
          let dx = b.x - a.x, dy = b.y - a.y
          let d = Math.hypot(dx, dy)
          if (d < min) {
            if (d < 0.01) { dx = 1; dy = 0; d = 1 }
            const push = (min - d) / 2 / d
            a.x -= dx * push; a.y -= dy * push
            b.x += dx * push; b.y += dy * push
          }
        }
      }
      for (const st of stars) {
        st.x = Math.min(VIEW_W - MARGIN, Math.max(MARGIN, st.x))
        st.y = Math.min(VIEW_H - 90, Math.max(96, st.y))
      }
    }
    const pos = new Map(stars.map((st) => [st.slug, st]))
    const lines = c.lines
      .map(([f, t]) => [pos.get(f), pos.get(t)])
      .filter((p): p is [EnStar, EnStar] => !!p[0] && !!p[1])
    return { stars, pos, lines }
  }, [qid])
}

/** 弧线控制点：中点向远离画面中心的方向外推 */
function arcPath(a: EnStar, b: EnStar) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const d = Math.hypot(b.x - a.x, b.y - a.y)
  let nx = -(b.y - a.y) / (d || 1)
  let ny = (b.x - a.x) / (d || 1)
  if ((mx - VIEW_W / 2) * nx + (my - VIEW_H / 2) * ny < 0) {
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
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              role="img"
              aria-label={`${question.name}星座放大图：思想家星位与对话弧线`}
            >
              <g className="l1-graticule" aria-hidden="true">
                <path d={`M -40 ${VIEW_H * 0.32} Q ${VIEW_W / 2} ${VIEW_H * 0.32 - 60} ${VIEW_W + 40} ${VIEW_H * 0.32}`} />
                <path d={`M -40 ${VIEW_H * 0.72} Q ${VIEW_W / 2} ${VIEW_H * 0.72 - 60} ${VIEW_W + 40} ${VIEW_H * 0.72}`} />
              </g>

              {enlarged.lines.map(([a, b], i) => (
                <line key={i} className="l1-const-line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              ))}

              {l1.arcs.map((arc, i) => {
                const a = enlarged.pos.get(arc.from)
                const b = enlarged.pos.get(arc.to)
                if (!a || !b) return null
                const d = arcPath(a, b)
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
                const labelY = s.labelUp ? s.y - s.r - 24 : s.y + s.r + 20
                const yearY = s.labelUp ? labelY - 16 : labelY + 15
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
