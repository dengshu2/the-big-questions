import type { CanonRow } from './types'

const CSV_URL = '/database/canon.csv'

/**
 * 解析 CSV 文本为 CanonRow 数组
 * 使用简单的 split 解析，因为数据没有复杂的引号/转义
 */
function parseCSVText(text: string): CanonRow[] {
  const lines = text.trim().split('\n')
  // 跳过 header 行
  return lines.slice(1).map((line) => {
    const values = line.split(',')

    return {
      big_question_id: parseInt(values[0], 10),
      big_question_name: values[1],
      section_id: values[2],
      section_name: values[3],
      discipline: values[4],
      thinker_name_zh: values[5],
      thinker_name_en: values[6] || '',
      birth_year: values[7] || '',
      death_year: values[8] || '',
      nationality: values[9],
      book_title_zh: values[10],
      book_title_en: values[11] || '',
      is_coauthored: values[12] === '是',
      book_order: parseInt(values[13], 10),
      is_minimum_list: values[14] === '是',
    }
  })
}

/**
 * 从服务器获取并解析 CSV
 */
export async function fetchCanonData(): Promise<CanonRow[]> {
  const response = await fetch(CSV_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch canon.csv: ${response.status}`)
  }
  const text = await response.text()
  return parseCSVText(text)
}
