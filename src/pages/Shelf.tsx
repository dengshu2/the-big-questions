import { useRef, useState } from 'react'
import { getBook } from '../data/catalog'
import { exportShelf, importShelf, STATUS_LABEL, STATUSES, useShelf, type Status } from '../data/shelf'
import { BookItem, Top, useOpenBook, useTitle } from '../components/ui'

export default function Shelf() {
  useTitle('我的书架')
  const shelf = useShelf()
  const [tab, setTab] = useState<Status>('reading')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, toggle] = useOpenBook()

  const ids = Object.entries(shelf)
    .filter(([id, e]) => e.status === tab && getBook(id))
    .sort((a, b) => b[1].at.localeCompare(a[1].at))
    .map(([id]) => id)
  const count = (s: Status) => Object.values(shelf).filter((e) => e.status === s).length

  const download = () => {
    const url = URL.createObjectURL(new Blob([exportShelf()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `大问题书架-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    try {
      const n = importShelf(await file.text())
      setMsg({ ok: true, text: `已导入 ${n} 本书的阅读状态` })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error && e.message.startsWith('这不是') ? e.message : '文件读不出来，请确认是本站导出的 JSON' })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <Top title="我的书架" sub={`${Object.keys(shelf).length} 本`} back="/" />
      <main className="q-page narrow">
        <div className="q-tiles">
          {STATUSES.map((s) => (
            <div key={s} className="q-tile">
              <span className="q-tile-label">{STATUS_LABEL[s]}</span>
              <span className="q-tile-value">{count(s)}</span>
            </div>
          ))}
        </div>

        <div className="q-seg" role="tablist" aria-label="按状态查看">
          {(['reading', 'want', 'done'] as Status[]).map((s) => (
            <button key={s} role="tab" aria-selected={tab === s} onClick={() => setTab(s)}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {ids.length ? (
          <ul className="q-rows books">
            {ids.map((id) => (
              <BookItem key={id} id={id} open={open === id} onToggle={toggle} />
            ))}
          </ul>
        ) : (
          <p className="q-empty">还没有{STATUS_LABEL[tab]}的书。点开任意一本书，在下面的想读、在读、读完里标记，就会出现在这里。</p>
        )}

        <section className="q-sec">
          <h3>备份</h3>
          <p className="q-meta">书架只保存在这个浏览器里。换设备或清理浏览器数据前，先导出一份。</p>
          <div className="q-actions">
            <button className="q-btn" onClick={download}>
              导出
            </button>
            <button className="q-btn" onClick={() => fileRef.current?.click()}>
              导入
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </div>
          {msg && <p className={msg.ok ? 'q-notice q-notice--ok' : 'q-notice q-notice--danger'}>{msg.text}</p>}
        </section>
      </main>
    </>
  )
}
