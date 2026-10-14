import { useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getBook, authorNames } from '../data/catalog'
import { STATUS_LABEL, useShelf } from '../data/shelf'

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
  out: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
}

/** 子页面返回：有站内历史就后退，否则回到上一级 */
function useBack(fallback: string) {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key !== 'default' ? navigate(-1) : navigate(fallback))
}

/**
 * 顶栏：左边返回（首页没有），中间两行状态，右边一个胶囊。
 * 子页面按 Esc 也会返回。
 */
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
        {back && (
          <button className="q-round" onClick={goBack} aria-label="返回">
            <Icon d={ICONS.back} />
          </button>
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

/** 书单里的一本书：书名 + 一句话 + 作者，右侧是阅读状态或"首选" */
export function BookRow({ id, must, showAuthor = true }: { id: string; must?: boolean; showAuthor?: boolean }) {
  const shelf = useShelf()
  const book = getBook(id)
  if (!book) return null
  const status = shelf[id]?.status
  return (
    <li>
      <Link to={`/b/${id}`} className="q-row book-row">
        <span className="q-row-main">
          <span>《{book.title}》</span>
          <span>{book.note}</span>
          {showAuthor && <span className="book-author">{authorNames(book)}</span>}
        </span>
        {status ? (
          <span className={status === 'done' ? 'q-st q-st--done' : 'q-st'}>{STATUS_LABEL[status]}</span>
        ) : (
          must && <span className="pick-tag">首选</span>
        )}
      </Link>
    </li>
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
