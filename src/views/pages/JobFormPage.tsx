import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { JobStepper } from '@/views/components/JobStepper'
import { JobEditForm } from '@/views/components/JobEditForm'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import type { JobFormData } from '@/models/job.model'
import { fetchJob } from '@/services/job.service'
import { toast } from '@/viewmodels/toast.viewmodel'

export function JobFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useJobStore()
  const { machines, load: loadMachines } = useMachineStore()
  const { employees, load: loadEmployees } = useEmployeeStore()

  const [initialData, setInitialData] = useState<Partial<JobFormData> | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)

  useEffect(() => {
    loadMachines()
    loadEmployees()
  }, [loadMachines, loadEmployees])

  useEffect(() => {
    if (!isEditing || !id) return
    setFetchLoading(true)
    fetchJob(id)
      .then((j) => setInitialData(j))
      .finally(() => setFetchLoading(false))
  }, [id, isEditing])

  async function handleSubmit(data: JobFormData) {
    setLoading(true)
    try {
      if (isEditing && id) {
        await update(id, data)
      } else {
        await create(data)
      }
      toast.success(isEditing ? 'OS atualizada com sucesso.' : 'OS criada com sucesso.')
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return <div className="flex justify-center py-16"><span className="loading loading-spinner loading-lg" /></div>
  }

  const employeeOptions = employees.map((e) => ({ id: e.id, name: e.name }))
  const machineOptions = machines.map((m) => ({ id: m.id, name: m.name }))

  if (isEditing) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/jobs')}>
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-xl font-bold tracking-tight">
              {`Editar OS${initialData?.description ? ` — ${initialData.description}` : ''}`}
            </h1>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/jobs')}>Cancelar</button>
            <button type="submit" form="job-edit-form" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-xs" /> : 'Salvar'}
            </button>
          </div>
        </div>

        <div className="card bg-base-200 border border-base-300">
          <div className="card-body">
            <JobEditForm
              formId="job-edit-form"
              initialData={initialData ?? {}}
              employees={employeeOptions}
              machines={machineOptions}
              onSubmit={handleSubmit}
              loading={loading}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/jobs')}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Nova OS</h1>
      </div>
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body">
          <JobStepper
            employees={employeeOptions}
            machines={machineOptions}
            initialData={initialData}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
