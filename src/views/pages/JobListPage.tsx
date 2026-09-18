import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Ban } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { JobDetailModal } from '@/views/components/JobDetailModal'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import type { Job, JobStatus, JobType } from '@/models/job.model'
import {
  JOB_STATUS_LABEL,
  JOB_STATUS_BADGE_CLASS,
  JOB_TYPE_LABELS,
  jobTypeLabel,
} from '@/models/job.model'
import { formatDate } from '@/utils/date'
import { MultiSelect } from '@/views/components/MultiSelect'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState, useUrlArrayState } from '@/hooks/useUrlState'
import { PageSkeleton } from '@/views/components/ui/Skeleton'

const STATUS_LABEL = JOB_STATUS_LABEL

const STATUS_CLASS: Record<JobStatus, string> = Object.fromEntries(
  Object.entries(JOB_STATUS_BADGE_CLASS).map(([status, cls]) => [status, `badge ${cls}`])
) as Record<JobStatus, string>

const STATUS_OPTS = Object.values(STATUS_LABEL)
const TYPE_OPTS = Object.values(JOB_TYPE_LABELS)

const STATUS_KEY_MAP: Record<string, JobStatus> = {
  Pendente: 'pending',
  Agendado: 'scheduled',
  'Em andamento': 'in_progress',
  Concluído: 'completed',
  Cancelado: 'cancelled',
}

const TYPE_KEY_MAP: Record<string, JobType> = Object.fromEntries(
  Object.entries(JOB_TYPE_LABELS).map(([slug, label]) => [label, slug])
) as Record<string, JobType>

