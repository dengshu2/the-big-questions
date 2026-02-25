// ==================== 原始 CSV 行类型 ====================

/** CSV 文件中的原始行数据（扁平结构） */
export interface CanonRow {
  big_question_id: number
  big_question_name: string
  section_id: string // "0", "1.1", "10.5" 等
  section_name: string
  discipline: string
  thinker_name_zh: string
  thinker_name_en: string // 可能为空
  birth_year: string // "前551", "约前369", "1561", "" 等
  death_year: string // 同上，可能为空
  nationality: string
  book_title_zh: string
  book_title_en: string // 可能为空
  is_coauthored: boolean // "是"/"否" → true/false
  book_order: number // 同一思想家的书籍排序
  is_minimum_list: boolean // "是"/"否" → true/false
  wikipedia_url: string // 维基百科链接，可能为空
}

// ==================== 聚合后的层级类型 ====================

/** 书籍 */
export interface Book {
  id: string // 自动生成: `${thinkerId}-${book_order}`
  titleZh: string
  titleEn: string
  order: number
  isMinimumList: boolean
  isCoauthored: boolean
}

/** 思想家 */
export interface Thinker {
  id: string // 自动生成: hash(nameZh + discipline)
  nameZh: string
  nameEn: string
  birthYear: string
  deathYear: string
  nationality: string
  wikipediaUrl: string
  books: Book[]
}

/** 学科 */
export interface Discipline {
  id: string // 自动生成: hash(name + sectionId)
  name: string
  thinkers: Thinker[]
}

/** 章节 */
export interface Section {
  id: string // 来自 CSV: "0", "1.1", "10.5"
  name: string
  disciplines: Discipline[]
}

/** 大问题 */
export interface BigQuestion {
  id: number // 来自 CSV: 0-10
  name: string
  sections: Section[]
  // 计算属性（便于展示）
  stats: {
    sectionCount: number
    disciplineCount: number
    thinkerCount: number
    bookCount: number
  }
}

// ==================== 完整数据结构 ====================

/** 所有数据的根结构 */
export interface CanonData {
  bigQuestions: BigQuestion[]
  // 扁平索引（便于搜索和筛选）
  allBooks: Book[]
  allThinkers: Thinker[]
  // 原始数据（便于筛选）
  rawRows: CanonRow[]
}

// ==================== 筛选相关类型 ====================

export interface BookFilter {
  bigQuestionId?: number
  sectionId?: string
  discipline?: string
  nationality?: string
  isMinimumList?: boolean
  searchQuery?: string // 搜索书名/作者名
  birthYearRange?: [number | null, number | null]
}
