import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useToolStore } from '@/viewmodels/tool.viewmodel'
import { ToolForm } from '@/views/components/ToolForm'
import type { ToolFormData } from '@/models/tool.model'
import { fetchTool } from '@/services/tool.service'
import type { Tool } from '@/models/tool.model'

export function ToolFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { createTool, updateTool } = useToolStore()

  const [initialData, setInitialData] = useState<Partial<ToolFormData> | undefined>(undefined)
  const [fetchLoading, setFetchLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEditing || !id) return
    setFetchLoading(true)
    fetchTool(id)
      .then((t: Tool) => {
        setInitialData({
          name: t.name,
          description: t.description ?? '',
          quantity: t.quantity,
          status: t.status,
        })
      })
      .finally(() => setFetchLoading(false))
  }, [id, isEditing])

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

  if (fetchLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-10 w-48 bg-base-300 rounded-lg" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-base-300 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/tools')}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">
          {isEditing ? `Editar Ferramenta${initialData?.name ? ` — ${initialData.name}` : ''}` : 'Nova Ferramenta'}
        </h1>
      </div>

      <ToolForm
        initialData={initialData}
        onSubmit={handleSubmit}
        loading={submitting}
        isEditing={isEditing}
      />
    </div>
  )
}
