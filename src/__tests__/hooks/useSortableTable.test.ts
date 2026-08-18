import { renderHook, act } from '@testing-library/react'
import { useSortableTable, sortIcon } from '@/hooks/useSortableTable'

interface Row {
  name: string
  age: number
  joinedAt: string
}

const rows: Row[] = [
  { name: 'Carlos', age: 40, joinedAt: '2024-03-01' },
  { name: 'Ana', age: 25, joinedAt: '2024-01-10' },
  { name: 'Bruno', age: 32, joinedAt: '2024-02-15' },
]

describe('useSortableTable', () => {
  it('retorna os dados na ordem original quando nenhum sort é aplicado', () => {
    const { result } = renderHook(() => useSortableTable(rows))
    expect(result.current.sorted.map((r) => r.name)).toEqual(['Carlos', 'Ana', 'Bruno'])
    expect(result.current.sort).toEqual({ key: '', dir: null })
  })

  it('ordena ascendente por string ao primeiro toggle', () => {
    const { result } = renderHook(() => useSortableTable(rows))
    act(() => result.current.toggle('name'))
    expect(result.current.sort).toEqual({ key: 'name', dir: 'asc' })
    expect(result.current.sorted.map((r) => r.name)).toEqual(['Ana', 'Bruno', 'Carlos'])
  })

  it('ordena descendente ao segundo toggle na mesma coluna', () => {
    const { result } = renderHook(() => useSortableTable(rows))
    act(() => result.current.toggle('name'))
    act(() => result.current.toggle('name'))
    expect(result.current.sort).toEqual({ key: 'name', dir: 'desc' })
    expect(result.current.sorted.map((r) => r.name)).toEqual(['Carlos', 'Bruno', 'Ana'])
  })

  it('remove a ordenação ao terceiro toggle na mesma coluna', () => {
    const { result } = renderHook(() => useSortableTable(rows))
    act(() => result.current.toggle('name'))
    act(() => result.current.toggle('name'))
    act(() => result.current.toggle('name'))
    expect(result.current.sort).toEqual({ key: '', dir: null })
    expect(result.current.sorted.map((r) => r.name)).toEqual(['Carlos', 'Ana', 'Bruno'])
  })

  it('ordena numericamente por coluna numérica', () => {
    const { result } = renderHook(() => useSortableTable(rows))
    act(() => result.current.toggle('age'))
    expect(result.current.sorted.map((r) => r.age)).toEqual([25, 32, 40])
  })

  it('ordena por data (ISO) corretamente', () => {
    const { result } = renderHook(() => useSortableTable(rows))
    act(() => result.current.toggle('joinedAt'))
    expect(result.current.sorted.map((r) => r.joinedAt)).toEqual([
      '2024-01-10',
      '2024-02-15',
      '2024-03-01',
    ])
  })

  it('trocar de coluna reinicia a ordenação para asc', () => {
    const { result } = renderHook(() => useSortableTable(rows))
    act(() => result.current.toggle('name'))
    act(() => result.current.toggle('name')) // desc
    act(() => result.current.toggle('age')) // switch column
    expect(result.current.sort).toEqual({ key: 'age', dir: 'asc' })
  })

  it('trata valores nulos/indefinidos colocando-os por último', () => {
    const withNulls = [
      { name: 'A', age: 10, joinedAt: '' },
      { name: null as unknown as string, age: 5, joinedAt: '' },
      { name: 'B', age: 20, joinedAt: '' },
    ]
    const { result } = renderHook(() => useSortableTable(withNulls))
    act(() => result.current.toggle('name'))
    expect(result.current.sorted[result.current.sorted.length - 1].name).toBeNull()
  })
})

describe('sortIcon', () => {
  it('retorna seta para cima quando asc', () => {
    expect(sortIcon('asc')).toBe(' ↑')
  })

  it('retorna seta para baixo quando desc', () => {
    expect(sortIcon('desc')).toBe(' ↓')
  })

  it('retorna ícone neutro quando null', () => {
    expect(sortIcon(null)).toBe(' ↕')
  })
})
