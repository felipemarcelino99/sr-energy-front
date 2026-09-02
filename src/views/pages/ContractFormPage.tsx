import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ContractForm } from '@/views/components/ContractForm'
import { EntityTimeline } from '@/views/components/EntityTimeline'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import type { ContractFormData } from '@/models/contract.model'
import { fetchContract, uploadContractFile } from '@/services/contract.service'
import type { Contract } from '@/models/contract.model'
import { toast } from '@/viewmodels/toast.viewmodel'
import { usePageHeader } from '@/hooks/usePageHeader'

export function ContractFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useContractStore()
  const { load: loadClients } = useClientStore()

  const [initialData, setInitialData] = useState<Partial<ContractFormData> | undefined>(undefined)
  const [proposal, setProposal] = useState<{ id: string; number: string } | null>(null)
  const [contractNumber, setContractNumber] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)

  useEffect(() => {
    loadClients()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEditing || !id) return
    setFetchLoading(true)
    fetchContract(id)
      .then((c: Contract) => {
        setInitialData({
          clientId: c.clientId,
          description: c.description,
          startDate: c.startDate,
          endDate: c.endDate,
          fileUrl: c.fileUrl,
          recurring: c.recurring,
          contractType: c.contractType,
          contractValue: c.contractValue,
        })
        setProposal(c.proposal ?? null)
        setContractNumber(c.number ?? undefined)
      })
      .finally(() => setFetchLoading(false))
  }, [id, isEditing])

  usePageHeader(isEditing ? 'Editar Contrato' : 'Novo Contrato', {
    onBack: () => navigate('/contracts'),
  })

  async function handleSubmit(data: ContractFormData, file?: File) {
    setLoading(true)
    try {
      if (isEditing && id) {
        await update(id, data)
        if (file) {
          const url = await uploadContractFile(id, file)
          await update(id, { fileUrl: url })
        }
      } else {
        await create(data)
      }
      toast.success(isEditing ? 'Contrato atualizado com sucesso.' : 'Contrato criado com sucesso.')
      navigate('/contracts')
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

  return (
    <div className="flex flex-col gap-5">
      {proposal && (
        <Link to={`/proposals/${proposal.id}/edit`} className="link link-primary text-xs">
          Ver PC de origem ({proposal.number})
        </Link>
      )}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body">
          <div className="flex items-center justify-end gap-2 mb-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/contracts')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="contract-form"
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : isEditing ? (
                'Salvar'
              ) : (
                'Criar'
              )}
            </button>
          </div>
          <ContractForm
            initialData={initialData}
            onSubmit={handleSubmit}
            loading={loading}
            formId="contract-form"
            hideButtons
          />
        </div>
      </div>

      {isEditing && id && (
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body">
            <h2 className="font-bold text-lg mb-3">Linha do tempo</h2>
            <EntityTimeline entityType="contract" entityId={id} entityNumber={contractNumber} />
          </div>
        </div>
      )}
    </div>
  )
}
