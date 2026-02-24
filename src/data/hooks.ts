import { use, useMemo } from 'react'
import type { CanonData, BigQuestion, BookFilter, Book, Thinker } from './types'
import { fetchCanonData } from './parser'
import { aggregateCanonData } from './aggregator'

// ==================== 数据加载（React 19 use() 模式） ====================

// 数据 Promise 缓存（单例）
let canonDataPromise: Promise<CanonData> | null = null

function getCanonDataPromise(): Promise<CanonData> {
  if (!canonDataPromise) {
    canonDataPromise = fetchCanonData().then(aggregateCanonData)
  }
  return canonDataPromise
}

/**
 * 核心 hook：获取完整的 canon 数据
 * 使用 React 19 的 use() 配合 Suspense
 *
 * @example
 * function MyComponent() {
 *   const data = useCanonData();
 *   return <div>{data.bigQuestions.length} questions</div>;
 * }
 *
 * // 父组件需要包裹 Suspense
 * <Suspense fallback={<Loading />}>
 *   <MyComponent />
 * </Suspense>
 */
export function useCanonData(): CanonData {
  return use(getCanonDataPromise())
}

// ==================== 派生数据 Hooks ====================

/**
 * 获取单个大问题
 */
export function useBigQuestion(id: number): BigQuestion | undefined {
  const data = useCanonData()
  return useMemo(
    () => data.bigQuestions.find((bq) => bq.id === id),
    [data.bigQuestions, id]
  )
}

/**
 * 获取所有大问题（用于首页卡片）
 */
export function useBigQuestions(): BigQuestion[] {
  const data = useCanonData()
  return data.bigQuestions
}

/**
 * 筛选书籍
 */
export function useFilteredBooks(filter: BookFilter): Book[] {
  const data = useCanonData()

  return useMemo(() => {
    let result = data.rawRows

    // 按大问题筛选
    if (filter.bigQuestionId !== undefined) {
      result = result.filter((r) => r.big_question_id === filter.bigQuestionId)
    }

    // 按章节筛选
    if (filter.sectionId) {
      result = result.filter((r) => r.section_id === filter.sectionId)
    }

    // 按学科筛选
    if (filter.discipline) {
      result = result.filter((r) => r.discipline === filter.discipline)
    }

    // 按国籍筛选
    if (filter.nationality) {
      result = result.filter((r) => r.nationality === filter.nationality)
    }

    // 最小书单筛选
    if (filter.isMinimumList !== undefined) {
      result = result.filter((r) => r.is_minimum_list === filter.isMinimumList)
    }

    // 搜索（书名或作者名）
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.book_title_zh.toLowerCase().includes(query) ||
          r.book_title_en.toLowerCase().includes(query) ||
          r.thinker_name_zh.toLowerCase().includes(query) ||
          r.thinker_name_en.toLowerCase().includes(query)
      )
    }

    // 出生年份范围（需要解析年份字符串）
    if (filter.birthYearRange) {
      const [min, max] = filter.birthYearRange
      result = result.filter((r) => {
        const year = parseYear(r.birth_year)
        if (year === null) return true // 未知年份的不过滤
        if (min !== null && year < min) return false
        if (max !== null && year > max) return false
        return true
      })
    }

    // 转换为 Book 对象（去重）
    const booksMap = new Map<string, Book>()
    for (const r of result) {
      const bookId = `${r.thinker_name_zh}-${r.book_order}`
      if (!booksMap.has(bookId)) {
        booksMap.set(bookId, {
          id: bookId,
          titleZh: r.book_title_zh,
          titleEn: r.book_title_en,
          order: r.book_order,
          isMinimumList: r.is_minimum_list,
          isCoauthored: r.is_coauthored,
        })
      }
    }

    return Array.from(booksMap.values())
  }, [data.rawRows, filter])
}

/**
 * 获取所有独立的筛选选项（用于筛选器 UI）
 */
export function useFilterOptions() {
  const data = useCanonData()

  return useMemo(() => {
    const nationalities = new Set<string>()
    const disciplines = new Set<string>()

    for (const row of data.rawRows) {
      if (row.nationality) nationalities.add(row.nationality)
      if (row.discipline) disciplines.add(row.discipline)
    }

    return {
      nationalities: Array.from(nationalities).sort(),
      disciplines: Array.from(disciplines).sort(),
    }
  }, [data.rawRows])
}

/**
 * 搜索思想家
 */
export function useSearchThinkers(query: string): Thinker[] {
  const data = useCanonData()

  return useMemo(() => {
    if (!query.trim()) return []

    const q = query.toLowerCase()
    return data.allThinkers.filter(
      (t) =>
        t.nameZh.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q)
    )
  }, [data.allThinkers, query])
}

// ==================== 工具函数 ====================

/**
 * 解析年份字符串（处理 "前551", "约前369", "1561" 等格式）
 */
export function parseYear(yearStr: string): number | null {
  if (!yearStr) return null

  // 移除 "约" 前缀
  const cleaned = yearStr.replace(/^约/, '')

  // 处理 "前" 前缀（公元前）
  if (cleaned.startsWith('前')) {
    const num = parseInt(cleaned.slice(1), 10)
    return isNaN(num) ? null : -num
  }

  const num = parseInt(cleaned, 10)
  return isNaN(num) ? null : num
}
