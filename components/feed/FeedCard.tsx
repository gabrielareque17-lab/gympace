"use client";

import {
  Activity,
  Award,
  Dumbbell,
  Flame,
  MessageCircle,
  Swords,
  Trophy,
  Users,
  Zap,
  Star,
  TrendingUp,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { ReactionButton } from "@/components/feed/ReactionButton";
import type { FeedEvent, FeedProfile } from "@/lib/feed";
import { getMuscleGroupLabel } from "@/lib/muscles";
import { cn } from "@/lib/utils";
import { formatDateTime, formatTimeAgo } from "@/lib/date-utils";
import { CommentsDrawer } from "@/components/feed/CommentsDrawer";

// ── Labels & styles ──────────────────────────────────────────────────────────

const RANK_COLORS: Record<string, string> = {
  rookie: "#94A3B8",
  bronze: "#CD7F32",
  silver: "#A1A1AA",
  gold: "#EAB308",
  platinum: "#22D3EE",
  elite: "#B6FF00",
};

const RANK_LABELS: Record<string, string> = {
  rookie: "Rookie",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  elite: "Elite",
};

const RUN_TYPE_LABELS: Record<string, string> = {
  leve: "Leve",
  intervalado: "Intervalado",
  longao: "Longão",
  regenerativo: "Regenerativo",
  prova: "Prova",
  ritmo: "Ritmo",
};

const INTENSITY_LABELS: Record<string, string> = {
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
};

const SPLIT_LABELS: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  upper: "Upper",
  lower: "Lower",
  "full-body": "Full Body",
  custom: "Personalizado",
};

const SIMPLE_EVENT_TYPES = new Set([
  "level_up",
  "streak",
  "personal_record",
  "streak_milestone",
  "hybrid_bonus",
  "challenge_accepted",
  "challenge_won",
  "competition_joined",
  "exclusive_trophy",
  "rank_reached",
  "season_started",
]);

// ── Tag component ─────────────────────────────────────────────────────────────

type TagColor = "lime" | "blue" | "cyan" | "amber" | "orange" | "purple" | "red" | "neutral";

const TAG_STYLES: Record<TagColor, string> = {
  lime:    "border-[#B6FF00]/25 bg-[#B6FF00]/[0.08] text-[#B6FF00]/80",
  blue:    "border-[#3B82F6]/25 bg-[#3B82F6]/[0.08] text-[#3B82F6]/80",
  cyan:    "border-[#22D3EE]/25 bg-[#22D3EE]/[0.08] text-[#22D3EE]/80",
  amber:   "border-[#F59E0B]/25 bg-[#F59E0B]/[0.08] text-[#F59E0B]/80",
  orange:  "border-[#F97316]/25 bg-[#F97316]/[0.08] text-[#F97316]/80",
  purple:  "border-[#A78BFA]/25 bg-[#A78BFA]/[0.08] text-[#A78BFA]/80",
  red:     "border-[#EF4444]/25 bg-[#EF4444]/[0.08] text-[#EF4444]/80",
  neutral: "border-white/[0.09] bg-white/[0.04] text-[#F5F5F5]/45",
};

function Tag({ children, color }: { children: ReactNode; color: TagColor }) {
  return (
    <span className={cn("inline-flex min-h-5 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none tracking-tight", TAG_STYLES[color])}>
      {children}
    </span>
  );
}

// ── Stats grid for run/workout ────────────────────────────────────────────────

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#F5F5F5]/28">{label}</span>
      <span className="text-[13px] font-bold leading-none" style={color ? { color } : { color: "#F5F5F5" }}>
        {value}
      </span>
    </div>
  );
}

function StatsRow({ children, color }: { children: ReactNode; color: string }) {
  return (
    <div
      className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-xl sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none"
      style={{ border: `1px solid ${color}18`, background: `${color}06` }}
    >
      {children}
    </div>
  );
}

