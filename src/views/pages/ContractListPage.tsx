import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Download, XCircle } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import { ContractStatusBadge } from '@/views/components/ContractStatusBadge'
import { getContractStatus } from '@/models/contract.model'
import type { Contract, ContractStatus, ContractType } from '@/models/contract.model'
import { formatDate } from '@/utils/date'
import { toast } from '@/viewmodels/toast.viewmodel'
import { MultiSelect } from '@/views/components/MultiSelect'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState, useUrlArrayState } from '@/hooks/useUrlState'
import { PageSkeleton } from '@/views/components/ui/Skeleton'
import { ActionsMenu } from '@/views/components/ui/ActionsMenu'

const STATUS_OPTS = ['Ativo', 'Vencendo', 'Expirado']
const STATUS_MAP: Record<string, ContractStatus> = {
  Ativo: 'active',
  Vencendo: 'expiring',
  Expirado: 'expired',
}
const TYPE_OPTS = ['Serviço', 'Locação']
const TYPE_MAP: Record<string, ContractType> = { Serviço: 'service', Locação: 'rental' }
const RECURRING_OPTS = ['Recorrente', 'Não recorrente']

export function ContractListPage() {
  const {
    load,
    filtered,
    remove,
    terminate,
    loading,
    error,
    search,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    setRecurringFilter,
  } = useContractStore()
  const navigate = useNavigate()

  const [statusSel] = useUrlArrayState('status')
  const [typeSel] = useUrlArrayState('type')
  const [recurringSel] = useUrlArrayState('recurring')
  const [pageStr] = useUrlState('page', '1')
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  // Raw URLSearchParams setter: filter params + `page` must be updated
  // atomically in a single call, otherwise two sequential setSearchParams
  // calls in the same event handler (via useUrlArrayState/useUrlState) each
  // read a stale snapshot and the later call silently discards earlier ones.
  const [, setRawParams] = useSearchParams()

  function applyArrayFilter(key: 'status' | 'type' | 'recurring', v: string[]) {
    setRawParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (v.length === 0) params.delete(key)
        else params.set(key, v.join(','))
        params.delete('page')
        return params
      },
      { replace: true }
    )
  }

  function goToPage(p: number) {
    setRawParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (p <= 1) params.delete('page')
        else params.set('page', String(p))
        return params
      },
      { replace: true }
    )
  }

  function clearFilters() {
    setSearch('')
    setRawParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.delete('status')
        params.delete('type')
        params.delete('recurring')
        params.delete('page')
        return params
      },
      { replace: true }
    )
  }

  usePageHeader('Contratos')

  useEffect(() => {
    load()
    // Reset store-level filters so filtered() only applies text search
    setStatusFilter(undefined)
    setTypeFilter(undefined)
    setRecurringFilter(undefined)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allContracts = filtered()

  const localFiltered = useMemo(() => {
    let r = allContracts
    if (statusSel.length > 0) {
      const mapped = statusSel.map((s) => STATUS_MAP[s])
      r = r.filter((c) => mapped.includes(getContractStatus(c.endDate)))
    }
    if (typeSel.length > 0) {
      const mapped = typeSel.map((t) => TYPE_MAP[t])
      r = r.filter((c) => mapped.includes(c.contractType as ContractType))
    }
    if (recurringSel.length > 0) {
      const wantYes = recurringSel.includes('Recorrente')
      const wantNo = recurringSel.includes('Não recorrente')
      r = r.filter((c) => (wantYes && c.recurring) || (wantNo && !c.recurring))
    }
    return r
  }, [allContracts, statusSel, typeSel, recurringSel])

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Contrato excluído com sucesso.')
  }

  const hasFilters =
    search !== '' || statusSel.length > 0 || typeSel.length > 0 || recurringSel.length > 0

  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      {
        id: 'clientId',
        accessorFn: (c) => c.client?.razaoSocial ?? '—',
        header: 'Cliente',
      },
      {
        accessorKey: 'contractType',
        header: 'Tipo',
        cell: ({ row }) => (
          <span
            className={`badge badge-sm ${row.original.contractType === 'rental' ? 'badge-accent' : 'badge-primary'}`}
          >
            {row.original.contractType === 'rental' ? 'Locação' : 'Serviço'}
          </span>
        ),
      },
      {
        accessorKey: 'contractValue',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="num text-base-content/70">
            {row.original.contractValue != null
              ? row.original.contractValue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Início',
        cell: ({ row }) => formatDate(row.original.startDate),
      },
      {
        accessorKey: 'endDate',
        header: 'Término',
        cell: ({ row }) => formatDate(row.original.endDate),
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => <ContractStatusBadge status={getContractStatus(row.original.endDate)} />,
      },
      {
        id: 'recurring',
        header: 'Recorrente',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.recurring ? (
            <span className="badge badge-sm badge-info">Recorrente</span>
          ) : (
            <span className="text-base-content/30 text-xs">—</span>
          ),
      },
      {
        id: 'fileUrl',
        header: 'Arquivo',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.fileUrl ? (
            <a
              href={row.original.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-xs"
              title="Baixar arquivo"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={13} />
            </a>
          ) : (
            <span className="text-base-content/30 text-xs">—</span>
          ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original
          const canTerminate = ['active', 'expiring'].includes(getContractStatus(c.endDate))
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <ActionsMenu
                actions={[
                  {
                    label: 'Editar',
                    icon: Pencil,
                    onClick: () => navigate(`/contracts/${c.id}/edit`),
                  },
                  ...(canTerminate
                    ? [
                        {
                          label: 'Encerrar contrato',
                          icon: XCircle,
                          onClick: () => setTerminateId(c.id),
                        },
                      ]
                    : []),
                  {
                    label: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteId(c.id),
                    variant: 'danger' as const,
                  },
                ]}
              />
            </div>
          )
        },
      },
    ],
    [navigate]
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="Buscar por cliente ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <MultiSelect
            options={STATUS_OPTS}
            value={statusSel}
            onChange={(v) => applyArrayFilter('status', v)}
            placeholder="Status"
          />
          <MultiSelect
            options={TYPE_OPTS}
            value={typeSel}
            onChange={(v) => applyArrayFilter('type', v)}
            placeholder="Tipo"
          />
          <MultiSelect
            options={RECURRING_OPTS}
            value={recurringSel}
            onChange={(v) => applyArrayFilter('recurring', v)}
            placeholder="Recorrência"
          />
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
          <span className="text-xs text-base-content/40">{localFiltered.length} registro(s)</span>
        </div>
        <Link to="/contracts/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Adicionar Contrato
        </Link>
      </div>

      {loading && <PageSkeleton />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          <DataTable<Contract>
            data={localFiltered}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            page={page}
            onPageChange={goToPage}
            getRowId={(c) => c.id}
            onRowClick={(c) => navigate(`/contracts/${c.id}/edit`)}
            emptyMessage="Nenhum contrato encontrado."
          />
        </div>
      )}

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir este contrato?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {terminateId && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Encerrar contrato</h3>
            <p className="py-4">Esta ação definirá a data de término como hoje. Confirmar?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setTerminateId(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-warning"
                onClick={async () => {
                  await terminate(terminateId)
                  setTerminateId(null)
                  toast.success('Contrato encerrado com sucesso.')
                }}
              >
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
