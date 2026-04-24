import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { Pagination } from '@/views/components/Pagination'
import { MultiSelect } from '@/views/components/MultiSelect'
import { useSortableTable, sortIcon } from '@/hooks/useSortableTable'
import { toast } from '@/viewmodels/toast.viewmodel'

const STATUS_OPTS = ['Ativo', 'Inativo']
const SEGMENTO_OPTS = ['Industrial', 'Comercial', 'Residencial', 'Poder Público', 'Outro']

export function ClientListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useClientStore()

  const [statusSel, setStatusSel] = useState<string[]>([])
  const [segmentoSel, setSegmentoSel] = useState<string[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allClients = filtered()

  const localFiltered = useMemo(() => {
    let r = allClients
    if (statusSel.length > 0) {
      const mapped = statusSel.map((s) => (s === 'Ativo' ? 'active' : 'inactive'))
      r = r.filter((c) => mapped.includes(c.status))
    }
    if (segmentoSel.length > 0) {
      r = r.filter((c) => segmentoSel.includes(c.segmento))
    }
    return r
  }, [allClients, statusSel, segmentoSel])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sorted, sort, toggle } = useSortableTable(localFiltered as any[])
  const { paginated, page, totalPages, goTo } = usePagination(sorted, 10)

  const hasFilters = search !== '' || statusSel.length > 0 || segmentoSel.length > 0

  function clearFilters() {
    setSearch('')
    setStatusSel([])
    setSegmentoSel([])
  }

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Cliente excluído com sucesso.')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Clientes</h1>
        <Link to="/clients/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Adicionar Cliente
        </Link>
      </div>

      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por razão social ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <MultiSelect options={STATUS_OPTS} value={statusSel} onChange={setStatusSel} placeholder="Status" />
        <MultiSelect options={SEGMENTO_OPTS} value={segmentoSel} onChange={setSegmentoSel} placeholder="Segmento" />
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
            <div className="text-center text-base-content/50 py-10">Nenhum cliente encontrado.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th className="sortable" onClick={() => toggle('razaoSocial')}>
                        Razão Social{sortIcon(sort.key === 'razaoSocial' ? sort.dir : null)}
                      </th>
                      <th>CNPJ</th>
                      <th className="sortable" onClick={() => toggle('segmento')}>
                        Segmento{sortIcon(sort.key === 'segmento' ? sort.dir : null)}
                      </th>
                      <th>E-mail</th>
                      <th>Telefone</th>
                      <th>Celular</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {paginated.map((c: any) => (
                      <tr
                        key={c.id}
                        className="hover cursor-pointer"
                        onClick={() => navigate(`/clients/${c.id}/edit`)}
                      >
                        <td className="font-medium">{c.razaoSocial}</td>
                        <td>{c.cnpj}</td>
                        <td>{c.segmento}</td>
                        <td>{c.email}</td>
                        <td>{c.telefone || '—'}</td>
                        <td>{c.celular || '—'}</td>
                        <td>
                          <span className={`badge badge-sm ${c.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                            {c.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()} className="flex gap-2">
                          <Link to={`/clients/${c.id}/edit`} className="btn btn-ghost btn-xs" title="Editar">
                            <Pencil size={13} />
                          </Link>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => setDeleteId(c.id)}
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
            <p className="py-4">Tem certeza que deseja excluir este cliente?</p>
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