function StatsCell({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-[3px] border-white/[0.05] px-2.5 py-2", !last && "sm:border-r")}>
      <StatItem label={label} value={value} color={color} />
    </div>
  );
}

// ── Event config ─────────────────────────────────────────────────────────────

type EventConfig = {
  Icon: React.ElementType;
  color: string;
  badgeBg: string;
  cardBorder: string;
  cardBg: string;
};

const EVENT_CONFIG: Record<string, EventConfig> = {
  run: {
    Icon: Activity,
    color: "#B6FF00",
    badgeBg: "bg-[#B6FF00]/20",
    cardBorder: "border-white/[0.07] hover:border-[#B6FF00]/20",
    cardBg: "bg-[#111111] hover:bg-[#131313]",
  },
  workout: {
    Icon: Dumbbell,
    color: "#3B82F6",
    badgeBg: "bg-[#3B82F6]/20",
    cardBorder: "border-white/[0.07] hover:border-[#3B82F6]/20",
    cardBg: "bg-[#111111] hover:bg-[#111417]",
  },
  level_up: {
    Icon: Trophy,
    color: "#F59E0B",
    badgeBg: "bg-[#F59E0B]/20",
    cardBorder: "border-[#F59E0B]/15 hover:border-[#F59E0B]/28",
    cardBg: "bg-[#F59E0B]/[0.03] hover:bg-[#F59E0B]/[0.05]",
  },
  streak: {
    Icon: Flame,
    color: "#F97316",
    badgeBg: "bg-[#F97316]/20",
    cardBorder: "border-[#F97316]/15 hover:border-[#F97316]/28",
    cardBg: "bg-[#F97316]/[0.03] hover:bg-[#F97316]/[0.05]",
  },
  personal_record: {
    Icon: Star,
    color: "#A78BFA",
    badgeBg: "bg-[#A78BFA]/20",
    cardBorder: "border-[#A78BFA]/18 hover:border-[#A78BFA]/32",
    cardBg: "bg-[#A78BFA]/[0.03] hover:bg-[#A78BFA]/[0.05]",
  },
  streak_milestone: {
    Icon: Flame,
    color: "#FB923C",
    badgeBg: "bg-[#FB923C]/20",
    cardBorder: "border-[#FB923C]/18 hover:border-[#FB923C]/32",
    cardBg: "bg-[#FB923C]/[0.03] hover:bg-[#FB923C]/[0.05]",
  },
  hybrid_bonus: {
    Icon: Zap,
    color: "#22D3EE",
    badgeBg: "bg-[#22D3EE]/20",
    cardBorder: "border-[#22D3EE]/18 hover:border-[#22D3EE]/32",
    cardBg: "bg-[#22D3EE]/[0.03] hover:bg-[#22D3EE]/[0.05]",
  },
  challenge_accepted: {
    Icon: Swords,
    color: "#FB923C",
    badgeBg: "bg-[#FB923C]/20",
    cardBorder: "border-[#FB923C]/15 hover:border-[#FB923C]/28",
    cardBg: "bg-[#111111] hover:bg-[#131311]",
  },
  challenge_won: {
    Icon: Trophy,
    color: "#EAB308",
    badgeBg: "bg-[#EAB308]/20",
    cardBorder: "border-[#EAB308]/20 hover:border-[#EAB308]/35",
    cardBg: "bg-[#EAB308]/[0.04] hover:bg-[#EAB308]/[0.07]",
  },
  competition_joined: {
    Icon: Users,
    color: "#A78BFA",
    badgeBg: "bg-[#A78BFA]/20",
    cardBorder: "border-white/[0.07] hover:border-[#A78BFA]/20",
    cardBg: "bg-[#111111] hover:bg-[#121118]",
  },
  exclusive_trophy: {
    Icon: Award,
    color: "#22D3EE",
    badgeBg: "bg-[#22D3EE]/20",
    cardBorder: "border-[#22D3EE]/22 hover:border-[#22D3EE]/40",
    cardBg: "bg-[#22D3EE]/[0.04] hover:bg-[#22D3EE]/[0.07]",
  },
  rank_reached: {
    Icon: TrendingUp,
    color: "#B6FF00",
    badgeBg: "bg-[#B6FF00]/20",
    cardBorder: "border-[#B6FF00]/18 hover:border-[#B6FF00]/32",
    cardBg: "bg-[#B6FF00]/[0.03] hover:bg-[#B6FF00]/[0.05]",
  },
  season_started: {
    Icon: Calendar,
    color: "#A78BFA",
    badgeBg: "bg-[#A78BFA]/20",
    cardBorder: "border-[#A78BFA]/18 hover:border-[#A78BFA]/32",
    cardBg: "bg-[#A78BFA]/[0.03] hover:bg-[#A78BFA]/[0.05]",
  },
};

