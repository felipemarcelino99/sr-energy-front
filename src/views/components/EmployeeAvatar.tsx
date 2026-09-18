// Sub-plano 05 (épico ajustes-cliente-2026-09): foto do funcionário com
// fallback para iniciais sobre a cor de identificação. Usado no próprio
// cadastro (EmployeeForm) e na listagem (EmployeeListPage). O sub-plano 06
// (calendário) reaproveita este componente para os eventos/legenda.

interface EmployeeAvatarProps {
  name: string
  photoUrl?: string | null
  color?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<EmployeeAvatarProps['size']>, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-20 h-20 text-xl',
}

const SIZE_PX: Record<NonNullable<EmployeeAvatarProps['size']>, number> = {
  sm: 24,
  md: 40,
  lg: 80,
}

const FALLBACK_COLOR = '#6b7280'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function EmployeeAvatar({ name, photoUrl, color, size = 'md' }: EmployeeAvatarProps) {
  const sizeClass = SIZE_CLASSES[size]
  const px = SIZE_PX[size]

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        width={px}
        height={px}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    )
  }

  return (
    <span
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: color ?? FALLBACK_COLOR }}
      role="img"
      aria-label={name || 'Avatar do funcionário'}
    >
      {getInitials(name)}
    </span>
  )
}
