import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { BagFormPage } from '@/views/pages/BagFormPage'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { fetchBag } from '@/services/bag.service'

jest.mock('@/viewmodels/bag.viewmodel')
jest.mock('@/services/bag.service', () => ({
  fetchBag: jest.fn(),
}))

const mockCreate = jest.fn().mockResolvedValue(undefined)
const mockUpdate = jest.fn().mockResolvedValue(undefined)
const mockUploadCert = jest.fn().mockResolvedValue(undefined)
const mockRemoveCert = jest.fn().mockResolvedValue(undefined)

const editBag = {
  id: '1',
  name: 'Mala Azul',
  model: 'Pelican 1510',
  quantity: 2,
  calibrationCertificates: [
    { id: 'c1', fileUrl: 'https://files/c1.pdf', expiryDate: '2099-01-01' },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/bags/new']}>
      <Routes>
        <Route path="/bags/new" element={<BagFormPage />} />
        <Route path="/bags" element={<div>Bags List</div>} />
      </Routes>
    </MemoryRouter>
  )
}

function renderEdit(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/bags/${id}/edit`]}>
      <Routes>
        <Route path="/bags/:id/edit" element={<BagFormPage />} />
        <Route path="/bags" element={<div>Bags List</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useBagStore as unknown as jest.Mock).mockReturnValue({
    create: mockCreate,
    update: mockUpdate,
    uploadCert: mockUploadCert,
    removeCert: mockRemoveCert,
  })
  ;(fetchBag as jest.Mock).mockResolvedValue(editBag)
})

it('renders Nome, Modelo e Quantidade fields in create mode', () => {
  renderCreate()
  expect(screen.getByPlaceholderText(/mala de ferramentas/i)).toBeInTheDocument()
  expect(screen.getByPlaceholderText(/pelican/i)).toBeInTheDocument()
  expect(screen.getByText('Criar')).toBeInTheDocument()
})

it('does not show certificates section in create mode', () => {
  renderCreate()
  expect(screen.queryByText(/certificados de calibração/i)).not.toBeInTheDocument()
})

it('shows validation error when submitting empty Nome', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(screen.getByText(/nome deve ter ao menos 2 caracteres/i)).toBeInTheDocument()
  })
  expect(mockCreate).not.toHaveBeenCalled()
})

it('calls create on valid submit and navigates to /bags', async () => {
  renderCreate()
  fireEvent.change(screen.getByPlaceholderText(/mala de ferramentas/i), {
    target: { value: 'Mala Vermelha' },
  })
  fireEvent.change(screen.getByPlaceholderText(/pelican/i), { target: { value: 'Pelican 1400' } })
  fireEvent.click(screen.getByText('Criar'))
  await waitFor(() => {
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mala Vermelha', model: 'Pelican 1400', quantity: 1 })
    )
  })
  await waitFor(() => {
    expect(screen.getByText('Bags List')).toBeInTheDocument()
  })
})

it('navigates to /bags on cancel without calling create', async () => {
  renderCreate()
  fireEvent.click(screen.getByText('Cancelar'))
  await waitFor(() => {
    expect(screen.getByText('Bags List')).toBeInTheDocument()
  })
  expect(mockCreate).not.toHaveBeenCalled()
})

it('pre-fills form fields and shows certificates in edit mode', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/mala de ferramentas/i)).toHaveValue('Mala Azul')
  })
  expect(screen.getByText(/certificados de calibração/i)).toBeInTheDocument()
  expect(screen.getByText(/ver certificado/i)).toBeInTheDocument()
  expect(screen.getByText('Salvar')).toBeInTheDocument()
})

it('calls update on valid submit in edit mode', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/mala de ferramentas/i)).toHaveValue('Mala Azul')
  })
  fireEvent.click(screen.getByText('Salvar'))
  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ name: 'Mala Azul', model: 'Pelican 1510', quantity: 2 })
    )
  })
})

it('removes a certificate when clicking the remove button', async () => {
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText(/ver certificado/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getByTitle(/remover certificado/i))
  await waitFor(() => {
    expect(mockRemoveCert).toHaveBeenCalledWith('1', 'c1')
  })
})

it('uploads a certificate when file and expiry are set', async () => {
  ;(fetchBag as jest.Mock)
    .mockResolvedValueOnce(editBag)
    .mockResolvedValueOnce({ ...editBag, calibrationCertificates: [] })
  renderEdit()
  await waitFor(() => {
    expect(screen.getByText(/adicionar certificado/i)).toBeInTheDocument()
  })

  const file = new File(['content'], 'cert.pdf', { type: 'application/pdf' })
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  fireEvent.change(fileInput, { target: { files: [file] } })

  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
  fireEvent.change(dateInput, { target: { value: '2099-05-05' } })

  fireEvent.click(screen.getByText(/enviar/i))
  await waitFor(() => {
    expect(mockUploadCert).toHaveBeenCalledWith('1', file, '2099-05-05')
  })
})
