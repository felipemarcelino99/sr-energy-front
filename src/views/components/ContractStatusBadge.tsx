import type { ContractStatus } from '@/models/contract.model'

interface Props {
  status: ContractStatus
}

const config: Record<ContractStatus, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'badge badge-success' },
  expiring: { label: 'A vencer', className: 'badge badge-warning' },
  expired: { label: 'Vencido', className: 'badge badge-error' },
}

export function ContractStatusBadge({ status }: Props) {
  const { label, className } = config[status]
  return <span className={className}>{label}</span>
}
