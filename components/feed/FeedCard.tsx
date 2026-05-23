"use client";

import {
  Activity,
  Award,
  Calendar,
  Dumbbell,
  Flame,
  Heart,
  MessageCircle,
  Swords,
  Trophy,
  Users,
  Zap,
  Star,
  TrendingUp,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { memo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { FeedRoutePreview } from "@/components/feed/FeedRoutePreview";
import { ReactionButton } from "@/components/feed/ReactionButton";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { formatDateTime, formatTimeAgo } from "@/lib/date-utils";
import type { FeedEvent, FeedProfile } from "@/lib/feed";
import { getMuscleGroupLabel } from "@/lib/muscles";
import { cn } from "@/lib/utils";

const CommentsDrawer = dynamic(
  () => import("@/components/feed/CommentsDrawer").then((mod) => ({ default: mod.CommentsDrawer })),
  { ssr: false }
);

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

const ACHIEVEMENT_EVENTS = new Set(["challenge_won", "competition_won", "exclusive_trophy", "rank_reached"]);

type TagColor = "lime" | "cyan" | "amber" | "orange" | "purple" | "neutral";

const TAG_STYLES: Record<TagColor, string> = {
  lime: "border-[#B6FF00]/25 bg-[#B6FF00]/[0.08] text-[#B6FF00]/80",
  cyan: "border-[#22D3EE]/25 bg-[#22D3EE]/[0.08] text-[#22D3EE]/80",
  amber: "border-[#F59E0B]/25 bg-[#F59E0B]/[0.08] text-[#F59E0B]/80",
  orange: "border-[#F97316]/25 bg-[#F97316]/[0.08] text-[#F97316]/80",
  purple: "border-[#A78BFA]/25 bg-[#A78BFA]/[0.08] text-[#A78BFA]/80",
  neutral: "border-white/[0.09] bg-white/[0.04] text-[#F5F5F5]/45",
};

type EventConfig = {
  Icon: ElementType;
  color: string;
  badgeBg: string;
  cardBorder: string;
  cardBg: string;
  label: string;
};

const EVENT_CONFIG: Record<string, EventConfig> = {
  run: {
    Icon: Activity,
    color: "#B6FF00",
    badgeBg: "bg-[#B6FF00]/18",
    cardBorder: "border-white/[0.07] hover:border-[#B6FF00]/18",
    cardBg: "bg-[#111111] hover:bg-[#131313]",
    label: "Corrida",
  },
  workout: {
    Icon: Dumbbell,
    color: "#3B82F6",
    badgeBg: "bg-[#3B82F6]/18",
    cardBorder: "border-white/[0.07] hover:border-[#3B82F6]/18",
    cardBg: "bg-[#111111] hover:bg-[#111417]",
    label: "Treino",
  },
  level_up: {
    Icon: Trophy,
    color: "#F59E0B",
    badgeBg: "bg-[#F59E0B]/18",
    cardBorder: "border-[#F59E0B]/15 hover:border-[#F59E0B]/28",
    cardBg: "bg-[#F59E0B]/[0.03] hover:bg-[#F59E0B]/[0.05]",
    label: "Nível",
  },
  streak: {
    Icon: Flame,
    color: "#F97316",
    badgeBg: "bg-[#F97316]/18",
    cardBorder: "border-[#F97316]/15 hover:border-[#F97316]/28",
    cardBg: "bg-[#F97316]/[0.03] hover:bg-[#F97316]/[0.05]",
    label: "Sequência",
  },
  personal_record: {
    Icon: Star,
    color: "#A78BFA",
    badgeBg: "bg-[#A78BFA]/18",
    cardBorder: "border-[#A78BFA]/18 hover:border-[#A78BFA]/32",
    cardBg: "bg-[#A78BFA]/[0.03] hover:bg-[#A78BFA]/[0.05]",
    label: "Recorde",
  },
  streak_milestone: {
    Icon: Flame,
    color: "#FB923C",
    badgeBg: "bg-[#FB923C]/18",
    cardBorder: "border-[#FB923C]/18 hover:border-[#FB923C]/32",
    cardBg: "bg-[#FB923C]/[0.03] hover:bg-[#FB923C]/[0.05]",
    label: "Marco",
  },
  hybrid_bonus: {
    Icon: Zap,
    color: "#22D3EE",
    badgeBg: "bg-[#22D3EE]/18",
    cardBorder: "border-[#22D3EE]/18 hover:border-[#22D3EE]/32",
    cardBg: "bg-[#22D3EE]/[0.03] hover:bg-[#22D3EE]/[0.05]",
    label: "Bônus",
  },
  challenge_accepted: {
    Icon: Swords,
    color: "#FB923C",
    badgeBg: "bg-[#FB923C]/18",
    cardBorder: "border-[#FB923C]/15 hover:border-[#FB923C]/28",
    cardBg: "bg-[#111111] hover:bg-[#131311]",
    label: "Duelo",
  },
  challenge_won: {
    Icon: Trophy,
    color: "#EAB308",
    badgeBg: "bg-[#EAB308]/18",
    cardBorder: "border-[#EAB308]/25 hover:border-[#EAB308]/40",
    cardBg: "bg-[#EAB308]/[0.035] hover:bg-[#EAB308]/[0.055]",
    label: "Conquista",
  },
  competition_joined: {
    Icon: Users,
    color: "#A78BFA",
    badgeBg: "bg-[#A78BFA]/18",
    cardBorder: "border-white/[0.07] hover:border-[#A78BFA]/20",
    cardBg: "bg-[#111111] hover:bg-[#121118]",
    label: "Competição",
  },
  competition_won: {
    Icon: Trophy,
    color: "#EAB308",
    badgeBg: "bg-[#EAB308]/18",
    cardBorder: "border-[#EAB308]/25 hover:border-[#EAB308]/40",
    cardBg: "bg-[#EAB308]/[0.035] hover:bg-[#EAB308]/[0.055]",
    label: "Conquista",
  },
  exclusive_trophy: {
    Icon: Award,
    color: "#22D3EE",
    badgeBg: "bg-[#22D3EE]/18",
    cardBorder: "border-[#22D3EE]/22 hover:border-[#22D3EE]/40",
    cardBg: "bg-[#22D3EE]/[0.035] hover:bg-[#22D3EE]/[0.055]",
    label: "Troféu",
  },
  rank_reached: {
    Icon: TrendingUp,
    color: "#B6FF00",
    badgeBg: "bg-[#B6FF00]/18",
    cardBorder: "border-[#B6FF00]/18 hover:border-[#B6FF00]/32",
    cardBg: "bg-[#B6FF00]/[0.03] hover:bg-[#B6FF00]/[0.05]",
    label: "Rank",
  },
  season_started: {
    Icon: Calendar,
    color: "#A78BFA",
    badgeBg: "bg-[#A78BFA]/18",
    cardBorder: "border-[#A78BFA]/18 hover:border-[#A78BFA]/32",
    cardBg: "bg-[#A78BFA]/[0.03] hover:bg-[#A78BFA]/[0.05]",
    label: "Temporada",
  },
};

function Tag({ children, color }: { children: ReactNode; color: TagColor }) {
  return (
    <span className={cn("inline-flex min-h-5 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none", TAG_STYLES[color])}>
      {children}
    </span>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-[3px]">
      <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#F5F5F5]/28">{label}</span>
      <span className="truncate text-[13px] font-bold leading-none" style={color ? { color } : { color: "#F5F5F5" }}>
        {value}
      </span>
    </div>
  );
}

function StatsRow({ children, color }: { children: ReactNode; color: string }) {
  return (
    <div
      className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none"
      style={{ border: `1px solid ${color}16`, background: `${color}05` }}
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

function formatLevelXp(profile?: FeedProfile) {
  if (profile?.xp_into_level == null || profile?.xp_for_next_level == null) return null;
  return `${profile.xp_into_level.toLocaleString("pt-BR")} / ${profile.xp_for_next_level.toLocaleString("pt-BR")} XP`;
}

function UserAvatar({ profile, name }: { profile?: FeedProfile; name: string }) {
  const initials = name[0]?.toUpperCase() ?? "A";
  const avatar = <AvatarDisplay avatarId={profile?.avatar_id ?? null} initials={initials} size="sm" />;

  if (!profile?.username) return <>{avatar}</>;
  return (
    <Link href={`/perfil/${profile.username}`} prefetch className="mobile-tap block shrink-0 transition-opacity active:opacity-80 hover:opacity-75">
      {avatar}
    </Link>
  );
}

function EventBadge({ Icon, color, badgeBg, compact = false }: EventConfig & { compact?: boolean }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full border ring-2 ring-[#111111]",
        compact ? "size-5" : "size-8",
        badgeBg
      )}
      style={{ borderColor: `${color}24`, color }}
    >
      <Icon className={compact ? "size-3" : "size-4"} strokeWidth={compact ? 2.4 : 2.1} />
    </div>
  );
}

function ActionRow({
  event,
  dateDetail,
  onCommentsOpen,
  compact,
}: {
  event: FeedEvent;
  dateDetail: string;
  onCommentsOpen: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", compact ? "mt-2" : "mt-3")}>
      <p className="truncate text-[10px] text-[#F5F5F5]/22">{dateDetail}</p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onCommentsOpen}
          aria-label="Comentários"
          className="mobile-tap inline-flex min-h-7 items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.025] px-2 text-[11px] text-[#F5F5F5]/44 transition-all duration-150 hover:bg-white/[0.055] hover:text-[#F5F5F5]/70 active:scale-95"
        >
          <MessageCircle className="size-3.5" strokeWidth={1.7} />
          {event.comment_count > 0 && <span className="font-semibold tabular-nums">{event.comment_count}</span>}
        </button>
        <ReactionButton feedEventId={event.id} initialCount={event.reaction_count} initialReacted={event.user_has_reacted} />
      </div>
    </div>
  );
}

function RunContent({ payload, color }: { payload: Record<string, unknown>; color: string }) {
  const p = payload as {
    id?: string;
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
      <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
        completou <span className="font-bold" style={{ color }}>{dist} km</span>
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
          {p.avg_speed != null && <Tag color="neutral">{Number(p.avg_speed).toFixed(1)} km/h</Tag>}
        </div>
      )}

      {p.id && <FeedRoutePreview runId={p.id} />}
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
  const muscleKeys = p.muscle_groups?.length ? p.muscle_groups : p.muscle_group ? [p.muscle_group] : [];
  const muscle = muscleKeys.length ? muscleKeys.map(getMuscleGroupLabel).join(", ") : "musculação";
  const intensityColorMap: Record<string, TagColor> = { leve: "lime", moderado: "amber", intenso: "orange" };
  const intensityColor: TagColor = intensityColorMap[p.intensity ?? ""] ?? "neutral";
  const hasCols = [p.duration_minutes, p.workout_split].filter(Boolean).length;

  return (
    <>
      <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
        treinou <span className="font-bold" style={{ color }}>{muscle}</span>
      </p>

      {hasCols > 0 && (
        <StatsRow color={color}>
          {p.duration_minutes != null && <StatsCell label="Duração" value={`${p.duration_minutes} min`} color={color} />}
          {p.workout_split && <StatsCell label="Split" value={SPLIT_LABELS[p.workout_split] ?? p.workout_split} last />}
        </StatsRow>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.title && <Tag color="neutral">{p.title}</Tag>}
        {p.intensity && <Tag color={intensityColor}>{INTENSITY_LABELS[p.intensity] ?? p.intensity}</Tag>}
        {p.muscle_details?.slice(0, 3).map((detail) => (
          <Tag key={detail} color="neutral">{detail}</Tag>
        ))}
      </div>
    </>
  );
}

function StandardEventContent({
  type,
  payload,
  color,
  profile,
}: {
  type: string;
  payload: Record<string, unknown>;
  color: string;
  profile?: FeedProfile;
}) {
  switch (type) {
    case "level_up": {
      const p = payload as { new_level?: number; new_rank?: string };
      const rankColor = p.new_rank ? RANK_COLORS[p.new_rank] ?? color : color;
      const levelXp = formatLevelXp(profile);
      return (
        <>
          <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
            subiu para <span className="font-bold" style={{ color }}>Nível {p.new_level ?? "?"}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.new_rank && (
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                style={{ color: rankColor, borderColor: `${rankColor}44`, background: `${rankColor}14` }}
              >
                {RANK_LABELS[p.new_rank] ?? p.new_rank}
              </span>
            )}
            {levelXp && <Tag color="amber">{levelXp}</Tag>}
          </div>
        </>
      );
    }
    case "streak": {
      const p = payload as { streak_days?: number };
      return (
        <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
          mantém uma sequência de <span className="font-bold" style={{ color }}>{p.streak_days ?? 0} dias</span>
        </p>
      );
    }
    case "personal_record": {
      const p = payload as { label?: string; distance?: number; pace?: string };
      return (
        <>
          <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
            novo recorde pessoal: <span className="font-bold" style={{ color }}>{p.label ?? "PR"}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.distance != null && <Tag color="neutral">{Number(p.distance).toFixed(1)} km</Tag>}
            {p.pace && <Tag color="purple">{p.pace}/km</Tag>}
          </div>
        </>
      );
    }
    case "streak_milestone": {
      const p = payload as { streak_days?: number };
      return (
        <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
          atingiu <span className="font-bold" style={{ color }}>{p.streak_days} dias</span> de sequência ininterrupta
        </p>
      );
    }
    case "hybrid_bonus":
      return (
        <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
          conquistou o <span className="font-bold" style={{ color }}>Bônus Híbrido</span> por combinar corrida e treino
        </p>
      );
    case "challenge_accepted":
      return (
        <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
          aceitou um <span className="font-bold" style={{ color }}>desafio</span> e o duelo começou
        </p>
      );
    case "competition_joined":
      return (
        <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
          entrou em uma <span className="font-bold" style={{ color }}>competição</span>
        </p>
      );
    case "season_started": {
      const p = payload as { season_name?: string };
      return (
        <p className="mt-0.5 text-sm text-[#F5F5F5]/58">
          entrou na temporada <span className="font-bold" style={{ color }}>{p.season_name ?? "nova temporada"}</span>
        </p>
      );
    }
    default:
      return null;
  }
}

