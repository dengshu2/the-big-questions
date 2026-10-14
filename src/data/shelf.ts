// 我的书架：每本书的阅读状态，保存在本浏览器的 localStorage
import { useSyncExternalStore } from 'react'

export type Status = 'want' | 'reading' | 'done'

export const STATUS_LABEL: Record<Status, string> = { want: '想读', reading: '在读', done: '读完' }
export const STATUSES: Status[] = ['want', 'reading', 'done']

export interface Entry {
  status: Status
  at: string
}

type Shelf = Readonly<Record<string, Entry>>

const KEY = 'tbq-shelf'
const VERSION = 2

function parse(json: string): Shelf {
  const data = JSON.parse(json)
  if (data?.version !== VERSION || typeof data.books !== 'object' || data.books === null) {
    throw new Error('这不是本站导出的书架文件')
  }
  const out: Record<string, Entry> = {}
  for (const [id, e] of Object.entries(data.books as Record<string, Entry>)) {
    if (e && STATUSES.includes(e.status) && typeof e.at === 'string') out[id] = { status: e.status, at: e.at }
  }
  return out
}

function load(): Shelf {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? parse(raw) : {}
  } catch {
    return {}
  }
}

let state: Shelf = load()
const listeners = new Set<() => void>()

function commit(next: Shelf) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, books: state }))
  } catch {
    /* 隐私模式等情况下只保存在内存里 */
  }
  for (const l of listeners) l()
}

export function setStatus(id: string, status: Status | null) {
  const next = { ...state }
  if (status) next[id] = { status, at: new Date().toISOString() }
  else delete next[id]
  commit(next)
}

export const exportShelf = () => JSON.stringify({ version: VERSION, books: state }, null, 2)

/** 导入会覆盖当前书架，返回导入的条数 */
export function importShelf(json: string): number {
  const next = parse(json)
  commit(next)
  return Object.keys(next).length
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useShelf() {
  return useSyncExternalStore(subscribe, () => state)
}

/** 一组书里读完的本数 */
export const countDone = (shelf: Shelf, ids: string[]) => ids.filter((id) => shelf[id]?.status === 'done').length