// ── Avatar ────────────────────────────────────────────────────────────────────

function UserAvatar({ profile, name }: { profile?: FeedProfile; name: string }) {
  const initials = name[0]?.toUpperCase() ?? "A";
  const profileHref = profile?.username ? `/perfil/${profile.username}` : undefined;
  const avatar = <AvatarDisplay avatarId={profile?.avatar_id ?? null} initials={initials} size="sm" />;
  if (!profileHref) return <>{avatar}</>;
  return (
    <Link
      href={profileHref}
      prefetch
      className="mobile-tap block shrink-0 transition-opacity duration-100 active:opacity-80 hover:opacity-75"
    >
      {avatar}
    </Link>
  );
}

// ── Content builders per event type ──────────────────────────────────────────

function RunContent({ payload, color }: { payload: Record<string, unknown>; color: string }) {
  const p = payload as {
    distance?: number;
    pace?: string;
    duration?: string;
    avg_speed?: number;
    calories?: number;
    run_type?: string;
  };
  const dist = Number(p.distance ?? 0).toFixed(2).replace(".", ",");
  const hasCols = [p.pace, p.duration, p.calories].filter(Boolean).length;

  return (
    <>
      <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
        completou{" "}
        <span className="font-bold" style={{ color }}>{dist} km</span>
      </p>

      {hasCols > 0 && (
        <StatsRow color={color}>
          <StatsCell label="Distância" value={`${dist} km`} color={color} />
          {p.pace && <StatsCell label="Pace" value={`${p.pace}/km`} />}
          {p.duration && <StatsCell label="Tempo" value={p.duration} />}
          {p.calories && <StatsCell label="Kcal" value={String(p.calories)} last />}
        </StatsRow>
      )}

      {p.run_type && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Tag color="lime">{RUN_TYPE_LABELS[p.run_type] ?? p.run_type}</Tag>
          {p.avg_speed != null && (
            <Tag color="neutral">{Number(p.avg_speed).toFixed(1)} km/h</Tag>
          )}
        </div>
      )}
    </>
  );
}

