import { redirect } from "next/navigation";
import { Activity, Compass, Dumbbell, Flame, LucideIcon, Rss, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getFeedEvents, type FeedEvent, type FeedProfile } from "@/lib/feed";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RANK_LABELS: Record<string, string> = {
  rookie: "Rookie",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  elite: "Elite",
};

const RANK_COLORS: Record<string, string> = {
  rookie: "#94A3B8",
  bronze: "#CD7F32",
  silver: "#A1A1AA",
  gold: "#EAB308",
  platinum: "#22D3EE",
  elite: "#B6FF00",
};

const RUN_TYPE_LABELS: Record<string, string> = {
  leve: "Leve",
  intervalado: "Intervalado",
  longao: "Longão",
  regenerativo: "Regenerativo",
  prova: "Prova",
  ritmo: "Ritmo",
};

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  peito: "Peito",
  costas: "Costas",
  pernas: "Pernas",
  ombros: "Ombros",
  bracos: "Braços",
  abdomen: "Abdômen",
  "full-body": "Full Body",
};

const INTENSITY_LABELS: Record<string, string> = {
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
};

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  if (h < 48) return "ontem";
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} dias`;
  return `há ${Math.floor(d / 7)} sem`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS_PT[d.getMonth()];
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} • ${h}:${min}`;
}

type DateGroup = "hoje" | "ontem" | "semana" | "anterior";

function getDateGroup(iso: string): DateGroup {
  const now = new Date();
  const d = new Date(iso);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 7);
  if (d >= todayStart) return "hoje";
  if (d >= yesterdayStart) return "ontem";
  if (d >= weekStart) return "semana";
  return "anterior";
}

const GROUP_LABELS: Record<DateGroup, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  semana: "Esta semana",
  anterior: "Anteriores",
};

const GROUP_ORDER: DateGroup[] = ["hoje", "ontem", "semana", "anterior"];

function groupEvents(events: FeedEvent[]): Array<{ group: DateGroup; events: FeedEvent[] }> {
  const map = new Map<DateGroup, FeedEvent[]>();
  for (const event of events) {
    const g = getDateGroup(event.created_at);
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(event);
  }
  return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
    group: g,
    events: map.get(g)!,
  }));
}

type TagColor = "lime" | "blue" | "amber" | "orange" | "neutral";

function Tag({ children, color }: { children: ReactNode; color: TagColor }) {
  const s: Record<TagColor, string> = {
    lime: "border-[#B6FF00]/25 bg-[#B6FF00]/[0.08] text-[#B6FF00]/80",
    blue: "border-[#3B82F6]/25 bg-[#3B82F6]/[0.08] text-[#3B82F6]/80",
    amber: "border-[#F59E0B]/25 bg-[#F59E0B]/[0.08] text-[#F59E0B]/80",
    orange: "border-[#F97316]/25 bg-[#F97316]/[0.08] text-[#F97316]/80",
    neutral: "border-white/[0.09] bg-white/[0.04] text-[#F5F5F5]/45",
  };
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-tight", s[color])}>
      {children}
    </span>
  );
}

type EventConfig = {
  Icon: LucideIcon;
  color: string;
  badgeBg: string;
  cardCn: string;
};

const EVENT_CONFIG: Record<string, EventConfig> = {
  run: {
    Icon: Activity,
    color: "#B6FF00",
    badgeBg: "bg-[#B6FF00]/20",
    cardCn: "border-white/[0.07] hover:border-[#B6FF00]/15 hover:shadow-[0_2px_20px_rgba(182,255,0,0.05)]",
  },
  workout: {
    Icon: Dumbbell,
    color: "#3B82F6",
    badgeBg: "bg-[#3B82F6]/20",
    cardCn: "border-white/[0.07] hover:border-[#3B82F6]/15 hover:shadow-[0_2px_20px_rgba(59,130,246,0.05)]",
  },
  level_up: {
    Icon: Trophy,
    color: "#F59E0B",
    badgeBg: "bg-[#F59E0B]/20",
    cardCn: "border-[#F59E0B]/12 bg-[#F59E0B]/[0.025] hover:border-[#F59E0B]/22 hover:shadow-[0_2px_20px_rgba(245,158,11,0.07)]",
  },
  streak: {
    Icon: Flame,
    color: "#F97316",
    badgeBg: "bg-[#F97316]/20",
    cardCn: "border-[#F97316]/12 bg-[#F97316]/[0.025] hover:border-[#F97316]/22 hover:shadow-[0_2px_20px_rgba(249,115,22,0.07)]",
  },
};

