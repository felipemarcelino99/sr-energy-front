import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Download, Check, X } from 'lucide-react'
import { PageSkeleton } from '@/views/components/ui/Skeleton'
import { ActionsMenu } from '@/views/components/ui/ActionsMenu'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/viewmodels/auth.viewmodel'
import { fetchProposals, rejectProposal } from '@/services/proposal.service'
import type { Proposal, ProposalStatus } from '@/models/proposal.model'
import { formatDate } from '@/utils/date'
import { toast } from '@/viewmodels/toast.viewmodel'
import { AcceptProposalModal } from '@/views/components/AcceptProposalModal'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState } from '@/hooks/useUrlState'
import { DataTable } from '@/views/components/ui/DataTable'

const STATUS_LABEL: Record<ProposalStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceita',
  rejected: 'Recusada',
}

const STATUS_BADGE_CLASS: Record<ProposalStatus, string> = {
  pending: 'badge-warning',
  accepted: 'badge-success',
  rejected: 'badge-error',
}

function extractApiError(err: unknown, fallback: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status = (err as any)?.response?.status
  if (status === 404) return 'Esta proposta não foi encontrada.'
  if (status === 409) return 'Esta proposta já não está pendente.'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (err as any)?.response?.data?.error ?? fallback
}

export function ProposalListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const [acceptTarget, setAcceptTarget] = useState<{ id: string; number: string } | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [pageStr, setPageStr] = useUrlState('page', '1')
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const [sorting, setSorting] = useState<SortingState>([])

  usePageHeader('Propostas Comerciais')

  const proposalsQuery = useQuery({
    queryKey: ['proposals'],
    queryFn: fetchProposals,
  })
  const proposals = proposalsQuery.data ?? []

  const rejectMutation = useMutation({
    mutationFn: rejectProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      setRejectId(null)
      toast.success('Proposta recusada.')
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'Erro ao recusar a proposta.'))
      setRejectId(null)
    },
  })

  const columns = useMemo<ColumnDef<Proposal>[]>(
    () => [
      { accessorKey: 'number', header: 'Número' },
      {
        id: 'clientId',
        accessorFn: (p) => p.clients?.razaoSocial ?? '—',
        header: 'Cliente',
      },
      {
        id: 'description',
        header: 'Descrição',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="max-w-xs truncate block">{row.original.description}</span>
        ),
      },
      {
        accessorKey: 'contractType',
        header: 'Tipo',
        cell: ({ row }) => (
          <span
            className={`badge badge-sm ${row.original.contractType === 'rental' ? 'badge-accent' : 'badge-primary'}`}
          >
            {row.original.contractType === 'rental' ? 'Locação' : 'Serviço'}
          </span>
        ),
      },
      {
        accessorKey: 'contractValue',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="num text-base-content/70">
            {row.original.contractValue != null
              ? row.original.contractValue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className={`badge badge-sm ${STATUS_BADGE_CLASS[row.original.status]}`}>
            {STATUS_LABEL[row.original.status]}
          </span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Data',
        cell: ({ row }) => formatDate(row.original.startDate),
      },
      {
        id: 'fileUrl',
        header: 'Arquivo',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.fileUrl ? (
            <a
              href={row.original.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-xs"
              title="Baixar arquivo"
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
          const p = row.original
          const canDecide = canManage && p.status === 'pending'
          return (
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <ActionsMenu
                actions={[
                  ...(canDecide
                    ? [
                        {
                          label: 'Aceitar',
                          icon: Check,
                          onClick: () => setAcceptTarget({ id: p.id, number: p.number }),
                        },
                        {
                          label: 'Recusar',
                          icon: X,
                          onClick: () => setRejectId(p.id),
                          variant: 'danger' as const,
                        },
                      ]
                    : []),
                  {
                    label: 'Editar',
                    icon: Pencil,
                    onClick: () => navigate(`/proposals/${p.id}/edit`),
                  },
                ]}
              />
            </div>
          )
        },
      },
    ],
    [canManage, navigate]
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Link to="/proposals/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova Proposta
        </Link>
      </div>

      {proposalsQuery.isLoading && <PageSkeleton />}
      {proposalsQuery.isError && (
        <div className="alert alert-error">Erro ao carregar propostas.</div>
      )}

      {!proposalsQuery.isLoading && !proposalsQuery.isError && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          <DataTable<Proposal>
            data={proposals}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            page={page}
            onPageChange={(p) => setPageStr(String(p))}
            getRowId={(p) => p.id}
            onRowClick={(p) => navigate(`/proposals/${p.id}/edit`)}
            emptyMessage="Nenhuma proposta encontrada."
          />
        </div>
      )}

      {acceptTarget && (
        <AcceptProposalModal
          proposalId={acceptTarget.id}
          proposalNumber={acceptTarget.number}
          onClose={() => setAcceptTarget(null)}
          onAccepted={() => setAcceptTarget(null)}
        />
      )}

      {rejectId && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Recusar proposta</h3>
            <p className="py-4">
              Tem certeza que deseja recusar esta proposta? Nenhum contrato ou OS será criado.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setRejectId(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-error"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate(rejectId)}
              >
                {rejectMutation.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  'Recusar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
