import { Clock, Zap, CheckCircle2, XCircle } from 'lucide-react'
import type { JobStatusSummary } from '@/models/dashboard.model'

const STATUS_CONFIG: Record<
  string,
  {
    label: string
    icon: React.ComponentType<{ size?: number; color?: string }>
    color: string
  }
> = {
  scheduled: { label: 'Agendado', icon: Clock, color: '#FFB400' },
  pending: { label: 'Pendente', icon: Clock, color: '#FFB400' },
  in_progress: { label: 'Em andamento', icon: Zap, color: '#47A1C8' },
  completed: { label: 'Concluído', icon: CheckCircle2, color: '#16A34A' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: '#E53E3E' },
}

interface JobStatusCardProps {
  summary: JobStatusSummary[]
  onStatusClick?: (status: string) => void
  compact?: boolean
}

export function JobStatusCard({ summary, onStatusClick, compact }: JobStatusCardProps) {
  if (compact) {
    const total = summary.reduce((sum, { count }) => sum + count, 0)
    return (
      <div
        style={{
          background: 'var(--color-base-200)',
          borderRadius: 8,
          border: '1px solid var(--color-base-300)',
          boxShadow: '0 1px 3px rgba(0,0,0,.08)',
          padding: '14px 16px',
        }}
      >
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 'var(--space-2)',
          }}
        >
          OS por Status
        </p>
        <div
          style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}
        >
          <p
            className="num"
            data-testid="status-total"
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 700,
              color: 'var(--color-base-content)',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {total}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {summary.map(({ status, count }) => {
              const cfg = STATUS_CONFIG[status]
              if (!cfg) return null
              return (
                <span
                  key={status}
                  data-testid={`status-chip-${status}`}
                  role={onStatusClick ? 'button' : undefined}
                  tabIndex={onStatusClick ? 0 : undefined}
                  className={onStatusClick ? 'cursor-pointer' : undefined}
                  onClick={() => onStatusClick?.(status)}
                  onKeyDown={(e) => e.key === 'Enter' && onStatusClick?.(status)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    color: cfg.color,
                    background: cfg.color + '1A',
                    borderRadius: 999,
                    padding: '4px var(--space-3)',
                  }}
                >
                  {cfg.label}
                  <span className="num">{count}</span>
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--color-base-200)',
        borderRadius: 8,
        border: '1px solid var(--color-base-300)',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)',
        padding: '18px 20px',
      }}
    >
      <p
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          marginBottom: 'var(--space-4)',
        }}
      >
        OS por Status
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
              className={onStatusClick ? 'cursor-pointer' : undefined}
              onClick={() => onStatusClick?.(status)}
              onKeyDown={(e) => e.key === 'Enter' && onStatusClick?.(status)}
              style={{
                flex: '1 1 120px',
                maxWidth: '15.25rem',
                background: 'var(--color-base-200)',
                borderRadius: 8,
                border: '1px solid var(--color-base-300)',
                padding: '14px 16px',
                transition: 'box-shadow 150ms',
              }}
              onMouseEnter={(e) => {
                if (onStatusClick)
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,.10)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-base-content)',
                    opacity: 0.7,
                    lineHeight: 1.3,
                  }}
                >
                  {cfg.label}
                </p>
                <div
                  style={{
                    background: cfg.color + '1A',
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} color={cfg.color} />
                </div>
              </div>
              <p
                className="num"
                data-testid={`count-${status}`}
                style={{ fontSize: 28, fontWeight: 700, color: cfg.color, lineHeight: 1 }}
              >
                {count}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
