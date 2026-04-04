import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import { useToolStore } from '@/viewmodels/tool.viewmodel'

export function ToolListPage() {
  const { tools, loading, error, fetchTools, removeTool, updateTool } = useToolStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  function handleFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === 'active' || val === 'inactive') {
      fetchTools(val)
    } else {
      fetchTools(undefined)
    }
  }

  async function handleToggleStatus(tool: { id: string; status: 'active' | 'inactive' }) {
    if (tool.status === 'active') {
      await removeTool(tool.id)
    } else {
      await updateTool(tool.id, { status: 'active' })
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ferramentas</h1>
        <Link to="/tools/new" className="btn btn-primary btn-sm">
          <Plus size={14} />
          Nova Ferramenta
        </Link>
      </div>

      <div className="mb-4">
        <select className="select select-bordered" onChange={handleFilterChange} defaultValue="">
          <option value="">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {!loading && tools.length === 0 && (
        <div className="text-center text-base-content/50 py-16">
          Nenhuma ferramenta cadastrada.
        </div>
      )}

      {!loading && tools.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Quantidade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
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
                      Editar
                    </Link>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleToggleStatus(tool)}
                    >
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
  )
}
