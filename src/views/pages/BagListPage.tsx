import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { isCertificateExpiringSoon, isCertificateExpired } from '@/models/bag.model'
import { toast } from '@/viewmodels/toast.viewmodel'

export function BagListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useBagStore()
  const bags = filtered()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Mala excluída com sucesso.')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Malas</h1>
        <Link to="/bags/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova Mala
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por nome ou modelo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {!loading && bags.length === 0 && (
        <div className="text-center text-base-content/50 py-16">Nenhuma mala cadastrada.</div>
      )}

      {!loading && bags.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Modelo</th>
                <th>Qtd.</th>
                <th>Certificados</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {bags.map((b) => {
                const expiringSoon = b.calibrationCertificates.some((c) => isCertificateExpiringSoon(c.expiryDate))
                const anyExpired = b.calibrationCertificates.some((c) => isCertificateExpired(c.expiryDate))
                return (
                  <tr
                    key={b.id}
                    className="hover cursor-pointer"
                    onClick={() => navigate(`/bags/${b.id}/edit`)}
                  >
                    <td className="font-medium">
                      {(expiringSoon || anyExpired) && (
                        <AlertTriangle size={14} className={`inline mr-1 ${anyExpired ? 'text-error' : 'text-warning'}`} />
                      )}
                      {b.name}
                    </td>
                    <td>{b.model}</td>
                    <td>{b.quantity}</td>
                    <td>
                      {b.calibrationCertificates.length === 0
                        ? <span className="text-base-content/30 text-xs">—</span>
                        : <span className="badge badge-sm">{b.calibrationCertificates.length}</span>
                      }
                    </td>
                    <td onClick={(e) => e.stopPropagation()} className="flex gap-2">
                      <Link to={`/bags/${b.id}/edit`} className="btn btn-ghost btn-xs" title="Editar">
                        <Pencil size={13} />
                      </Link>
                      <button
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => setDeleteId(b.id)}
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir esta mala?</p>
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
