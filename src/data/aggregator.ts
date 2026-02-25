import type {
  CanonRow,
  CanonData,
  BigQuestion,
  Section,
  Discipline,
  Thinker,
  Book,
} from './types'

/**
 * 生成简单的字符串哈希作为 ID
 */
function hashId(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

// 内部构建时使用的中间类型
interface ThinkerBuilder {
  id: string
  nameZh: string
  nameEn: string
  birthYear: string
  deathYear: string
  nationality: string
  wikipediaUrl: string
  books: Book[]
}

interface DisciplineBuilder {
  id: string
  name: string
  thinkersMap: Map<string, ThinkerBuilder>
}

interface SectionBuilder {
  id: string
  name: string
  disciplinesMap: Map<string, DisciplineBuilder>
}

interface BigQuestionBuilder {
  id: number
  name: string
  sectionsMap: Map<string, SectionBuilder>
}

/**
 * 将扁平的 CSV 行聚合为层级结构
 */
export function aggregateCanonData(rows: CanonRow[]): CanonData {
  const bigQuestionsMap = new Map<number, BigQuestionBuilder>()
  const allBooks: Book[] = []
  const allThinkersMap = new Map<string, Thinker>()

  for (const row of rows) {
    // 1. 获取或创建 BigQuestion
    if (!bigQuestionsMap.has(row.big_question_id)) {
      bigQuestionsMap.set(row.big_question_id, {
        id: row.big_question_id,
        name: row.big_question_name,
        sectionsMap: new Map(),
      })
    }
    const bq = bigQuestionsMap.get(row.big_question_id)!

    // 2. 获取或创建 Section
    if (!bq.sectionsMap.has(row.section_id)) {
      bq.sectionsMap.set(row.section_id, {
        id: row.section_id,
        name: row.section_name,
        disciplinesMap: new Map(),
      })
    }
    const section = bq.sectionsMap.get(row.section_id)!

    // 3. 获取或创建 Discipline
    const disciplineKey = `${row.section_id}-${row.discipline}`
    if (!section.disciplinesMap.has(disciplineKey)) {
      section.disciplinesMap.set(disciplineKey, {
        id: hashId(disciplineKey),
        name: row.discipline,
        thinkersMap: new Map(),
      })
    }
    const discipline = section.disciplinesMap.get(disciplineKey)!

    // 4. 获取或创建 Thinker
    const thinkerKey = `${disciplineKey}-${row.thinker_name_zh}`
    if (!discipline.thinkersMap.has(thinkerKey)) {
      const thinkerId = hashId(thinkerKey)
      discipline.thinkersMap.set(thinkerKey, {
        id: thinkerId,
        nameZh: row.thinker_name_zh,
        nameEn: row.thinker_name_en,
        birthYear: row.birth_year,
        deathYear: row.death_year,
        nationality: row.nationality,
        wikipediaUrl: row.wikipedia_url,
        books: [],
      })
    }
    const thinker = discipline.thinkersMap.get(thinkerKey)!

    // 5. 创建 Book
    const book: Book = {
      id: `${thinker.id}-${row.book_order}`,
      titleZh: row.book_title_zh,
      titleEn: row.book_title_en,
      order: row.book_order,
      isMinimumList: row.is_minimum_list,
      isCoauthored: row.is_coauthored,
    }
    thinker.books.push(book)
    allBooks.push(book)
  }

  // 转换 Map 为数组结构
  const bigQuestions: BigQuestion[] = Array.from(bigQuestionsMap.values())
    .sort((a, b) => a.id - b.id)
    .map((bq) => {
      const sections: Section[] = Array.from(bq.sectionsMap.values()).map(
        (s) => {
          const disciplines: Discipline[] = Array.from(
            s.disciplinesMap.values()
          ).map((d) => {
            const thinkers: Thinker[] = Array.from(d.thinkersMap.values())
            // 收集到全局 thinkers 索引
            thinkers.forEach((t) => allThinkersMap.set(t.id, t))
            return { id: d.id, name: d.name, thinkers }
          })
          return { id: s.id, name: s.name, disciplines }
        }
      )

      // 计算统计数据
      const stats = {
        sectionCount: sections.length,
        disciplineCount: sections.reduce(
          (sum, s) => sum + s.disciplines.length,
          0
        ),
        thinkerCount: sections.reduce(
          (sum, s) =>
            sum +
            s.disciplines.reduce((dSum, d) => dSum + d.thinkers.length, 0),
          0
        ),
        bookCount: sections.reduce(
          (sum, s) =>
            sum +
            s.disciplines.reduce(
              (dSum, d) =>
                dSum +
                d.thinkers.reduce((tSum, t) => tSum + t.books.length, 0),
              0
            ),
          0
        ),
      }

      return { id: bq.id, name: bq.name, sections, stats }
    })

  return {
    bigQuestions,
    allBooks,
    allThinkers: Array.from(allThinkersMap.values()),
    rawRows: rows,
  }
}