function WorkoutContent({ payload, color }: { payload: Record<string, unknown>; color: string }) {
  const p = payload as {
    title?: string;
    muscle_group?: string;
    muscle_groups?: string[];
    muscle_details?: string[];
    duration_minutes?: number;
    intensity?: string;
    workout_split?: string;
  };
  const muscleKeys = p.muscle_groups?.length ? p.muscle_groups : (p.muscle_group ? [p.muscle_group] : []);
  const muscle = muscleKeys.length ? muscleKeys.map(getMuscleGroupLabel).join(", ") : "musculação";
  const intensityColorMap: Record<string, TagColor> = { leve: "lime", moderado: "amber", intenso: "orange" };
  const intensityColor: TagColor = intensityColorMap[p.intensity ?? ""] ?? "neutral";
  const hasCols = [p.duration_minutes, p.workout_split].filter(Boolean).length;

  return (
    <>
      <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
        treinou{" "}
        <span className="font-bold" style={{ color }}>{muscle}</span>
      </p>

      {hasCols > 0 && (
        <StatsRow color={color}>
          {p.duration_minutes != null && (
            <StatsCell label="Duração" value={`${p.duration_minutes} min`} color={color} />
          )}
          {p.workout_split && (
            <StatsCell label="Split" value={SPLIT_LABELS[p.workout_split] ?? p.workout_split} last />
          )}
        </StatsRow>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.title && <Tag color="neutral">{p.title}</Tag>}
        {p.intensity && <Tag color={intensityColor}>{INTENSITY_LABELS[p.intensity] ?? p.intensity}</Tag>}
        {p.muscle_details?.slice(0, 3).map((d) => (
          <Tag key={d} color="neutral">{d}</Tag>
        ))}
      </div>
    </>
  );
}

function LevelUpContent({ payload, color, profile }: { payload: Record<string, unknown>; color: string; profile?: FeedProfile }) {
  const p = payload as { new_level?: number; new_rank?: string };
  const rankColor = p.new_rank ? (RANK_COLORS[p.new_rank] ?? color) : color;
  const liveXp = profile?.total_xp;
  return (
    <>
      <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
        subiu para{" "}
        <span className="font-bold" style={{ color }}>Nível {p.new_level ?? "?"}</span>! 🎉
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.new_rank && (
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight"
            style={{ color: rankColor, borderColor: `${rankColor}44`, background: `${rankColor}14` }}
          >
            {RANK_LABELS[p.new_rank] ?? p.new_rank}
          </span>
        )}
        {liveXp != null && <Tag color="amber">{liveXp.toLocaleString("pt-BR")} XP total</Tag>}
      </div>
    </>
  );
}

function StreakContent({ payload, color }: { payload: Record<string, unknown>; color: string }) {
  const p = payload as { streak_days?: number };
  return (
    <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
      mantém uma sequência de{" "}
      <span className="font-bold" style={{ color }}>{p.streak_days ?? 0} dias</span> 🔥
    </p>
  );
}

function PersonalRecordContent({ payload, color }: { payload: Record<string, unknown>; color: string }) {
  const p = payload as { label?: string; distance?: number; pace?: string };
  return (
    <>
      <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
        novo recorde pessoal:{" "}
        <span className="font-bold" style={{ color }}>{p.label ?? "PR"}</span> ⚡
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.distance != null && <Tag color="neutral">{Number(p.distance).toFixed(1)} km</Tag>}
        {p.pace && <Tag color="purple">{p.pace}/km</Tag>}
      </div>
    </>
  );
}

function StreakMilestoneContent({ payload, color }: { payload: Record<string, unknown>; color: string }) {
  const p = payload as { streak_days?: number };
  return (
    <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
      atingiu{" "}
      <span className="font-bold" style={{ color }}>{p.streak_days} dias</span>{" "}
      de sequência ininterrupta! 🔥
    </p>
  );
}

function HybridBonusContent({ color }: { color: string }) {
  return (
    <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
      conquistou o{" "}
      <span className="font-bold" style={{ color }}>Bônus Híbrido</span>{" "}
      — corrida + treino no mesmo dia ⚡
    </p>
  );
}

function ChallengeAcceptedContent({ color }: { color: string }) {
  return (
    <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
      aceitou um{" "}
      <span className="font-bold" style={{ color }}>desafio</span>{" "}
      — o duelo começou! ⚔️
    </p>
  );
}

function ChallengeWonContent({ color }: { color: string }) {
  return (
    <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
      <span className="font-bold" style={{ color }}>venceu um desafio</span>! 🏆
    </p>
  );
}

function CompetitionJoinedContent({ color }: { color: string }) {
  return (
    <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
      entrou em uma{" "}
      <span className="font-bold" style={{ color }}>competição</span> 🏁
    </p>
  );
}

