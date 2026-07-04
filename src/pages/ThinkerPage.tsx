import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { atlas, doubanBookUrl, formatYears, getQuestion, getThinker, MAG_LABEL, qVar } from '../data'
import { useProgress } from '../data/progress'
import { SiteNav } from '../components/SiteNav'
import './ThinkerPage.css'

const essayCache = new Map<string, string>()

function useEssay(slug: string | undefined, hasEssay: boolean) {
  // text === undefined 加载中；null 加载失败；string 就绪（缓存直出不经 state）
  const [fetched, setFetched] = useState<{ slug: string; text: string | null }>()
  useEffect(() => {
    if (!slug || !hasEssay || essayCache.has(slug)) return
    let cancelled = false
    fetch(`/thinkers/${slug}.md`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => {
        essayCache.set(slug, text)
        if (!cancelled) setFetched({ slug, text })
      })
      .catch(() => {
        if (!cancelled) setFetched({ slug, text: null })
      })
    return () => {
      cancelled = true
    }
  }, [slug, hasEssay])

  const cached = slug ? essayCache.get(slug) : undefined
  const fresh = fetched && fetched.slug === slug ? fetched.text : undefined
  const essay = cached ?? fresh
  return { essay: essay ?? null, failed: fresh === null }
}

export default function ThinkerPage() {
  const { slug } = useParams()
  const thinker = getThinker(slug)
  const { statusOf, setStatus } = useProgress()
  const { essay, failed } = useEssay(slug, thinker?.hasEssay ?? false)

  if (!thinker) return <Navigate to="/library" replace />

  const status = statusOf(thinker.slug)
  const primaryQ = thinker.questions[0]
  const l1 = atlas.l1[String(primaryQ)]
  const idx = l1.stars.findIndex((s) => s.slug === thinker.slug)
  const prevStar = idx > 0 ? getThinker(l1.stars[idx - 1].slug) : undefined
  const nextStar = idx >= 0 && idx < l1.stars.length - 1 ? getThinker(l1.stars[idx + 1].slug) : undefined

  return (
    <>
      <SiteNav />
      <main className="page thinker-page">
        <div className="crumbs">
          <Link to="/">天球</Link>
          <span>/</span>
          <Link to={`/constellation/${primaryQ}`}>{getQuestion(primaryQ)?.name}</Link>
          <span>/</span>
          <span>{thinker.nameZh}</span>
        </div>

        <header className="tk-head">
          <div className="tk-head-main">
            <p className="plate-label">
              {MAG_LABEL[thinker.magnitude]}
              {thinker.questions.length > 1 && ' · 双星'}
              {thinker.yearEstimated && ' · 年代为估算'}
            </p>
            <h1 className="tk-name">
              {thinker.nameZh}
              {status === 'read' && <span className="tk-lit-star" title="已点亮">✦</span>}
            </h1>
            {thinker.nameEn && <p className="tk-name-en">{thinker.nameEn}</p>}
            <p className="tk-line">{thinker.line}</p>
            <p className="tk-meta">
              {formatYears(thinker)} · {thinker.nationality || '国籍不详'}
            </p>
            <p className="tk-qs">
              {thinker.questions.map((qid) => (
                <Link key={qid} to={`/constellation/${qid}`} className="q-chip" style={{ color: qVar(qid) }}>
                  Q{qid} {getQuestion(qid)?.name}
                </Link>
              ))}
              {thinker.wikipediaUrl && (
                <a className="q-chip tk-wiki" href={thinker.wikipediaUrl} target="_blank" rel="noreferrer">
                  维基百科 ↗
                </a>
              )}
            </p>
          </div>

          <div className="tk-actions">
            <button
              className={status === 'read' ? 'btn lit' : 'btn'}
              onClick={() => setStatus(thinker.slug, status === 'read' ? null : 'read')}
            >
              ✦ {status === 'read' ? '已点亮' : '点亮这颗星'}
            </button>
            <button
              className={status === 'want' ? 'btn active' : 'btn'}
              onClick={() => setStatus(thinker.slug, status === 'want' ? null : 'want')}
            >
              {status === 'want' ? '已在想读' : '想读'}
            </button>
          </div>
        </header>

        {thinker.brief && (
          <section className="tk-brief">
            <p>{thinker.brief}</p>
          </section>
        )}

        <section className="tk-books">
          <h2 className="tk-h2">著作 · {thinker.books.length}</h2>
          <ul className="tk-book-list">
            {thinker.books.map((b, i) => (
              <li key={i}>
                <a
                  className="tk-book-title"
                  href={doubanBookUrl(b.titleZh)}
                  target="_blank"
                  rel="noreferrer"
                  title="在豆瓣搜索本书"
                >
                  《{b.titleZh}》
                </a>
                {b.titleEn && <span className="tk-book-en">{b.titleEn}</span>}
                {b.minimum && <span className="tk-badge gold">必读</span>}
                {b.coauthored && <span className="tk-badge">合著</span>}
                <span className="tk-book-disc" style={{ color: qVar(b.questionId) }}>
                  {b.discipline}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {thinker.dialogues.length > 0 && (
          <section className="tk-dialogues">
            <h2 className="tk-h2">思想对话 · {thinker.dialogues.length}</h2>
            <ul className="tk-dlg-list">
              {thinker.dialogues.map((d, i) => {
                const other = getThinker(d.with)!
                return (
                  <li key={i}>
                    <span className={d.type === 'extends' ? 'arc-tag ext' : 'arc-tag ref'}>
                      {d.type === 'extends' ? '呼应' : '反驳'}
                    </span>
                    <span className="tk-dlg-who">
                      {d.dir === 'out' ? (
                        <>
                          他{d.type === 'extends' ? '呼应了' : '反驳了'}{' '}
                          <Link to={`/thinker/${other.slug}`}>{other.nameZh}</Link>
                        </>
                      ) : (
                        <>
                          <Link to={`/thinker/${other.slug}`}>{other.nameZh}</Link>{' '}
                          {d.type === 'extends' ? '呼应了' : '反驳了'}他
                        </>
                      )}
                    </span>
                    <span className="tk-dlg-note">{d.note}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {thinker.hasEssay && (
          <section className="tk-essay">
            <h2 className="tk-h2">星志</h2>
            {essay ? (
              <div className="tk-md">
                <ReactMarkdown components={{ h1: 'h2' }}>{essay}</ReactMarkdown>
              </div>
            ) : failed ? (
              <p className="tk-essay-fail">介绍加载失败，请刷新重试。</p>
            ) : (
              <p className="tk-essay-loading">正在展开星志……</p>
            )}
          </section>
        )}

        <nav className="tk-pager">
          {prevStar ? (
            <Link to={`/thinker/${prevStar.slug}`} className="btn">
              ← 前一颗 · {prevStar.nameZh}
            </Link>
          ) : (
            <span />
          )}
          {nextStar ? (
            <Link to={`/thinker/${nextStar.slug}`} className="btn">
              后一颗 · {nextStar.nameZh} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </main>
    </>
  )
}
