import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { acceptProposal } from '@/services/proposal.service'
import { updateJob } from '@/services/job.service'
import type { JobFormData } from '@/models/job.model'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { toast } from '@/viewmodels/toast.viewmodel'

interface AcceptProposalModalProps {
  proposalId: string
  proposalNumber?: string
  /** Pré-preenche o detalhamento do escopo da OS com a descrição da PC. */
  initialScopeDetail?: string
  /** Pré-preenche a data do serviço da OS com a data inicial da PC. */
  initialScheduledDate?: string
  onClose: () => void
  onAccepted: (jobId: string) => void
}

function extractApiError(err: unknown, fallback: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status = (err as any)?.response?.status
  if (status === 404) return 'Esta proposta não foi encontrada.'
  if (status === 409) return 'Esta proposta já não está pendente.'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (err as any)?.response?.data?.error ?? fallback
}

export function AcceptProposalModal({
  proposalId,
  proposalNumber,
  initialScopeDetail,
  initialScheduledDate,
  onClose,
  onAccepted,
}: AcceptProposalModalProps) {
  const queryClient = useQueryClient()
  const { employees, load: loadEmployees } = useEmployeeStore()
  const { bags, load: loadBags } = useBagStore()

  const [employeeIds, setEmployeeIds] = useState<string[]>([])
  const [bagId, setBagId] = useState('')
  const [serviceAddress, setServiceAddress] = useState('')
  const [clientContactName, setClientContactName] = useState('')
  const [clientContactPhone, setClientContactPhone] = useState('')
  // Pré-preenchidos com os dados já cadastrados na PC — o manager só precisa
  // ajustar/completar, não redigitar do zero (bug 2 do passo 1).
  const [scopeDetail, setScopeDetail] = useState(initialScopeDetail ?? '')
  const [scheduledDate, setScheduledDate] = useState(initialScheduledDate ?? '')
  const [scheduledEndDate, setScheduledEndDate] = useState('')

  useEffect(() => {
    loadEmployees()
    loadBags()
  }, [loadEmployees, loadBags])

  function toggleEmployee(id: string) {
    setEmployeeIds((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]))
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await acceptProposal(proposalId)
      const jobId = result.job?.id

      const payload: Partial<JobFormData> = {}
      if (employeeIds.length > 0) payload.employeeIds = employeeIds
      if (bagId) payload.bagId = bagId
      if (serviceAddress) payload.serviceAddress = serviceAddress
      if (clientContactName) payload.clientContactName = clientContactName
      if (clientContactPhone) payload.clientContactPhone = clientContactPhone
      if (scopeDetail) payload.scopeDetail = scopeDetail
      if (scheduledDate) payload.scheduledDate = scheduledDate
      if (scheduledEndDate) payload.scheduledEndDate = scheduledEndDate

      const filled = Object.keys(payload).length > 0
      if (jobId && filled) {
        await updateJob(jobId, payload)
      }

      return {
        jobId: jobId ?? '',
        jobNumber: result.job?.number,
        filled,
      }
    },
    onSuccess: ({ jobId, jobNumber, filled }) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'jobs'] })

      const osLabel = jobNumber ? `OS ${jobNumber}` : 'OS'
      toast.success(
        filled
          ? `Proposta aceita. ${osLabel} criada e preenchida com sucesso.`
          : `Proposta aceita. ${osLabel} criada — complete os dados quando puder.`
      )
      onAccepted(jobId)
      onClose()
    },
    onError: (err) => {
      toast.error(extractApiError(err, 'Erro ao aceitar a proposta.'))
    },
  })

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-200 max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg">
          Aceitar proposta{proposalNumber ? ` ${proposalNumber}` : ''}
        </h3>
        <p className="py-2 text-sm text-base-content/70">
          Uma OS será criada e vinculada a esta PC. Os dados abaixo já vêm preenchidos com o que foi
          cadastrado na proposta — ajuste o que for necessário ou complete depois.
        </p>

        <div className="flex flex-col gap-4 mt-2">
          <fieldset className="fieldset gap-1">
            <legend className="label text-xs font-medium text-base-content/60">
              Colaboradores
            </legend>
            <div className="flex flex-wrap gap-2 border border-base-300 rounded-lg p-3">
              {employees.length === 0 && (
                <span className="text-xs text-base-content/40">Nenhum colaborador cadastrado.</span>
              )}
              {employees.map((e) => {
                const checked = employeeIds.includes(e.id)
                return (
                  <label
                    key={e.id}
                    className={`badge cursor-pointer gap-2 ${checked ? 'badge-primary' : 'badge-outline'}`}
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={checked}
                      onChange={() => toggleEmployee(e.id)}
                    />
                    {e.name}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset className="fieldset gap-1">
              <label
                className="label text-xs font-medium text-base-content/60"
                htmlFor="accept-bagId"
              >
                Mala <span className="text-base-content/30">(opcional)</span>
              </label>
              <select
                id="accept-bagId"
                className="select select-bordered w-full"
                value={bagId}
                onChange={(e) => setBagId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {bags.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.model}
                  </option>
                ))}
              </select>
            </fieldset>

            <fieldset className="fieldset gap-1">
              <label
                className="label text-xs font-medium text-base-content/60"
                htmlFor="accept-scheduledDate"
              >
                Data do serviço <span className="text-base-content/30">(opcional)</span>
              </label>
              <input
                id="accept-scheduledDate"
                type="date"
                className="input input-bordered w-full"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset gap-1">
              <label
                className="label text-xs font-medium text-base-content/60"
                htmlFor="accept-scheduledEndDate"
              >
                Data final <span className="text-base-content/30">(opcional)</span>
              </label>
              <input
                id="accept-scheduledEndDate"
                type="date"
                className="input input-bordered w-full"
                value={scheduledEndDate}
                onChange={(e) => setScheduledEndDate(e.target.value)}
              />
              <p className="text-xs text-base-content/40 mt-1">
                Deixe em branco se o serviço for de um dia só.
              </p>
            </fieldset>

            <fieldset className="fieldset gap-1 md:col-span-2">
              <label
                className="label text-xs font-medium text-base-content/60"
                htmlFor="accept-serviceAddress"
              >
                Endereço de atendimento <span className="text-base-content/30">(opcional)</span>
              </label>
              <input
                id="accept-serviceAddress"
                type="text"
                className="input input-bordered w-full"
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset gap-1">
              <label
                className="label text-xs font-medium text-base-content/60"
                htmlFor="accept-clientContactName"
              >
                Contato do cliente <span className="text-base-content/30">(opcional)</span>
              </label>
              <input
                id="accept-clientContactName"
                type="text"
                className="input input-bordered w-full"
                value={clientContactName}
                onChange={(e) => setClientContactName(e.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset gap-1">
              <label
                className="label text-xs font-medium text-base-content/60"
                htmlFor="accept-clientContactPhone"
              >
                Telefone do contato <span className="text-base-content/30">(opcional)</span>
              </label>
              <input
                id="accept-clientContactPhone"
                type="text"
                className="input input-bordered w-full"
                value={clientContactPhone}
                onChange={(e) => setClientContactPhone(e.target.value)}
              />
            </fieldset>

            <fieldset className="fieldset gap-1 md:col-span-2">
              <label
                className="label text-xs font-medium text-base-content/60"
                htmlFor="accept-scopeDetail"
              >
                Detalhamento do escopo <span className="text-base-content/30">(opcional)</span>
              </label>
              <textarea
                id="accept-scopeDetail"
                className="textarea textarea-bordered w-full"
                rows={2}
                value={scopeDetail}
                onChange={(e) => setScopeDetail(e.target.value)}
              />
            </fieldset>
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </button>
          <button
            className="btn btn-success"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              'Aceitar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
