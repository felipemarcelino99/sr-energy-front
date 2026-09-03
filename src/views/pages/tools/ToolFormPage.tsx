import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToolStore } from '@/viewmodels/tool.viewmodel'
import { ToolForm } from '@/views/components/ToolForm'
import type { ToolFormData } from '@/models/tool.model'
import { usePageHeader } from '@/hooks/usePageHeader'

export function ToolFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { tools, fetchTools, createTool, updateTool } = useToolStore()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const tool = isEditing && id ? tools.find((t) => t.id === id) : undefined
  const initialData: Partial<ToolFormData> | undefined = tool
    ? {
        name: tool.name,
        description: tool.description ?? '',
        quantity: tool.quantity,
        status: tool.status,
      }
    : undefined

  usePageHeader(isEditing ? 'Editar Ferramenta' : 'Nova Ferramenta', {
    onBack: () => navigate('/tools'),
  })

  async function handleSubmit(data: ToolFormData) {
    setSubmitting(true)
    try {
      if (isEditing && id) {
        await updateTool(id, data)
      } else {
        await createTool(data)
      }
      navigate('/tools')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body">
          <div className="flex items-center justify-end gap-2 mb-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/tools')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="tool-form"
              className="btn btn-primary btn-sm"
              disabled={submitting}
            >
              {submitting ? <span className="loading loading-spinner loading-xs" /> : 'Salvar'}
            </button>
          </div>
          <ToolForm
            key={tool?.id ?? 'new'}
            initialData={initialData}
            onSubmit={handleSubmit}
            loading={submitting}
            isEditing={isEditing}
            formId="tool-form"
            hideButtons
          />
        </div>
      </div>
    </div>
  )
}
