"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Timer, Route, Dumbbell, Zap, ChevronRight } from "lucide-react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { GOAL_CONFIG, type GoalType } from "@/lib/challenge-progress";

type SearchUser = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_id: string | null;
};

const GOAL_ICONS: Record<GoalType, React.ElementType> = {
  runs_count:     Timer,
  distance_km:    Route,
  gym_sessions:   Dumbbell,
  total_workouts: Zap,
};

const DURATION_OPTIONS = [3, 7, 14, 30];

const GOAL_DEFAULTS: Record<GoalType, number> = {
  runs_count:     10,
  distance_km:    50,
  gym_sessions:   10,
  total_workouts: 15,
};

const AUTO_TITLES: Record<GoalType, string> = {
  runs_count:     "Quem corre mais?",
  distance_km:    "Duelo de distância",
  gym_sessions:   "Rei da academia",
  total_workouts: "Desafio total",
};

interface CreateChallengeFormProps {
  prefilledUserId?: string;
  prefilledDisplayName?: string;
  prefilledUsername?: string;
  prefilledAvatarId?: string | null;
}

export function CreateChallengeForm({
  prefilledUserId,
  prefilledDisplayName,
  prefilledUsername,
  prefilledAvatarId,
}: CreateChallengeFormProps) {
  const router = useRouter();

  // Opponent state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(
    prefilledUserId
      ? {
          user_id: prefilledUserId,
          display_name: prefilledDisplayName ?? null,
          username: prefilledUsername ?? null,
          avatar_id: prefilledAvatarId ?? null,
        }
      : null
  );

  // Challenge config state
  const [goalType, setGoalType] = useState<GoalType>("distance_km");
  const [targetValue, setTargetValue] = useState<string>(
    String(GOAL_DEFAULTS["distance_km"])
  );
  const [durationDays, setDurationDays] = useState(7);
  const [title, setTitle] = useState(AUTO_TITLES["distance_km"]);
  const [description, setDescription] = useState("");

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    if (searchRef.current) clearTimeout(searchRef.current);
    setIsSearching(true);
    searchRef.current = setTimeout(async () => {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const json = await res.json().catch(() => ({ results: [] }));
      setResults((json as { results: SearchUser[] }).results ?? []);
      setIsSearching(false);
    }, 320);
  }, [query]);

  // Sync auto-title and default target when goal type changes
  function handleGoalTypeChange(type: GoalType) {
    setGoalType(type);
    setTargetValue(String(GOAL_DEFAULTS[type]));
    setTitle(AUTO_TITLES[type]);
  }

  function selectUser(u: SearchUser) {
    setSelectedUser(u);
    setQuery("");
    setResults([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    const tv = parseFloat(targetValue);
    if (!isFinite(tv) || tv <= 0) {
      setSubmitError("Meta inválida");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challenged_id: selectedUser.user_id,
        title: title.trim() || AUTO_TITLES[goalType],
        description: description.trim() || null,
        goal_type: goalType,
        target_value: tv,
        duration_days: durationDays,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitError((json as { error?: string }).error ?? "Erro ao criar desafio");
      setIsSubmitting(false);
      return;
    }

    router.push(`/desafios/${(json as { id: string }).id}`);
  }

  const opponentName =
    selectedUser?.display_name || selectedUser?.username || "Atleta";
  const opponentInitials = opponentName[0].toUpperCase();
  const goalCfg = GOAL_CONFIG[goalType];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Step 1: Opponent ── */}
      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/35">
          1. Escolher adversário
        </h2>

        {selectedUser ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[#B6FF00]/[0.18] bg-[#B6FF00]/[0.06] px-4 py-3">
            <AvatarDisplay
              avatarId={selectedUser.avatar_id}
              initials={opponentInitials}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#F5F5F5]/90">{opponentName}</p>
              {selectedUser.username && (
                <p className="text-xs text-[#F5F5F5]/38">@{selectedUser.username}</p>
              )}
            </div>
            {!prefilledUserId && (
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="grid size-7 place-items-center rounded-lg text-[#F5F5F5]/35 transition-colors hover:text-[#F5F5F5]/70"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
              <Search className="size-4 text-[#F5F5F5]/28" strokeWidth={1.8} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou @usuário..."
              className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-[#F5F5F5] placeholder:text-[#F5F5F5]/28 focus:outline-none focus:ring-2 focus:ring-[#B6FF00]/30"
            />
            {/* Dropdown */}
            {(results.length > 0 || isSearching) && (
              <div className="absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#141414] shadow-2xl">
                {isSearching ? (
                  <div className="px-4 py-3 text-xs text-[#F5F5F5]/38">
                    Buscando...
                  </div>
                ) : (
                  results.map((u) => {
                    const name = u.display_name || u.username || "Atleta";
                    return (
                      <button
                        key={u.user_id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                      >
                        <AvatarDisplay
                          avatarId={u.avatar_id}
                          initials={name[0].toUpperCase()}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#F5F5F5]/80">
                            {name}
                          </p>
                          {u.username && (
                            <p className="text-xs text-[#F5F5F5]/35">@{u.username}</p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Step 2: Goal type ── */}
      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/35">
          2. Modalidade
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(GOAL_CONFIG) as GoalType[]).map((type) => {
            const cfg = GOAL_CONFIG[type];
            const Icon = GOAL_ICONS[type];
            const isActive = goalType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleGoalTypeChange(type)}
                className="flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition-all duration-150 active:scale-[0.97]"
                style={
                  isActive
                    ? {
                        borderColor: cfg.color + "40",
                        background: cfg.color + "0F",
                        color: cfg.color,
                      }
                    : {
                        borderColor: "rgba(255,255,255,0.07)",
                        background: "rgba(255,255,255,0.025)",
                        color: "rgba(245,245,245,0.45)",
                      }
                }
              >
                <Icon className="size-4 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold leading-tight">{cfg.label}</p>
                  <p className="text-[9.5px] leading-tight opacity-60">
                    em {cfg.unit}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Step 3: Target + duration ── */}
      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/35">
          3. Meta e duração
        </h2>

        {/* Target value */}
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/30">
              Meta — {goalCfg.unit}
            </label>
            <input
              type="number"
              value={targetValue}
              min="1"
              step={goalType === "distance_km" ? "0.5" : "1"}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full bg-transparent text-xl font-bold text-[#F5F5F5]/90 placeholder:text-[#F5F5F5]/20 focus:outline-none"
              placeholder="0"
              style={{ color: goalCfg.color }}
            />
          </div>
          <span
            className="shrink-0 text-sm font-semibold opacity-60"
            style={{ color: goalCfg.color }}
          >
            {goalCfg.unit}
          </span>
        </div>

        {/* Duration */}
        <div className="flex gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDurationDays(d)}
              className="flex-1 rounded-xl border py-2.5 text-[11px] font-bold transition-all duration-150"
              style={
                durationDays === d
                  ? {
                      borderColor: "#B6FF00" + "40",
                      background: "#B6FF00" + "0F",
                      color: "#B6FF00",
                    }
                  : {
                      borderColor: "rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.025)",
                      color: "rgba(245,245,245,0.38)",
                    }
              }
            >
              {d}d
            </button>
          ))}
        </div>
      </section>

      {/* ── Step 4: Title (optional) ── */}
      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/35">
          4. Título (opcional)
        </h2>
        <input
          type="text"
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-[#F5F5F5]/85 placeholder:text-[#F5F5F5]/25 focus:outline-none focus:ring-2 focus:ring-[#B6FF00]/25"
          placeholder={AUTO_TITLES[goalType]}
        />
      </section>

      {/* ── Error ── */}
      {submitError && (
        <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
          {submitError}
        </p>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={!selectedUser || isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-[#080808] transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
        style={{
          background: "#B6FF00",
          boxShadow: "0 0 24px rgba(182,255,0,0.30)",
        }}
      >
        {isSubmitting ? (
          "Enviando desafio..."
        ) : (
          <>
            Enviar desafio
            <ChevronRight className="size-4" strokeWidth={2.5} />
          </>
        )}
      </button>
    </form>
  );
}
