import { useJobReportStore } from '@/viewmodels/job-report.viewmodel'

jest.mock('@/services/job-report.service', () => ({
  submitReport: jest.fn(),
  uploadEvidence: jest.fn(),
}))

import * as reportService from '@/services/job-report.service'

beforeEach(() => {
  useJobReportStore.setState({ report: null, loading: false, error: null, submitted: false })
  jest.clearAllMocks()
})

describe('job-report.viewmodel — submit', () => {
  it('chama o service com relatório e atualiza submitted para true', async () => {
    const mockReport = {
      id: 'r1',
      jobId: 'job-1',
      content: '<p>Concluído</p>',
      evidences: [],
      submittedAt: '2025-06-01',
      employeeId: 'emp-1',
    }
    ;(reportService.submitReport as jest.Mock).mockResolvedValue(mockReport)
    await useJobReportStore.getState().submit('job-1', '<p>Concluído</p>', [])
    expect(reportService.submitReport).toHaveBeenCalledWith('job-1', '<p>Concluído</p>')
    expect(useJobReportStore.getState().submitted).toBe(true)
    expect(useJobReportStore.getState().report).toEqual(mockReport)
  })

  it('loading é true durante a chamada e false ao concluir', async () => {
    let resolveSubmit!: (v: unknown) => void
    ;(reportService.submitReport as jest.Mock).mockReturnValue(
      new Promise((res) => { resolveSubmit = res })
    )
    const promise = useJobReportStore.getState().submit('job-1', '<p>ok</p>', [])
    expect(useJobReportStore.getState().loading).toBe(true)
    resolveSubmit({ id: 'r1', jobId: 'job-1', content: '<p>ok</p>', evidences: [], submittedAt: '', employeeId: '' })
    await promise
    expect(useJobReportStore.getState().loading).toBe(false)
  })
})