function getAchievementCopy(type: string, payload: Record<string, unknown>, color: string) {
  if (type === "challenge_won") {
    return {
      eyebrow: "Conquista",
      title: "Duelo vencido",
      detail: "Recebeu um troféu exclusivo no perfil.",
      tags: [<Tag key="trophy" color="amber">Troféu exclusivo</Tag>],
    };
  }

  if (type === "competition_won") {
    const p = payload as { trophy_name?: string; progress?: number; target?: number };
    return {
      eyebrow: "Conquista",
      title: "Campeão da competição",
      detail: p.trophy_name ? `Recebeu ${p.trophy_name}.` : "Recebeu um troféu exclusivo no perfil.",
      tags: [
        <Tag key="champion" color="amber">Campeão</Tag>,
        typeof p.progress === "number" && typeof p.target === "number" ? (
          <Tag key="progress" color="neutral">{p.progress}/{p.target}</Tag>
        ) : null,
      ].filter(Boolean) as ReactNode[],
    };
  }

  if (type === "exclusive_trophy") {
    const p = payload as { trophy_name?: string; rarity?: string };
    return {
      eyebrow: "Troféu",
      title: p.trophy_name ?? "Troféu exclusivo",
      detail: "Nova conquista em exibição no perfil.",
      tags: [p.rarity ? <Tag key="rarity" color="cyan">{p.rarity}</Tag> : null].filter(Boolean) as ReactNode[],
    };
  }

  const p = payload as { rank?: string };
  const rank = p.rank ? RANK_LABELS[p.rank] ?? p.rank : "novo rank";
  return {
    eyebrow: "Evolução",
    title: `Rank ${rank} alcançado`,
    detail: "Novo patamar competitivo desbloqueado.",
    tags: [<Tag key="rank" color="lime">Rank</Tag>],
    color: p.rank ? RANK_COLORS[p.rank] ?? color : color,
  };
}

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
      const muscleKeys = p.muscle_groups?.length ? p.muscle_groups : p.muscle_group ? [p.muscle_group] : [];
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
    case "competition_won":
      return { title: `${name} venceu uma competição`, detail: "Conquista GymPace", color };
    case "challenge_won":
      return { title: `${name} venceu um desafio`, detail: "Conquista GymPace", color };
    default:
      return { title: `Publicação de ${name}`, detail: "Feed GymPace", color };
  }
}