function ExclusiveTrophyContent({ payload, color }: { payload: Record<string, unknown>; color: string }) {
  const p = payload as { trophy_name?: string; rarity?: string };
  return (
    <>
      <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
        recebeu o troféu exclusivo{" "}
        <span className="font-bold" style={{ color }}>{p.trophy_name ?? "Troféu"}</span> 🏅
      </p>
      {p.rarity && (
        <div className="mt-2">
          <Tag color="cyan">{p.rarity.charAt(0).toUpperCase() + p.rarity.slice(1)}</Tag>
        </div>
      )}
    </>
  );
}

function RankReachedContent({ payload, color }: { payload: Record<string, unknown>; color: string }) {
  const p = payload as { rank?: string; level?: number };
  const rankColor = p.rank ? (RANK_COLORS[p.rank] ?? color) : color;
  return (
    <>
      <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
        alcançou o rank{" "}
        <span className="font-bold" style={{ color: rankColor }}>{p.rank ? (RANK_LABELS[p.rank] ?? p.rank) : "novo rank"}</span>! 🚀
      </p>
    </>
  );
}

function SeasonStartedContent({ payload, color }: { payload: Record<string, unknown>; color: string }) {
  const p = payload as { season_name?: string };
  return (
    <p className="mt-0.5 text-sm text-[#F5F5F5]/55">
      entrou na temporada{" "}
      <span className="font-bold" style={{ color }}>{p.season_name ?? "nova temporada"}</span> 🗓️
    </p>
  );
}

// ── Main FeedCard ─────────────────────────────────────────────────────────────

function getCommentContext(event: FeedEvent, name: string, color: string) {
  const payload = event.payload;

  switch (event.event_type) {
    case "run": {
      const p = payload as { distance?: number; pace?: string; duration?: string };
      const distance = Number(p.distance ?? 0).toFixed(2).replace(".", ",");
      return {
        title: `${name} completou ${distance} km`,
        detail: [p.pace ? `${p.pace}/km` : null, p.duration ?? null].filter(Boolean).join(" · "),
        color,
      };
    }
    case "workout": {
      const p = payload as { muscle_group?: string; muscle_groups?: string[]; duration_minutes?: number };
      const muscleKeys = p.muscle_groups?.length ? p.muscle_groups : (p.muscle_group ? [p.muscle_group] : []);
      const muscle = muscleKeys.length ? muscleKeys.map(getMuscleGroupLabel).join(", ") : "musculação";
      return {
        title: `${name} treinou ${muscle}`,
        detail: p.duration_minutes ? `${p.duration_minutes} min` : "Treino registrado",
        color,
      };
    }
    case "level_up": {
      const p = payload as { new_level?: number };
      return { title: `${name} subiu de nível`, detail: `Nível ${p.new_level ?? "?"}`, color };
    }
    case "streak": {
      const p = payload as { streak_days?: number };
      return { title: `${name} manteve a sequência`, detail: `${p.streak_days ?? 0} dias`, color };
    }
    case "exclusive_trophy": {
      const p = payload as { trophy_name?: string };
      return { title: `${name} recebeu um troféu`, detail: p.trophy_name ?? "Troféu exclusivo", color };
    }
    default:
      return { title: `Publicação de ${name}`, detail: "Feed GymPace", color };
  }
}

