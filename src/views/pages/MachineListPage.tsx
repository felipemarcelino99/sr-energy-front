import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { toast } from '@/viewmodels/toast.viewmodel'
import { Pagination } from '@/views/components/Pagination'

export function MachineListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useMachineStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Máquina excluída com sucesso.')
  }

  const machines = filtered()
  const { paginated, page, totalPages, goTo } = usePagination(machines, 10)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Máquinas</h1>
        <Link to="/machines/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Adicionar Máquina
        </Link>
      </div>

      <input
        type="text"
        className="input input-bordered w-full max-w-sm mb-4"
        placeholder="Buscar por nome, marca ou modelo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {!loading && machines.length === 0 && (
        <div className="text-center text-base-content/50 py-16">Nenhuma máquina cadastrada.</div>
      )}

      {!loading && machines.length > 0 && (
        <>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Nº Série</th>
                <th>Ano</th>
                <th>Manual</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((m) => (
                <tr
                  key={m.id}
                  className="hover cursor-pointer"
                  onClick={() => navigate(`/machines/${m.id}/edit`)}
                >
                  <td>{m.name}</td>
                  <td>{m.brand}</td>
                  <td>{m.model}</td>
                  <td>{m.serialNumber}</td>
                  <td>{m.year}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {m.manualUrl ? (
                      <a href={m.manualUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs" title="Baixar manual">
                        <Download size={13} />
                      </a>
                    ) : (
                      <span className="text-base-content/30 text-xs">—</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()} className="flex gap-2">
                    <Link to={`/machines/${m.id}/edit`} className="btn btn-ghost btn-xs" title="Editar">
                      <Pencil size={13} />
                    </Link>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteId(m.id)} title="Excluir">
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

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir esta máquina? Esta ação não pode ser desfeita.</p>
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
