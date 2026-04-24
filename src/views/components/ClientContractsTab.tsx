import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { fetchContractsByClient } from '@/services/contract.service'
import { ContractStatusBadge } from '@/views/components/ContractStatusBadge'
import { getContractStatus } from '@/models/contract.model'
import type { Contract } from '@/models/contract.model'
import { formatDate } from '@/utils/date'

interface Props {
  clientId: string
}

export function ClientContractsTab({ clientId }: Props) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    fetchContractsByClient(clientId)
      .then(setContracts)
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="loading loading-spinner loading-md" />
      </div>
    )
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center text-base-content/50 py-10">
        Nenhum contrato encontrado para este cliente.
      </div>
    )
  }

  const active = contracts.filter((c) => ['active', 'expiring'].includes(getContractStatus(c.endDate)))
  const inactive = contracts.filter((c) => getContractStatus(c.endDate) === 'expired')

  function renderTable(items: Contract[]) {
    return (
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Início</th>
              <th>Término</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="hover cursor-pointer" onClick={() => navigate(`/contracts/${c.id}/edit`)}>
                <td>{c.description}</td>
                <td>
                  <span className={`badge badge-sm ${c.contractType === 'rental' ? 'badge-accent' : 'badge-primary'}`}>
                    {c.contractType === 'rental' ? 'Locação' : 'Serviço'}
                  </span>
                </td>
                <td>
                  {c.contractValue != null
                    ? c.contractValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'}
                </td>
                <td>{formatDate(c.startDate)}</td>
                <td>{formatDate(c.endDate)}</td>
                <td><ContractStatusBadge status={getContractStatus(c.endDate)} /></td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => navigate(`/contracts/${c.id}/edit`)}
                    title="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {active.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">
            Ativos / Vencendo ({active.length})
          </h3>
          <div className="card bg-base-200 border border-base-300 overflow-hidden">
            {renderTable(active)}
          </div>
        </div>
      )}
      {inactive.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-base-content/60 uppercase tracking-wider mb-2">
            Expirados ({inactive.length})
          </h3>
          <div className="card bg-base-200 border border-base-300 overflow-hidden">
            {renderTable(inactive)}
          </div>
        </div>
      )}
    </div>
  )
}
