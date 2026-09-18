import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { EmployeeForm } from '@/views/components/EmployeeForm'
import { formatDate } from '@/utils/date'
import { SalaryAdjustmentForm } from '@/views/components/SalaryAdjustmentForm'
import type { EmployeeFormData } from '@/models/employee.model'
import type { SalaryAdjustmentFormData } from '@/models/salary-adjustment.model'
import { fetchEmployee, uploadEmployeePhoto } from '@/services/employee.service'
import type { Employee } from '@/models/employee.model'
import { toast } from '@/viewmodels/toast.viewmodel'
import { fetchJobs } from '@/services/job.service'
import { JOB_STATUS_LABEL, JOB_STATUS_BADGE_CLASS, jobTypeLabel } from '@/models/job.model'
import type { Job } from '@/models/job.model'
import { usePageHeader } from '@/hooks/usePageHeader'

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

  usePageHeader(
    isEdit
      ? `Editar Funcionário${employee?.name ? ` — ${employee.name}` : ''}`
      : 'Novo Funcionário',
    { onBack: () => navigate('/employees') }
  )

  async function handleSubmit(data: EmployeeFormData & { password?: string }, photoFile?: File) {
    setSubmitting(true)
    try {
      // Sub-plano 05: na criação o id só existe depois do POST /employees
      // resolver — a foto (se houver) é enviada num segundo request, com o
      // id recém-criado. Na edição o id já é conhecido.
      const employeeId = id ?? (await create(data)).id
      if (id) {
        await update(id, data)
      }
      if (photoFile) {
        try {
          await uploadEmployeePhoto(employeeId, photoFile)
        } catch {
          toast.error('Funcionário salvo, mas a foto não pôde ser enviada.')
        }
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
    setEmployee((prev) => (prev ? { ...prev, salary: data.newSalary } : prev))
    toast.success('Reajuste salarial registrado com sucesso.')
  }

  if (loadingPage) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-10 w-48 bg-base-300 rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-base-300 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
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
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body">
            <div className="flex items-center justify-end gap-2 mb-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/employees')}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="employee-form"
                className="btn btn-primary btn-sm"
                disabled={submitting || storeLoading}
              >
                {submitting || storeLoading ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : isEdit ? (
                  'Salvar'
                ) : (
                  'Criar'
                )}
              </button>
            </div>
            <EmployeeForm
              initialData={employee ?? undefined}
              initialPhotoUrl={employee?.photoUrl}
              onSubmit={handleSubmit}
              loading={submitting || storeLoading}
              formId="employee-form"
              hideButtons
              isEditing={isEdit}
            />
          </div>
        </div>
      )}

      {tab === 'trabalhos' && (
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-0">
            {jobsLoading ? (
              <div className="flex flex-col gap-3 p-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-base-300 rounded" />
                ))}
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
                      <th className="font-semibold">OS</th>
                      <th className="font-semibold">Status</th>
                      <th className="font-semibold">Tipo</th>
                      <th className="font-semibold">Equipamento</th>
                      <th className="font-semibold">Local</th>
                      <th className="font-semibold">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeJobs.map((job) => (
                      <tr key={job.id} className="border-base-300">
                        <td className="font-medium max-w-xs truncate">{job.number ?? '—'}</td>
                        <td>
                          <span
                            className={`badge badge-sm ${JOB_STATUS_BADGE_CLASS[job.status] ?? 'badge-ghost'}`}
                          >
                            {JOB_STATUS_LABEL[job.status] ?? job.status}
                          </span>
                        </td>
                        <td className="text-base-content/60 capitalize">
                          {jobTypeLabel(job.jobType)}
                        </td>
                        <td className="text-base-content/60">{job.machineName}</td>
                        <td className="text-base-content/60">
                          {job.city}/{job.state}
                        </td>
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
                          {adj.newSalary.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
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
