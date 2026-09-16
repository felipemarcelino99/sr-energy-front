import { parseReportHtml } from '@/utils/richTextPdf'

describe('parseReportHtml', () => {
  it('separa parágrafos em blocos distintos', () => {
    const blocks = parseReportHtml('<p>Primeiro</p><p>Segundo</p>')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toEqual({
      type: 'paragraph',
      runs: [{ text: 'Primeiro', bold: false, italic: false, underline: false }],
    })
  })

  it('preserva negrito, itálico e sublinhado', () => {
    const blocks = parseReportHtml(
      '<p>normal <strong>negrito</strong> <em>itálico</em> <u>sublinhado</u></p>'
    )
    expect(blocks).toHaveLength(1)
    const runs = blocks[0].type === 'paragraph' ? blocks[0].runs : []
    expect(runs.find((r) => r.text === 'negrito')).toMatchObject({ bold: true })
    expect(runs.find((r) => r.text === 'itálico')).toMatchObject({ italic: true })
    expect(runs.find((r) => r.text === 'sublinhado')).toMatchObject({ underline: true })
  })

  it('combina negrito+itálico aninhados', () => {
    const blocks = parseReportHtml('<p><strong><em>forte e itálico</em></strong></p>')
    const runs = blocks[0].type === 'paragraph' ? blocks[0].runs : []
    expect(runs[0]).toMatchObject({ bold: true, italic: true, text: 'forte e itálico' })
  })

  it('reconhece headings h1-h3', () => {
    const blocks = parseReportHtml('<h1>Título</h1><h2>Subtítulo</h2><h3>Menor</h3>')
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'heading', 'heading'])
    expect(blocks[0]).toMatchObject({ level: 1 })
    expect(blocks[1]).toMatchObject({ level: 2 })
    expect(blocks[2]).toMatchObject({ level: 3 })
  })

  it('reconhece lista com marcadores e lista numerada', () => {
    const blocks = parseReportHtml(
      '<ul><li>Item A</li><li>Item B</li></ul><ol><li>Um</li><li>Dois</li></ol>'
    )
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: false })
    expect(blocks[1]).toMatchObject({ type: 'list', ordered: true })
    const ul = blocks[0].type === 'list' ? blocks[0].items : []
    expect(ul[0][0].text).toBe('Item A')
  })

  it('converte <br> em quebra de linha dentro do run', () => {
    const blocks = parseReportHtml('<p>linha um<br>linha dois</p>')
    const runs = blocks[0].type === 'paragraph' ? blocks[0].runs : []
    expect(runs.some((r) => r.text === '\n')).toBe(true)
  })

  it('decodifica entidades HTML', () => {
    const blocks = parseReportHtml('<p>A &amp; B &lt;teste&gt; &nbsp;fim</p>')
    const runs = blocks[0].type === 'paragraph' ? blocks[0].runs : []
    expect(runs[0].text).toBe('A & B <teste>  fim')
  })

  it('retorna lista vazia pra HTML vazio', () => {
    expect(parseReportHtml('')).toEqual([])
  })

  it('remove o wrapper <p> que o TipTap coloca dentro de <li>', () => {
    const blocks = parseReportHtml('<ul><li><p>Item A</p></li><li><p>Item B</p></li></ul>')
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: false })
    const items = blocks[0].type === 'list' ? blocks[0].items : []
    expect(items[0][0].text).toBe('Item A')
    expect(items[1][0].text).toBe('Item B')
    expect(items[0][0].text).not.toContain('<p>')
    expect(items[0][0].text).not.toContain('</p>')
  })

  it('preserva negrito/itálico dentro de <li><p>...</p></li>', () => {
    const blocks = parseReportHtml('<ul><li><p>normal <strong>negrito</strong></p></li></ul>')
    const items = blocks[0].type === 'list' ? blocks[0].items : []
    expect(items[0].find((r) => r.text === 'negrito')).toMatchObject({ bold: true })
  })

  it('junta múltiplos <p> dentro do mesmo <li> com quebra de linha', () => {
    const blocks = parseReportHtml('<ul><li><p>linha um</p><p>linha dois</p></li></ul>')
    const items = blocks[0].type === 'list' ? blocks[0].items : []
    const text = items[0].map((r) => r.text).join('')
    expect(text).toBe('linha um\nlinha dois')
  })

  it('mantém item de lista vazio (<li></li>) sem quebrar o parse', () => {
    const blocks = parseReportHtml('<ul><li></li><li>Item B</li></ul>')
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: false })
    const items = blocks[0].type === 'list' ? blocks[0].items : []
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual([])
    expect(items[1][0].text).toBe('Item B')
  })

  it('mantém compatibilidade com <li> sem wrapper <p>', () => {
    const blocks = parseReportHtml('<ul><li>Item A</li></ul>')
    const items = blocks[0].type === 'list' ? blocks[0].items : []
    expect(items[0][0].text).toBe('Item A')
  })
})
