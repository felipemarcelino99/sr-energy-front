import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EquipmentRentalFormPage } from '@/views/pages/EquipmentRentalFormPage'
import { useEquipmentRentalStore } from '@/viewmodels/equipment-rental.viewmodel'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { fetchEquipmentRental } from '@/services/equipment-rental.service'

jest.mock('@/viewmodels/equipment-rental.viewmodel')
jest.mock('@/viewmodels/contract.viewmodel')
jest.mock('@/viewmodels/bag.viewmodel')
jest.mock('@/services/equipment-rental.service', () => ({
  fetchEquipmentRental: jest.fn(),
}))

const mockCreate = jest.fn().mockResolvedValue(undefined)
const mockUpdate = jest.fn().mockResolvedValue(undefined)
const mockLoadContracts = jest.fn()
const mockLoadBags = jest.fn()

const contracts = [{ id: 'c1', client: { razaoSocial: 'Cliente A' } }]
const bags = [{ id: 'b1', name: 'Mala X', model: 'Modelo X' }]

const editRental = {
  id: 'r1',
  contractId: 'c1',
  bagId: 'b1',
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  value: 500,
}

interface FormFields {
  contractSelect: HTMLSelectElement
  bagSelect: HTMLSelectElement
  startDate: HTMLInputElement
  endDate: HTMLInputElement
  value: HTMLInputElement
}

function getFields(container: HTMLElement): FormFields {
  const selects = container.querySelectorAll('select')
  const dateInputs = container.querySelectorAll('input[type="date"]')
  const valueInput = container.querySelector('input[type="number"]') as HTMLInputElement
  return {
    contractSelect: selects[0] as HTMLSelectElement,
    bagSelect: selects[1] as HTMLSelectElement,
    startDate: dateInputs[0] as HTMLInputElement,
    endDate: dateInputs[1] as HTMLInputElement,
    value: valueInput,
  }
}

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/equipment-rentals/new']}>
      <Routes>
        <Route path="/equipment-rentals/new" element={<EquipmentRentalFormPage />} />
        <Route path="/equipment-rentals" element={<div>Rentals List</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function renderEdit(id = 'r1') {
  return render(
    <MemoryRouter initialEntries={[`/equipment-rentals/${id}/edit`]}>
      <Routes>
        <Route path="/equipment-rentals/:id/edit" element={<EquipmentRentalFormPage />} />
        <Route path="/equipment-rentals" element={<div>Rentals List</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useEquipmentRentalStore as unknown as jest.Mock).mockReturnValue({
    create: mockCreate,
    update: mockUpdate,
  })
  ;(useContractStore as unknown as jest.Mock).mockReturnValue({
    contracts,
    load: mockLoadContracts,
  })
  ;(useBagStore as unknown as jest.Mock).mockReturnValue({
    bags,
    load: mockLoadBags,
  })
  ;(fetchEquipmentRental as jest.Mock).mockResolvedValue(editRental)
})

it('renders contract and bag selects in create mode', () => {
  renderCreate()
  expect(screen.getByText(/selecionar contrato/i)).toBeInTheDocument()
  expect(screen.getByText(/selecionar mala/i)).toBeInTheDocument()
  expect(screen.getByText('Cliente A')).toBeInTheDocument()
  expect(screen.getByText(/mala x/i)).toBeInTheDocument()
})

it('loads contracts and bags on mount', () => {
  renderCreate()
  expect(mockLoadContracts).toHaveBeenCalled()
  expect(mockLoadBags).toHaveBeenCalled()
})

it('shows validation errors when submitting empty form', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(screen.getByText(/contrato é obrigatório/i)).toBeInTheDocument()
    expect(screen.getByText(/mala é obrigatória/i)).toBeInTheDocument()
  })
  expect(mockCreate).not.toHaveBeenCalled()
})

it('calls create on valid submit and navigates to /equipment-rentals', async () => {
  const { container } = renderCreate()
  const { contractSelect, bagSelect, startDate, endDate, value } = getFields(container)
  fireEvent.change(contractSelect, { target: { value: 'c1' } })
  fireEvent.change(bagSelect, { target: { value: 'b1' } })
  fireEvent.change(startDate, { target: { value: '2026-02-01' } })
  fireEvent.change(endDate, { target: { value: '2026-02-10' } })
  fireEvent.change(value, { target: { value: '1000' } })
  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: 'c1',
        bagId: 'b1',
        startDate: '2026-02-01',
        endDate: '2026-02-10',
        value: 1000,
      })
    )
  })
  await waitFor(() => {
    expect(screen.getByText('Rentals List')).toBeInTheDocument()
  })
})

it('shows error when end date is before start date', async () => {
  const { container } = renderCreate()
  const { contractSelect, bagSelect, startDate, endDate } = getFields(container)
  fireEvent.change(contractSelect, { target: { value: 'c1' } })
  fireEvent.change(bagSelect, { target: { value: 'b1' } })
  fireEvent.change(startDate, { target: { value: '2026-02-10' } })
  fireEvent.change(endDate, { target: { value: '2026-02-01' } })
  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(screen.getByText(/data de fim deve ser após a data de início/i)).toBeInTheDocument()
  })
  expect(mockCreate).not.toHaveBeenCalled()
})

it('navigates to /equipment-rentals on cancel without calling create', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Cancelar'))
  await waitFor(() => {
    expect(screen.getByText('Rentals List')).toBeInTheDocument()
  })
  expect(mockCreate).not.toHaveBeenCalled()
})

it('pre-fills form fields in edit mode and calls update on submit', async () => {
  const { container } = renderEdit()
  await waitFor(() => {
    const { contractSelect } = getFields(container)
    expect(contractSelect.value).toBe('c1')
  })
  const { bagSelect, value } = getFields(container)
  expect(bagSelect.value).toBe('b1')
  expect(value.value).toBe('500')

  fireEvent.click(screen.getByText('Salvar'))
  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      'r1',
      expect.objectContaining({ contractId: 'c1', bagId: 'b1', value: 500 })
    )
  })
})
