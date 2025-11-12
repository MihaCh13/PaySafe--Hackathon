import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-soft hover:shadow-soft-lg hover:opacity-90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:shadow-danger hover:opacity-90",
        outline:
          "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/30",
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft-xs hover:shadow-soft hover:bg-secondary-hover",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground shadow-soft hover:shadow-success hover:opacity-90",
        warning: "bg-warning text-warning-foreground shadow-soft hover:shadow-warning hover:opacity-90",
      },
      size: {
        default: "h-11 sm:h-12 px-4 sm:px-6 py-2 sm:py-2.5",
        sm: "h-10 sm:h-11 rounded-lg px-3 sm:px-4 text-xs",
        lg: "h-12 sm:h-14 rounded-xl px-6 sm:px-8 text-sm sm:text-base",
        icon: "h-11 w-11 sm:h-12 sm:w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
