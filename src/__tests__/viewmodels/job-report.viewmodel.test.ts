import { useJobReportStore } from '@/viewmodels/job-report.viewmodel'

jest.mock('@/services/job-report.service', () => ({
  submitReport: jest.fn(),
  uploadEvidence: jest.fn(),
  updateReport: jest.fn(),
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
      new Promise((res) => {
        resolveSubmit = res
      })
    )
    const promise = useJobReportStore.getState().submit('job-1', '<p>ok</p>', [])
    expect(useJobReportStore.getState().loading).toBe(true)
    resolveSubmit({
      id: 'r1',
      jobId: 'job-1',
      content: '<p>ok</p>',
      evidences: [],
      submittedAt: '',
      employeeId: '',
    })
    await promise
    expect(useJobReportStore.getState().loading).toBe(false)
  })

  it('faz upload de cada evidência sequencialmente após criar o relatório', async () => {
    const mockReport = {
      id: 'r1',
      jobId: 'job-1',
      content: '<p>ok</p>',
      evidences: [],
      submittedAt: '',
      employeeId: '',
    }
    ;(reportService.submitReport as jest.Mock).mockResolvedValue(mockReport)
    ;(reportService.uploadEvidence as jest.Mock).mockResolvedValue(undefined)
    const f1 = new File(['a'], 'a.jpg')
    const f2 = new File(['b'], 'b.jpg')
    await useJobReportStore.getState().submit('job-1', '<p>ok</p>', [f1, f2])
    expect(reportService.uploadEvidence).toHaveBeenNthCalledWith(1, 'r1', f1)
    expect(reportService.uploadEvidence).toHaveBeenNthCalledWith(2, 'r1', f2)
  })

  it('define erro e mantém submitted false quando o service falha', async () => {
    ;(reportService.submitReport as jest.Mock).mockRejectedValue(new Error('falha ao enviar'))
    await useJobReportStore.getState().submit('job-1', '<p>x</p>', [])
    expect(useJobReportStore.getState().error).toBe('falha ao enviar')
    expect(useJobReportStore.getState().submitted).toBe(false)
    expect(useJobReportStore.getState().loading).toBe(false)
  })
})

describe('job-report.viewmodel — update', () => {
  it('chama o service e atualiza o report no store', async () => {
    const updated = {
      id: 'r1',
      jobId: 'job-1',
      content: '<p>editado</p>',
      evidences: [],
      submittedAt: '',
      employeeId: '',
    }
    ;(reportService.updateReport as jest.Mock).mockResolvedValue(updated)
    await useJobReportStore.getState().update('job-1', '<p>editado</p>')
    expect(reportService.updateReport).toHaveBeenCalledWith('job-1', '<p>editado</p>')
    expect(useJobReportStore.getState().report).toEqual(updated)
    expect(useJobReportStore.getState().loading).toBe(false)
  })

  it('define erro quando o service falha', async () => {
    ;(reportService.updateReport as jest.Mock).mockRejectedValue(new Error('falha ao editar'))
    await useJobReportStore.getState().update('job-1', '<p>x</p>')
    expect(useJobReportStore.getState().error).toBe('falha ao editar')
    expect(useJobReportStore.getState().loading).toBe(false)
  })
})

describe('job-report.viewmodel — reset', () => {
  it('limpa o estado do store', () => {
    useJobReportStore.setState({
      report: {
        id: 'r1',
        jobId: 'j1',
        content: 'x',
        evidences: [],
        submittedAt: '',
        employeeId: '',
      },
      loading: true,
      error: 'erro',
      submitted: true,
    })
    useJobReportStore.getState().reset()
    expect(useJobReportStore.getState()).toMatchObject({
      report: null,
      loading: false,
      error: null,
      submitted: false,
    })
  })
})
