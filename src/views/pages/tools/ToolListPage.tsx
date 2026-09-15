import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Power, PowerOff } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useToolStore } from '@/viewmodels/tool.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import { MultiSelect } from '@/views/components/MultiSelect'
import { usePageHeader } from '@/hooks/usePageHeader'
import type { Tool } from '@/models/tool.model'
import { PageSkeleton } from '@/views/components/ui/Skeleton'
import { ActionsMenu } from '@/views/components/ui/ActionsMenu'

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
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <ActionsMenu
              actions={[
                {
                  label: 'Editar',
                  icon: Pencil,
                  onClick: () => navigate(`/tools/${tool.id}/edit`),
                },
                {
                  label: tool.status === 'active' ? 'Desativar' : 'Ativar',
                  icon: tool.status === 'active' ? PowerOff : Power,
                  onClick: () => handleToggleStatus(tool),
                },
              ]}
            />
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {loading && <PageSkeleton />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <>
          {/* Filter bar */}
          <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex gap-3 items-center">
            <input
              type="text"
              className="input input-bordered input-sm flex-1 min-w-0"
              placeholder="Buscar por nome ou descrição..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
            />
            <MultiSelect
              className="flex-1"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Status"
            />
            {hasFilters && (
              <button
                className="btn btn-ghost btn-sm shrink-0"
                onClick={() => {
                  setNameSearch('')
                  setStatusFilter([])
                }}
              >
                Limpar filtros
              </button>
            )}
            <span className="text-xs text-base-content/40 shrink-0 whitespace-nowrap">
              {localFiltered.length} registro(s)
            </span>
            <Link to="/tools/new" className="btn btn-primary btn-sm gap-1 shrink-0">
              <Plus size={14} /> Nova Ferramenta
            </Link>
          </div>

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
        </>
      )}
    </div>
  )
}
