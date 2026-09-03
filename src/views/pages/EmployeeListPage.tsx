import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import { toast } from '@/viewmodels/toast.viewmodel'
import { MultiSelect } from '@/views/components/MultiSelect'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState, useUrlArrayState } from '@/hooks/useUrlState'
import type { Employee } from '@/models/employee.model'
import { PageSkeleton } from '@/views/components/ui/Skeleton'
import { ActionsMenu } from '@/views/components/ui/ActionsMenu'

const ROLE_OPTS = ['Gestor', 'Funcionário']

export function EmployeeListPage() {
  const { loading, error, load, filtered, setSearch, search, remove } = useEmployeeStore()
  const navigate = useNavigate()
  const [roleSel] = useUrlArrayState('role')
  const [pageStr] = useUrlState('page', '1')
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const [sorting, setSorting] = useState<SortingState>([])
  // Raw URLSearchParams setter: `role` and `page` must be updated atomically
  // in a single call, otherwise two sequential setSearchParams calls in the
  // same event handler (via useUrlArrayState + useUrlState) each read a
  // stale snapshot and the second call silently discards the first's change.
  const [, setRawParams] = useSearchParams()

  function applyRoleFilter(v: string[]) {
    setRawParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (v.length === 0) params.delete('role')
        else params.set('role', v.join(','))
        params.delete('page')
        return params
      },
      { replace: true }
    )
  }

  function clearAllFilters() {
    setSearch('')
    setRawParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.delete('role')
        params.delete('page')
        return params
      },
      { replace: true }
    )
  }

  function goToPage(p: number) {
    setRawParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (p <= 1) params.delete('page')
        else params.set('page', String(p))
        return params
      },
      { replace: true }
    )
  }

  usePageHeader('Funcionários')

  useEffect(() => {
    load()
  }, [load])

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

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
      cell: ({ row }) => <span className="text-base-content/60">{row.original.email}</span>,
    },
    {
      accessorKey: 'role',
      header: 'Função',
      cell: ({ row }) => (
        <span
          className={`badge badge-sm ${row.original.role === 'manager' ? 'badge-primary' : 'badge-ghost'}`}
        >
          {row.original.role === 'manager' ? 'Gestor' : 'Funcionário'}
        </span>
      ),
    },
    {
      accessorKey: 'salary',
      header: 'Salário',
      cell: ({ row }) => (
        <span className="text-right num text-base-content/60 block">
          {row.original.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const emp = row.original
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <ActionsMenu
              actions={[
                {
                  label: 'Editar',
                  icon: Pencil,
                  onClick: () => navigate(`/employees/${emp.id}/edit`),
                },
                {
                  label: 'Excluir',
                  icon: Trash2,
                  onClick: () => handleRemove(emp.id, emp.name),
                  variant: 'danger',
                },
              ]}
            />
          </div>
        )
      },
    },
  ]

  if (loading) {
    return <PageSkeleton />
  }

  if (error) {
    return (
      <div role="alert" className="alert alert-error">
        {error}
      </div>
    )
  }

  const hasFilters = search !== '' || roleSel.length > 0

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm flex-1 min-w-0"
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <MultiSelect
          className="flex-1"
          options={ROLE_OPTS}
          value={roleSel}
          onChange={applyRoleFilter}
          placeholder="Função"
        />
        {hasFilters && (
          <button className="btn btn-ghost btn-sm shrink-0" onClick={clearAllFilters}>
            Limpar filtros
          </button>
        )}
        <span className="text-xs text-base-content/40 shrink-0 whitespace-nowrap">
          {localFiltered.length} registro(s)
        </span>
        <button
          className="btn btn-primary btn-sm gap-1 shrink-0"
          onClick={() => navigate('/employees/new')}
        >
          <Plus size={14} /> Adicionar Funcionário
        </button>
      </div>

      {/* Table */}
      <div className="card bg-base-200 border border-base-300 overflow-hidden">
        <DataTable<Employee>
          data={localFiltered}
          columns={columns}
          sorting={sorting}
          onSortingChange={setSorting}
          page={page}
          onPageChange={goToPage}
          getRowId={(e) => e.id}
          onRowClick={(e) => navigate(`/employees/${e.id}/edit`)}
          emptyMessage="Nenhum funcionário encontrado"
        />
      </div>
    </div>
  )
}
