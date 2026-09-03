import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva('badge', {
  variants: {
    tone: {
      success: 'badge-success',
      warning: 'badge-warning',
      error: 'badge-error',
      info: 'badge-info',
      neutral: 'badge-ghost',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={`${badgeVariants({ tone })} ${className ?? ''}`.trim()} {...props} />
}
