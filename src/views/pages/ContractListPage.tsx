import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { Pagination } from '@/views/components/Pagination'
import { ContractStatusBadge } from '@/views/components/ContractStatusBadge'
import { getContractStatus } from '@/models/contract.model'
import { formatDate } from '@/utils/date'

export function ContractListPage() {
  const { load, contracts, remove, loading, error } = useContractStore()
  const { paginated, page, totalPages, goTo } = usePagination(contracts, 10)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <Link to="/contracts/new" className="btn btn-primary btn-sm" title="Novo contrato">
          <Plus size={14} />
        </Link>
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
    </div>
  )
}
