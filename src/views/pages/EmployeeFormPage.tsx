import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { EmployeeForm } from '@/views/components/EmployeeForm'
import { formatDate } from '@/utils/date'
import { SalaryAdjustmentForm } from '@/views/components/SalaryAdjustmentForm'
import type { EmployeeFormData } from '@/models/employee.model'
import type { SalaryAdjustmentFormData } from '@/models/salary-adjustment.model'
import { fetchEmployee } from '@/services/employee.service'
import type { Employee } from '@/models/employee.model'
import { toast } from '@/viewmodels/toast.viewmodel'
import { fetchJobs } from '@/services/job.service'
import type { Job, JobStatus } from '@/models/job.model'

const statusLabel: Record<JobStatus, string> = {
  pending: 'Pendente',
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

const statusClass: Record<JobStatus, string> = {
  pending: 'badge badge-neutral badge-sm',
  scheduled: 'badge badge-warning badge-sm',
  in_progress: 'badge badge-info badge-sm',
  completed: 'badge badge-success badge-sm',
  cancelled: 'badge badge-error badge-outline badge-sm',
}

type Tab = 'dados' | 'trabalhos' | 'reajustes'

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const {
    create,
    update,
    loading: storeLoading,
    adjustments,
    adjustmentsLoading,
    loadAdjustments,
    addAdjustment,
  } = useEmployeeStore()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [tab, setTab] = useState<Tab>('dados')
  const [loadingPage, setLoadingPage] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [employeeJobs, setEmployeeJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoadingPage(true)
    Promise.all([fetchEmployee(id), loadAdjustments(id)])
      .then(([emp]) => {
        setEmployee(emp)
      })
      .finally(() => setLoadingPage(false))
  }, [id, loadAdjustments])

  useEffect(() => {
    if (tab !== 'trabalhos' || !id) return
    setJobsLoading(true)
    fetchJobs()
      .then((all) => setEmployeeJobs(all.filter((j) => j.employeeId === id)))
      .finally(() => setJobsLoading(false))
  }, [tab, id])

  async function handleSubmit(data: EmployeeFormData) {
    setSubmitting(true)
    try {
      if (id) {
        await update(id, data)
      } else {
        await create(data)
      }
      toast.success(id ? 'Funcionário atualizado com sucesso.' : 'Funcionário criado com sucesso.')
      navigate('/employees')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdjustment(data: SalaryAdjustmentFormData) {
    if (!id || !employee) return
    await addAdjustment(id, data)
    setEmployee((prev) => prev ? { ...prev, salary: data.newSalary } : prev)
    toast.success('Reajuste salarial registrado com sucesso.')
  }

  if (loadingPage) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-10 w-48 bg-base-300 rounded-lg" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-base-300 rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/employees')}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">
          {isEdit ? `Editar Funcionário${employee?.name ? ` — ${employee.name}` : ''}` : 'Novo Funcionário'}
        </h1>
      </div>

      {/* Tabs (edit mode only) */}
      {isEdit && (
        <div role="tablist" className="tabs tabs-bordered">
          {(['dados', 'trabalhos', 'reajustes'] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              className={`tab capitalize ${tab === t ? 'tab-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'dados' ? 'Dados' : t === 'trabalhos' ? 'OS' : 'Reajustes'}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {tab === 'dados' && (
        <EmployeeForm
          initialData={employee ?? undefined}
          onSubmit={handleSubmit}
          loading={submitting || storeLoading}
        />
      )}

      {tab === 'trabalhos' && (
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-0">
            {jobsLoading ? (
              <div className="flex flex-col gap-3 p-4 animate-pulse">
                {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-base-300 rounded" />)}
              </div>
            ) : employeeJobs.length === 0 ? (
              <p className="text-sm text-base-content/30 text-center py-10">
                Nenhum trabalho encontrado para este funcionário
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="border-base-300 text-xs text-base-content/40 uppercase tracking-wider">
                      <th className="font-semibold">Descrição</th>
                      <th className="font-semibold">Status</th>
                      <th className="font-semibold">Tipo</th>
                      <th className="font-semibold">Máquina</th>
                      <th className="font-semibold">Local</th>
                      <th className="font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeJobs.map((job) => (
                      <tr key={job.id} className="border-base-300">
                        <td className="font-medium max-w-xs truncate">{job.description}</td>
                        <td>
                          <span className={statusClass[job.status]}>{statusLabel[job.status]}</span>
                        </td>
                        <td className="text-base-content/60 capitalize">
                          {job.jobType === 'maintenance' ? 'Manutenção' : 'Implantação'}
                        </td>
                        <td className="text-base-content/60">{job.machineName}</td>
                        <td className="text-base-content/60">{job.city}/{job.state}</td>
                        <td className="text-base-content/60">{formatDate(job.scheduledDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'reajustes' && employee && (
        <div className="flex flex-col gap-6">
          <SalaryAdjustmentForm
            currentSalary={employee.salary}
            onSubmit={handleAdjustment}
            loading={adjustmentsLoading}
          />
          {adjustments.length > 0 && (
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body gap-3">
                <h3 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                  Histórico
                </h3>
                <ul className="divide-y divide-base-300">
                  {adjustments.map((adj) => (
                    <li key={adj.id} className="py-2 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          {adj.newSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-xs text-base-content/40">{adj.reason}</p>
                      </div>
                      <span className="text-xs text-base-content/40 shrink-0">
                        {formatDate(adj.adjustedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
