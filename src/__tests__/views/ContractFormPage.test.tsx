import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ContractFormPage } from '@/views/pages/ContractFormPage'
import { useContractStore } from '@/viewmodels/contract.viewmodel'

jest.mock('@/viewmodels/contract.viewmodel')
jest.mock('@/services/contract.service', () => ({ fetchContract: jest.fn(), uploadContractFile: jest.fn() }))

beforeEach(() => {
  ;(useContractStore as unknown as jest.Mock).mockReturnValue({ create: jest.fn(), update: jest.fn() })
})

it('o wrapper principal não contém classe max-w-xl', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/contracts/new']}>
      <Routes><Route path="/contracts/new" element={<ContractFormPage />} /></Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-xl')).not.toBeInTheDocument()
})
