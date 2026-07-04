// 阅读进度：localStorage 持久化的极简外部 store
// 读过 = 点亮（天球上变金星）；想读 = 收藏待读
import { useSyncExternalStore } from 'react'

const KEY = 'tbq-progress'

export type StarStatus = 'read' | 'want'

export interface ProgressEntry {
  status: StarStatus
  at: string
}

type ProgressMap = Readonly<Record<string, ProgressEntry>>

function load(): ProgressMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed?.version === 1 && parsed.stars && typeof parsed.stars === 'object') {
      return parsed.stars as ProgressMap
    }
  } catch {
    /* 损坏数据视为空 */
  }
  return {}
}

let state: ProgressMap = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, stars: state }))
  } catch {
    /* 隐私模式等场景静默失败，进度仅存于内存 */
  }
}

function emit() {
  for (const l of listeners) l()
}

export function setStatus(slug: string, status: StarStatus | null) {
  const next: Record<string, ProgressEntry> = { ...state }
  if (status) next[slug] = { status, at: new Date().toISOString() }
  else delete next[slug]
  state = next
  persist()
  emit()
}

export function exportProgress(): string {
  return JSON.stringify({ version: 1, stars: state }, null, 2)
}

export function importProgress(json: string): number {
  const parsed = JSON.parse(json)
  if (parsed?.version !== 1 || typeof parsed.stars !== 'object') {
    throw new Error('不是有效的观测记录文件')
  }
  state = { ...parsed.stars }
  persist()
  emit()
  return Object.keys(state).length
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useProgress() {
  const stars = useSyncExternalStore(subscribe, () => state)
  const readCount = Object.values(stars).filter((e) => e.status === 'read').length
  return {
    stars,
    readCount,
    statusOf: (slug: string): StarStatus | null => stars[slug]?.status ?? null,
    setStatus,
  }
}
