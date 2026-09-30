import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current",
        // Semantic fills. Tinted bg + dark text (light) / gray-light (dark)
        // is the only token pairing that clears 4.5:1 in BOTH modes: the
        // hue-matched text these variants pair with their own tint measures
        // 4.46:1 in light and ~2.2:1 in dark (both fail), so the hue is
        // carried by the tinted fill + border instead of the text. Mirrors
        // the warning variant; measured values in docs/UI_AUDIT.md.
        success:
          "bg-growth/15 text-slate-dark border-growth/30 *:data-[slot=alert-description]:text-slate-dark/90 [&>svg]:text-current dark:bg-growth/15 dark:text-gray-light dark:*:data-[slot=alert-description]:text-gray-light/90",
        warning:
          "bg-gold/20 text-slate-dark border-gold/40 *:data-[slot=alert-description]:text-slate-dark/90 [&>svg]:text-current dark:bg-gold/15 dark:text-gold dark:*:data-[slot=alert-description]:text-gold/90",
        info:
          "bg-dead-sea/10 text-slate-dark border-dead-sea/30 *:data-[slot=alert-description]:text-slate-dark/90 [&>svg]:text-current dark:bg-dead-sea/15 dark:text-gray-light dark:*:data-[slot=alert-description]:text-gray-light/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
