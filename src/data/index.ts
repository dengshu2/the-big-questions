// 类型导出
export type {
  CanonRow,
  Book,
  Thinker,
  Discipline,
  Section,
  BigQuestion,
  CanonData,
  BookFilter,
} from './types'

// Hook 导出
export {
  useCanonData,
  useBigQuestion,
  useBigQuestions,
  useFilteredBooks,
  useFilterOptions,
  useSearchThinkers,
  parseYear,
} from './hooks'

// 底层函数导出（供测试或特殊场景使用）
export { fetchCanonData } from './parser'
export { aggregateCanonData } from './aggregator'
