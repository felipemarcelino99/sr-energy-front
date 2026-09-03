import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ProposalForm } from '@/views/components/ProposalForm'
import type { ProposalFormData, ProposalStatus } from '@/models/proposal.model'
import {
  fetchProposal,
  createProposal,
  updateProposal,
  rejectProposal,
} from '@/services/proposal.service'
import { toast } from '@/viewmodels/toast.viewmodel'
import { useAuthStore } from '@/viewmodels/auth.viewmodel'
import { AcceptProposalModal } from '@/views/components/AcceptProposalModal'
import { usePageHeader } from '@/hooks/usePageHeader'

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

export function ProposalFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const [loading, setLoading] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const proposalQuery = useQuery({
    queryKey: ['proposals', id],
    queryFn: () => fetchProposal(id!),
    enabled: isEditing && Boolean(id),
  })
  const initialData: Partial<ProposalFormData> | undefined = proposalQuery.data
  const fetchLoading = isEditing && proposalQuery.isLoading
  const proposalStatus = proposalQuery.data?.status

  usePageHeader(isEditing ? 'Editar Proposta' : 'Nova Proposta', {
    onBack: () => navigate('/proposals'),
  })

  const rejectMutation = useMutation({
    mutationFn: rejectProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['proposals', id] })
      setShowRejectModal(false)
      toast.success('Proposta recusada.')
      navigate('/proposals')
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'Erro ao recusar a proposta.'))
      setShowRejectModal(false)
    },
  })

  async function handleSubmit(data: ProposalFormData) {
    setLoading(true)
    try {
      if (isEditing && id) {
        await updateProposal(id, data)
      } else {
        await createProposal(data)
      }
      toast.success(isEditing ? 'Proposta atualizada com sucesso.' : 'Proposta criada com sucesso.')
      navigate('/proposals')
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.response?.data?.error ?? 'Erro ao salvar a proposta.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEditing && proposalStatus && (
            <span className={`badge badge-sm ${STATUS_BADGE_CLASS[proposalStatus]}`}>
              {STATUS_LABEL[proposalStatus]}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing && canManage && proposalStatus === 'pending' && (
            <>
              <button
                type="button"
                className="btn btn-error btn-sm gap-1"
                onClick={() => setShowRejectModal(true)}
              >
                <X size={14} /> Recusar
              </button>
              <button
                type="button"
                className="btn btn-success btn-sm gap-1"
                onClick={() => setShowAcceptModal(true)}
              >
                <Check size={14} /> Aceitar
              </button>
            </>
          )}
        </div>
      </div>
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body">
          <div className="flex items-center justify-end gap-2 mb-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => navigate('/proposals')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="proposal-form"
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : isEditing ? (
                'Salvar'
              ) : (
                'Criar'
              )}
            </button>
          </div>
          <ProposalForm
            initialData={initialData}
            onSubmit={handleSubmit}
            loading={loading}
            formId="proposal-form"
            hideButtons
          />
        </div>
      </div>

      {showAcceptModal && id && (
        <AcceptProposalModal
          proposalId={id}
          proposalNumber={proposalQuery.data?.number}
          onClose={() => setShowAcceptModal(false)}
          onAccepted={() => navigate('/proposals')}
        />
      )}

      {showRejectModal && id && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Recusar proposta</h3>
            <p className="py-4">
              Tem certeza que deseja recusar esta proposta? Nenhum contrato ou OS será criado.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-error"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate(id)}
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
