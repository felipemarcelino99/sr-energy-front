import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { usePagination } from '@/utils/usePagination'
import { toast } from '@/viewmodels/toast.viewmodel'
import { Pagination } from '@/views/components/Pagination'
import { MultiSelect } from '@/views/components/MultiSelect'
import { useSortableTable, sortIcon } from '@/hooks/useSortableTable'

const ROLE_OPTS = ['Gestor', 'Funcionário']

export function EmployeeListPage() {
  const { loading, error, load, filtered, setSearch, search, remove } = useEmployeeStore()
  const navigate = useNavigate()
  const [roleSel, setRoleSel] = useState<string[]>([])

  useEffect(() => { load() }, [load])

  async function handleRemove(id: string, name: string) {
    if (!window.confirm(`Excluir funcionário "${name}"?`)) return
    await remove(id)
    toast.success('Funcionário excluído com sucesso.')
  }

  const allEmployees = filtered()

  const localFiltered = useMemo(() => {
    if (roleSel.length === 0) return allEmployees
    return allEmployees.filter((e) =>
      roleSel.some((r) => (r === 'Gestor' ? e.role === 'manager' : e.role === 'employee'))
    )
  }, [allEmployees, roleSel])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sorted, sort, toggle } = useSortableTable(localFiltered as any[])
  const { paginated, page, totalPages, goTo } = usePagination(sorted, 10)

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

  const hasFilters = search !== '' || roleSel.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-sm text-base-content/40 mt-0.5">{sorted.length} registros</p>
        </div>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => navigate('/employees/new')}>
          <Plus size={14} /> Adicionar Funcionário
        </button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <MultiSelect options={ROLE_OPTS} value={roleSel} onChange={setRoleSel} placeholder="Função" />
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setRoleSel([]) }}>
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-base-content/40">{sorted.length} registro(s)</span>
      </div>

      {/* Table */}
      <div className="card bg-base-200 border border-base-300 overflow-hidden">
        {sorted.length === 0 ? (
          <p className="text-sm text-base-content/30 py-10 text-center">Nenhum funcionário encontrado</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => toggle('name')}>Nome{sortIcon(sort.key === 'name' ? sort.dir : null)}</th>
                    <th className="sortable" onClick={() => toggle('email')}>E-mail{sortIcon(sort.key === 'email' ? sort.dir : null)}</th>
                    <th className="sortable" onClick={() => toggle('role')}>Função{sortIcon(sort.key === 'role' ? sort.dir : null)}</th>
                    <th className="sortable text-right" onClick={() => toggle('salary')}>Salário{sortIcon(sort.key === 'salary' ? sort.dir : null)}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {paginated.map((emp: any) => (
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
                          <button className="btn btn-ghost btn-xs" onClick={() => navigate(`/employees/${emp.id}/edit`)} title="Editar">
                            <Pencil size={13} />
                          </button>
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => handleRemove(emp.id, emp.name)} title="Excluir">
                            <Trash2 size={13} />
                          </button>
                        </div>
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
    </div>
  )
}
