import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { isCertificateExpiringSoon, isCertificateExpired } from '@/models/bag.model'
import type { Bag } from '@/models/bag.model'
import { toast } from '@/viewmodels/toast.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import { MultiSelect } from '@/views/components/MultiSelect'
import { usePageHeader } from '@/hooks/usePageHeader'
import { PageSkeleton } from '@/views/components/ui/Skeleton'
import { ActionsMenu } from '@/views/components/ui/ActionsMenu'

const CERT_STATUS_OPTIONS = ['Válido', 'Vencendo', 'Vencido', 'Sem certificado']

function getBagCertStatus(bag: { calibrationCertificates: Array<{ expiryDate: string }> }): string {
  if (bag.calibrationCertificates.length === 0) return 'Sem certificado'
  if (bag.calibrationCertificates.some((c) => isCertificateExpired(c.expiryDate))) return 'Vencido'
  if (bag.calibrationCertificates.some((c) => isCertificateExpiringSoon(c.expiryDate)))
    return 'Vencendo'
  return 'Válido'
}

export function BagListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useBagStore()
  const bags = filtered()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [certFilter, setCertFilter] = useState<string[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()

  usePageHeader('Malas')

  useEffect(() => {
    load()
  }, [load])

  const localFiltered = useMemo(() => {
    if (certFilter.length === 0) return bags
    return bags.filter((b) => certFilter.includes(getBagCertStatus(b)))
  }, [bags, certFilter])

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Mala excluída com sucesso.')
  }

  const hasFilters = search !== '' || certFilter.length > 0

  const columns = useMemo<ColumnDef<Bag>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nome',
        cell: ({ row }) => {
          const b = row.original
          const certStatus = getBagCertStatus(b)
          const isExpired = certStatus === 'Vencido'
          const isExpiring = certStatus === 'Vencendo'
          return (
            <span className="font-medium">
              {(isExpiring || isExpired) && (
                <AlertTriangle
                  size={14}
                  className={`inline mr-1 ${isExpired ? 'text-error' : 'text-warning'}`}
                />
              )}
              {b.name}
            </span>
          )
        },
      },
      { accessorKey: 'model', header: 'Modelo' },
      { accessorKey: 'quantity', header: 'Qtd.' },
      {
        id: 'certificates',
        header: 'Certificados',
        enableSorting: false,
        cell: ({ row }) => {
          const b = row.original
          if (b.calibrationCertificates.length === 0) {
            return <span className="text-base-content/30 text-xs">—</span>
          }
          const certStatus = getBagCertStatus(b)
          const isExpired = certStatus === 'Vencido'
          const isExpiring = certStatus === 'Vencendo'
          return (
            <span
              className={`badge badge-sm ${isExpired ? 'badge-error' : isExpiring ? 'badge-warning' : 'badge-success'}`}
            >
              {certStatus}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => {
          const b = row.original
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <ActionsMenu
                actions={[
                  { label: 'Editar', icon: Pencil, onClick: () => navigate(`/bags/${b.id}/edit`) },
                  {
                    label: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteId(b.id),
                    variant: 'danger',
                  },
                ]}
              />
            </div>
          )
        },
      },
    ],
    [navigate]
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="Buscar por nome ou modelo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <MultiSelect
            options={CERT_STATUS_OPTIONS}
            value={certFilter}
            onChange={setCertFilter}
            placeholder="Status de certificado"
          />
          {hasFilters && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('')
                setCertFilter([])
              }}
            >
              Limpar filtros
            </button>
          )}
          <span className="text-xs text-base-content/40">{localFiltered.length} registro(s)</span>
        </div>
        <Link to="/bags/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova Mala
        </Link>
      </div>

      {loading && <PageSkeleton />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          <DataTable<Bag>
            data={localFiltered}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            getRowId={(b) => b.id}
            onRowClick={(b) => navigate(`/bags/${b.id}/edit`)}
            emptyMessage="Nenhuma mala encontrada."
          />
        </div>
      )}

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir esta mala?</p>
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
