import { render, screen } from '@testing-library/react'

// Mock TipTap since it requires a real DOM environment beyond jsdom
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => ({
    chain: () => ({ focus: () => ({ toggleBold: () => ({ run: jest.fn() }) }) }),
    isActive: jest.fn(() => false),
    getHTML: jest.fn(() => '<p>test</p>'),
  })),
  EditorContent: ({ 'data-testid': testId }: { 'data-testid': string }) => (
    <div data-testid={testId ?? 'editor-content'} contentEditable suppressContentEditableWarning>
      Editor content
    </div>
  ),
}))

jest.mock('@tiptap/starter-kit', () => ({}))
jest.mock('@tiptap/extension-underline', () => ({}))
jest.mock('@tiptap/extension-heading', () => ({ configure: jest.fn(() => ({})) }))

import { RichTextEditor } from '@/views/components/RichTextEditor'

describe('RichTextEditor', () => {
  it('renderiza toolbar', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
  })

  it('renderiza área de conteúdo editável', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })

  it('renderiza botões de formatação', () => {
    render(<RichTextEditor content="" onChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: /negrito/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /itálico/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sublinhado/i })).toBeInTheDocument()
  })
})
