import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EntityTimeline } from '@/views/components/EntityTimeline'
import { fetchAuditLog } from '@/services/audit-log.service'
import { fetchDocuments } from '@/services/document.service'
import { fetchEmployees } from '@/services/employee.service'

jest.mock('@/services/audit-log.service', () => ({ fetchAuditLog: jest.fn() }))
jest.mock('@/services/document.service', () => ({ fetchDocuments: jest.fn() }))
jest.mock('@/services/employee.service', () => ({ fetchEmployees: jest.fn() }))

function renderTimeline() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <EntityTimeline entityType="contract" entityId="c1" />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(fetchEmployees as jest.Mock).mockResolvedValue([
    { id: 'emp-1', name: 'Ana Silva', userId: 'user-1' },
  ])
})

it('renderiza a lista combinada de audit-log e documentos', async () => {
  ;(fetchAuditLog as jest.Mock).mockResolvedValue([
    {
      id: 'ev1',
      entityType: 'contract',
      entityId: 'c1',
      actorId: 'emp-1',
      action: 'contract.accepted',
      createdAt: '2025-01-01T10:00:00Z',
    },
  ])
  ;(fetchDocuments as jest.Mock).mockResolvedValue([
    {
      id: 'doc1',
      entityType: 'contract',
      entityId: 'c1',
      storageKind: 'internal',
      label: 'Contrato assinado',
      createdAt: '2025-01-02T10:00:00Z',
    },
  ])

  renderTimeline()

  expect(await screen.findByText('Contrato aceito')).toBeInTheDocument()
  expect(await screen.findByText('Documento: Contrato assinado')).toBeInTheDocument()
})
