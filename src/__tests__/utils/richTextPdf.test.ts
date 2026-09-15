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
})
