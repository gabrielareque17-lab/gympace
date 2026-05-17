"use client";

import {
  BarChart3,
  Bell,
  Compass,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Rss,
  Settings2,
  Swords,
  Target,
  Timer,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";

const rankStyles: Record<string, { label: string; color: string }> = {
  rookie: { label: "Rookie", color: "#94A3B8" },
  bronze: { label: "Bronze", color: "#CD7F32" },
  silver: { label: "Silver", color: "#A1A1AA" },
  gold: { label: "Gold", color: "#EAB308" },
  platinum: { label: "Platinum", color: "#22D3EE" },
  elite: { label: "Elite", color: "#B6FF00" },
};

const navigationItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Feed", href: "/feed", icon: Rss },
  { label: "Perfil", href: "/perfil", icon: UserRound },
  { label: "Explorar", href: "/explorar", icon: Compass },
  { label: "Competições", href: "/competicoes", icon: Swords },
  { label: "Convites", href: "/convites", icon: Bell },
  { label: "Corridas", href: "/corridas", icon: Timer },
  { label: "Academia", href: "/academia", icon: Dumbbell },
  { label: "Metas", href: "/metas", icon: Target },
  { label: "Evolução", href: "/evolucao", icon: BarChart3 },
  { label: "Configurações", href: "/configuracoes", icon: Settings2 },
];

export function Sidebar({ onClose, email = "" }: { onClose?: () => void; email?: string }) {
  const pathname = usePathname();
  const { profile, isLoading: profileLoading } = useProfile();
  const initials = email ? email[0].toUpperCase() : "?";
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const now = new Date();
      const day = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
      weekStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("runs")
        .select("distance")
        .eq("user_id", user.id)
        .gte("created_at", weekStart.toISOString());
      if (!data) return;
      const totalKm = data.reduce((sum, r) => sum + Number(r.distance ?? 0), 0);
      setWeeklyProgress(Math.min(Math.round((totalKm / 50) * 100), 100));
    });
  }, []);

  return (
    <aside className="flex min-h-screen w-[256px] shrink-0 flex-col border-r border-white/[0.06] bg-[#090909] px-3 py-5 text-[#F5F5F5]">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="grid size-8 place-items-center rounded-xl bg-[#B6FF00] shadow-[0_0_20px_rgba(182,255,0,0.28)]">
          <Zap className="size-4 text-[#080808]" strokeWidth={2.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold tracking-tight">GymPace</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B6FF00]/60">
            Train harder
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-lg text-[#F5F5F5]/40 transition-colors hover:bg-white/[0.05] hover:text-[#F5F5F5]/70"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-px" aria-label="Navegação principal">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return <SidebarItem key={item.label} {...item} active={isActive} />;
        })}
      </nav>

      <div className="border-t border-white/[0.05] pt-4 space-y-1">
        {/* User info block */}
        {profileLoading ? (
          <div className="mx-2 mb-3 flex items-center gap-2.5">
            <div className="size-8 shrink-0 animate-pulse rounded-xl bg-white/[0.06]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-2 w-1/2 animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
        ) : (
          <div className="mx-2 mb-3 rounded-xl border border-white/[0.04] bg-white/[0.02] px-2.5 py-2">
            <div className="flex items-center gap-2.5">
            <AvatarDisplay
              avatarId={profile?.avatarId ?? null}
              initials={initials}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#F5F5F5]/65">{email || "—"}</p>
              <p className="text-[10px] text-[#F5F5F5]/30">
                Nível {profile?.currentLevel ?? profile?.level ?? 1} · {rankStyles[profile?.rank ?? "rookie"]?.label ?? "Rookie"}
              </p>
            </div>
            </div>
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/28">
                  XP
                </span>
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ color: rankStyles[profile?.rank ?? "rookie"]?.color ?? "#B6FF00" }}
                >
                  {profile?.totalXp ?? 0}
                </span>
              </div>
              <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${profile?.levelProgress ?? 0}%`,
                    background: rankStyles[profile?.rank ?? "rookie"]?.color ?? "#B6FF00",
                    boxShadow: `0 0 8px ${rankStyles[profile?.rank ?? "rookie"]?.color ?? "#B6FF00"}66`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="px-2 pb-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#F5F5F5]/38">
              Meta semanal
            </span>
            <span className="text-[11px] font-bold tabular-nums text-[#B6FF00]/70">
              {weeklyProgress}%
            </span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-[#B6FF00] shadow-[0_0_8px_rgba(182,255,0,0.38)] transition-all duration-700"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>

        <SidebarLogout />

        <div className="px-2 pt-2">
          <p className="text-center text-[9px] tracking-[0.08em] text-[#F5F5F5]/14">
            by{" "}
            <span className="font-semibold text-[#B6FF00]/30">Gravix Tech</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  label,
  href,
  icon: Icon,
  active = false,
}: {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6FF00]/40",
        active
          ? "bg-white/[0.07] text-[#F5F5F5]"
          : "text-[#F5F5F5]/38 hover:bg-white/[0.04] hover:text-[#F5F5F5]/72"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors duration-150",
          active
            ? "text-[#B6FF00]"
            : "text-[#F5F5F5]/28 group-hover:text-[#F5F5F5]/50"
        )}
        strokeWidth={active ? 2.2 : 1.8}
      />
      <span className="truncate">{label}</span>
      {active && (
        <span className="ml-auto block size-1.5 rounded-full bg-[#B6FF00] shadow-[0_0_6px_rgba(182,255,0,0.6)]" />
      )}
    </Link>
  );
}

function SidebarLogout() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="group flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-[#F5F5F5]/32 transition-all duration-150 hover:bg-red-500/[0.07] hover:text-red-400/80 disabled:pointer-events-none disabled:opacity-50"
    >
      <LogOut
        className="size-4 shrink-0 text-[#F5F5F5]/22 transition-colors duration-150 group-hover:text-red-400/65"
        strokeWidth={1.8}
      />
      {isPending ? "Saindo..." : "Sair da conta"}
    </button>
  );
}