function UserAvatar({ profile, name }: { profile?: FeedProfile; name: string }) {
  const initials = name[0]?.toUpperCase() ?? "A";
  const profileHref = profile?.username ? `/perfil/${profile.username}` : undefined;
  const avatar = (
    <AvatarDisplay avatarId={profile?.avatar_id ?? null} initials={initials} size="sm" />
  );
  if (!profileHref) return <>{avatar}</>;
  return (
    <Link href={profileHref} className="block shrink-0 transition-opacity duration-150 hover:opacity-75">
      {avatar}
    </Link>
  );
}

function FeedCard({ event }: { event: FeedEvent }) {
  const { event_type: type, payload, created_at, profile } = event;
  const name = profile?.display_name ?? profile?.username ?? "Atleta";
  const profileHref = profile?.username ? `/perfil/${profile.username}` : undefined;
  const time = timeAgo(created_at);
  const dateDetail = formatDateTime(created_at);
  const config = EVENT_CONFIG[type] ?? EVENT_CONFIG.run;
  const { Icon, color, badgeBg } = config;

  let action: ReactNode = null;
  let tags: ReactNode = null;

  if (type === "run") {
    const p = payload as { distance?: number; pace?: string; run_type?: string };
    const dist = Number(p.distance ?? 0).toFixed(1);
    action = (
      <span className="text-[#F5F5F5]/55">
        correu{" "}
        <span className="font-semibold" style={{ color }}>{dist} km</span>
      </span>
    );
    tags = (
      <>
        {p.run_type && <Tag color="lime">{RUN_TYPE_LABELS[p.run_type] ?? p.run_type}</Tag>}
        {p.pace && <Tag color="neutral">{p.pace}/km</Tag>}
      </>
    );
  } else if (type === "workout") {
    const p = payload as { title?: string; muscle_group?: string; duration_minutes?: number; intensity?: string };
    const muscle = MUSCLE_GROUP_LABELS[p.muscle_group ?? ""] ?? p.muscle_group ?? "academia";
    const intensityColorMap: Record<string, TagColor> = { leve: "lime", moderado: "amber", intenso: "orange" };
    const intensityColor: TagColor = intensityColorMap[p.intensity ?? ""] ?? "neutral";
    action = (
      <span className="text-[#F5F5F5]/55">
        treinou{" "}
        <span className="font-semibold" style={{ color }}>{muscle}</span>
      </span>
    );
    tags = (
      <>
        {p.title && <Tag color="neutral">{p.title}</Tag>}
        {p.duration_minutes != null && <Tag color="blue">{p.duration_minutes} min</Tag>}
        {p.intensity && <Tag color={intensityColor}>{INTENSITY_LABELS[p.intensity] ?? p.intensity}</Tag>}
      </>
    );
  } else if (type === "level_up") {
    const p = payload as { new_level?: number; new_rank?: string };
    const rankColor = p.new_rank ? (RANK_COLORS[p.new_rank] ?? "#F59E0B") : "#F59E0B";
    action = (
      <span className="text-[#F5F5F5]/55">
        subiu para{" "}
        <span className="font-semibold" style={{ color }}>Nível {p.new_level ?? "?"}</span>!
      </span>
    );
    tags = p.new_rank ? (
      <span
        className="rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight"
        style={{ color: rankColor, borderColor: `${rankColor}44`, background: `${rankColor}14` }}
      >
        {RANK_LABELS[p.new_rank] ?? p.new_rank}
      </span>
    ) : null;
  } else if (type === "streak") {
    const p = payload as { streak_days?: number };
    action = (
      <span className="text-[#F5F5F5]/55">
        em sequência de{" "}
        <span className="font-semibold" style={{ color }}>{p.streak_days ?? 0} dias</span>!
      </span>
    );
  }

  return (
    <article
      className={cn(
        "group relative flex gap-3.5 rounded-2xl border bg-[#111111] p-4 transition-all duration-200 hover:bg-[#141414]",
        config.cardCn
      )}
    >
      {/* Avatar + event type badge */}
      <div className="relative mt-0.5 shrink-0">
        <UserAvatar profile={profile} name={name} />
        <div
          className={cn(
            "absolute -bottom-1 -right-1 grid size-[18px] place-items-center rounded-full",
            badgeBg
          )}
        >
          <Icon className="size-2.5" strokeWidth={2.5} style={{ color }} />
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + relative time */}
        <div className="flex items-baseline justify-between gap-2">
          {profileHref ? (
            <Link
              href={profileHref}
              className="text-sm font-semibold text-[#F5F5F5] transition-colors duration-150 hover:text-[#B6FF00]"
            >
              {name}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-[#F5F5F5]">{name}</span>
          )}
          <span className="shrink-0 text-[10px] tabular-nums text-[#F5F5F5]/28">{time}</span>
        </div>

        {/* Action text */}
        <p className="mt-0.5 text-sm">{action}</p>

        {/* Detail tags */}
        {tags && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">{tags}</div>
        )}

        {/* Absolute timestamp */}
        <p className="mt-2 text-[10px] text-[#F5F5F5]/20">{dateDetail}</p>
      </div>
    </article>
  );
}

