import { Clock, Zap, CheckCircle2, XCircle } from 'lucide-react'
import type { JobStatusSummary } from '@/models/dashboard.model'

const STATUS_CONFIG: Record<string, {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  textColor: string
  borderColor: string
  bgColor: string
}> = {
  scheduled: {
    label: 'Agendado',
    icon: Clock,
    textColor: 'text-warning',
    borderColor: 'border-l-warning',
    bgColor: 'bg-warning/5',
  },
  in_progress: {
    label: 'Em andamento',
    icon: Zap,
    textColor: 'text-info',
    borderColor: 'border-l-info',
    bgColor: 'bg-info/5',
  },
  completed: {
    label: 'Concluído',
    icon: CheckCircle2,
    textColor: 'text-success',
    borderColor: 'border-l-success',
    bgColor: 'bg-success/5',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    textColor: 'text-error',
    borderColor: 'border-l-error',
    bgColor: 'bg-error/5',
  },
}

interface JobStatusCardProps {
  summary: JobStatusSummary[]
  onStatusClick?: (status: string) => void
}

export function JobStatusCard({ summary, onStatusClick }: JobStatusCardProps) {
  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body gap-4">
        <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Trabalhos por Status
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {summary.map(({ status, count }) => {
            const cfg = STATUS_CONFIG[status]
            if (!cfg) return null
            const Icon = cfg.icon
            return (
              <div
                key={status}
                data-testid={`status-card-${status}`}
                role={onStatusClick ? 'button' : undefined}
                tabIndex={onStatusClick ? 0 : undefined}
                onClick={() => onStatusClick?.(status)}
                onKeyDown={(e) => e.key === 'Enter' && onStatusClick?.(status)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-2 ${cfg.borderColor} ${cfg.bgColor}${onStatusClick ? ' cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              >
                <Icon size={14} className={`${cfg.textColor} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-base-content/40 truncate">{cfg.label}</p>
                  <p
                    className={`text-xl font-bold num leading-tight ${cfg.textColor}`}
                    data-testid={`count-${status}`}
                  >
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
