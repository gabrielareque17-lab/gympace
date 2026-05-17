import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6 sm:mb-8">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
        {eyebrow}
      </p>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1.5 max-w-lg text-sm leading-6 text-[#F5F5F5]/40 sm:mt-2">{description}</p>
    </header>
  );
}

export function SectionCard({
  label,
  title,
  badge,
  children,
  className,
}: {
  label: string;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]",
        className
      )}
    >
      <div className="relative flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/60">
            {label}
          </p>
          <h2 className="font-display text-base font-semibold">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto mb-3 grid size-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#F5F5F5]/22">
        <Icon className="size-5" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-[#F5F5F5]/35">{title}</p>
      <p className="mt-1 text-xs text-[#F5F5F5]/20">{subtitle}</p>
    </div>
  );
}

export function ComingSoonBadge() {
  return (
    <span className="shrink-0 rounded-full border border-[#B6FF00]/20 bg-[#B6FF00]/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#B6FF00]/70">
      Em breve
    </span>
  );
}
