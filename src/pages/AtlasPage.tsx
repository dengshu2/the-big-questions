import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { atlas, getThinker, formatYears, meta, qVar, questions } from '../data'
import { useProgress } from '../data/progress'
import { SiteNav } from '../components/SiteNav'
import './AtlasPage.css'

const SKY_W = atlas.sky.width
const SKY_H = atlas.sky.height
const K_MIN = 1
const K_MAX = 7

interface Transform {
  x: number
  y: number
  k: number
}

function clampTransform(t: Transform): Transform {
  const k = Math.min(K_MAX, Math.max(K_MIN, t.k))
  const x = Math.min(0, Math.max(SKY_W * (1 - k), t.x))
  const y = Math.min(0, Math.max(SKY_H * (1 - k), t.y))
  return { x, y, k }
}

/** 装饰性背景星：确定性种子，不代表数据（模块级常量，渲染期不可变）
 *  范围超出 viewBox：meet 模式下溢出到留白区，让纸面铺满星尘 */
const FIELD_STARS = (() => {
  let seed = 20260704
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  return Array.from({ length: 200 }, () => ({
    x: -500 + rnd() * (SKY_W + 1000),
    y: -260 + rnd() * (SKY_H + 520),
    r: 0.6 + rnd() * 0.9,
    dur: 2.8 + rnd() * 4,
    delay: rnd() * 4,
  }))
})()

