import { AlertTriangle, XCircle } from 'lucide-react'
import type { ContractStatusSummary } from '@/models/dashboard.model'

const STATUS_CONFIG: Record<ContractStatusSummary['status'], {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  textColor: string
  borderColor: string
  bgColor: string
}> = {
  expiring: {
    label: 'Próximos ao vencimento',
    icon: AlertTriangle,
    textColor: 'text-warning',
    borderColor: 'border-l-warning',
    bgColor: 'bg-warning/5',
  },
  expired: {
    label: 'Expirados',
    icon: XCircle,
    textColor: 'text-error',
    borderColor: 'border-l-error',
    bgColor: 'bg-error/5',
  },
}

interface ContractStatusCardProps {
  summary: ContractStatusSummary[]
  onStatusClick?: (status: string) => void
}

export function ContractStatusCard({ summary, onStatusClick }: ContractStatusCardProps) {
  if (summary.length === 0) return null

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body gap-4">
        <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Contratos por Status
        </h2>

        <div className="flex gap-2">
          {summary.map(({ status, count }) => {
            const cfg = STATUS_CONFIG[status]
            const Icon = cfg.icon
            return (
              <div
                key={status}
                role={onStatusClick ? 'button' : undefined}
                tabIndex={onStatusClick ? 0 : undefined}
                onClick={() => onStatusClick?.(status)}
                onKeyDown={(e) => e.key === 'Enter' && onStatusClick?.(status)}
                className={`flex flex-1 items-center gap-3 px-3 py-2.5 rounded-lg border-l-2 ${cfg.borderColor} ${cfg.bgColor}${onStatusClick ? ' cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              >
                <Icon size={14} className={`${cfg.textColor} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-base-content/40 truncate">{cfg.label}</p>
                  <p className={`text-xl font-bold num leading-tight ${cfg.textColor}`}>
                    {count}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
