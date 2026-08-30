import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Ban } from 'lucide-react'
import { JobDetailModal } from '@/views/components/JobDetailModal'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { Pagination } from '@/views/components/Pagination'
import type { Job, JobStatus } from '@/models/job.model'
import { JOB_STATUS_LABEL, JOB_STATUS_BADGE_CLASS } from '@/models/job.model'
import { formatDate } from '@/utils/date'
import { MultiSelect } from '@/views/components/MultiSelect'
import { useSortableTable, sortIcon } from '@/hooks/useSortableTable'

const STATUS_LABEL = JOB_STATUS_LABEL

const STATUS_CLASS: Record<JobStatus, string> = Object.fromEntries(
  Object.entries(JOB_STATUS_BADGE_CLASS).map(([status, cls]) => [status, `badge ${cls}`])
) as Record<JobStatus, string>

const STATUS_OPTS = Object.values(STATUS_LABEL)
const TYPE_OPTS = ['Manutenção', 'Implementação']

const STATUS_KEY_MAP: Record<string, JobStatus> = {
  Pendente: 'pending',
  Agendado: 'scheduled',
  'Em andamento': 'in_progress',
  Concluído: 'completed',
  Cancelado: 'cancelled',
}

export function JobListPage() {
  const { load, filtered, cancel, loading, error, filters, setFilters } = useJobStore()
  const navigate = useNavigate()
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailJobId, setDetailJobId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const [statusSel, setStatusSel] = useState<string[]>(() => {
    const statusParam = searchParams.get('status') as JobStatus | null
    const label = statusParam ? STATUS_LABEL[statusParam] : null
    return label ? [label] : []
  })
  const [typeSel, setTypeSel] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    setFilters({ search: filters.search })
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel() {
    if (!cancelId) return
    await cancel(cancelId)
    setCancelId(null)
  }

  const allJobs = filtered()

  const localFiltered = useMemo(() => {
    let r = allJobs
    if (statusSel.length > 0) {
      const keys = statusSel.map((s) => STATUS_KEY_MAP[s])
      r = r.filter((j) => keys.includes(j.status))
    }
    if (typeSel.length > 0) {
      r = r.filter((j) =>
        typeSel.some((t) =>
          t === 'Manutenção' ? j.jobType === 'maintenance' : j.jobType === 'implementation'
        )
      )
    }
    if (dateFilter) {
      r = r.filter((j) => j.scheduledDate?.startsWith(dateFilter))
    }
    return r
  }, [allJobs, statusSel, typeSel, dateFilter])

  const { sorted, sort, toggle } = useSortableTable<Job>(localFiltered)
  const { paginated, page, totalPages, goTo } = usePagination(sorted, 10)

  const hasFilters =
    (filters.search ?? '') !== '' || statusSel.length > 0 || typeSel.length > 0 || dateFilter !== ''

  function clearFilters() {
    setFilters({ search: undefined })
    setStatusSel([])
    setTypeSel([])
    setDateFilter('')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Ordens de Serviço</h1>
        <Link to="/jobs/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova OS
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar funcionário, máquina, cidade, OS…"
          aria-label="Buscar funcionário, máquina, cidade ou OS"
          value={filters.search ?? ''}
          onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
          style={{ minWidth: 220 }}
        />
        <MultiSelect
          options={STATUS_OPTS}
          value={statusSel}
          onChange={setStatusSel}
          placeholder="Status"
        />
        <MultiSelect options={TYPE_OPTS} value={typeSel} onChange={setTypeSel} placeholder="Tipo" />
        <input
          type="date"
          className="input input-bordered input-sm"
          aria-label="Filtrar por data agendada"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-base-content/40">{sorted.length} registro(s)</span>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          {sorted.length === 0 ? (
            <div className="text-center text-base-content/50 py-10">Nenhuma OS encontrada.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => toggle('number')}>
                        ID{sortIcon(sort.key === 'number' ? sort.dir : null)}
                      </th>
                      <th className="sortable" onClick={() => toggle('scheduledDate')}>
                        Data{sortIcon(sort.key === 'scheduledDate' ? sort.dir : null)}
                      </th>
                      <th className="sortable" onClick={() => toggle('employeeName')}>
                        Funcionário{sortIcon(sort.key === 'employeeName' ? sort.dir : null)}
                      </th>
                      <th className="sortable" onClick={() => toggle('machineName')}>
                        Máquina{sortIcon(sort.key === 'machineName' ? sort.dir : null)}
                      </th>
                      <th>Tipo</th>
                      <th className="sortable" onClick={() => toggle('city')}>
                        Local{sortIcon(sort.key === 'city' ? sort.dir : null)}
                      </th>
                      <th className="sortable" onClick={() => toggle('status')}>
                        Status{sortIcon(sort.key === 'status' ? sort.dir : null)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((j) => (
                      <>
                        <tr
                          key={j.id}
                          className="hover cursor-pointer"
                          onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                              e.preventDefault()
                              setExpandedId(expandedId === j.id ? null : j.id)
                            }
                          }}
                        >
                          <td className="num text-xs text-base-content/50">{j.number ?? '—'}</td>
                          <td>{formatDate(j.scheduledDate)}</td>
                          <td>{j.employeeName ?? j.employeeId}</td>
                          <td>{j.machineName ?? j.machineId}</td>
                          <td>{j.jobType === 'maintenance' ? 'Manutenção' : 'Implementação'}</td>
                          <td>
                            {j.city}/{j.state}
                          </td>
                          <td>
                            <span className={STATUS_CLASS[j.status]}>{STATUS_LABEL[j.status]}</span>
                          </td>
                        </tr>
                        {expandedId === j.id && (
                          <tr key={`preview-${j.id}`}>
                            <td colSpan={7} className="bg-base-200 px-4 py-3">
                              <div
                                data-testid={`job-preview-${j.id}`}
                                className="flex flex-col gap-1 text-sm"
                              >
                                <p>
                                  <span className="font-medium">Descrição:</span> {j.description}
                                </p>
                                <p>
                                  <span className="font-medium">Local:</span> {j.city}/{j.state}
                                </p>
                                <p>
                                  <span className="font-medium">Horário:</span> {j.startTime} –{' '}
                                  {j.endTime}
                                </p>
                                <p>
                                  <span className="font-medium">Hospedagem:</span>{' '}
                                  {j.accommodation ? 'Sim' : 'Não'} ·{' '}
                                  <span className="font-medium">Carro:</span>{' '}
                                  {j.car ? 'Sim' : 'Não'}
                                </p>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    className="btn btn-xs btn-primary"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setDetailJobId(j.id)
                                    }}
                                  >
                                    Ver detalhes
                                  </button>
                                  {j.status !== 'cancelled' && j.status !== 'completed' && (
                                    <button
                                      className="btn btn-xs btn-ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/jobs/${j.id}/edit`)
                                      }}
                                    >
                                      <Pencil size={11} /> Editar
                                    </button>
                                  )}
                                  {j.status === 'scheduled' && (
                                    <button
                                      className="btn btn-xs btn-ghost text-error"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setCancelId(j.id)
                                      }}
                                    >
                                      <Ban size={11} /> Cancelar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-base-300">
                <Pagination page={page} totalPages={totalPages} onGoTo={goTo} />
              </div>
            </>
          )}
        </div>
      )}

      {detailJobId && <JobDetailModal jobId={detailJobId} onClose={() => setDetailJobId(null)} />}

      {cancelId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmar cancelamento</h3>
            <p className="py-4">Tem certeza que deseja cancelar esta OS?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setCancelId(null)}>
                Não
              </button>
              <button className="btn btn-error" onClick={handleCancel}>
                Cancelar OS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
