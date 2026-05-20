"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  ChevronLeft,
  Flag,
  LayoutDashboard,
  Megaphone,
  Shield,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/admin",         icon: LayoutDashboard },
  { label: "Enviar Update", href: "/admin/updates",  icon: Megaphone       },
  { label: "Temporadas",    href: "/admin/seasons",  icon: Trophy          },
  { label: "Social",        href: "/admin/social",   icon: Star            },
];

const FUTURE_ITEMS = [
  { label: "Usuários",          icon: Users    },
  { label: "Analytics",         icon: BarChart2 },
  { label: "Competições",       icon: Trophy   },
  { label: "Moderação",         icon: Shield   },
  { label: "Feature Flags",     icon: Flag     },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5]">

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 hidden w-[220px] flex-col border-r border-white/[0.06] bg-[#0C0C0C] md:flex">

        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="grid size-8 place-items-center rounded-xl bg-[#B6FF00]/10">
            <Zap className="size-[15px] text-[#B6FF00]" strokeWidth={2.2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tracking-tight text-[#F5F5F5]">GymPace</span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-[#080808]"
              style={{ background: "#B6FF00" }}
            >
              ADMIN
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-[#B6FF00]/10 text-[#B6FF00]"
                      : "text-[#F5F5F5]/45 hover:bg-white/[0.05] hover:text-[#F5F5F5]/75"
                  )}
                >
                  <Icon
                    className="size-4 shrink-0"
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Future modules */}
          <div className="mt-6 mb-2 px-3">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#F5F5F5]/20">
              Em breve
            </span>
          </div>
          <div className="space-y-0.5">
            {FUTURE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#F5F5F5]/18 cursor-not-allowed select-none"
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.6} />
                  {item.label}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Back to app */}
        <div className="border-t border-white/[0.06] p-3">
          <Link
            href="/feed"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#F5F5F5]/30 transition-all duration-150 hover:bg-white/[0.04] hover:text-[#F5F5F5]/55"
          >
            <ChevronLeft className="size-3.5 shrink-0" strokeWidth={2} />
            Voltar ao app
          </Link>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────────────── */}
      <div className="md:hidden">
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#0C0C0C] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-lg bg-[#B6FF00]/10">
              <Zap className="size-3 text-[#B6FF00]" strokeWidth={2.2} />
            </div>
            <span className="text-[13px] font-bold tracking-tight">GymPace</span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-[#080808]"
              style={{ background: "#B6FF00" }}
            >
              ADMIN
            </span>
          </div>
          <Link
            href="/feed"
            className="flex items-center gap-1 text-[11px] text-[#F5F5F5]/35 hover:text-[#F5F5F5]/60 transition-colors"
          >
            <ChevronLeft className="size-3" strokeWidth={2} />
            App
          </Link>
        </header>

        {/* Mobile tab nav */}
        <nav className="flex items-center gap-1 border-b border-white/[0.04] bg-[#080808] px-4 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-[#B6FF00]/10 text-[#B6FF00]"
                    : "text-[#F5F5F5]/40 hover:text-[#F5F5F5]/65"
                )}
              >
                <Icon className="size-3.5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="md:pl-[220px]">
        <div className="mx-auto max-w-4xl px-4 py-7 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
