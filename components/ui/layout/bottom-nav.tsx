"use client";

import { LayoutDashboard, Rss, Swords, Timer, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Início", href: "/", icon: LayoutDashboard },
  { label: "Corridas", href: "/corridas", icon: Timer },
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "Competições", href: "/competicoes", icon: Swords },
  { label: "Perfil", href: "/perfil", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Navegação principal"
    >
      {/* Blurred background */}
      <div className="absolute inset-0 bg-[#090909]/92 backdrop-blur-2xl" />
      {/* Top separator line */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />

      <div
        className="relative flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-all duration-200 active:scale-[0.88]",
                isActive ? "text-[#B6FF00]" : "text-[#F5F5F5]/32"
              )}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <span
                  className="absolute inset-x-4 top-0 h-[2px] rounded-full bg-[#B6FF00]"
                  style={{ boxShadow: "0 0 10px rgba(182,255,0,0.65)" }}
                />
              )}

              <Icon
                className={cn(
                  "size-[22px] shrink-0 transition-all duration-200",
                  isActive
                    ? "drop-shadow-[0_0_6px_rgba(182,255,0,0.55)]"
                    : "group-active:scale-90"
                )}
                strokeWidth={isActive ? 2.2 : 1.7}
              />

              <span
                className={cn(
                  "text-[10px] font-semibold tracking-tight transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-40 group-active:opacity-70"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
