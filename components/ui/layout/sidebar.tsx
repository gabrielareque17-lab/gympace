"use client";

import {
  BarChart3,
  Compass,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Medal,
  Rss,
  Shield,
  Settings2,
  Swords,
  Target,
  Trophy,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { NotificationBell } from "@/components/notifications/notification-bell";
import { useNavBadgeContext } from "@/components/providers/nav-badge-provider";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useProfile } from "@/hooks/use-profile";
import { getLocalDateKey } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const rankStyles: Record<string, { label: string; color: string }> = {
  rookie:   { label: "Rookie",   color: "#94A3B8" },
  bronze:   { label: "Bronze",   color: "#CD7F32" },
  silver:   { label: "Silver",   color: "#A1A1AA" },
  gold:     { label: "Gold",     color: "#EAB308" },
  platinum: { label: "Platinum", color: "#22D3EE" },
  elite:    { label: "Elite",    color: "#B6FF00" },
};

type NavItem = { label: string; href: string; icon: LucideIcon; badgeKey?: "feed" | "challenges" | "trophies" | "competitions" };
type NavGroup = { label: string | null; items: NavItem[] };

function buildNavGroups(isAdmin: boolean): NavGroup[] {
  return [
  {
    label: null,
    items: [
      { label: "Início",       href: "/",             icon: LayoutDashboard },
      { label: "Treinos",      href: "/treinos",      icon: Dumbbell       },
      { label: "Ranking",      href: "/social",        icon: Medal          },
      { label: "Desafios & Competições", href: "/desafios-competicoes", icon: Trophy, badgeKey: "challenges" as const },
      { label: "Feed",         href: "/feed",          icon: Rss,           badgeKey: "feed" as const },
      { label: "Perfil",       href: "/perfil",        icon: UserRound      },
    ],
  },
  {
    label: "Extras",
    items: [
      { label: "Metas",        href: "/metas",         icon: Target         },
      { label: "Evolução",     href: "/evolucao",      icon: BarChart3      },
      { label: "Explorar",     href: "/explorar",      icon: Compass        },
      { label: "Convites",     href: "/convites",      icon: Swords         },
    ],
  },
  {
    label: null,
    items: [
      { label: "Configurações", href: "/configuracoes", icon: Settings2     },
      ...(isAdmin ? [{ label: "Admin", href: "/admin", icon: Shield }] : []),
    ],
  },
  ];
}