export function FeedCard({ event }: { event: FeedEvent }) {
  const { event_type: type, payload, created_at, profile } = event;
  const name = profile?.display_name ?? profile?.username ?? "Atleta";
  const profileHref = profile?.username ? `/perfil/${profile.username}` : undefined;
  const time = formatTimeAgo(created_at);
  const dateDetail = formatDateTime(created_at);
  const config = EVENT_CONFIG[type] ?? EVENT_CONFIG.run;
  const { Icon, color, badgeBg, cardBorder, cardBg } = config;
  const isSimpleEvent = SIMPLE_EVENT_TYPES.has(type);
  const commentContext = getCommentContext(event, name, color);

  const [commentsOpen, setCommentsOpen] = useState(false);

  function renderContent() {
    switch (type) {
      case "run":            return <RunContent payload={payload} color={color} />;
      case "workout":        return <WorkoutContent payload={payload} color={color} />;
      case "level_up":       return <LevelUpContent payload={payload} color={color} profile={profile} />;
      case "streak":         return <StreakContent payload={payload} color={color} />;
      case "personal_record":return <PersonalRecordContent payload={payload} color={color} />;
      case "streak_milestone":return <StreakMilestoneContent payload={payload} color={color} />;
      case "hybrid_bonus":   return <HybridBonusContent color={color} />;
      case "challenge_accepted": return <ChallengeAcceptedContent color={color} />;
      case "challenge_won":  return <ChallengeWonContent color={color} />;
      case "competition_joined": return <CompetitionJoinedContent color={color} />;
      case "exclusive_trophy": return <ExclusiveTrophyContent payload={payload} color={color} />;
      case "rank_reached":   return <RankReachedContent payload={payload} color={color} />;
      case "season_started": return <SeasonStartedContent payload={payload} color={color} />;
      default:               return null;
    }
  }

  return (
    <>
      <article
        className={cn(
          "group relative flex rounded-2xl border transition-colors duration-100",
          isSimpleEvent ? "gap-3 p-3" : "gap-3 p-3.5 sm:p-4",
          cardBorder,
          cardBg
        )}
      >
        {/* Avatar + event type badge */}
        <div className={cn("relative shrink-0", isSimpleEvent ? "mt-0" : "mt-0.5")}>
          <UserAvatar profile={profile} name={name} />
          <div
            className={cn(
              "absolute -bottom-1 -right-1 grid place-items-center rounded-full ring-2 ring-[#111111]",
              isSimpleEvent ? "size-5" : "size-[18px]",
              badgeBg
            )}
          >
            <Icon className={isSimpleEvent ? "size-3" : "size-2.5"} strokeWidth={2.5} style={{ color }} />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name + time */}
          <div className="flex items-start justify-between gap-2">
            {profileHref ? (
              <Link
                href={profileHref}
                prefetch
                className="mobile-tap min-w-0 truncate text-[13px] font-bold leading-5 text-[#F5F5F5] transition-colors duration-100 active:opacity-80 hover:text-[#B6FF00]"
              >
                {name}
              </Link>
            ) : (
              <span className="min-w-0 truncate text-[13px] font-bold leading-5 text-[#F5F5F5]">{name}</span>
            )}
            <span className="shrink-0 rounded-full bg-white/[0.035] px-2 py-0.5 text-[10px] font-medium tabular-nums text-[#F5F5F5]/34">{time}</span>
          </div>

          {/* Event content */}
          {renderContent()}

          {/* Footer: date + reactions + comments */}
          <div className={cn("flex items-center justify-between gap-2", isSimpleEvent ? "mt-2" : "mt-3")}>
            <p className="truncate text-[10px] text-[#F5F5F5]/24">{dateDetail}</p>
            <div className="flex shrink-0 items-center gap-1.5">
              {/* Comments button */}
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                aria-label="Comentários"
                className="mobile-tap flex min-h-8 items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.035] px-2.5 py-1 text-xs text-[#F5F5F5]/48 transition-all duration-150 hover:bg-white/[0.06] hover:text-[#F5F5F5]/70 active:scale-95"
              >
                <MessageCircle className="size-3.5" strokeWidth={1.8} />
                {event.comment_count > 0 && (
                  <span className="font-semibold tabular-nums">{event.comment_count}</span>
                )}
              </button>

              <ReactionButton
                feedEventId={event.id}
                initialCount={event.reaction_count}
                initialReacted={event.user_has_reacted}
              />
            </div>
          </div>
        </div>
      </article>

      {commentsOpen && (
        <CommentsDrawer
          feedEventId={event.id}
          initialCount={event.comment_count}
          postContext={commentContext}
          onClose={() => setCommentsOpen(false)}
        />
      )}
    </>
  );
}
