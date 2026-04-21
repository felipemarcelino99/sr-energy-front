import { render, screen, waitFor } from '@testing-library/react'
import { MachineOverview } from '@/views/components/MachineOverview'
import * as machineService from '@/services/machine.service'

jest.mock('@/services/machine.service', () => ({
  getMachineOverview: jest.fn(),
}))

describe('MachineOverview', () => {
  it('shows skeleton while loading', () => {
    jest.mocked(machineService.getMachineOverview).mockReturnValue(new Promise(() => {}))
    const { container } = render(<MachineOverview machineId="machine-1" />)
    expect(container.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('renders overview content after loading', async () => {
    jest.mocked(machineService.getMachineOverview).mockResolvedValue('**Specs:** Pressão 200 bar')
    render(<MachineOverview machineId="machine-1" />)
    await waitFor(() => expect(screen.getByText(/Pressão 200 bar/)).toBeInTheDocument())
  })

  it('shows error message when fetch fails', async () => {
    jest.mocked(machineService.getMachineOverview).mockRejectedValue(
      new Error('Manual não indexado para esta máquina')
    )
    render(<MachineOverview machineId="machine-1" />)
    await waitFor(() =>
      expect(screen.getByText(/Manual não indexado/)).toBeInTheDocument()
    )
  })
})
