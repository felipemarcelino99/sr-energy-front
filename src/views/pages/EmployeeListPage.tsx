import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'

export function EmployeeListPage() {
  const { loading, error, load, filtered, setSearch, search, remove } = useEmployeeStore()
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [load])

  async function handleRemove(id: string, name: string) {
    if (!window.confirm(`Excluir funcionário "${name}"?`)) return
    await remove(id)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-10 w-48 bg-base-300 rounded-lg" />
        <div className="h-10 bg-base-300 rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-base-300 rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div role="alert" className="alert alert-error">{error}</div>
  }

  const employees = filtered()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-sm text-base-content/40 mt-0.5">{employees.length} registros</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/employees/new')}
          title="Novo funcionário"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search */}
      <label className="input input-bordered flex items-center gap-2 w-full max-w-sm">
        <Search size={14} className="text-base-content/40" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="grow"
        />
      </label>

      {/* Table */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-0">
          {employees.length === 0 ? (
            <p className="text-sm text-base-content/30 py-10 text-center">
              Nenhum funcionário encontrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr className="border-base-300 text-xs text-base-content/40 uppercase tracking-wider">
                    <th className="font-semibold">Nome</th>
                    <th className="font-semibold">E-mail</th>
                    <th className="font-semibold">Função</th>
                    <th className="font-semibold text-right">Salário</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-base-300 hover:bg-base-300/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/employees/${emp.id}/edit`)}
                    >
                      <td className="font-medium">{emp.name}</td>
                      <td className="text-base-content/60">{emp.email}</td>
                      <td>
                        <span className={`badge badge-sm ${emp.role === 'manager' ? 'badge-primary' : 'badge-ghost'}`}>
                          {emp.role === 'manager' ? 'Gestor' : 'Funcionário'}
                        </span>
                      </td>
                      <td className="text-right num text-base-content/60">
                        {emp.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => navigate(`/employees/${emp.id}/edit`)}
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => handleRemove(emp.id, emp.name)}
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
