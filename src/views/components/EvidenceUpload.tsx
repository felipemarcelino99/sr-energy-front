import { ALLOWED_MIME_TYPES } from '@/models/job-report.model'

interface Props {
  files: File[]
  onChange: (files: File[]) => void
}

export function EvidenceUpload({ files, onChange }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const valid = selected.filter((f) => ALLOWED_MIME_TYPES.includes(f.type))
    if (valid.length === 0) return
    onChange([...files, ...valid])
    e.target.value = ''
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="label text-xs font-medium text-base-content/60">
        Evidências (jpg, png, pdf, mp4, mp3)
      </label>

      <input
        data-testid="evidence-input"
        type="file"
        multiple
        accept={ALLOWED_MIME_TYPES.join(',')}
        className="file-input file-input-bordered w-full"
        onChange={handleChange}
      />

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, i) => (
            <li key={i} className="flex items-center justify-between bg-base-200 rounded px-3 py-2 text-sm">
              <span className="truncate max-w-xs">{file.name}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs text-error ml-2"
                aria-label="remover"
                onClick={() => handleRemove(i)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
