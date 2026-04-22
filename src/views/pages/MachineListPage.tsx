import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { toast } from '@/viewmodels/toast.viewmodel'
import { Pagination } from '@/views/components/Pagination'
import { useSortableTable, sortIcon } from '@/hooks/useSortableTable'

export function MachineListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useMachineStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => { load() }, [load])

  const machines = filtered()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sorted, sort, toggle } = useSortableTable(machines as any[])
  const { paginated, page, totalPages, goTo } = usePagination(sorted, 10)

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Máquina excluída com sucesso.')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Máquinas</h1>
        <Link to="/machines/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Adicionar Máquina
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por nome, marca ou modelo..."
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
            <div className="text-center text-base-content/50 py-10">Nenhuma máquina encontrada.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => toggle('name')}>Nome{sortIcon(sort.key === 'name' ? sort.dir : null)}</th>
                      <th className="sortable" onClick={() => toggle('brand')}>Marca{sortIcon(sort.key === 'brand' ? sort.dir : null)}</th>
                      <th className="sortable" onClick={() => toggle('model')}>Modelo{sortIcon(sort.key === 'model' ? sort.dir : null)}</th>
                      <th>Nº Série</th>
                      <th className="sortable" onClick={() => toggle('year')}>Ano{sortIcon(sort.key === 'year' ? sort.dir : null)}</th>
                      <th>Manual</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {paginated.map((m: any) => (
                      <tr key={m.id} className="hover cursor-pointer" onClick={() => navigate(`/machines/${m.id}/edit`)}>
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
                          <Link to={`/machines/${m.id}/edit`} className="btn btn-ghost btn-xs" title="Editar"><Pencil size={13} /></Link>
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteId(m.id)} title="Excluir"><Trash2 size={13} /></button>
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
