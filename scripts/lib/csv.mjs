// 极简 CSV 读写（RFC 4180：逗号分隔，含逗号/引号/换行的字段用双引号包裹）
import { readFileSync, writeFileSync } from 'node:fs'

export function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.length > 1 || r[0] !== '')
}

/** 读成对象数组；_row 为文件中的行号，便于报错 */
export function readCsv(file) {
  const [header, ...rows] = parseCsv(readFileSync(file, 'utf8'))
  return rows.map((cells, i) => {
    if (cells.length !== header.length) throw new Error(`${file} 第 ${i + 2} 行: 列数 ${cells.length} ≠ ${header.length}`)
    return Object.assign(Object.fromEntries(header.map((h, j) => [h, cells[j]])), { _row: i + 2 })
  })
}

const quote = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function writeCsv(file, header, rows) {
  const lines = [header.join(','), ...rows.map((r) => header.map((h) => quote(r[h])).join(','))]
  writeFileSync(file, lines.join('\n') + '\n')
}
