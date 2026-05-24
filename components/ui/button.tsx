import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: tap handling, SVG sizing, disabled state, transitions
  "group/button mobile-tap inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold whitespace-nowrap outline-none select-none transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // ── Shadcn compatibility variants ──────────────────
        default:
          "rounded-lg border border-transparent bg-primary text-primary-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-primary/80",
        outline:
          "rounded-lg border border-border bg-background focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "rounded-lg border border-transparent bg-secondary text-secondary-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-secondary/80",
        ghost:
          "rounded-lg border border-transparent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        destructive:
          "rounded-lg border border-transparent bg-destructive/10 text-destructive focus-visible:border-destructive/40 focus-visible:ring-3 focus-visible:ring-destructive/20 hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",

        // ── GymPace brand variants ──────────────────────────
        // Primary — neon green, jet-black text, glow shadow
        "gp-primary":
          "gp-btn gp-btn-primary rounded-xl hover:-translate-y-px active:translate-y-px focus-visible:ring-[3px] focus-visible:ring-[#B6FF00]/22",

        // Ghost — dim transparent surface
        "gp-ghost":
          "gp-btn gp-btn-ghost rounded-xl focus-visible:ring-[3px] focus-visible:ring-white/10",

        // Outline — bordered, no fill
        "gp-outline":
          "gp-btn gp-btn-outline rounded-xl focus-visible:ring-[3px] focus-visible:ring-white/10",

        // Danger — red destructive action
        "gp-danger":
          "gp-btn gp-btn-danger rounded-xl focus-visible:ring-[3px] focus-visible:ring-red-500/20",

        // Accent ghost — neon green tinted surface
        "gp-accent-ghost":
          "gp-btn gp-btn-accent-ghost rounded-xl focus-visible:ring-[3px] focus-visible:ring-[#B6FF00]/20",
      },

      size: {
        default:    "h-8 gap-1.5 px-2.5 rounded-lg text-sm",
        xs:         "h-6 gap-1 rounded-[min(var(--gp-r-sm),10px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm:         "h-7 gap-1 rounded-[min(var(--gp-r-md),12px)] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg:         "h-9 gap-1.5 px-3 text-sm",
        xl:         "h-11 gap-2 px-5 text-sm",
        full:       "h-11 w-full gap-2 px-5 text-sm",
        icon:       "size-8 rounded-lg",
        "icon-xs":  "size-6 rounded-[min(var(--gp-r-sm),10px)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":  "size-7 rounded-[min(var(--gp-r-md),12px)]",
        "icon-lg":  "size-9 rounded-lg",
        "icon-xl":  "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
