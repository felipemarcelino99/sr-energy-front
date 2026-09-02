import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useEquipmentRentalStore } from '@/viewmodels/equipment-rental.viewmodel'
import { formatDate } from '@/utils/date'
import { toast } from '@/viewmodels/toast.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState } from '@/hooks/useUrlState'
import type { EquipmentRental } from '@/models/equipment-rental.model'

export function EquipmentRentalListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useEquipmentRentalStore()
  const rentals = filtered()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pageStr, setPageStr] = useUrlState('page', '1')
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const navigate = useNavigate()

  usePageHeader('Locação de Equipamentos')

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Locação excluída com sucesso.')
  }

  const columns = useMemo<ColumnDef<EquipmentRental>[]>(
    () => [
      {
        id: 'contractClientName',
        accessorFn: (r) => r.contractClientName ?? r.contractId,
        header: 'Cliente',
      },
      {
        id: 'bagName',
        accessorFn: (r) => r.bagName ?? r.bagId,
        header: 'Mala',
      },
      {
        accessorKey: 'startDate',
        header: 'Início',
        cell: ({ row }) => formatDate(row.original.startDate),
      },
      {
        accessorKey: 'endDate',
        header: 'Fim',
        cell: ({ row }) => formatDate(row.original.endDate),
      },
      {
        accessorKey: 'value',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="num">
            {row.original.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Link
                to={`/equipment-rentals/${r.id}/edit`}
                className="btn btn-ghost btn-xs"
                title="Editar"
              >
                <Pencil size={13} />
              </Link>
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={() => setDeleteId(r.id)}
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
        <Link to="/equipment-rentals/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova Locação
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por cliente ou mala…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>
            Limpar
          </button>
        )}
        <span className="ml-auto text-xs text-base-content/40">{rentals.length} registro(s)</span>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          <DataTable<EquipmentRental>
            data={rentals}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            page={page}
            onPageChange={(p) => setPageStr(String(p))}
            getRowId={(r) => r.id}
            onRowClick={(r) => navigate(`/equipment-rentals/${r.id}/edit`)}
            emptyMessage="Nenhuma locação encontrada."
          />
        </div>
      )}

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir esta locação?</p>
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
