import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Heading from '@tiptap/extension-heading'

interface Props {
  content: string
  onChange: (html: string) => void
}

export function RichTextEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Heading.configure({ levels: [1, 2, 3] }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-64 p-4 w-full',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div
      className="border border-base-300 rounded-lg overflow-hidden cursor-text"
      data-testid="rich-text-editor"
      onClick={() => editor.commands.focus()}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap gap-1 p-2 bg-base-200 border-b border-base-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`btn btn-xs ${editor.isActive('bold') ? 'btn-primary' : 'btn-ghost'}`}
          aria-label="negrito"
        >
          <strong>N</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`btn btn-xs ${editor.isActive('italic') ? 'btn-primary' : 'btn-ghost'}`}
          aria-label="itálico"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`btn btn-xs ${editor.isActive('underline') ? 'btn-primary' : 'btn-ghost'}`}
          aria-label="sublinhado"
        >
          <u>S</u>
        </button>
        <div className="divider divider-horizontal m-0" />
        {([1, 2, 3] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            className={`btn btn-xs ${editor.isActive('heading', { level }) ? 'btn-primary' : 'btn-ghost'}`}
          >
            H{level}
          </button>
        ))}
        <div className="divider divider-horizontal m-0" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`btn btn-xs ${editor.isActive('bulletList') ? 'btn-primary' : 'btn-ghost'}`}
        >
          • Lista
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`btn btn-xs ${editor.isActive('orderedList') ? 'btn-primary' : 'btn-ghost'}`}
        >
          1. Lista
        </button>
      </div>

      <EditorContent editor={editor} data-testid="editor-content" />
    </div>
  )
}
