import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { JobStepper } from '@/views/components/JobStepper'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import type { JobFormData } from '@/models/job.model'
import { fetchJob } from '@/services/job.service'
import { toast } from '@/viewmodels/toast.viewmodel'
import { usePageHeader } from '@/hooks/usePageHeader'

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

  usePageHeader(
    isEditing
      ? `Editar OS${initialData?.description ? ` — ${initialData.description}` : ''}`
      : 'Nova OS',
    { onBack: () => navigate('/jobs') }
  )

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
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-4 sm:p-5">
            <JobStepper
              employees={employeeOptions}
              machines={machineOptions}
              bags={bagOptions}
              initialData={initialData}
              onSubmit={handleSubmit}
              loading={loading}
              submitLabel="Salvar"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-4 sm:p-5">
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
