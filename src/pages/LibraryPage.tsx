import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { allThinkers, formatYears, meta, qVar, questions } from '../data'
import { exportProgress, importProgress, useProgress } from '../data/progress'
import { SiteNav } from '../components/SiteNav'
import './LibraryPage.css'

type Sort = 'year' | 'books' | 'name'
type Filter = 'all' | 'mag1' | number

export default function LibraryPage() {
  const { statusOf } = useProgress()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('year')
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    let arr = allThinkers.filter((t) => {
      if (filter === 'mag1' && t.magnitude !== 1) return false
      if (typeof filter === 'number' && !t.questions.includes(filter)) return false
      if (!q) return true
      return (
        t.nameZh.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.nationality.toLowerCase().includes(q) ||
        t.books.some((b) => b.titleZh.toLowerCase().includes(q) || b.titleEn.toLowerCase().includes(q))
      )
    })
    arr = [...arr]
    if (sort === 'year') arr.sort((a, b) => a.birthNum - b.birthNum)
    if (sort === 'books') arr.sort((a, b) => b.books.length - a.books.length)
    if (sort === 'name') arr.sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh'))
    return arr
  }, [query, filter, sort])

  const downloadProgress = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `观测记录-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const onImportFile = (file: File | undefined) => {
    if (!file) return
    file.text().then((text) => {
      try {
        const n = importProgress(text)
        setImportMsg(`已恢复 ${n} 条观测记录`)
      } catch (e) {
        setImportMsg(e instanceof Error ? e.message : '导入失败')
      }
    })
  }

  return (
    <>
      <SiteNav />
      <main className="page lib-page">
        <header className="lib-head">
          <p className="plate-label">Observation handbook · 附录</p>
          <h1>观测手册</h1>
          <p className="lib-sub">
            全部 {meta.thinkerCount} 位思想家 · {meta.bookCount} 部著作的检索目录
          </p>
        </header>

        <div className="lib-tools">
          <input
            className="lib-search"
            type="search"
            placeholder="搜索姓名 / 国籍 / 书名…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="lib-sorts">
            {(
              [
                ['year', '按年代'],
                ['books', '按著作'],
                ['name', '按姓名'],
              ] as [Sort, string][]
            ).map(([key, label]) => (
              <button key={key} className={sort === key ? 'btn active' : 'btn'} onClick={() => setSort(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="lib-filters">
          <button className={filter === 'all' ? 'btn active' : 'btn'} onClick={() => setFilter('all')}>
            全部
          </button>
          <button className={filter === 'mag1' ? 'btn active' : 'btn'} onClick={() => setFilter('mag1')}>
            ✦ 一等星
          </button>
          {questions.map((q) => (
            <button
              key={q.id}
              className={filter === q.id ? 'btn active' : 'btn'}
              style={filter === q.id ? { background: `var(--q${q.id})`, borderColor: `var(--q${q.id})` } : { color: qVar(q.id) }}
              onClick={() => setFilter(q.id)}
            >
              Q{q.id} {q.name}
            </button>
          ))}
        </div>

        <p className="lib-count">{list.length} 条记录</p>

        <ul className="lib-list">
          {list.map((t) => {
            const status = statusOf(t.slug)
            return (
              <li key={t.slug}>
                <Link to={`/thinker/${t.slug}`} className="lib-row">
                  <span
                    className={`lib-dot${status === 'read' ? ' lit' : ''}${t.magnitude === 1 ? ' mag1' : ''}`}
                    title={status === 'read' ? '已点亮' : undefined}
                  />
                  <span className="lib-name">
                    <b>{t.nameZh}</b>
                    <small>{t.line}</small>
                  </span>
                  <span className="lib-years">{formatYears(t)}</span>
                  <span className="lib-nation">{t.nationality || '—'}</span>
                  <span className="lib-books">{t.books.length} 部</span>
                  <span className="lib-qs">
                    {t.questions.map((qid) => (
                      <i key={qid} style={{ color: qVar(qid) }}>
                        Q{qid}
                      </i>
                    ))}
                    {t.hasEssay && <i className="lib-essay">志</i>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        <footer className="lib-footer">
          <h2>观测记录</h2>
          <p>阅读进度保存在本浏览器中。换设备前请导出备份。</p>
          <div className="lib-footer-btns">
            <button className="btn" onClick={downloadProgress}>
              导出 JSON
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              导入 JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => onImportFile(e.target.files?.[0])}
            />
            {importMsg && <span className="lib-import-msg">{importMsg}</span>}
          </div>
        </footer>
      </main>
    </>
  )
}
