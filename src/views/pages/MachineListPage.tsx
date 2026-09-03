import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import { toast } from '@/viewmodels/toast.viewmodel'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState } from '@/hooks/useUrlState'
import type { Machine } from '@/models/machine.model'

export function MachineListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useMachineStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pageStr, setPageStr] = useUrlState('page', '1')
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const navigate = useNavigate()

  usePageHeader('Máquinas')

  useEffect(() => {
    load()
  }, [load])

  const machines = filtered()

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Máquina excluída com sucesso.')
  }

  const columns = useMemo<ColumnDef<Machine>[]>(
    () => [
      { accessorKey: 'name', header: 'Nome' },
      { accessorKey: 'brand', header: 'Marca' },
      { accessorKey: 'model', header: 'Modelo' },
      {
        id: 'serialNumber',
        header: 'Nº Série',
        enableSorting: false,
        cell: ({ row }) => row.original.serialNumber,
      },
      { accessorKey: 'year', header: 'Ano' },
      {
        id: 'manualUrl',
        header: 'Manual',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.manualUrl ? (
            <a
              href={row.original.manualUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-xs"
              title="Baixar manual"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={13} />
            </a>
          ) : (
            <span className="text-base-content/30 text-xs">—</span>
          ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => {
          const m = row.original
          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Link to={`/machines/${m.id}/edit`} className="btn btn-ghost btn-xs" title="Editar">
                <Pencil size={13} />
              </Link>
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={() => setDeleteId(m.id)}
                title="Excluir"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
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
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>
            Limpar
          </button>
        )}
        <span className="ml-auto text-xs text-base-content/40">{machines.length} registro(s)</span>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          <DataTable<Machine>
            data={machines}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            page={page}
            onPageChange={(p) => setPageStr(String(p))}
            getRowId={(m) => m.id}
            onRowClick={(m) => navigate(`/machines/${m.id}/edit`)}
            emptyMessage="Nenhuma máquina encontrada."
          />
        </div>
      )}

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">
              Tem certeza que deseja excluir esta máquina? Esta ação não pode ser desfeita.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
