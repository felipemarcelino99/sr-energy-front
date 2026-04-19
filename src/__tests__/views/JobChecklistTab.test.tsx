import { render, screen, fireEvent } from '@testing-library/react'
import { JobChecklistTab } from '@/views/components/JobChecklistTab'
import { useChecklistStore } from '@/viewmodels/checklist.viewmodel'

jest.mock('@/viewmodels/checklist.viewmodel', () => ({
  useChecklistStore: jest.fn(),
}))

const mockFetchChecklist = jest.fn().mockResolvedValue(undefined)
const mockToggleItem = jest.fn().mockResolvedValue(undefined)

const baseStore = {
  items: [],
  loading: false,
  error: null,
  checkedCount: 0,
  allChecked: false,
  fetchChecklist: mockFetchChecklist,
  toggleItem: mockToggleItem,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useChecklistStore as unknown as jest.Mock).mockReturnValue(baseStore)
})

const makeItem = (id: string, name: string, checked: boolean) => ({
  id,
  jobId: 'job-1',
  employeeId: 'emp-1',
  toolId: `t-${id}`,
  checked,
  phase: 'pre_work' as const,
  createdAt: '2025-01-01',
  tool: { id: `t-${id}`, name, status: 'active' as const, quantity: 1, createdAt: '', updatedAt: '' },
})

describe('JobChecklistTab', () => {
  it('chama fetchChecklist ao montar', () => {
    render(<JobChecklistTab jobId="job-1" />)
    expect(mockFetchChecklist).toHaveBeenCalledWith('job-1', undefined)
  })

  it('chama fetchChecklist com phase quando fornecida', () => {
    render(<JobChecklistTab jobId="job-1" phase="pre_report" />)
    expect(mockFetchChecklist).toHaveBeenCalledWith('job-1', 'pre_report')
  })

  it('mostra spinner enquanto carrega', () => {
    ;(useChecklistStore as unknown as jest.Mock).mockReturnValue({ ...baseStore, loading: true })
    render(<JobChecklistTab jobId="job-1" />)
    expect(screen.getByTestId('checklist-loading')).toBeInTheDocument()
  })

  it('mostra mensagem quando lista está vazia', () => {
    render(<JobChecklistTab jobId="job-1" />)
    expect(screen.getByTestId('checklist-empty')).toBeInTheDocument()
  })

  it('exibe itens do checklist e progresso', () => {
    const items = [makeItem('1', 'Chave de fenda', true), makeItem('2', 'Alicate', false)]
    ;(useChecklistStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore, items, checkedCount: 1, allChecked: false,
    })
    render(<JobChecklistTab jobId="job-1" />)
    expect(screen.getByTestId('checklist-progress')).toHaveTextContent('1/2 itens verificados')
    expect(screen.getByText('Chave de fenda')).toBeInTheDocument()
    expect(screen.getByText('Alicate')).toBeInTheDocument()
  })

  it('checkbox chama toggleItem ao mudar', () => {
    const items = [makeItem('1', 'Chave', false)]
    ;(useChecklistStore as unknown as jest.Mock).mockReturnValue({ ...baseStore, items })
    render(<JobChecklistTab jobId="job-1" />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(mockToggleItem).toHaveBeenCalledWith('job-1', '1', true)
  })

  it('checkboxes são disabled em modo readOnly', () => {
    const items = [makeItem('1', 'Chave', false)]
    ;(useChecklistStore as unknown as jest.Mock).mockReturnValue({ ...baseStore, items })
    render(<JobChecklistTab jobId="job-1" readOnly />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('exibe mensagem de erro', () => {
    ;(useChecklistStore as unknown as jest.Mock).mockReturnValue({
      ...baseStore, error: 'Falha ao carregar',
    })
    render(<JobChecklistTab jobId="job-1" />)
    expect(screen.getByText(/falha ao carregar/i)).toBeInTheDocument()
  })
})