function FeedCardComponent({ event }: { event: FeedEvent }) {
  const { event_type: type, payload, created_at, profile } = event;
  const name = profile?.display_name ?? profile?.username ?? "Atleta";
  const profileHref = profile?.username ? `/perfil/${profile.username}` : undefined;
  const time = formatTimeAgo(created_at);
  const dateDetail = formatDateTime(created_at);
  const config = EVENT_CONFIG[type] ?? EVENT_CONFIG.run;
  const { Icon, color, cardBorder, cardBg, label } = config;
  const isAchievement = ACHIEVEMENT_EVENTS.has(type);
  const commentContext = getCommentContext(event, name, color);
  const [commentsOpen, setCommentsOpen] = useState(false);

  function renderMainContent() {
    if (type === "run") return <RunContent payload={payload} color={color} />;
    if (type === "workout") return <WorkoutContent payload={payload} color={color} />;
    return <StandardEventContent type={type} payload={payload} color={color} profile={profile} />;
  }

  function renderIdentity() {
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {profileHref ? (
            <Link
              href={profileHref}
              prefetch
              className="mobile-tap min-w-0 truncate text-[13px] font-bold leading-5 text-[#F5F5F5] transition-colors active:opacity-80 hover:text-[#B6FF00]"
            >
              {name}
            </Link>
          ) : (
            <span className="min-w-0 truncate text-[13px] font-bold leading-5 text-[#F5F5F5]">{name}</span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-white/[0.035] px-2 py-0.5 text-[10px] font-medium tabular-nums text-[#F5F5F5]/32">
          {time}
        </span>
      </div>
    );
  }

  return (
    <>
      {isAchievement ? (
        <article
          className={cn("group relative overflow-hidden rounded-2xl border p-4 transition-colors duration-150 sm:p-5", cardBorder, cardBg)}
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }} />
          <div className="pointer-events-none absolute -right-14 -top-16 size-36 rounded-full blur-[72px]" style={{ background: `${color}16` }} />

          <div className="relative flex gap-3">
            <div className="shrink-0">
              <UserAvatar profile={profile} name={name} />
            </div>

            <div className="min-w-0 flex-1">
              {renderIdentity()}
              <div className="mt-3 flex gap-3">
                <div
                  className="grid size-10 shrink-0 place-items-center rounded-2xl border"
                  style={{ borderColor: `${color}28`, background: `${color}12`, color }}
                >
                  <Icon className="size-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  {(() => {
                    const copy = getAchievementCopy(type, payload, color);
                    return (
                      <>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: copy.color ?? color }}>
                            {copy.eyebrow}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.035] px-2 py-0.5 text-[10px] font-semibold text-[#F5F5F5]/36">
                            <Heart className="size-3" strokeWidth={1.7} />
                            Destaque
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold leading-tight text-[#F5F5F5]">
                          {copy.title}
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-[#F5F5F5]/48">{copy.detail}</p>
                        {copy.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{copy.tags}</div>}
                      </>
                    );
                  })()}
                </div>
              </div>
              <ActionRow event={event} dateDetail={dateDetail} compact onCommentsOpen={() => setCommentsOpen(true)} />
            </div>
          </div>
        </article>
      ) : (
        <article
          className={cn("group relative flex gap-3 rounded-2xl border p-4 transition-colors duration-150 sm:p-5", cardBorder, cardBg)}
        >
          <div className="shrink-0 mt-0.5">
            <UserAvatar profile={profile} name={name} />
          </div>

          <div className="min-w-0 flex-1">
            {renderIdentity()}
            <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-white/[0.025] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/26">
              <Icon className="size-3" style={{ color }} strokeWidth={2} />
              {label}
            </div>
            {renderMainContent()}
            <ActionRow event={event} dateDetail={dateDetail} onCommentsOpen={() => setCommentsOpen(true)} />
          </div>
        </article>
      )}

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

export const FeedCard = memo(FeedCardComponent);
