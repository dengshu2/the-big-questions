// 书单数据：scripts/build-data.mjs 生成的 catalog.json 及其查询函数
import raw from './catalog.json'

export interface Thinker {
  slug: string
  name: string
  nameEn: string
  birth: string
  death: string
  /** 出生年份（公元前为负），用于排序 */
  year: number | null
  nationality: string
  wikipedia: string
  line: string
  brief: string
  books: string[]
}

export interface Place {
  question: string
  section: string
  group: string
  must: boolean
}

export interface Book {
  id: string
  title: string
  orig: string
  note: string
  /** 作者归属需要说明时的一句话，比如书单所列作者其实是编者或研究对象 */
  credit: string
  authors: string[]
  places: Place[]
}

export interface Section {
  id: string
  name: string
  note: string
  groups: { name: string; books: { id: string; must?: boolean }[] }[]
}

export interface Question {
  id: string
  name: string
  summary: string
  intro: string
  sections: Section[]
}

interface Catalog {
  about: string[]
  questions: Question[]
  thinkers: Record<string, Thinker>
  books: Record<string, Book>
}

const catalog = raw as Catalog

export const about = catalog.about
export const questions = catalog.questions
export const allBooks = Object.values(catalog.books)
export const allThinkers = Object.values(catalog.thinkers)

export const getQuestion = (id: string | undefined) => questions.find((q) => q.id === id)
export const getBook = (id: string | undefined) => (id ? catalog.books[id] : undefined)
export const getThinker = (slug: string | undefined) => (slug ? catalog.thinkers[slug] : undefined)

export const getSection = (id: string) => {
  for (const q of questions) for (const s of q.sections) if (s.id === id) return { question: q, section: s }
  return undefined
}

/** 一个问题下的全部书（去重，按书单顺序） */
export function booksOfQuestion(q: Question): string[] {
  const ids = q.sections.flatMap((s) => s.groups.flatMap((g) => g.books.map((b) => b.id)))
  return [...new Set(ids)]
}

/** 每节的首选书，按书单顺序 */
export const picks: { question: Question; section: Section; book: Book }[] = questions.flatMap((q) =>
  q.sections.flatMap((s) =>
    s.groups.flatMap((g) => g.books.filter((b) => b.must).map((b) => ({ question: q, section: s, book: catalog.books[b.id] }))),
  ),
)

export const authorNames = (b: Book) => b.authors.map((a) => catalog.thinkers[a]?.name ?? a).join('、')

export function formatYears(t: Thinker): string {
  if (!t.birth && !t.death) return '生卒年不详'
  if (!t.death) return `${t.birth} 年生`
  return `${t.birth}—${t.death}`
}

export const sectionLabel = (id: string) => (id === '0' ? '' : id)

export const doubanUrl = (title: string) =>
  `https://search.douban.com/book/subject_search?search_text=${encodeURIComponent(title)}`

export const stats = {
  questions: questions.length,
  thinkers: allThinkers.length,
  books: allBooks.length,
  picks: picks.length,
}
