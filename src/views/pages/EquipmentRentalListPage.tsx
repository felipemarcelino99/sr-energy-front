import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useEquipmentRentalStore } from '@/viewmodels/equipment-rental.viewmodel'
import { formatDate } from '@/utils/date'
import { toast } from '@/viewmodels/toast.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { Pagination } from '@/views/components/Pagination'
import { useSortableTable, sortIcon } from '@/hooks/useSortableTable'

export function EquipmentRentalListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useEquipmentRentalStore()
  const rentals = filtered()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => { load() }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sorted, sort, toggle } = useSortableTable(rentals as any[])
  const { paginated, page, totalPages, goTo } = usePagination(sorted, 10)

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Locação excluída com sucesso.')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Locação de Equipamentos</h1>
        <Link to="/equipment-rentals/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova Locação
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por cliente ou mala…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>Limpar</button>
        )}
        <span className="ml-auto text-xs text-base-content/40">{sorted.length} registro(s)</span>
      </div>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          {sorted.length === 0 ? (
            <div className="text-center text-base-content/50 py-10">Nenhuma locação encontrada.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => toggle('contractClientName')}>Cliente{sortIcon(sort.key === 'contractClientName' ? sort.dir : null)}</th>
                      <th className="sortable" onClick={() => toggle('bagName')}>Mala{sortIcon(sort.key === 'bagName' ? sort.dir : null)}</th>
                      <th className="sortable" onClick={() => toggle('startDate')}>Início{sortIcon(sort.key === 'startDate' ? sort.dir : null)}</th>
                      <th className="sortable" onClick={() => toggle('endDate')}>Fim{sortIcon(sort.key === 'endDate' ? sort.dir : null)}</th>
                      <th className="sortable" onClick={() => toggle('value')}>Valor{sortIcon(sort.key === 'value' ? sort.dir : null)}</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {paginated.map((r: any) => (
                      <tr key={r.id} className="hover cursor-pointer" onClick={() => navigate(`/equipment-rentals/${r.id}/edit`)}>
                        <td>{r.contractClientName ?? r.contractId}</td>
                        <td>{r.bagName ?? r.bagId}</td>
                        <td>{formatDate(r.startDate)}</td>
                        <td>{formatDate(r.endDate)}</td>
                        <td className="num">{r.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td onClick={(e) => e.stopPropagation()} className="flex gap-2">
                          <Link to={`/equipment-rentals/${r.id}/edit`} className="btn btn-ghost btn-xs" title="Editar"><Pencil size={13} /></Link>
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteId(r.id)} title="Excluir"><Trash2 size={13} /></button>
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
            <p className="py-4">Tem certeza que deseja excluir esta locação?</p>
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
