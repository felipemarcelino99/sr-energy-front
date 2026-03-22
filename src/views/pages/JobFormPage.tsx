import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { JobStepper } from '@/views/components/JobStepper'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import type { JobFormData } from '@/models/job.model'
import { fetchJob } from '@/services/job.service'

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

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Trabalho' : 'Novo Trabalho'}</h1>
      <JobStepper
        employees={employeeOptions}
        machines={machineOptions}
        initialData={initialData}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  )
}