function DateSectionHeader({ group }: { group: DateGroup }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/30">
        {GROUP_LABELS[group]}
      </span>
      <div className="h-px flex-1 bg-white/[0.05]" />
    </div>
  );
}

function FeedEmpty() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111111] px-5 py-16 text-center">
      <div className="mx-auto mb-4 flex items-center justify-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/10">
          <Activity className="size-5 text-[#B6FF00]" strokeWidth={1.8} />
        </div>
        <div className="grid size-10 place-items-center rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10">
          <Dumbbell className="size-5 text-[#3B82F6]" strokeWidth={1.8} />
        </div>
      </div>
      <p className="text-sm font-medium text-[#F5F5F5]/35">Nada por aqui ainda</p>
      <p className="mt-1 text-xs text-[#F5F5F5]/22">
        Registre atividades ou siga atletas para ver o feed
      </p>
      <Link
        href="/explorar"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#B6FF00]/20 bg-[#B6FF00]/[0.07] px-4 py-1.5 text-xs font-semibold text-[#B6FF00]/75 transition-all hover:border-[#B6FF00]/35 hover:bg-[#B6FF00]/[0.12]"
      >
        <Compass className="size-3.5" strokeWidth={2} />
        Explorar atletas
      </Link>
    </div>
  );
}

export default async function FeedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const events = await getFeedEvents(supabase, user.id);
  const groups = groupEvents(events);

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-2xl px-4 py-5 sm:py-8 md:px-6">
        <header className="mb-6 sm:mb-8">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/10">
              <Rss className="size-4 text-[#B6FF00]" strokeWidth={2} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
              Social
            </p>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Feed</h1>
          <p className="mt-1.5 text-sm text-[#F5F5F5]/40 sm:mt-2">
            Atividade da sua rede GymPace
          </p>
        </header>

        {events.length === 0 ? (
          <FeedEmpty />
        ) : (
          <div className="space-y-6">
            {groups.map(({ group, events: groupEvents }) => (
              <section key={group}>
                <DateSectionHeader group={group} />
                <div className="mt-2 space-y-2.5">
                  {groupEvents.map((event) => (
                    <FeedCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
