import { useToastStore } from '@/viewmodels/toast.viewmodel'

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('adds a toast with a unique id', () => {
    useToastStore.getState().add({ message: 'Olá', type: 'success' })
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Olá')
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].id).toBeDefined()
  })

  it('adds multiple toasts', () => {
    useToastStore.getState().add({ message: 'A', type: 'success' })
    useToastStore.getState().add({ message: 'B', type: 'error' })
    expect(useToastStore.getState().toasts).toHaveLength(2)
  })

  it('removes a toast by id', () => {
    useToastStore.getState().add({ message: 'Para remover', type: 'info' })
    const id = useToastStore.getState().toasts[0].id
    useToastStore.getState().remove(id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('does not remove other toasts when removing by id', () => {
    useToastStore.getState().add({ message: 'A', type: 'success' })
    useToastStore.getState().add({ message: 'B', type: 'error' })
    const idA = useToastStore.getState().toasts[0].id
    useToastStore.getState().remove(idA)
    const remaining = useToastStore.getState().toasts
    expect(remaining).toHaveLength(1)
    expect(remaining[0].message).toBe('B')
  })
})
