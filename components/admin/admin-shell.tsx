"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  ChevronLeft,
  Flag,
  LayoutDashboard,
  Megaphone,
  Menu,
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
    <div className="min-h-dvh bg-[#080808] text-[#F5F5F5]">

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
              const isActive = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
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
        <header
          className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-[#0C0C0C]/95 px-3 backdrop-blur-xl"
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            minHeight: "calc(3.25rem + env(safe-area-inset-top, 0px))",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-[#B6FF00]/10">
              <Zap className="size-3 text-[#B6FF00]" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold tracking-tight">GymPace</span>
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-[#080808]"
                  style={{ background: "#B6FF00" }}
                >
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-[#F5F5F5]/28">Painel de controle</p>
            </div>
          </div>
          <Link
            href="/feed"
            className="grid size-9 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-[#F5F5F5]/45 transition-colors hover:text-[#F5F5F5]/70"
            aria-label="Voltar ao app"
          >
            <ChevronLeft className="size-3" strokeWidth={2} />
          </Link>
        </header>

        {/* Mobile tab nav */}
        <div className="sticky top-[calc(3.25rem+env(safe-area-inset-top,0px))] z-30 border-b border-white/[0.04] bg-[#080808]/95 backdrop-blur-xl">
          <nav className="flex snap-x items-center gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mr-1 grid size-8 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-[#F5F5F5]/28">
              <Menu className="size-4" strokeWidth={1.8} />
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold transition-all duration-150",
                    isActive
                      ? "bg-[#B6FF00]/10 text-[#B6FF00] shadow-[0_0_16px_rgba(182,255,0,0.08)]"
                      : "border border-white/[0.05] bg-white/[0.025] text-[#F5F5F5]/42 hover:text-[#F5F5F5]/70"
                  )}
                >
                  <Icon className="size-3.5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="md:pl-[220px]">
        <div className="mx-auto max-w-4xl px-3.5 pb-8 pt-5 sm:px-4 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
