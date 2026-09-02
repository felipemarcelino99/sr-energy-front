import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useToolStore } from '@/viewmodels/tool.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import { MultiSelect } from '@/views/components/MultiSelect'
import { usePageHeader } from '@/hooks/usePageHeader'
import type { Tool } from '@/models/tool.model'

const STATUS_OPTIONS = ['Ativo', 'Inativo']

export function ToolListPage() {
  const { tools, loading, error, fetchTools, removeTool, updateTool } = useToolStore()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [nameSearch, setNameSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  usePageHeader('Ferramentas')

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const localFiltered = useMemo(() => {
    let result = tools
    if (statusFilter.length > 0) {
      result = result.filter((t) =>
        statusFilter.some((s) => (s === 'Ativo' ? t.status === 'active' : t.status === 'inactive'))
      )
    }
    if (nameSearch) {
      const q = nameSearch.toLowerCase()
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }, [tools, statusFilter, nameSearch])

  async function handleToggleStatus(tool: { id: string; status: 'active' | 'inactive' }) {
    if (tool.status === 'active') {
      await removeTool(tool.id)
    } else {
      await updateTool(tool.id, { status: 'active' })
    }
  }

  const hasFilters = statusFilter.length > 0 || nameSearch !== ''

  const columns: ColumnDef<Tool>[] = [
    { accessorKey: 'name', header: 'Nome' },
    {
      id: 'description',
      header: 'Descrição',
      enableSorting: false,
      cell: ({ row }) => row.original.description ?? '—',
    },
    { accessorKey: 'quantity', header: 'Quantidade' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.status === 'active' ? (
          <span className="badge badge-success">Ativo</span>
        ) : (
          <span className="badge badge-ghost">Inativo</span>
        ),
    },
    {
      id: 'actions',
      header: 'Ações',
      enableSorting: false,
      cell: ({ row }) => {
        const tool = row.original
        return (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Link to={`/tools/${tool.id}/edit`} className="btn btn-ghost btn-xs" title="Editar">
              <Pencil size={13} />
            </Link>
            <button
              className="btn btn-sm btn-ghost btn-xs"
              onClick={() => handleToggleStatus(tool)}
            >
              {tool.status === 'active' ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
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
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setNameSearch('')
              setStatusFilter([])
            }}
          >
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-base-content/40">
          {localFiltered.length} registro(s)
        </span>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          <DataTable<Tool>
            data={localFiltered}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            getRowId={(t) => t.id}
            onRowClick={(t) => navigate(`/tools/${t.id}/edit`)}
            emptyMessage="Nenhuma ferramenta encontrada."
          />
        </div>
      )}
    </div>
  )
}
