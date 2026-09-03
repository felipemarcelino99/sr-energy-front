import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import { DataTable } from '@/views/components/ui/DataTable'
import { MultiSelect } from '@/views/components/MultiSelect'
import { toast } from '@/viewmodels/toast.viewmodel'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState, useUrlArrayState } from '@/hooks/useUrlState'
import type { Client } from '@/models/client.model'
import { PageSkeleton } from '@/views/components/ui/Skeleton'
import { ActionsMenu } from '@/views/components/ui/ActionsMenu'

const STATUS_OPTS = ['Ativo', 'Inativo']
const SEGMENTO_OPTS = ['Industrial', 'Comercial', 'Residencial', 'Poder Público', 'Outro']

export function ClientListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useClientStore()

  const [statusSel, setStatusSel] = useUrlArrayState('status')
  const [segmentoSel, setSegmentoSel] = useUrlArrayState('segmento')
  const [pageStr, setPageStr] = useUrlState('page', '1')
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()

  usePageHeader('Clientes')

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allClients = filtered()

  const localFiltered = useMemo(() => {
    let r = allClients
    if (statusSel.length > 0) {
      const mapped = statusSel.map((s) => (s === 'Ativo' ? 'active' : 'inactive'))
      r = r.filter((c) => mapped.includes(c.status))
    }
    if (segmentoSel.length > 0) {
      r = r.filter((c) => segmentoSel.includes(c.segmento))
    }
    return r
  }, [allClients, statusSel, segmentoSel])

  const hasFilters = search !== '' || statusSel.length > 0 || segmentoSel.length > 0

  function clearFilters() {
    setSearch('')
    setStatusSel([])
    setSegmentoSel([])
    setPageStr('1')
  }

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Cliente excluído com sucesso.')
  }

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: 'razaoSocial',
        header: 'Razão Social',
        cell: ({ row }) => <span className="font-medium">{row.original.razaoSocial}</span>,
      },
      { id: 'cnpj', header: 'CNPJ', enableSorting: false, cell: ({ row }) => row.original.cnpj },
      { accessorKey: 'segmento', header: 'Segmento' },
      {
        id: 'email',
        header: 'E-mail',
        enableSorting: false,
        cell: ({ row }) => row.original.email,
      },
      {
        id: 'telefone',
        header: 'Telefone',
        enableSorting: false,
        cell: ({ row }) => row.original.telefone || '—',
      },
      {
        id: 'celular',
        header: 'Celular',
        enableSorting: false,
        cell: ({ row }) => row.original.celular || '—',
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className={`badge badge-sm ${row.original.status === 'active' ? 'badge-success' : 'badge-ghost'}`}
          >
            {row.original.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <ActionsMenu
                actions={[
                  {
                    label: 'Editar',
                    icon: Pencil,
                    onClick: () => navigate(`/clients/${c.id}/edit`),
                  },
                  {
                    label: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteId(c.id),
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
      {loading && <PageSkeleton />}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <>
          <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex gap-3 items-center">
            <input
              type="text"
              className="input input-bordered input-sm flex-1 min-w-0"
              placeholder="Buscar por razão social ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <MultiSelect
              className="flex-1"
              options={STATUS_OPTS}
              value={statusSel}
              onChange={(v) => {
                setStatusSel(v)
                setPageStr('1')
              }}
              placeholder="Status"
            />
            <MultiSelect
              className="flex-1"
              options={SEGMENTO_OPTS}
              value={segmentoSel}
              onChange={(v) => {
                setSegmentoSel(v)
                setPageStr('1')
              }}
              placeholder="Segmento"
            />
            {hasFilters && (
              <button className="btn btn-ghost btn-sm shrink-0" onClick={clearFilters}>
                Limpar filtros
              </button>
            )}
            <span className="text-xs text-base-content/40 shrink-0 whitespace-nowrap">
              {localFiltered.length} registro(s)
            </span>
            <Link to="/clients/new" className="btn btn-primary btn-sm gap-1 shrink-0">
              <Plus size={14} /> Adicionar Cliente
            </Link>
          </div>

          <div className="card bg-base-200 border border-base-300 overflow-hidden">
            <DataTable<Client>
              data={localFiltered}
              columns={columns}
              sorting={sorting}
              onSortingChange={setSorting}
              page={page}
              onPageChange={(p) => setPageStr(String(p))}
              getRowId={(c) => c.id}
              onRowClick={(c) => navigate(`/clients/${c.id}/edit`)}
              emptyMessage="Nenhum cliente encontrado."
            />
          </div>
        </>
      )}

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir este cliente?</p>
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
