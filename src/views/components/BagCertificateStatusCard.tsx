import { AlertTriangle, XCircle } from 'lucide-react'
import type { BagCertificateStatusSummary } from '@/models/dashboard.model'

const STATUS_CONFIG: Record<BagCertificateStatusSummary['status'], {
  label: string
  icon: React.ComponentType<{ size?: number; color?: string }>
  color: string
}> = {
  expiring: {
    label: 'Próximos ao vencimento',
    icon: AlertTriangle,
    color: '#FFB400',
  },
  expired: {
    label: 'Expirados',
    icon: XCircle,
    color: '#E53E3E',
  },
}

interface BagCertificateStatusCardProps {
  summary: BagCertificateStatusSummary[]
  onStatusClick?: (status: string) => void
}

export function BagCertificateStatusCard({ summary, onStatusClick }: BagCertificateStatusCardProps) {
  if (summary.length === 0) return null

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
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-base-content)', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>
        Certificados de Malas
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        {summary.map(({ status, count }) => {
          const cfg = STATUS_CONFIG[status]
          if (!cfg) return null
          const Icon = cfg.icon
          return (
            <div
              key={status}
              role={onStatusClick ? 'button' : undefined}
              tabIndex={onStatusClick ? 0 : undefined}
              onClick={() => onStatusClick?.(status)}
              onKeyDown={(e) => e.key === 'Enter' && onStatusClick?.(status)}
              style={{
                flex: 1,
                maxWidth: '15.25rem',
                background: 'var(--color-base-200)',
                borderRadius: 8,
                border: '1px solid var(--color-base-300)',
                padding: '14px 16px',
                cursor: onStatusClick ? 'pointer' : undefined,
                transition: 'box-shadow 150ms',
              }}
              onMouseEnter={(e) => { if (onStatusClick) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,.10)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-base-content)', opacity: 0.7, lineHeight: 1.3 }}>{cfg.label}</p>
                <div style={{ background: cfg.color + '1A', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={cfg.color} />
                </div>
              </div>
              <p className="num" style={{ fontSize: 28, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{count}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
