import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { JobStepper } from '@/views/components/JobStepper'
import { JobEditForm } from '@/views/components/JobEditForm'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
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
  const { bags, load: loadBags } = useBagStore()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMachines()
    loadEmployees()
    loadBags()
  }, [loadMachines, loadEmployees, loadBags])

  const jobQuery = useQuery({
    queryKey: ['jobs', id],
    queryFn: () => fetchJob(id!),
    enabled: isEditing && Boolean(id),
  })
  const initialData: Partial<JobFormData> | undefined = jobQuery.data
  const fetchLoading = isEditing && jobQuery.isLoading

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
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  const employeeOptions = employees.map((e) => ({ id: e.id, name: e.name }))
  const machineOptions = machines.map((m) => ({ id: m.id, name: m.name }))
  const bagOptions = bags.map((b) => ({ id: b.id, name: b.name, model: b.model }))

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
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/jobs')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="job-edit-form"
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
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
              bags={bagOptions}
              onSubmit={handleSubmit}
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
            bags={bagOptions}
            initialData={initialData}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
