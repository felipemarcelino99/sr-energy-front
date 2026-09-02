import type { ReactNode, HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva('card bg-base-200 border border-base-300', {
  variants: {
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
    },
  },
  defaultVariants: { padding: 'md' },
})

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: ReactNode
}

// eslint-disable-next-line react-refresh/only-export-components -- compound component: sub-parts stay internal, only `Card` is exported below
function CardRoot({ className, padding, children, ...props }: CardProps) {
  return (
    <div className={`${cardVariants({ padding })} ${className ?? ''}`.trim()} {...props}>
      {children}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- compound component: sub-parts stay internal, only `Card` is exported below
function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between gap-2 mb-3 ${className ?? ''}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- compound component: sub-parts stay internal, only `Card` is exported below
function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- compound component: sub-parts stay internal, only `Card` is exported below
function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-end gap-2 mt-4 ${className ?? ''}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
})
