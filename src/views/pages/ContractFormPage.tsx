import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ContractForm } from '@/views/components/ContractForm'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import type { ContractFormData } from '@/models/contract.model'
import { fetchContract, uploadContractFile } from '@/services/contract.service'
import type { Contract } from '@/models/contract.model'

export function ContractFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useContractStore()

  const [initialData, setInitialData] = useState<Partial<ContractFormData> | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)

  useEffect(() => {
    if (!isEditing || !id) return
    setFetchLoading(true)
    fetchContract(id)
      .then((c: Contract) => {
        setInitialData({
          clientName: c.clientName,
          clientCnpj: c.clientCnpj,
          description: c.description,
          startDate: c.startDate,
          endDate: c.endDate,
          fileUrl: c.fileUrl,
          recurring: c.recurring,
        })
      })
      .finally(() => setFetchLoading(false))
  }, [id, isEditing])

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
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/contracts')}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">
          {isEditing ? `Editar Contrato${initialData?.clientName ? ` — ${initialData.clientName}` : ''}` : 'Novo Contrato'}
        </h1>
      </div>
      <ContractForm initialData={initialData} onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
