// 与 scripts/build-data.mjs 生成物对应的类型定义

export type DialogueType = 'extends' | 'refutes'

export interface Book {
  titleZh: string
  titleEn: string
  order: number
  minimum: boolean
  coauthored: boolean
  questionId: number
  sectionId: string
  sectionName: string
  discipline: string
}

export interface Dialogue {
  with: string
  dir: 'out' | 'in'
  type: DialogueType
  note: string
}

export interface Thinker {
  slug: string
  nameZh: string
  nameEn: string
  birthYear: string
  deathYear: string
  birthNum: number
  deathNum: number | null
  nationality: string
  wikipediaUrl: string
  isAnonymous: boolean
  yearEstimated: boolean
  questions: number[]
  books: Book[]
  hasEssay: boolean
  dialogues: Dialogue[]
  magnitude: 1 | 2 | 3 | 4
  /** 星签：一句话定位 */
  line: string
  /** 简志：150~250 字介绍（二等星） */
  brief?: string
}

export interface Discipline {
  name: string
  slugs: string[]
}

export interface Section {
  id: string
  name: string
  disciplines: Discipline[]
}

export interface Question {
  id: number
  name: string
  thinkerCount: number
  bookCount: number
  minimumCount: number
  sections: Section[]
}

export interface AtlasStar {
  slug: string
  x: number
  y: number
  r: number
  double: boolean
}

export interface Constellation {
  id: number
  name: string
  cx: number
  cy: number
  R: number
  stars: AtlasStar[]
  lines: [string, string][]
}

export interface L1Star {
  slug: string
  x: number
  lane: number
}

export interface L1Arc {
  from: string
  to: string
  type: DialogueType
  note: string
}

export interface L1Data {
  width: number
  stars: L1Star[]
  ticks: { year: number; x: number }[]
  arcs: L1Arc[]
}

export interface Atlas {
  sky: { width: number; height: number }
  constellations: Constellation[]
  doubleLinks: { question: number; from: string; to: string }[]
  l1: Record<string, L1Data>
}

export interface Meta {
  thinkerCount: number
  bookCount: number
  questionCount: number
  essayCount: number
  briefCount: number
  dialogueCount: number
  minimumCount: number
  doubleStars: string[]
  yearRange: [number, number]
}
