import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, Download, XCircle } from 'lucide-react'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { Pagination } from '@/views/components/Pagination'
import { ContractStatusBadge } from '@/views/components/ContractStatusBadge'
import { getContractStatus } from '@/models/contract.model'
import type { ContractStatus } from '@/models/contract.model'
import { formatDate } from '@/utils/date'

export function ContractListPage() {
  const { load, filtered, remove, terminate, loading, error, search, setSearch, statusFilter, setStatusFilter, recurringFilter, setRecurringFilter, sortField, sortOrder, setSort } = useContractStore()
  const contracts = filtered()
  const { paginated, page, totalPages, goTo } = usePagination(contracts, 10)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    load()
    const statusParam = searchParams.get('status') as ContractStatus | null
    if (statusParam) setStatusFilter(statusParam)
  }, [load, searchParams, setStatusFilter])

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <Link to="/contracts/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Adicionar Contrato
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por cliente ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered select-sm"
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter((e.target.value as ContractStatus) || undefined)}
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="expiring">Vencendo</option>
          <option value="expired">Expirado</option>
        </select>
        <select
          className="select select-bordered select-sm"
          value={recurringFilter === undefined ? '' : String(recurringFilter)}
          onChange={(e) => setRecurringFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
        >
          <option value="">Todos</option>
          <option value="true">Recorrentes</option>
          <option value="false">Não recorrentes</option>
        </select>
        <select
          className="select select-bordered select-sm"
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [f, o] = e.target.value.split('-') as [typeof sortField, typeof sortOrder]
            setSort(f, o)
          }}
        >
          <option value="endDate-asc">Vencimento ↑</option>
          <option value="endDate-desc">Vencimento ↓</option>
          <option value="clientName-asc">Cliente A→Z</option>
          <option value="clientName-desc">Cliente Z→A</option>
          <option value="startDate-asc">Início ↑</option>
          <option value="startDate-desc">Início ↓</option>
        </select>
      </div>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {!loading && contracts.length === 0 && (
        <div className="text-center text-base-content/50 py-16">Nenhum contrato cadastrado.</div>
      )}

      {!loading && contracts.length > 0 && (
        <>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>CNPJ</th>
                <th>Início</th>
                <th>Término</th>
                <th>Status</th>
                <th>Recorrente</th>
                <th>Arquivo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((c) => (
                <tr
                  key={c.id}
                  className="hover cursor-pointer"
                  onClick={() => navigate(`/contracts/${c.id}/edit`)}
                >
                  <td>{c.clientName}</td>
                  <td>{c.clientCnpj}</td>
                  <td>{formatDate(c.startDate)}</td>
                  <td>{formatDate(c.endDate)}</td>
                  <td>
                    <ContractStatusBadge status={getContractStatus(c.endDate)} />
                  </td>
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
                    <Link to={`/contracts/${c.id}/edit`} className="btn btn-ghost btn-xs" title="Editar">
                      <Pencil size={13} />
                    </Link>
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
        <Pagination page={page} totalPages={totalPages} onGoTo={goTo} />
        </>
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
              <button className="btn btn-warning" onClick={async () => { await terminate(terminateId); setTerminateId(null) }}>Encerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
