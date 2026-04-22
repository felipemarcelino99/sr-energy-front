import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import { useToolStore } from '@/viewmodels/tool.viewmodel'
import { MultiSelect } from '@/views/components/MultiSelect'
import { useSortableTable, sortIcon } from '@/hooks/useSortableTable'

const STATUS_OPTIONS = ['Ativo', 'Inativo']

export function ToolListPage() {
  const { tools, loading, error, fetchTools, removeTool, updateTool } = useToolStore()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [nameSearch, setNameSearch] = useState('')

  useEffect(() => { fetchTools() }, [fetchTools])

  const localFiltered = useMemo(() => {
    let result = tools
    if (statusFilter.length > 0) {
      result = result.filter((t) =>
        statusFilter.some((s) => (s === 'Ativo' ? t.status === 'active' : t.status === 'inactive'))
      )
    }
    if (nameSearch) {
      const q = nameSearch.toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
    }
    return result
  }, [tools, statusFilter, nameSearch])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sorted, sort, toggle } = useSortableTable(localFiltered as any[])

  async function handleToggleStatus(tool: { id: string; status: 'active' | 'inactive' }) {
    if (tool.status === 'active') {
      await removeTool(tool.id)
    } else {
      await updateTool(tool.id, { status: 'active' })
    }
  }

  const hasFilters = statusFilter.length > 0 || nameSearch !== ''

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Ferramentas</h1>
        <Link to="/tools/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova Ferramenta
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por nome ou descrição..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <MultiSelect
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
        />
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setNameSearch(''); setStatusFilter([]) }}>
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-base-content/40">{sorted.length} registro(s)</span>
      </div>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          {sorted.length === 0 ? (
            <div className="text-center text-base-content/50 py-10">Nenhuma ferramenta encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => toggle('name')}>Nome{sortIcon(sort.key === 'name' ? sort.dir : null)}</th>
                    <th>Descrição</th>
                    <th className="sortable" onClick={() => toggle('quantity')}>Quantidade{sortIcon(sort.key === 'quantity' ? sort.dir : null)}</th>
                    <th className="sortable" onClick={() => toggle('status')}>Status{sortIcon(sort.key === 'status' ? sort.dir : null)}</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {sorted.map((tool: any) => (
                    <tr key={tool.id} className="hover cursor-pointer" onClick={() => navigate(`/tools/${tool.id}/edit`)}>
                      <td>{tool.name}</td>
                      <td>{tool.description ?? '—'}</td>
                      <td>{tool.quantity}</td>
                      <td>
                        {tool.status === 'active' ? (
                          <span className="badge badge-success">Ativo</span>
                        ) : (
                          <span className="badge badge-ghost">Inativo</span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()} className="flex gap-2">
                        <Link to={`/tools/${tool.id}/edit`} className="btn btn-ghost btn-xs" title="Editar">
                          <Pencil size={13} />
                        </Link>
                        <button className="btn btn-sm btn-ghost btn-xs" onClick={() => handleToggleStatus(tool)}>
                          {tool.status === 'active' ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
