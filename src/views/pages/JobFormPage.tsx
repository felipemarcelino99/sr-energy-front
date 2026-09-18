import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { JobStepper } from '@/views/components/JobStepper'
import { JobEditTabs } from '@/views/components/JobEditTabs'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import type { Job, JobFormData } from '@/models/job.model'
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
  const job: Partial<Job> | undefined = jobQuery.data
  const fetchLoading = isEditing && jobQuery.isLoading

  // Sub-plano 04, item 4: título passa a ser "OS {number} — {clientName}"
  // (a descrição foi removida do modelo, não dá mais pra usá-la aqui).
  usePageHeader(
    isEditing
      ? job?.number
        ? `OS ${job.number}${job?.clientName ? ` — ${job.clientName}` : ''}`
        : 'Editar OS'
      : 'Nova OS',
    { onBack: () => navigate('/jobs') }
  )

  async function handleCreate(data: JobFormData) {
    setLoading(true)
    try {
      await create(data)
      toast.success('OS criada com sucesso.')
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(data: Partial<JobFormData>) {
    if (!id) return
    setLoading(true)
    try {
      await update(id, data)
      toast.success('OS atualizada com sucesso.')
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
        <JobEditTabs
          job={job ?? {}}
          employees={employeeOptions}
          machines={machineOptions}
          bags={bagOptions}
          onSubmit={handleUpdate}
          onCancel={() => navigate('/jobs')}
          loading={loading}
        />
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
            onSubmit={handleCreate}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}
