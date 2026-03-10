import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        // LockUp brand-inspired variants with direct Tailwind styles
        blue: 'border-transparent bg-[linear-gradient(135deg,#89CFF0_0%,#5AB4E0_100%)] text-[#0F1A14] shadow-[0_1px_3px_rgba(137,207,240,0.3)]',
        green: 'border-transparent bg-[linear-gradient(135deg,#228B22_0%,#1A6B1A_100%)] text-white shadow-[0_1px_3px_rgba(34,139,34,0.3)]',
        brown: 'border-transparent bg-[linear-gradient(135deg,#A67B5B_0%,#8C6648_100%)] text-white shadow-[0_1px_3px_rgba(166,123,91,0.3)]',
        // Severity variants with brand styling
        critical: 'border-transparent bg-[linear-gradient(135deg,#DC2626_0%,#B91C1C_100%)] text-white uppercase tracking-wide',
        high: 'border-transparent bg-[linear-gradient(135deg,#F59E0B_0%,#D97706_100%)] text-[#0F1A14] uppercase tracking-wide',
        medium: 'border-transparent bg-[linear-gradient(135deg,#89CFF0_0%,#5AB4E0_100%)] text-[#0F1A14] uppercase tracking-wide',
        low: 'border-transparent bg-[linear-gradient(135deg,#228B22_0%,#1A6B1A_100%)] text-white uppercase tracking-wide',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