export function JobListPage() {
  const { load, filtered, cancel, loading, error, filters, setFilters } = useJobStore()
  const navigate = useNavigate()
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailJobId, setDetailJobId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])

  const [statusParam] = useUrlArrayState('status')
  const [typeSel] = useUrlArrayState('type')
  const [clientSel] = useUrlArrayState('client')
  const [pcSel] = useUrlArrayState('pc')
  const [dateFilter] = useUrlState('date', '')
  const [pageStr, setPageStr] = useUrlState('page', '1')
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  // Raw URLSearchParams setter: filter params + `page` must be updated
  // atomically in a single call, otherwise two sequential setSearchParams
  // calls in the same event handler (via useUrlArrayState/useUrlState) each
  // read a stale snapshot and the later call silently discards earlier ones
  // (mesmo padrão já corrigido em ContractListPage — aqui nunca tinha sido
  // replicado, deixando Status/Tipo/Empresa/PC/Data/Limpar filtros
  // silenciosamente quebrados).
  const [, setRawParams] = useSearchParams()

  function applyFilters(patch: Record<string, string[] | string | null>) {
    setRawParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          const isEmpty = value === null || (Array.isArray(value) ? value.length === 0 : !value)
          if (isEmpty) params.delete(key)
          else params.set(key, Array.isArray(value) ? value.join(',') : value)
        }
        params.delete('page')
        return params
      },
      { replace: true }
    )
  }

  // status is stored in the URL as backend keys (e.g. "scheduled"), but the
  // MultiSelect works with the human-readable labels.
  const statusSel = statusParam.map((k) => STATUS_LABEL[k as JobStatus]).filter(Boolean)
  function setStatusSel(labels: string[]) {
    applyFilters({ status: labels.map((l) => STATUS_KEY_MAP[l]).filter(Boolean) })
  }

  usePageHeader('Ordens de Serviço')

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

  const clientOpts = useMemo(
    () =>
      Array.from(new Set(allJobs.map((j) => j.clientName).filter((n): n is string => !!n))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [allJobs]
  )

  const pcOpts = useMemo(
    () =>
      Array.from(new Set(allJobs.map((j) => j.number).filter((n): n is string => !!n))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [allJobs]
  )

  const localFiltered = useMemo(() => {
    let r = allJobs
    if (statusSel.length > 0) {
      const keys = statusSel.map((s) => STATUS_KEY_MAP[s])
      r = r.filter((j) => keys.includes(j.status))
    }
    if (typeSel.length > 0) {
      const keys = typeSel.map((t) => TYPE_KEY_MAP[t])
      r = r.filter((j) => keys.includes(j.jobType))
    }
    if (clientSel.length > 0) {
      r = r.filter((j) => !!j.clientName && clientSel.includes(j.clientName))
    }
    if (pcSel.length > 0) {
      r = r.filter((j) => !!j.number && pcSel.includes(j.number))
    }
    if (dateFilter) {
      r = r.filter((j) => j.scheduledDate?.startsWith(dateFilter))
    }
    return r
  }, [allJobs, statusSel, typeSel, clientSel, pcSel, dateFilter])

  const hasFilters =
    (filters.search ?? '') !== '' ||
    statusSel.length > 0 ||
    typeSel.length > 0 ||
    clientSel.length > 0 ||
    pcSel.length > 0 ||
    dateFilter !== ''

  function clearFilters() {
    setFilters({ search: undefined })
    applyFilters({ status: [], type: [], client: [], pc: [], date: null })
  }

  const columns = useMemo<ColumnDef<Job>[]>(
    () => [
      {
        accessorKey: 'number',
        header: 'ID',
        cell: ({ row }) => (
          <span className="num text-xs text-base-content/50">{row.original.number ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'scheduledDate',
        header: 'Data',
        cell: ({ row }) => formatDate(row.original.scheduledDate),
      },
      {
        id: 'employeeName',
        accessorFn: (j) => j.employeeName ?? j.employeeId,
        header: 'Funcionário',
      },
      {
        id: 'machineName',
        accessorFn: (j) => j.machineName ?? j.machineId,
        header: 'Equipamento',
      },
      {
        id: 'clientName',
        accessorFn: (j) => j.clientName ?? '—',
        header: 'Empresa',
      },
      {
        id: 'jobType',
        header: 'Tipo',
        enableSorting: false,
        cell: ({ row }) => jobTypeLabel(row.original.jobType),
      },
      {
        id: 'city',
        // OS criadas via aceite de PC (sub-plano 01) nascem sem local
        // preenchido (accept_proposal não seta city/state) — sem o `?? ''`,
        // um valor ausente vira a string "null" ao entrar no template
        // literal, um bug visual real encontrado ao validar contra dados de
        // verdade (o tipo `Job.city/state: string` não reflete essa
        // nulidade possível em runtime).
        accessorFn: (j) => `${j.city ?? ''}/${j.state ?? ''}`,
        header: 'Local',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className={STATUS_CLASS[row.original.status]}>
            {STATUS_LABEL[row.original.status]}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-5">
      {loading && <PageSkeleton />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <>
          {/* Filter bar */}
          <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex gap-3 items-center">
            <input
              type="text"
              className="input input-bordered input-sm flex-1 min-w-0"
              placeholder="Buscar funcionário, equipamento, cidade, OS…"
              aria-label="Buscar funcionário, equipamento, cidade ou OS"
              value={filters.search ?? ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
            />
            <MultiSelect
              className="flex-1"
              options={STATUS_OPTS}
              value={statusSel}
              onChange={setStatusSel}
              placeholder="Status"
            />
            <MultiSelect
              className="flex-1"
              options={TYPE_OPTS}
              value={typeSel}
              onChange={(v) => applyFilters({ type: v })}
              placeholder="Tipo"
            />
            <MultiSelect
              className="flex-1"
              options={clientOpts}
              value={clientSel}
              onChange={(v) => applyFilters({ client: v })}
              placeholder="Empresa"
            />
            <MultiSelect
              className="flex-1"
              options={pcOpts}
              value={pcSel}
              onChange={(v) => applyFilters({ pc: v })}
              placeholder="PC"
            />
            <input
              type="date"
              className="input input-bordered input-sm flex-1 min-w-0"
              aria-label="Filtrar por data agendada"
              value={dateFilter}
              onChange={(e) => applyFilters({ date: e.target.value })}
            />
            {hasFilters && (
              <button className="btn btn-ghost btn-sm shrink-0" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
            <span className="text-xs text-base-content/40 shrink-0 whitespace-nowrap">
              {localFiltered.length} registro(s)
            </span>
            <Link to="/jobs/new" className="btn btn-primary btn-sm gap-1 shrink-0">
              <Plus size={14} /> Nova OS
            </Link>
          </div>

          <div className="card bg-base-200 border border-base-300 overflow-hidden">
            <DataTable<Job>
              data={localFiltered}
              columns={columns}
              sorting={sorting}
              onSortingChange={setSorting}
              page={page}
              onPageChange={(p) => setPageStr(String(p))}
              getRowId={(j) => j.id}
              onRowClick={(j) => setExpandedId(expandedId === j.id ? null : j.id)}
              isRowExpanded={(j) => expandedId === j.id}
              emptyMessage="Nenhuma OS encontrada."
              renderExpandedRow={(j) => (
                <div data-testid={`job-preview-${j.id}`} className="flex flex-col gap-1 text-sm">
                  <p>
                    <span className="font-medium">Tipo:</span> {jobTypeLabel(j.jobType)}
                  </p>
                  <p>
                    <span className="font-medium">Local:</span> {j.city}/{j.state}
                  </p>
                  <p>
                    <span className="font-medium">Horário:</span> {j.startTime} – {j.endTime}
                  </p>
                  <p>
                    <span className="font-medium">Hospedagem:</span>{' '}
                    {j.accommodation ? 'Sim' : 'Não'} · <span className="font-medium">Carro:</span>{' '}
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
              )}
            />
          </div>
        </>
      )}

      {detailJobId && <JobDetailModal jobId={detailJobId} onClose={() => setDetailJobId(null)} />}

      {cancelId && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-h-[90vh] overflow-y-auto">
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
