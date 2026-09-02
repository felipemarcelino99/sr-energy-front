import type { ContractStatus } from '@/models/contract.model'
import { Badge } from '@/views/components/ui/Badge'

interface Props {
  status: ContractStatus
}

const config: Record<ContractStatus, { label: string; tone: 'success' | 'warning' | 'error' }> = {
  active: { label: 'Ativo', tone: 'success' },
  expiring: { label: 'A vencer', tone: 'warning' },
  expired: { label: 'Vencido', tone: 'error' },
}

export function ContractStatusBadge({ status }: Props) {
  const { label, tone } = config[status]
  return <Badge tone={tone}>{label}</Badge>
}
