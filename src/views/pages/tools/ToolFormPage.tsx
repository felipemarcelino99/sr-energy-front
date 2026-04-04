import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToolStore } from '@/viewmodels/tool.viewmodel'
import { toolSchema, type ToolFormData } from '@/models/tool.model'

export function ToolFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { tools, fetchTools, createTool, updateTool, loading } = useToolStore()

  const [form, setForm] = useState<ToolFormData>({
    name: '',
    description: '',
    quantity: 0,
    status: 'active',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isEditing) fetchTools()
  }, [isEditing, fetchTools])

  useEffect(() => {
    if (isEditing && id && tools.length > 0) {
      const tool = tools.find((t) => t.id === id)
      if (tool) {
        setForm({
          name: tool.name,
          description: tool.description ?? '',
          quantity: tool.quantity,
          status: tool.status,
        })
      }
    }
  }, [isEditing, id, tools])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = toolSchema.safeParse(form)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      if (isEditing && id) {
        await updateTool(id, parsed.data)
      } else {
        await createTool(parsed.data)
      }
      navigate('/tools')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && isEditing) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Editar Ferramenta' : 'Nova Ferramenta'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-lg flex flex-col gap-4">
        <div className="form-control">
          <label className="label" htmlFor="tool-name">
            <span className="label-text">Nome *</span>
          </label>
          <input
            id="tool-name"
            aria-label="Nome"
            className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
            placeholder="Nome da ferramenta"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          {errors.name && <span className="text-error text-sm mt-1">{errors.name}</span>}
        </div>

        <div className="form-control">
          <label className="label" htmlFor="tool-description">
            <span className="label-text">Descrição</span>
          </label>
          <input
            id="tool-description"
            aria-label="Descrição"
            className="input input-bordered"
            placeholder="Descrição (opcional)"
            value={form.description ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="form-control">
          <label className="label" htmlFor="tool-quantity">
            <span className="label-text">Quantidade</span>
          </label>
          <input
            id="tool-quantity"
            aria-label="Quantidade"
            type="number"
            min={0}
            className={`input input-bordered ${errors.quantity ? 'input-error' : ''}`}
            value={form.quantity}
            onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
          />
          {errors.quantity && <span className="text-error text-sm mt-1">{errors.quantity}</span>}
        </div>

        {isEditing && (
          <div className="form-control">
            <label className="label" htmlFor="tool-status">
              <span className="label-text">Status</span>
            </label>
            <select
              id="tool-status"
              aria-label="Status"
              className="select select-bordered"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/tools')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