export default function AtlasPage() {
  const navigate = useNavigate()
  const { statusOf, readCount } = useProgress()
  const [t, setT] = useState<Transform>({ x: 0, y: 0, k: 1 })
  const [hover, setHover] = useState<{ slug: string; sx: number; sy: number } | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null)
  

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  /** 屏幕坐标 → 天球基准坐标（preserveAspectRatio: meet，全图完整可见） */
  const toSky = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const scale = Math.min(rect.width / SKY_W, rect.height / SKY_H)
    const ox = (rect.width - SKY_W * scale) / 2
    const oy = (rect.height - SKY_H * scale) / 2
    return {
      x: (clientX - rect.left - ox) / scale,
      y: (clientY - rect.top - oy) / scale,
      scale,
    }
  }

  useEffect(() => {
    if (isMobile) return
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { x: sx, y: sy } = toSky(e.clientX, e.clientY)
      setT((prev) => {
        const k = Math.min(K_MAX, Math.max(K_MIN, prev.k * Math.exp(-e.deltaY * 0.0016)))
        const ratio = k / prev.k
        return clampTransform({
          x: sx - (sx - prev.x) * ratio,
          y: sy - (sy - prev.y) * ratio,
          k,
        })
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [isMobile])

  const onPointerDown = (e: React.PointerEvent) => {
    if (isMobile) return
    drag.current = { px: e.clientX, py: e.clientY, ox: t.x, oy: t.y, moved: false }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const { scale } = toSky(e.clientX, e.clientY)
    const dx = (e.clientX - drag.current.px) / scale
    const dy = (e.clientY - drag.current.py) / scale
    if (Math.abs(e.clientX - drag.current.px) + Math.abs(e.clientY - drag.current.py) > 4) {
      drag.current.moved = true
    }
    setT((prev) => clampTransform({ ...prev, x: drag.current!.ox + dx, y: drag.current!.oy + dy }))
  }
  const onPointerUp = () => {
    setTimeout(() => {
      if (drag.current) drag.current = null
    }, 0)
  }

  const clickStar = (slug: string) => {
    if (drag.current?.moved) return
    navigate(`/thinker/${slug}`)
  }

  // 标签层级：拉近才浮现星名
  const tier = t.k >= 3.2 ? 2 : t.k >= 1.7 ? 1 : 0
  const hoverThinker = getThinker(hover?.slug)

  const sky = (
    <svg
      ref={svgRef}
      className="atlas-svg"
      viewBox={`0 0 ${SKY_W} ${SKY_H}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="img"
      aria-label="大问题天球总图：11 个星座，420 颗思想家之星"
    >
      <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>
        {/* 经纬弧线（图集肌理） */}
        <g className="atlas-graticule" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((f) => (
            <path key={`h${f}`} d={`M -500 ${SKY_H * f} Q ${SKY_W / 2} ${SKY_H * f - 90} ${SKY_W + 500} ${SKY_H * f}`} />
          ))}
          {[0.05, 0.22, 0.45, 0.68, 0.9, 1.06].map((f) => (
            <path key={`v${f}`} d={`M ${SKY_W * f} -260 Q ${SKY_W * f + 60} ${SKY_H / 2} ${SKY_W * f} ${SKY_H + 260}`} />
          ))}
        </g>

        {FIELD_STARS.map((s, i) => (
          <circle
            key={i}
            className="atlas-field-star"
            cx={s.x}
            cy={s.y}
            r={s.r}
            style={{ animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}
            aria-hidden="true"
          />
        ))}

        {/* 双星虚线：跨星座认领 */}
        {atlas.doubleLinks.map((l, i) => {
          const a = atlas.constellations.flatMap((c) => c.stars).find((s) => s.slug === l.from)
          const b = atlas.constellations.flatMap((c) => c.stars).find((s) => s.slug === l.to)
          if (!a || !b) return null
          return <line key={i} className="atlas-double-link" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        })}

        {atlas.constellations.map((c, ci) => {
          const pos = new Map(c.stars.map((s) => [s.slug, s]))
          const q = questions.find((x) => x.id === c.id)
          return (
            <g key={c.id}>
              {c.lines.map(([f, to], i) => {
                const a = pos.get(f)
                const b = pos.get(to)
                if (!a || !b) return null
                return (
                  <line
                    key={i}
                    className="atlas-line"
                    pathLength={1}
                    style={{ animationDelay: `${0.5 + ci * 0.12 + i * 0.14}s` }}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                  />
                )
              })}
              <g
                className="atlas-const-label"
                style={{ animationDelay: `${0.3 + ci * 0.1}s` }}
                onClick={() => navigate(`/constellation/${c.id}`)}
              >
                <text className="atlas-const-name" x={c.cx} y={c.cy - c.R - 26} fill={qVar(c.id)}>
                  {c.name}
                </text>
                <text className="atlas-const-count" x={c.cx} y={c.cy - c.R - 6}>
                  Q{c.id} · {q?.thinkerCount ?? c.stars.length} 星 · {q?.bookCount} 书
                </text>
              </g>
              {c.stars.map((s, si) => {
                const th = getThinker(s.slug)!
                const status = statusOf(s.slug)
                const lit = status === 'read'
                const showLabel = tier === 2 || (tier === 1 && th.magnitude <= 2)
                return (
                  <g key={s.slug} className="atlas-star-g" onClick={() => clickStar(s.slug)}
                    style={{ animationDelay: `${0.15 + ci * 0.08 + si * 0.012}s` }}
                    onPointerEnter={(e) => setHover({ slug: s.slug, sx: e.clientX, sy: e.clientY })}
                    onPointerLeave={() => setHover(null)}
                  >
                    {lit && <circle className="atlas-star-halo" cx={s.x} cy={s.y} r={s.r + 4.5} />}
                    {s.double && <circle className="atlas-star-double" cx={s.x} cy={s.y} r={s.r + 3.2} />}
                    {status === 'want' && <circle className="atlas-star-want" cx={s.x} cy={s.y} r={s.r + 3.2} />}
                    <circle className={lit ? 'atlas-star lit' : 'atlas-star'} cx={s.x} cy={s.y} r={s.r} />
                    {showLabel && (
                      <text className="atlas-star-name" x={s.x} y={s.y - s.r - 3.5}>
                        {th.nameZh}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}
      </g>
    </svg>
  )

  return (
    <>
      <SiteNav />
      <div className={isMobile ? 'atlas-wrap mobile' : 'atlas-wrap'} ref={wrapRef}>
        {sky}

        <div className="atlas-head">
          <p className="plate-label">Atlas of the Big Questions · 图幅一</p>
          <h1>大问题天球</h1>
          <p className="atlas-head-sub">
            {meta.questionCount} 个星座 · {meta.thinkerCount} 颗星 · {meta.bookCount} 部经典 ·
            跨越 {meta.yearRange[1] - meta.yearRange[0]} 年
            {readCount > 0 && <span className="atlas-head-lit"> · 已点亮 {readCount}</span>}
          </p>
        </div>

        {!isMobile && (
          <div className="atlas-legend">
            <span><i className="lg lg-mag1" /> 一等星（必读）</span>
            <span><i className="lg lg-double" /> 双星（跨问题）</span>
            <span><i className="lg lg-lit" /> 已点亮</span>
            <span className="atlas-legend-hint">滚轮拉近浮现星名 · 拖拽巡天</span>
            {(t.k > 1.01 || t.x !== 0 || t.y !== 0) && (
              <button className="btn" onClick={() => setT({ x: 0, y: 0, k: 1 })}>复位</button>
            )}
          </div>
        )}

        <div className="atlas-chips">
          {questions.map((q) => (
            <Link key={q.id} to={`/constellation/${q.id}`} className="q-chip atlas-chip" style={{ color: qVar(q.id) }}>
              <b>Q{q.id}</b> {q.name}
            </Link>
          ))}
        </div>

        {hoverThinker && hover && !isMobile && (
          <div className="atlas-tip" style={{ left: hover.sx + 14, top: hover.sy + 14 }}>
            <p className="atlas-tip-name">
              {hoverThinker.nameZh}
              {hoverThinker.hasEssay && <span className="atlas-tip-essay">有志</span>}
            </p>
            <p className="atlas-tip-meta">
              {formatYears(hoverThinker)} · {hoverThinker.nationality || '—'} · 著作 {hoverThinker.books.length}
            </p>
            <p className="atlas-tip-qs">
              {hoverThinker.questions.map((qid) => (
                <span key={qid} style={{ color: qVar(qid) }}>
                  Q{qid} {getQuestionName(qid)}
                </span>
              ))}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

function getQuestionName(id: number) {
  return questions.find((q) => q.id === id)?.name ?? ''
}
