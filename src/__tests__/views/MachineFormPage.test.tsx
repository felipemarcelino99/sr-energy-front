import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MachineFormPage } from '@/views/pages/MachineFormPage'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'

jest.mock('@/viewmodels/machine.viewmodel')
jest.mock('@/services/machine.service', () => ({ fetchMachine: jest.fn(), fetchMachineJobs: jest.fn() }))

beforeEach(() => {
  ;(useMachineStore as unknown as jest.Mock).mockReturnValue({ create: jest.fn(), update: jest.fn(), uploadManual: jest.fn() })
})

it('o wrapper principal não contém classe max-w-xl', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/machines/new']}>
      <Routes><Route path="/machines/new" element={<MachineFormPage />} /></Routes>
    </MemoryRouter>
  )
  expect(container.querySelector('.max-w-xl')).not.toBeInTheDocument()
  expect(container.querySelector('.max-w-lg')).not.toBeInTheDocument()
})
