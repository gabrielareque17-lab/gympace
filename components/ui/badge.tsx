import { cva, type VariantProps } from "class-variance-authority"
import { getAthleteTitle } from "@/lib/athlete-title"
import { cn } from "@/lib/utils"

const badgeVariants = cva("gp-badge", {
  variants: {
    variant: {
      // Accent — neon green (default for most badges)
      accent:  "gp-badge-accent",
      // Muted — low-contrast white
      muted:   "gp-badge-muted",
      // Danger — red
      danger:  "gp-badge-danger",
      // Blue — workout / secondary action
      blue:    "gp-badge-blue",
      // Você — the current user's own row indicator
      you:     "gp-badge-you",
      // Rank — square corners, used with dynamic color via style prop
      rank:    "gp-badge-rank",
    },
    size: {
      sm: "text-[9px] px-1.5 py-px",
      md: "",  // default from gp-badge
      lg: "text-xs px-2.5 py-1",
    },
  },
  defaultVariants: {
    variant: "accent",
    size: "md",
  },
})

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

function RankBadge({
  rank,
  className,
}: {
  rank: string
  className?: string
}) {
  const title = getAthleteTitle(rank)

  return (
    <Badge
      variant="rank"
      className={className}
      style={{
        background: `${title.color}18`,
        color: title.color,
      }}
    >
      {title.label}
    </Badge>
  )
}

// Numeric count badge (shown over nav icons, etc.)
function CountBadge({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  return (
    <span
      className={cn("gp-badge-dot", className)}
      aria-label={`${count} notificações`}
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}

export { Badge, RankBadge, CountBadge, badgeVariants }
export type { BadgeProps }
