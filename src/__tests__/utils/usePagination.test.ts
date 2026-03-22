import { renderHook, act } from '@testing-library/react'
import { usePagination } from '@/utils/usePagination'

describe('usePagination', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1)

  it('returns first page by default', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    expect(result.current.page).toBe(1)
    expect(result.current.paginated).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('calculates totalPages correctly', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    expect(result.current.totalPages).toBe(3)
  })

  it('next() advances the page', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.next())
    expect(result.current.page).toBe(2)
    expect(result.current.paginated).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  })

  it('prev() does not go below page 1', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.prev())
    expect(result.current.page).toBe(1)
  })

  it('next() does not exceed totalPages', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.goTo(3))
    act(() => result.current.next())
    expect(result.current.page).toBe(3)
  })

  it('goTo() jumps to a specific page', () => {
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.goTo(3))
    expect(result.current.page).toBe(3)
    expect(result.current.paginated).toEqual([21, 22, 23, 24, 25])
  })

  it('resets to page 1 when items change', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data: number[] }) => usePagination(data, 10),
      { initialProps: { data: items } }
    )
    act(() => result.current.goTo(2))
    expect(result.current.page).toBe(2)
    rerender({ data: [1, 2, 3] })
    expect(result.current.page).toBe(1)
  })
})
