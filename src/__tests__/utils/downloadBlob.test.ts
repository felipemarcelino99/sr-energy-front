import { downloadBlob } from '@/utils/downloadBlob'

describe('downloadBlob', () => {
  let createObjectURLMock: jest.Mock
  let revokeObjectURLMock: jest.Mock
  let clickSpy: jest.SpyInstance

  beforeEach(() => {
    createObjectURLMock = jest.fn().mockReturnValue('blob:mock-url')
    revokeObjectURLMock = jest.fn()
    // jsdom doesn't implement these — define them directly on URL.
    ;(URL as unknown as { createObjectURL: typeof createObjectURLMock }).createObjectURL =
      createObjectURLMock
    ;(URL as unknown as { revokeObjectURL: typeof revokeObjectURLMock }).revokeObjectURL =
      revokeObjectURLMock
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('cria um object URL a partir do blob e aciona o download com o filename informado', () => {
    const blob = new Blob(['conteúdo'], { type: 'application/pdf' })
    downloadBlob(blob, 'relatorio-teste.pdf')

    expect(createObjectURLMock).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('revoga o object URL após o clique', () => {
    const blob = new Blob(['x'])
    downloadBlob(blob, 'arquivo.pdf')
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url')
  })
})
