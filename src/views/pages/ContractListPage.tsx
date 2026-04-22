import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Download, XCircle } from 'lucide-react'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { Pagination } from '@/views/components/Pagination'
import { ContractStatusBadge } from '@/views/components/ContractStatusBadge'
import { getContractStatus } from '@/models/contract.model'
import type { ContractStatus, ContractType } from '@/models/contract.model'
import { formatDate } from '@/utils/date'
import { toast } from '@/viewmodels/toast.viewmodel'
import { MultiSelect } from '@/views/components/MultiSelect'
import { useSortableTable, sortIcon } from '@/hooks/useSortableTable'

const STATUS_OPTS = ['Ativo', 'Vencendo', 'Expirado']
const STATUS_MAP: Record<string, ContractStatus> = { Ativo: 'active', Vencendo: 'expiring', Expirado: 'expired' }
const TYPE_OPTS = ['Serviço', 'Locação']
const TYPE_MAP: Record<string, ContractType> = { Serviço: 'service', Locação: 'rental' }
const RECURRING_OPTS = ['Recorrente', 'Não recorrente']

export function ContractListPage() {
  const {
    load, filtered, remove, terminate, loading, error,
    search, setSearch,
    setStatusFilter, setTypeFilter, setRecurringFilter,
  } = useContractStore()

  const [statusSel, setStatusSel] = useState<string[]>([])
  const [typeSel, setTypeSel] = useState<string[]>([])
  const [recurringSel, setRecurringSel] = useState<string[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    load()
    // Reset store-level filters so filtered() only applies text search
    setStatusFilter(undefined)
    setTypeFilter(undefined)
    setRecurringFilter(undefined)

    const statusParam = searchParams.get('status') as ContractStatus | null
    if (statusParam) {
      const label = Object.entries(STATUS_MAP).find(([, v]) => v === statusParam)?.[0]
      if (label) setStatusSel([label])
    }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sorted, sort, toggle } = useSortableTable(localFiltered as any[])
  const { paginated, page, totalPages, goTo } = usePagination(sorted, 10)

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Contrato excluído com sucesso.')
  }

  const hasFilters = search !== '' || statusSel.length > 0 || typeSel.length > 0 || recurringSel.length > 0

  function clearFilters() {
    setSearch('')
    setStatusSel([])
    setTypeSel([])
    setRecurringSel([])
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Contratos</h1>
        <Link to="/contracts/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Adicionar Contrato
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por cliente ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <MultiSelect options={STATUS_OPTS} value={statusSel} onChange={setStatusSel} placeholder="Status" />
        <MultiSelect options={TYPE_OPTS} value={typeSel} onChange={setTypeSel} placeholder="Tipo" />
        <MultiSelect options={RECURRING_OPTS} value={recurringSel} onChange={setRecurringSel} placeholder="Recorrência" />
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Limpar filtros</button>
        )}
        <span className="ml-auto text-xs text-base-content/40">{sorted.length} registro(s)</span>
      </div>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          {sorted.length === 0 ? (
            <div className="text-center text-base-content/50 py-10">Nenhum contrato encontrado.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => toggle('clientName')}>Cliente{sortIcon(sort.key === 'clientName' ? sort.dir : null)}</th>
                      <th>CNPJ</th>
                      <th className="sortable" onClick={() => toggle('contractType')}>Tipo{sortIcon(sort.key === 'contractType' ? sort.dir : null)}</th>
                      <th className="sortable" onClick={() => toggle('contractValue')}>Valor{sortIcon(sort.key === 'contractValue' ? sort.dir : null)}</th>
                      <th className="sortable" onClick={() => toggle('startDate')}>Início{sortIcon(sort.key === 'startDate' ? sort.dir : null)}</th>
                      <th className="sortable" onClick={() => toggle('endDate')}>Término{sortIcon(sort.key === 'endDate' ? sort.dir : null)}</th>
                      <th>Status</th>
                      <th>Recorrente</th>
                      <th>Arquivo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {paginated.map((c: any) => (
                      <tr key={c.id} className="hover cursor-pointer" onClick={() => navigate(`/contracts/${c.id}/edit`)}>
                        <td>{c.clientName}</td>
                        <td>{c.clientCnpj}</td>
                        <td>
                          <span className={`badge badge-sm ${c.contractType === 'rental' ? 'badge-accent' : 'badge-primary'}`}>
                            {c.contractType === 'rental' ? 'Locação' : 'Serviço'}
                          </span>
                        </td>
                        <td className="num text-base-content/70">
                          {c.contractValue != null
                            ? c.contractValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : '—'}
                        </td>
                        <td>{formatDate(c.startDate)}</td>
                        <td>{formatDate(c.endDate)}</td>
                        <td><ContractStatusBadge status={getContractStatus(c.endDate)} /></td>
                        <td>
                          {c.recurring
                            ? <span className="badge badge-sm badge-info">Recorrente</span>
                            : <span className="text-base-content/30 text-xs">—</span>
                          }
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {c.fileUrl ? (
                            <a href={c.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs" title="Baixar arquivo">
                              <Download size={13} />
                            </a>
                          ) : (
                            <span className="text-base-content/30 text-xs">—</span>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()} className="flex gap-2">
                          <Link to={`/contracts/${c.id}/edit`} className="btn btn-ghost btn-xs" title="Editar"><Pencil size={13} /></Link>
                          {['active', 'expiring'].includes(getContractStatus(c.endDate)) && (
                            <button className="btn btn-ghost btn-xs text-warning" onClick={(e) => { e.stopPropagation(); setTerminateId(c.id) }} title="Encerrar contrato">
                              <XCircle size={13} />
                            </button>
                          )}
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteId(c.id)} title="Excluir">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
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

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir este contrato?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-error" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {terminateId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Encerrar contrato</h3>
            <p className="py-4">Esta ação definirá a data de término como hoje. Confirmar?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setTerminateId(null)}>Cancelar</button>
              <button className="btn btn-warning" onClick={async () => { await terminate(terminateId); setTerminateId(null); toast.success('Contrato encerrado com sucesso.') }}>Encerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
