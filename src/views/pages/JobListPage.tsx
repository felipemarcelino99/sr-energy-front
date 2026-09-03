import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Ban } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { JobDetailModal } from '@/views/components/JobDetailModal'
import { useJobStore } from '@/viewmodels/job.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import type { Job, JobStatus } from '@/models/job.model'
import { JOB_STATUS_LABEL, JOB_STATUS_BADGE_CLASS } from '@/models/job.model'
import { formatDate } from '@/utils/date'
import { MultiSelect } from '@/views/components/MultiSelect'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState, useUrlArrayState } from '@/hooks/useUrlState'

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
  const [sorting, setSorting] = useState<SortingState>([])

  const [statusParam, setStatusParam] = useUrlArrayState('status')
  const [typeSel, setTypeSel] = useUrlArrayState('type')
  const [clientSel, setClientSel] = useUrlArrayState('client')
  const [pcSel, setPcSel] = useUrlArrayState('pc')
  const [dateFilter, setDateFilter] = useUrlState('date', '')
  const [pageStr, setPageStr] = useUrlState('page', '1')
  const page = Math.max(1, parseInt(pageStr, 10) || 1)

  // status is stored in the URL as backend keys (e.g. "scheduled"), but the
  // MultiSelect works with the human-readable labels.
  const statusSel = statusParam.map((k) => STATUS_LABEL[k as JobStatus]).filter(Boolean)
  function setStatusSel(labels: string[]) {
    setStatusParam(labels.map((l) => STATUS_KEY_MAP[l]).filter(Boolean))
    setPageStr('1')
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
      r = r.filter((j) =>
        typeSel.some((t) =>
          t === 'Manutenção' ? j.jobType === 'maintenance' : j.jobType === 'implementation'
        )
      )
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
    setStatusParam([])
    setTypeSel([])
    setClientSel([])
    setPcSel([])
    setDateFilter('')
    setPageStr('1')
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
        header: 'Máquina',
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
        cell: ({ row }) =>
          row.original.jobType === 'maintenance' ? 'Manutenção' : 'Implementação',
      },
      {
        id: 'city',
        accessorFn: (j) => `${j.city}/${j.state}`,
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
      <div className="flex justify-end">
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
        <MultiSelect
          options={TYPE_OPTS}
          value={typeSel}
          onChange={(v) => {
            setTypeSel(v)
            setPageStr('1')
          }}
          placeholder="Tipo"
        />
        <MultiSelect
          options={clientOpts}
          value={clientSel}
          onChange={(v) => {
            setClientSel(v)
            setPageStr('1')
          }}
          placeholder="Empresa"
        />
        <MultiSelect
          options={pcOpts}
          value={pcSel}
          onChange={(v) => {
            setPcSel(v)
            setPageStr('1')
          }}
          placeholder="PC"
        />
        <input
          type="date"
          className="input input-bordered input-sm"
          aria-label="Filtrar por data agendada"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value)
            setPageStr('1')
          }}
        />
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-base-content/40">
          {localFiltered.length} registro(s)
        </span>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
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
                  <span className="font-medium">Descrição:</span> {j.description}
                </p>
                <p>
                  <span className="font-medium">Local:</span> {j.city}/{j.state}
                </p>
                <p>
                  <span className="font-medium">Horário:</span> {j.startTime} – {j.endTime}
                </p>
                <p>
                  <span className="font-medium">Hospedagem:</span> {j.accommodation ? 'Sim' : 'Não'}{' '}
                  · <span className="font-medium">Carro:</span> {j.car ? 'Sim' : 'Não'}
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
      )}

      {detailJobId && <JobDetailModal jobId={detailJobId} onClose={() => setDetailJobId(null)} />}

      {cancelId && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
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
