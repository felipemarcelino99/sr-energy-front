import { render, screen, fireEvent } from '@testing-library/react'
import { EvidenceUpload } from '@/views/components/EvidenceUpload'

describe('EvidenceUpload', () => {
  it('aceita arquivo de tipo válido (image/jpeg)', () => {
    const onChange = jest.fn()
    render(<EvidenceUpload files={[]} onChange={onChange} />)
    const input = screen.getByTestId('evidence-input')
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(onChange).toHaveBeenCalled()
  })

  it('rejeita arquivo de tipo inválido', () => {
    const onChange = jest.fn()
    render(<EvidenceUpload files={[]} onChange={onChange} />)
    const input = screen.getByTestId('evidence-input')
    const file = new File(['exe'], 'virus.exe', { type: 'application/exe' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('exibe arquivo adicionado na lista', () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    render(<EvidenceUpload files={[file]} onChange={jest.fn()} />)
    expect(screen.getByText('photo.jpg')).toBeInTheDocument()
  })

  it('permite remover arquivo da lista', () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const onChange = jest.fn()
    render(<EvidenceUpload files={[file]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /remover/i }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
