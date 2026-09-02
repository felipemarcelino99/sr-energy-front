import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import { toast } from '@/viewmodels/toast.viewmodel'
import { MultiSelect } from '@/views/components/MultiSelect'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState, useUrlArrayState } from '@/hooks/useUrlState'
import type { Employee } from '@/models/employee.model'

const ROLE_OPTS = ['Gestor', 'Funcionário']

export function EmployeeListPage() {
  const { loading, error, load, filtered, setSearch, search, remove } = useEmployeeStore()
  const navigate = useNavigate()
  const [roleSel, setRoleSel] = useUrlArrayState('role')
  const [pageStr, setPageStr] = useUrlState('page', '1')
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const [sorting, setSorting] = useState<SortingState>([])

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
        )
      },
    },
  ]

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
    return (
      <div role="alert" className="alert alert-error">
        {error}
      </div>
    )
  }

  const hasFilters = search !== '' || roleSel.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-base-content/40">{localFiltered.length} registros</p>
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
        <MultiSelect
          options={ROLE_OPTS}
          value={roleSel}
          onChange={(v) => {
            setRoleSel(v)
            setPageStr('1')
          }}
          placeholder="Função"
        />
        {hasFilters && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearch('')
              setRoleSel([])
              setPageStr('1')
            }}
          >
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-base-content/40">
          {localFiltered.length} registro(s)
        </span>
      </div>

      {/* Table */}
      <div className="card bg-base-200 border border-base-300 overflow-hidden">
        <DataTable<Employee>
          data={localFiltered}
          columns={columns}
          sorting={sorting}
          onSortingChange={setSorting}
          page={page}
          onPageChange={(p) => setPageStr(String(p))}
          getRowId={(e) => e.id}
          onRowClick={(e) => navigate(`/employees/${e.id}/edit`)}
          emptyMessage="Nenhum funcionário encontrado"
        />
      </div>
    </div>
  )
}
