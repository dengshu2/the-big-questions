import { act, renderHook } from '@testing-library/react'
import { countDone, exportShelf, importShelf, setStatus, useShelf } from './shelf'

test('标记、导出、再导入', () => {
  const { result } = renderHook(() => useShelf())
  act(() => setStatus('plato-1', 'done'))
  act(() => setStatus('kong-zi-1', 'want'))
  expect(countDone(result.current, ['plato-1', 'kong-zi-1'])).toBe(1)

  const backup = exportShelf()
  act(() => setStatus('plato-1', null))
  expect(result.current['plato-1']).toBeUndefined()

  act(() => {
    expect(importShelf(backup)).toBe(2)
  })
  expect(result.current['plato-1'].status).toBe('done')
  expect(JSON.parse(localStorage.getItem('tbq-shelf')!).version).toBe(2)
})

test('拒绝别的文件', () => {
  expect(() => importShelf('{"version":1,"stars":{}}')).toThrow('这不是本站导出的书架文件')
})
