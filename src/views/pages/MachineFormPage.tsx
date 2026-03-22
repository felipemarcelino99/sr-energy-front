import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MachineForm } from '@/views/components/MachineForm'
import { MachineJobHistory } from '@/views/components/MachineJobHistory'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import type { MachineFormData, MachineJob } from '@/models/machine.model'
import { fetchMachine, fetchMachineJobs } from '@/services/machine.service'
import type { Machine } from '@/models/machine.model'

type Tab = 'details' | 'history'

export function MachineFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { create, update, uploadManual } = useMachineStore()

  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [initialData, setInitialData] = useState<Partial<MachineFormData> | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)
  const [jobs, setJobs] = useState<MachineJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)

  useEffect(() => {
    if (!isEditing || !id) return
    setFetchLoading(true)
    fetchMachine(id)
      .then((m: Machine) => {
        setInitialData({
          name: m.name,
          brand: m.brand,
          model: m.model,
          serialNumber: m.serialNumber,
          year: m.year,
          manualUrl: m.manualUrl,
        })
      })
      .finally(() => setFetchLoading(false))
  }, [id, isEditing])

  useEffect(() => {
    if (!isEditing || !id || activeTab !== 'history') return
    setJobsLoading(true)
    fetchMachineJobs(id)
      .then(setJobs)
      .finally(() => setJobsLoading(false))
  }, [id, isEditing, activeTab])

  async function handleSubmit(data: MachineFormData, manualFile?: File) {
    setLoading(true)
    try {
      if (isEditing && id) {
        await update(id, data)
        if (manualFile) await uploadManual(id, manualFile)
      } else {
        await create(data)
      }
      navigate('/machines')
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
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold tracking-tight mb-6">
        {isEditing ? 'Editar Máquina' : 'Nova Máquina'}
      </h1>

      {isEditing && (
        <div role="tablist" className="tabs tabs-bordered mb-6">
          <button
            role="tab"
            className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Dados
          </button>
          <button
            role="tab"
            className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Histórico de Trabalhos
          </button>
        </div>
      )}

      {activeTab === 'details' && (
        <MachineForm initialData={initialData} onSubmit={handleSubmit} loading={loading} />
      )}

      {activeTab === 'history' && (
        <MachineJobHistory jobs={jobs} loading={jobsLoading} />
      )}
    </div>
  )
}
