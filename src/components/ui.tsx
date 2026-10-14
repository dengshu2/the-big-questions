import { useEffect, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authorNames, doubanUrl, formatYears, getBook, getSection, getThinker, sectionLabel } from '../data/catalog'
import { setStatus, STATUS_LABEL, STATUSES, useShelf } from '../data/shelf'

export function Icon({ d, sm }: { d: string; sm?: boolean }) {
  return (
    <svg className={sm ? 'q-i q-i--sm' : 'q-i'} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

export const ICONS = {
  back: 'M15 18l-6-6 6-6',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-4-4',
  shelf: 'M5 4h4v16H5zM10 4h4v16h-4zM15.5 5.5l3.5-1 3 15-3.5 1z',
  next: 'M9 6l6 6-6 6',
  prev: 'M15 6l-6 6 6 6',
  down: 'M6 9l6 6 6-6',
  out: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
}

/** 浏览器标签页标题 */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · 大问题` : '大问题 · 经典书单'
  }, [title])
}

/** 子页面返回：本站内有上一页就后退（回去时恢复滚动位置），否则回到上一级。
 *  用 React Router 记在 history.state 里的序号判断；切换节用的是 replace，不会增加序号。 */
function useBack(fallback: string) {
  const navigate = useNavigate()
  return () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate(fallback))
}

/** 顶栏：左边返回（首页没有），中间两行状态，右边一个胶囊。子页面按 Esc 也会返回。 */
export function Top({ title, sub, back, right }: { title: string; sub?: string; back?: string; right?: ReactNode }) {
  const goBack = useBack(back ?? '/')
  useEffect(() => {
    if (!back) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement && e.target.value)) goBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  return (
    <header className="q-top">
      <div>
        {back ? (
          <button className="q-round" onClick={goBack} aria-label="返回">
            <Icon d={ICONS.back} />
          </button>
        ) : (
          <Link to="/search" className="q-round" aria-label="搜索">
            <Icon d={ICONS.search} />
          </Link>
        )}
      </div>
      <div className="q-status">
        <b className="top-title">
          {!back && <span className="q-mark" aria-hidden="true">问</span>}
          {title}
        </b>
        {sub && <span>{sub}</span>}
      </div>
      <div>{right}</div>
    </header>
  )
}

export function ShelfPill() {
  const shelf = useShelf()
  const n = Object.keys(shelf).length
  return (
    <Link to="/shelf" className="q-pill" aria-label={`我的书架，${n} 本`}>
      <Icon d={ICONS.shelf} sm />
      书架{n > 0 && <span className="q-num">{n}</span>}
    </Link>
  )
}

/** 当前展开的书记在 URL 的 ?b= 上：可以分享，浏览器返回也能用 */
export function useOpenBook(): [string | null, (id: string) => void] {
  const [params, setParams] = useSearchParams()
  const open = params.get('b')
  // 从分享链接进来时，把展开的那本书滚到眼前（只在进入页面时做一次）
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => document.querySelector('.is-open')?.scrollIntoView({ block: 'center' }), 50)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const toggle = (id: string) =>
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (next.get('b') === id) next.delete('b')
        else next.set('b', id)
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  return [open, toggle]
}

export function StatusSeg({ id }: { id: string }) {
  const shelf = useShelf()
  const status = shelf[id]?.status
  return (
    <div className="q-seg" role="group" aria-label="阅读状态">
      {STATUSES.map((s) => (
        <button key={s} aria-pressed={status === s} onClick={() => setStatus(id, status === s ? null : s)}>
          {STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  )
}

/** 展开后的内容：一句话、归属说明、作者、阅读状态、链接 */
function BookDetail({ id, here, why }: { id: string; here?: string; why?: string }) {
  const book = getBook(id)!
  const elsewhere = book.places.filter((p) => p.section !== here)
  return (
    <div className="book-detail">
      {why && <p className="pick-why">{why}</p>}
      <p className="book-note">{book.note}</p>
      {book.orig && <p className="q-meta orig">{book.orig}</p>}
      {book.credit && <p className="q-notice">{book.credit}</p>}
      {book.authors.map((a) => {
        const t = getThinker(a)
        if (!t) return null
        return (
          <div key={a} className="author">
            <p className="author-name">
              {t.name}
              <span className="q-meta"> {[t.nameEn, formatYears(t), t.nationality].filter(Boolean).join(' · ')}</span>
            </p>
            <p className="author-brief">{t.brief}</p>
          </div>
        )
      })}
      <div className="book-actions">
        <StatusSeg id={id} />
        <a className="q-link ext-link" href={doubanUrl(book.title)} target="_blank" rel="noreferrer">
          豆瓣 <Icon d={ICONS.out} sm />
        </a>
      </div>
      {elsewhere.length > 0 && (
        <p className="q-meta">
          {here ? '也出现在：' : '在书单中：'}
          {elsewhere.map((p, i) => {
            const hit = getSection(p.section)
            return (
              <span key={p.section}>
                {i > 0 && '、'}
                <Link to={`/q/${p.question}/${p.section}?b=${id}`} className="inline-link">
                  {hit?.question.name} {sectionLabel(p.section)} {hit?.section.name}
                </Link>
              </span>
            )
          })}
        </p>
      )}
    </div>
  )
}

/** 书单里的一本书：收起时一行（书名 · 作者 · 状态），点开在原地展开 */
export function BookItem({ id, here, why, open, onToggle }: { id: string; here?: string; why?: string; open: boolean; onToggle: (id: string) => void }) {
  const shelf = useShelf()
  const book = getBook(id)
  if (!book) return null
  const status = shelf[id]?.status
  return (
    <li className={open ? 'book is-open' : 'book'}>
      <button className="q-row book-line" aria-expanded={open} onClick={() => onToggle(id)}>
        <span className="book-title">《{book.title}》</span>
        <span className="book-by">{authorNames(book)}</span>
        {status && <span className={status === 'done' ? 'q-st q-st--done' : 'q-st'}>{STATUS_LABEL[status]}</span>}
        <span className="chev">
          <Icon d={ICONS.down} sm />
        </span>
      </button>
      {open && <BookDetail id={id} here={here} why={why} />}
    </li>
  )
}

/** 一节的首选：大卡片，直接写为什么先读，阅读状态也直接放出来 */
export function PickCard({ id, why, here, open, onToggle }: { id: string; why: string; here?: string; open: boolean; onToggle: (id: string) => void }) {
  const book = getBook(id)
  if (!book) return null
  return (
    <article className={open ? 'pick is-open' : 'pick'}>
      <span className="pick-tag">先读这本</span>
      <h3 className="pick-title">
        《{book.title}》<span className="book-by">{authorNames(book)}</span>
      </h3>
      <p className="pick-why">{why}</p>
      {open ? (
        <BookDetail id={id} here={here} />
      ) : (
        <div className="book-actions">
          <StatusSeg id={id} />
          <button className="q-btn q-btn--quiet q-btn--sm" onClick={() => onToggle(id)} aria-expanded={false}>
            关于这本书和作者
          </button>
        </div>
      )}
      {open && (
        <button className="q-btn q-btn--quiet q-btn--sm collapse" onClick={() => onToggle(id)}>
          收起
        </button>
      )}
    </article>
  )
}

export function Progress({ done, total }: { done: number; total: number }) {
  return (
    <div className="progress">
      <span className="q-bar" aria-hidden="true">
        <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </span>
      <span className="q-meta q-num">
        读完 {done} / {total}
      </span>
    </div>
  )
}
