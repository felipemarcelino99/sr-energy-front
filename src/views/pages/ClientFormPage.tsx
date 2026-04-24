import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ClientForm } from '@/views/components/ClientForm'
import { ClientContractsTab } from '@/views/components/ClientContractsTab'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import type { ClientFormData } from '@/models/client.model'
import { fetchClient } from '@/services/client.service'
import type { Client } from '@/models/client.model'
import { toast } from '@/viewmodels/toast.viewmodel'

type Tab = 'dados' | 'contratos'

export function ClientFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useClientStore()

  const [initialData, setInitialData] = useState<Partial<ClientFormData> | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)
  const [activeTab, setActiveTab] = useState<Tab>('dados')

  useEffect(() => {
    if (!isEditing || !id) return
    setFetchLoading(true)
    fetchClient(id)
      .then((c: Client | null) => {
        if (!c) return
        setInitialData({
          razaoSocial: c.razaoSocial,
          cnpj: c.cnpj,
          segmento: c.segmento,
          endereco: c.endereco,
          telefone: c.telefone,
          celular: c.celular,
          email: c.email,
          status: c.status,
        })
      })
      .finally(() => setFetchLoading(false))
  }, [id, isEditing])

  async function handleSubmit(data: ClientFormData) {
    setLoading(true)
    try {
      if (isEditing && id) {
        await update(id, data)
      } else {
        await create(data)
      }
      toast.success(isEditing ? 'Cliente atualizado com sucesso.' : 'Cliente criado com sucesso.')
      navigate('/clients')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  const title = isEditing
    ? `Editar Cliente${initialData?.razaoSocial ? ` — ${initialData.razaoSocial}` : ''}`
    : 'Novo Cliente'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/clients')}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        {activeTab === 'dados' && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')}>
              Cancelar
            </button>
            <button type="submit" form="client-form" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-xs" /> : isEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <div role="tablist" className="tabs tabs-bordered mb-4">
            <button
              role="tab"
              className={`tab${activeTab === 'dados' ? ' tab-active' : ''}`}
              onClick={() => setActiveTab('dados')}
            >
              Dados Cadastrais
            </button>
            <button
              role="tab"
              className={`tab${activeTab === 'contratos' ? ' tab-active' : ''}`}
              onClick={() => setActiveTab('contratos')}
            >
              Contratos
            </button>
          </div>

          {activeTab === 'dados' && (
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body">
                <ClientForm
                  initialData={initialData}
                  onSubmit={handleSubmit}
                  loading={loading}
                  formId="client-form"
                  hideButtons
                />
              </div>
            </div>
          )}

          {activeTab === 'contratos' && id && <ClientContractsTab clientId={id} />}
        </div>
      ) : (
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body">
            <ClientForm
              initialData={initialData}
              onSubmit={handleSubmit}
              loading={loading}
              formId="client-form"
              hideButtons
            />
          </div>
        </div>
      )}
    </div>
  )
}
