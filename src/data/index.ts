import questionsJson from './generated/questions.json'
import thinkersJson from './generated/thinkers.json'
import atlasJson from './generated/atlas.json'
import metaJson from './generated/meta.json'
import type { Atlas, Meta, Question, Thinker } from './types'

export * from './types'

export const questions = questionsJson as unknown as Question[]
export const thinkers = thinkersJson as unknown as Record<string, Thinker>
export const atlas = atlasJson as unknown as Atlas
export const meta = metaJson as unknown as Meta

export const allThinkers: Thinker[] = Object.values(thinkers)

export const getThinker = (slug: string | undefined): Thinker | undefined =>
  slug ? thinkers[slug] : undefined

export const getQuestion = (id: number): Question | undefined =>
  questions.find((q) => q.id === id)

/** 星座色 CSS 变量 */
export const qVar = (id: number) => `var(--q${id})`

/** 展示生卒年；估算/缺失如实呈现 */
export function formatYears(t: Thinker): string {
  if (!t.birthYear && !t.deathYear) return '生卒年不详'
  if (!t.deathYear) return `${t.birthYear} 生`
  return `${t.birthYear} — ${t.deathYear}`
}

export const doubanBookUrl = (title: string) =>
  `https://search.douban.com/book/subject_search?search_text=${encodeURIComponent(title)}`

/** 星等符号（图例与列表用） */
export const MAG_LABEL: Record<number, string> = {
  1: '一等星 · 必读',
  2: '二等星',
  3: '三等星',
  4: '四等星',
}
