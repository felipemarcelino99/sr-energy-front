import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { ContractForm } from '@/views/components/ContractForm'
import { EntityTimeline } from '@/views/components/EntityTimeline'
import { DataTable } from '@/views/components/ui/DataTable'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { useClientStore } from '@/viewmodels/client.viewmodel'
import type { ContractFormData } from '@/models/contract.model'
import { fetchContract, uploadContractFile } from '@/services/contract.service'
import type { Contract } from '@/models/contract.model'
import { fetchProposals } from '@/services/proposal.service'
import type { Proposal, ProposalStatus } from '@/models/proposal.model'
import { fetchJobs } from '@/services/job.service'
import type { Job } from '@/models/job.model'
import { JOB_STATUS_LABEL, JOB_STATUS_BADGE_CLASS } from '@/models/job.model'
import { toast } from '@/viewmodels/toast.viewmodel'
import { usePageHeader } from '@/hooks/usePageHeader'
import { formatDate } from '@/utils/date'

type Tab = 'dados' | 'propostas' | 'os'

const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceita',
  rejected: 'Recusada',
}

const PROPOSAL_STATUS_BADGE_CLASS: Record<ProposalStatus, string> = {
  pending: 'badge-warning',
  accepted: 'badge-success',
  rejected: 'badge-error',
}

export function ContractFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useContractStore()
  const { load: loadClients } = useClientStore()

  const [initialData, setInitialData] = useState<Partial<ContractFormData> | undefined>(undefined)
  const [contractNumber, setContractNumber] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)
  const [activeTab, setActiveTab] = useState<Tab>('dados')
  const [proposalsSorting, setProposalsSorting] = useState<SortingState>([])
  const [jobsSorting, setJobsSorting] = useState<SortingState>([])

  useEffect(() => {
    loadClients()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEditing || !id) return
    setFetchLoading(true)
    fetchContract(id)
      .then((c: Contract) => {
        setInitialData({
          clientId: c.clientId,
          description: c.description,
          startDate: c.startDate,
          endDate: c.endDate,
          fileUrl: c.fileUrl,
          recurring: c.recurring,
          contractType: c.contractType,
          contractValue: c.contractValue,
        })
        setContractNumber(c.number ?? undefined)
      })
      .finally(() => setFetchLoading(false))
  }, [id, isEditing])

  usePageHeader(isEditing ? 'Editar Contrato' : 'Novo Contrato', {
    onBack: () => navigate('/contracts'),
  })

  const proposalsQuery = useQuery({
    queryKey: ['proposals', 'byContract', id],
    queryFn: () => fetchProposals({ contractId: id! }),
    enabled: isEditing && Boolean(id) && activeTab === 'propostas',
  })

  // job.service.ts não expõe filtro por contractId (fora do escopo deste
  // sub-plano — job.* é do sub-plano 04). Filtramos no cliente por ora.
  const jobsQuery = useQuery({
    queryKey: ['jobs', 'all-for-contract-filter'],
    queryFn: fetchJobs,
    enabled: isEditing && Boolean(id) && activeTab === 'os',
  })
  const contractJobs = useMemo(
    () => (jobsQuery.data ?? []).filter((j) => j.contractId === id),
    [jobsQuery.data, id]
  )

  const proposalColumns = useMemo<ColumnDef<Proposal>[]>(
    () => [
      { accessorKey: 'number', header: 'Número' },
      {
        id: 'description',
        header: 'Descrição',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="max-w-xs truncate block">{row.original.description}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className={`badge badge-sm ${PROPOSAL_STATUS_BADGE_CLASS[row.original.status]}`}>
            {PROPOSAL_STATUS_LABEL[row.original.status]}
          </span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: 'Data',
        cell: ({ row }) => formatDate(row.original.startDate ?? ''),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            to={`/proposals/${row.original.id}/edit`}
            className="link link-primary text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            Ver PC
          </Link>
        ),
      },
    ],
    []
  )

  const jobColumns = useMemo<ColumnDef<Job>[]>(
    () => [
      { accessorKey: 'number', header: 'Número' },
      { accessorKey: 'employeeName', header: 'Colaborador' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span className={`badge badge-sm ${JOB_STATUS_BADGE_CLASS[row.original.status]}`}>
            {JOB_STATUS_LABEL[row.original.status]}
          </span>
        ),
      },
      {
        accessorKey: 'scheduledDate',
        header: 'Data',
        cell: ({ row }) => formatDate(row.original.scheduledDate ?? ''),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            to={`/jobs/${row.original.id}/edit`}
            className="link link-primary text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            Ver OS
          </Link>
        ),
      },
    ],
    []
  )

  async function handleSubmit(data: ContractFormData, file?: File) {
    setLoading(true)
    try {
      if (isEditing && id) {
        await update(id, data)
        if (file) {
          const url = await uploadContractFile(id, file)
          await update(id, { fileUrl: url })
        }
      } else {
        await create(data)
      }
      toast.success(isEditing ? 'Contrato atualizado com sucesso.' : 'Contrato criado com sucesso.')
      navigate('/contracts')
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
      {isEditing && (
        <div role="tablist" className="tabs tabs-bordered">
          <button
            role="tab"
            className={`tab${activeTab === 'dados' ? ' tab-active' : ''}`}
            onClick={() => setActiveTab('dados')}
          >
            Dados
          </button>
          <button
            role="tab"
            className={`tab${activeTab === 'propostas' ? ' tab-active' : ''}`}
            onClick={() => setActiveTab('propostas')}
          >
            Propostas
          </button>
          <button
            role="tab"
            className={`tab${activeTab === 'os' ? ' tab-active' : ''}`}
            onClick={() => setActiveTab('os')}
          >
            OS
          </button>
        </div>
      )}

      {(!isEditing || activeTab === 'dados') && (
        <>
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <div className="flex items-center justify-end gap-2 mb-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('/contracts')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="contract-form"
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
              <ContractForm
                initialData={initialData}
                onSubmit={handleSubmit}
                loading={loading}
                formId="contract-form"
                hideButtons
              />
            </div>
          </div>

          {isEditing && id && (
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body">
                <h2 className="font-bold text-lg mb-3">Linha do tempo</h2>
                <EntityTimeline entityType="contract" entityId={id} entityNumber={contractNumber} />
              </div>
            </div>
          )}
        </>
      )}

      {isEditing && activeTab === 'propostas' && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          {proposalsQuery.isLoading && (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}
          {!proposalsQuery.isLoading && (
            <DataTable<Proposal>
              data={proposalsQuery.data ?? []}
              columns={proposalColumns}
              sorting={proposalsSorting}
              onSortingChange={setProposalsSorting}
              getRowId={(p) => p.id}
              onRowClick={(p) => navigate(`/proposals/${p.id}/edit`)}
              emptyMessage="Nenhuma PC vinculada a este contrato."
            />
          )}
        </div>
      )}

      {isEditing && activeTab === 'os' && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          {jobsQuery.isLoading && (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}
          {!jobsQuery.isLoading && (
            <DataTable<Job>
              data={contractJobs}
              columns={jobColumns}
              sorting={jobsSorting}
              onSortingChange={setJobsSorting}
              getRowId={(j) => j.id}
              onRowClick={(j) => navigate(`/jobs/${j.id}/edit`)}
              emptyMessage="Nenhuma OS vinculada a este contrato."
            />
          )}
        </div>
      )}
    </div>
  )
}
