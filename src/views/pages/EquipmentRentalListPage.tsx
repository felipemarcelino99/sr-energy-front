import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useEquipmentRentalStore } from '@/viewmodels/equipment-rental.viewmodel'
import { formatDate } from '@/utils/date'
import { toast } from '@/viewmodels/toast.viewmodel'

export function EquipmentRentalListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useEquipmentRentalStore()
  const rentals = filtered()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Locação excluída com sucesso.')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Locação de Equipamentos</h1>
        <Link to="/equipment-rentals/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova Locação
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por cliente ou mala…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {!loading && rentals.length === 0 && (
        <div className="text-center text-base-content/50 py-16">Nenhuma locação cadastrada.</div>
      )}

      {!loading && rentals.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Mala</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((r) => (
                <tr
                  key={r.id}
                  className="hover cursor-pointer"
                  onClick={() => navigate(`/equipment-rentals/${r.id}/edit`)}
                >
                  <td>{r.contractClientName ?? r.contractId}</td>
                  <td>{r.bagName ?? r.bagId}</td>
                  <td>{formatDate(r.startDate)}</td>
                  <td>{formatDate(r.endDate)}</td>
                  <td className="num">
                    {r.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td onClick={(e) => e.stopPropagation()} className="flex gap-2">
                    <Link to={`/equipment-rentals/${r.id}/edit`} className="btn btn-ghost btn-xs" title="Editar">
                      <Pencil size={13} />
                    </Link>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => setDeleteId(r.id)}
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
