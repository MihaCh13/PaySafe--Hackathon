import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary-button hover:bg-primary/25",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary-hover/30",
        destructive:
          "border-transparent bg-danger-light text-danger-button hover:bg-danger-light/80",
        outline: "text-foreground border-border",
        success:
          "border-transparent bg-success-light text-success-button hover:bg-success-light/80",
        warning:
          "border-transparent bg-warning-light text-warning-text hover:bg-warning-light/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