export function Sidebar({ onClose, email = "" }: { onClose?: () => void; email?: string }) {
  const pathname = usePathname();
  const { profile, isLoading: profileLoading } = useProfile();
  const { badges } = useNavBadgeContext();
  const initials = email ? email[0].toUpperCase() : "?";
  const [weeklyProgress, setWeeklyProgress] = useState(0);
  const navGroups = buildNavGroups(Boolean(profile?.isAdmin));

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const todayKey = getLocalDateKey(new Date());
      const weekStart = new Date(`${todayKey}T12:00:00`);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() + (day === 0 ? -6 : 1 - day));
      const weekStartKey = getLocalDateKey(weekStart);
      const { data } = await supabase
        .from("runs")
        .select("distance, created_at")
        .eq("user_id", user.id)
        .gte("created_at", new Date(weekStart.getTime() - 36 * 60 * 60 * 1000).toISOString());
      if (!data) return;
      const totalKm = data
        .filter((r) => getLocalDateKey(r.created_at) >= weekStartKey)
        .reduce((sum, r) => sum + Number(r.distance ?? 0), 0);
      setWeeklyProgress(Math.min(Math.round((totalKm / 50) * 100), 100));
    });
  }, []);

  const rankKey = profile?.rank ?? "rookie";
  const rankColor = rankStyles[rankKey]?.color ?? "#B6FF00";
  const rankLabel = rankStyles[rankKey]?.label ?? "Rookie";

  return (
    <aside
      className="flex h-dvh w-[256px] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#0A0A0A] text-[#F5F5F5]"
    >
      {/* ── Header ── */}
      <div
        className="flex shrink-0 items-center gap-2.5 px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)",
          paddingBottom: "14px",
        }}
      >
        <div
          className="grid size-8 place-items-center rounded-xl bg-[#B6FF00]"
          style={{ boxShadow: "0 0 18px rgba(182,255,0,0.28)" }}
        >
          <Zap className="size-4 text-[#080808]" strokeWidth={2.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[14px] font-bold tracking-tight">GymPace</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/55">
            Train harder
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="grid size-8 place-items-center rounded-xl text-[#F5F5F5]/35 transition-all duration-150 active:scale-90 active:bg-white/[0.06] hover:bg-white/[0.05] hover:text-[#F5F5F5]/65"
          >
            <X className="size-[15px]" />
          </button>
        ) : (
          <NotificationBell context="sidebar" />
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2"
        aria-label="Navegação principal"
      >
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-0.5" : ""}>
            {group.label && (
              <p className="mb-1 ml-2.5 mt-3.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/20">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const badgeCount = item.badgeKey ? (badges[item.badgeKey] ?? 0) : 0;
              return (
                <SidebarItem
                  key={item.label}
                  label={item.label}
                  href={item.href}
                  icon={item.icon}
                  active={isActive}
                  badge={badgeCount > 0}
                  onClose={onClose}
                />
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        className="shrink-0 space-y-1.5 border-t border-white/[0.05] px-2.5 pt-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        {/* User card */}
        {profileLoading ? (
          <div className="flex items-center gap-2.5 rounded-2xl px-2.5 py-2">
            <div className="size-8 shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-2 w-1/2 animate-pulse rounded bg-white/[0.04]" />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-2.5">
            {/* Avatar + name row */}
            <div className="flex items-center gap-2.5">
              <AvatarDisplay
                avatarId={profile?.avatarId ?? null}
                initials={initials}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] font-semibold leading-tight text-[#F5F5F5]/72">
                  {email || "—"}
                </p>
                <p
                  className="text-[10px] font-semibold leading-tight"
                  style={{ color: rankColor }}
                >
                  Nível {profile?.currentLevel ?? profile?.level ?? 1} · {rankLabel}
                </p>
              </div>
            </div>

            {/* Stats: XP + Meta semanal */}
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <div>
                <div className="mb-[5px] flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#F5F5F5]/22">
                    XP
                  </span>
                  <span
                    className="text-[9.5px] font-bold tabular-nums"
                    style={{ color: rankColor }}
                  >
                    {profile?.totalXp ?? 0}
                  </span>
                </div>
                <div className="h-[2.5px] overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${profile?.levelProgress ?? 0}%`,
                      background: rankColor,
                      boxShadow: `0 0 6px ${rankColor}55`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-[5px] flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#F5F5F5]/22">
                    Meta
                  </span>
                  <span className="text-[9.5px] font-bold tabular-nums text-[#B6FF00]/65">
                    {weeklyProgress}%
                  </span>
                </div>
                <div className="h-[2.5px] overflow-hidden rounded-full bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-[#B6FF00] transition-all duration-700"
                    style={{
                      width: `${weeklyProgress}%`,
                      boxShadow: "0 0 6px rgba(182,255,0,0.38)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <SidebarLogout />

        {/* Branding */}
        <p className="pb-0.5 text-center text-[9px] tracking-[0.06em] text-[#F5F5F5]/14">
          by <span className="font-semibold text-[#B6FF00]/28">Gravix Tech</span>
        </p>
      </div>
    </aside>
  );
}

function SidebarItem({
  label,
  href,
  icon: Icon,
  active = false,
  badge = false,
  onClose,
}: {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: boolean;
  onClose?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium",
        "transition-all duration-150 active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6FF00]/40",
        active
          ? "bg-white/[0.08] text-[#F5F5F5]"
          : "text-[#F5F5F5]/42 hover:bg-white/[0.04] hover:text-[#F5F5F5]/72"
      )}
    >
      {active && (
        <span
          className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-[#B6FF00]"
          style={{ boxShadow: "0 0 8px rgba(182,255,0,0.65)" }}
        />
      )}
      <div className="relative shrink-0">
        <Icon
          className={cn(
            "size-[17px] transition-colors duration-150",
            active ? "text-[#B6FF00]" : "text-[#F5F5F5]/28"
          )}
          strokeWidth={active ? 2.2 : 1.8}
        />
        {badge && !active && (
          <span
            className="absolute -right-0.5 -top-0.5 size-[7px] rounded-full bg-[#B6FF00]"
            style={{ boxShadow: "0 0 6px rgba(182,255,0,0.8)" }}
          />
        )}
      </div>
      <span className="truncate">{label}</span>
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
      className="group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-red-400/55 transition-all duration-150 hover:bg-red-500/[0.08] hover:text-red-400/90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
    >
      <LogOut
        className="size-[17px] shrink-0 text-red-400/42 transition-colors duration-150 group-hover:text-red-400/80"
        strokeWidth={1.8}
      />
      {isPending ? "Saindo..." : "Sair da conta"}
    </button>
  );
}
