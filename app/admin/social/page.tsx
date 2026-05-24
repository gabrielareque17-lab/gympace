"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Bell, Gift, Loader2, Search, Shield, Sparkles, Trophy, UserRound } from "lucide-react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { AvatarSVG } from "@/components/ui/avatar/avatar-svg";
import type { AvatarDefinition, AvatarRarity, AvatarType } from "@/lib/avatar-registry";

type AdminUser = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_id: string | null;
  current_level: number | null;
  total_xp: number | null;
  rank: string | null;
  is_admin: boolean | null;
  last_seen_at: string | null;
};

type TrophyRow = {
  id: string;
  name: string;
  description: string | null;
  rarity: string;
  visual: string;
};

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
const RARITIES = ["common", "rare", "epic", "legendary", "mythic"];
const CUSTOM_AVATAR_RARITIES: Array<{ value: AvatarRarity; label: string }> = [
  { value: "common", label: "Comum" },
  { value: "rare", label: "Raro" },
  { value: "epic", label: "Epico" },
  { value: "legendary", label: "Lendario" },
];
const AVATAR_TYPES: Array<{ value: AvatarType; label: string }> = [
  { value: "power_athlete", label: "Premium" },
  { value: "runner", label: "Corrida" },
  { value: "gym_rat", label: "Musculacao" },
  { value: "hybrid_athlete", label: "Hibrido" },
];

const RARITY_COLORS: Record<string, string> = {
  common: "#94A3B8",
  rare: "#22D3EE",
  epic: "#A78BFA",
  legendary: "#EAB308",
  mythic: "#B6FF00",
  seasonal: "#FACC15",
};

const RARITY_LABELS_PT: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const HAIR_STYLE_OPTIONS = ['careca', 'curto', 'topete', 'raspado', 'moicano', 'medio', 'afro', 'rabo', 'ondulado', 'longo', 'cacheado'] as const;
const HAIR_STYLE_LABELS: Record<string, string> = {
  careca: 'Careca', curto: 'Curto', topete: 'Topete', raspado: 'Raspado',
  moicano: 'Moicano', medio: 'Médio', afro: 'Afro', rabo: 'Rabo', ondulado: 'Ondulado',
  longo: 'Longo', cacheado: 'Cacheado',
};
const FACE_STYLE_OPTIONS = ['confiante', 'serio', 'feliz', 'focado'] as const;
const FACE_STYLE_LABELS: Record<string, string> = {
  confiante: 'Confiante', serio: 'Sério', feliz: 'Feliz', focado: 'Focado',
};
const ACCESSORY_OPTIONS = [
  { value: 'none', label: 'Nenhum' },
  { value: 'bone', label: 'Boné' },
  { value: 'headphone', label: 'Fone' },
  { value: 'oculos', label: 'Óculos' },
] as const;

function buildDefinitionFromRow(row: CustomAvatarRow): AvatarDefinition {
  const ac = row.primary_color ?? row.accent_color;
  const cat = row.type === 'runner' ? 'running' as const
    : row.type === 'gym_rat' ? 'gym' as const
    : row.type === 'hybrid_athlete' ? 'hybrid' as const
    : 'premium' as const;
  return {
    id: row.id,
    type: row.type,
    category: cat,
    label: row.name ?? row.label,
    description: row.description,
    accentColor: ac,
    secondaryColor: row.secondary_color,
    glowColor: `${ac}55`,
    rarity: row.rarity,
    unlock: { kind: 'admin' as const, label: row.unlock_label },
    female: row.gender === 'feminino',
    customVisual: {
      gender: row.gender,
      primaryColor: ac,
      backgroundColor: row.background_color ?? '#080808',
      outfitColor: row.outfit_color ?? ac,
      hairStyle: row.hair_style ?? 'curto',
      hairColor: row.hair_color ?? '#171717',
      faceStyle: row.face_style ?? 'confiante',
      accessory: row.accessory ?? 'none',
    },
  };
}

type CustomAvatarRow = {
  id: string;
  name: string | null;
  label: string;
  description: string;
  rarity: AvatarRarity;
  gender: "masculino" | "feminino" | "neutro";
  type: AvatarType;
  category: "running" | "gym" | "hybrid" | "premium";
  primary_color: string | null;
  accent_color: string;
  secondary_color: string;
  background_color: string | null;
  outfit_color: string | null;
  hair_style: string | null;
  hair_color: string | null;
  face_style: string | null;
  accessory: string | null;
  unlock_label: string;
  assigned_to: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

function getPresence(lastSeenAt: string | null): { dot: string; label: string } {
  if (!lastSeenAt) return { dot: "rgba(245,245,245,0.15)", label: "Nunca" };
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < ONLINE_THRESHOLD_MS) return { dot: "#22C55E", label: "Online" };
  if (diff < 60 * 60 * 1000) return { dot: "#EAB308", label: `${Math.floor(diff / 60000)}min atras` };
  if (diff < 24 * 60 * 60 * 1000) return { dot: "rgba(245,245,245,0.30)", label: `${Math.floor(diff / 3600000)}h atras` };
  return { dot: "rgba(245,245,245,0.15)", label: `${Math.floor(diff / 86400000)}d atras` };
}

export default function AdminSocialPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [trophies, setTrophies] = useState<TrophyRow[]>([]);
  const [customAvatars, setCustomAvatars] = useState<CustomAvatarRow[]>([]);
  const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedTrophyId, setSelectedTrophyId] = useState("");
  const [avatarSource, setAvatarSource] = useState("admin");
  const [avatarDraft, setAvatarDraft] = useState({
    label: "Champion",
    description: "Avatar exclusivo",
    rarity: "legendary" as AvatarRarity,
    gender: "neutro" as "masculino" | "feminino" | "neutro",
    type: "power_athlete" as AvatarType,
    accentColor: "#FACC15",
    backgroundColor: "#080808",
    outfitColor: "#FACC15",
    secondaryColor: "#FFF4A3",
    hairStyle: "curto",
    hairColor: "#171717",
    faceStyle: "confiante",
    accessory: "none",
    isActive: true,
    unlockLabel: "Exclusivo",
    trophyName: "Champion",
    trophyDescription: "Avatar exclusivo entregue pela equipe GymPace.",
  });
  const [trophyDraft, setTrophyDraft] = useState({
    name: "",
    description: "",
    rarity: "rare",
    visual: "trophy",
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedUser = useMemo(
    () => users.find((u) => u.user_id === selectedUserId),
    [users, selectedUserId]
  );

  const avatarPreviewId = useMemo(() => {
    const slug = avatarDraft.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "avatar";
    const gToken = avatarDraft.gender === "feminino" ? "f" : "m";
    return `custom-preview-${slug}-${gToken}`;
  }, [avatarDraft.label, avatarDraft.gender]);

  const avatarPreviewDefinition = useMemo<AvatarDefinition>(() => ({
    id: avatarPreviewId,
    type: avatarDraft.type,
    category: avatarDraft.type === "runner" ? "running" : avatarDraft.type === "gym_rat" ? "gym" : avatarDraft.type === "hybrid_athlete" ? "hybrid" : "premium",
    label: avatarDraft.label || "Preview do avatar",
    description: avatarDraft.description || "Avatar personalizado criado para um usuario especifico.",
    accentColor: avatarDraft.accentColor,
    secondaryColor: avatarDraft.secondaryColor,
    glowColor: `${avatarDraft.accentColor}55`,
    rarity: avatarDraft.rarity,
    unlock: { kind: "admin", label: avatarDraft.unlockLabel || "Exclusivo" },
    female: avatarDraft.gender === "feminino",
    customVisual: {
      gender: avatarDraft.gender,
      primaryColor: avatarDraft.accentColor,
      backgroundColor: avatarDraft.backgroundColor,
      outfitColor: avatarDraft.outfitColor,
      hairStyle: avatarDraft.hairStyle,
      hairColor: avatarDraft.hairColor,
      faceStyle: avatarDraft.faceStyle,
      accessory: avatarDraft.accessory,
    },
  }), [avatarDraft, avatarPreviewId]);

  async function loadUsers(q = "") {
    const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const json = await res.json();
    if (res.ok) setUsers(json.users ?? []);
  }

  async function loadTrophies() {
    const res = await fetch("/api/admin/trophies");
    const json = await res.json();
    if (res.ok) setTrophies(json.trophies ?? []);
  }

  async function loadAvatars() {
    const res = await fetch("/api/admin/avatars");
    const json = await res.json();
    if (res.ok) setCustomAvatars(json.customAvatars ?? []);
  }

  useEffect(() => {
    void Promise.resolve().then(() => Promise.all([loadUsers(), loadTrophies(), loadAvatars()]));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers(query);
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    void loadUsers(query);
  }

  function createTrophy(formData: FormData) {
    setNotice("");
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/trophies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
          rarity: formData.get("rarity"),
          visual: formData.get("visual"),
          is_unique: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Erro ao criar trofeu.");
        return;
      }
      setNotice("Trofeu criado.");
      setTrophyDraft({ name: "", description: "", rarity: "rare", visual: "trophy" });
      await loadTrophies();
    });
  }

  function awardTrophy(formData: FormData) {
    setNotice("");
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/trophies/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          trophy_id: selectedTrophyId,
          note: formData.get("note"),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Erro ao entregar trofeu.");
        return;
      }
      setNotice("Trofeu entregue.");
    });
  }

  function unlockAvatar() {
    setNotice("");
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          source: avatarSource,
          custom_avatar: {
            label: avatarDraft.label,
            description: avatarDraft.description,
            rarity: avatarDraft.rarity,
            gender: avatarDraft.gender,
            type: avatarDraft.type,
            primary_color: avatarDraft.accentColor,
            accent_color: avatarDraft.accentColor,
            secondary_color: avatarDraft.secondaryColor,
            background_color: avatarDraft.backgroundColor,
            outfit_color: avatarDraft.outfitColor,
            hair_style: avatarDraft.hairStyle,
            hair_color: avatarDraft.hairColor,
            face_style: avatarDraft.faceStyle,
            accessory: avatarDraft.accessory,
            is_active: avatarDraft.isActive,
            unlock_label: avatarDraft.unlockLabel,
            trophy_name: avatarDraft.trophyName,
            trophy_description: avatarDraft.trophyDescription,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Erro ao criar/liberar avatar.");
        return;
      }
      setNotice("Avatar exclusivo criado e liberado.");
      setAvatarDraft((current) => ({ ...current, label: "", description: "", trophyName: "", trophyDescription: "" }));
      await Promise.all([loadTrophies(), loadAvatars()]);
    });
  }

  function editAvatar(row: CustomAvatarRow) {
    setEditingAvatarId(row.id);
    setSelectedUserId(row.assigned_to ?? selectedUserId);
    setAvatarDraft((current) => ({
      ...current,
      label: row.name ?? row.label,
      description: row.description ?? "",
      rarity: row.rarity,
      gender: row.gender ?? "neutro",
      type: row.type,
      accentColor: row.primary_color ?? row.accent_color,
      secondaryColor: row.secondary_color,
      backgroundColor: row.background_color ?? "#080808",
      outfitColor: row.outfit_color ?? row.accent_color,
      hairStyle: row.hair_style ?? "curto",
      hairColor: row.hair_color ?? "#171717",
      faceStyle: row.face_style ?? "confiante",
      accessory: row.accessory ?? "none",
      unlockLabel: row.unlock_label ?? "Exclusivo",
      isActive: row.is_active !== false,
      trophyName: "",
      trophyDescription: "",
    }));
  }

  function updateAvatar() {
    if (!editingAvatarId) return;
    setNotice("");
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/avatars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAvatarId,
          name: avatarDraft.label,
          label: avatarDraft.label,
          description: avatarDraft.description,
          rarity: avatarDraft.rarity,
          gender: avatarDraft.gender,
          type: avatarDraft.type,
          primary_color: avatarDraft.accentColor,
          secondary_color: avatarDraft.secondaryColor,
          background_color: avatarDraft.backgroundColor,
          outfit_color: avatarDraft.outfitColor,
          hair_style: avatarDraft.hairStyle,
          hair_color: avatarDraft.hairColor,
          face_style: avatarDraft.faceStyle,
          accessory: avatarDraft.accessory,
          unlock_label: avatarDraft.unlockLabel,
          assigned_to: selectedUserId || null,
          is_active: avatarDraft.isActive,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Erro ao atualizar avatar.");
        return;
      }
      setNotice("Avatar personalizado atualizado.");
      setEditingAvatarId(null);
      await loadAvatars();
    });
  }

  function sendUserNotification(formData: FormData) {
    setNotice("");
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          title: formData.get("title"),
          message: formData.get("message"),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Erro ao enviar notificacao.");
        return;
      }
      setNotice("Notificacao enviada.");
    });
  }

  return (
    <div>
      <div className="mb-5 sm:mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Admin Social</h1>
        <p className="mt-1 text-sm text-[#F5F5F5]/40">
          Gerencie usuarios, trofeus, avatares exclusivos e updates direcionados.
        </p>
      </div>

      {(notice || error) && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-[#B6FF00]/20 bg-[#B6FF00]/10 text-[#B6FF00]"}`}>
          {error || notice}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-5">
        <section className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="size-4 text-[#B6FF00]" />
            <h2 className="font-display text-base font-semibold">Usuarios</h2>
          </div>
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por username ou nome"
              className="h-11 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm outline-none focus:border-[#B6FF00]/30"
            />
            <button className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#B6FF00] text-[#080808]">
              <Search className="size-4" />
            </button>
          </form>
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 lg:max-h-[640px]">
            {users.map((user) => (
              <button
                key={user.user_id}
                type="button"
                onClick={() => setSelectedUserId(user.user_id)}
                className="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition"
                style={{
                  borderColor: selectedUserId === user.user_id ? "rgba(182,255,0,0.35)" : "rgba(255,255,255,0.06)",
                  background: selectedUserId === user.user_id ? "rgba(182,255,0,0.07)" : "rgba(255,255,255,0.02)",
                }}
              >
                <div className="relative shrink-0">
                  <AvatarDisplay
                    avatarId={user.avatar_id}
                    initials={(user.display_name ?? user.username ?? "A")[0]?.toUpperCase()}
                    size="sm"
                  />
                  {user.is_admin && (
                    <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#B6FF00] text-[#080808]">
                      <Shield className="size-2.5" strokeWidth={2.4} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.display_name ?? user.username ?? "Atleta"}</p>
                  <p className="truncate text-xs text-[#F5F5F5]/30">
                    @{user.username ?? "sem-username"} · Nv. {user.current_level ?? 1} · {user.total_xp ?? 0} XP
                  </p>
                </div>
                <PresenceDot lastSeenAt={user.last_seen_at} />
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-4 sm:space-y-5">
          <section className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-[#FACC15]" />
              <h2 className="font-display text-base font-semibold">Avatares Personalizados</h2>
            </div>

            {/* ── Live preview ── */}
            <div
              className="relative mb-4 overflow-hidden rounded-2xl border p-4"
              style={{
                borderColor: `${avatarDraft.accentColor}35`,
                background: `radial-gradient(circle at 30% 50%, ${avatarDraft.accentColor}08 0%, transparent 60%), ${avatarDraft.accentColor}06`,
                boxShadow: `0 0 24px ${avatarDraft.accentColor}14`,
              }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${avatarDraft.accentColor}60, transparent)` }}
              />
              <div className="flex items-center gap-4">
                <div
                  className="relative grid size-[88px] shrink-0 place-items-center overflow-hidden rounded-2xl border"
                  style={{
                    borderColor: `${avatarDraft.accentColor}30`,
                    background: `radial-gradient(circle at 50% 35%, ${avatarDraft.accentColor}22 0%, transparent 70%), rgba(0,0,0,0.55)`,
                    boxShadow: `0 0 16px ${avatarDraft.accentColor}30 inset`,
                  }}
                >
                  <AvatarSVG
                    avatarId={avatarPreviewId}
                    accentColor={avatarDraft.accentColor}
                    secondaryColor={avatarDraft.secondaryColor}
                    size={88}
                    definition={avatarPreviewDefinition}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                      style={{
                        borderColor: `${RARITY_COLORS[avatarDraft.rarity] ?? "#FACC15"}40`,
                        color: RARITY_COLORS[avatarDraft.rarity] ?? "#FACC15",
                        background: `${RARITY_COLORS[avatarDraft.rarity] ?? "#FACC15"}10`,
                      }}
                    >
                      {RARITY_LABELS_PT[avatarDraft.rarity] ?? avatarDraft.rarity}
                    </span>
                    <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">
                      {avatarDraft.unlockLabel || "Exclusivo"}
                    </span>
                  </div>
                  <h3 className="truncate font-display text-base font-bold">{avatarDraft.label || "Prévia do avatar"}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-[#F5F5F5]/38">{avatarDraft.description || "Avatar exclusivo criado para um usuário específico."}</p>
                  {avatarDraft.trophyName && (
                    <p className="mt-1 text-[10px] font-semibold text-[#FACC15]/70">
                      🏆 {avatarDraft.trophyName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Editor form ── */}
            <form action={editingAvatarId ? updateAvatar : unlockAvatar} className="space-y-4">
              <p className="text-xs text-[#F5F5F5]/35">
                Usuário: <span className="font-semibold text-[#F5F5F5]/55">{selectedUser ? selectedUser.display_name ?? selectedUser.username : "nenhum selecionado"}</span>
              </p>

              {/* Identidade */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/30">Identidade</p>
                <input
                  required
                  placeholder="Nome do avatar"
                  value={avatarDraft.label}
                  onChange={(e) => setAvatarDraft((cur) => ({ ...cur, label: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30"
                />
                <textarea
                  rows={2}
                  placeholder="Descrição do avatar"
                  value={avatarDraft.description}
                  onChange={(e) => setAvatarDraft((cur) => ({ ...cur, description: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30"
                />
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/30">Tipo</p>
                <div className="grid grid-cols-3 gap-2">
                  <select value={avatarDraft.rarity} onChange={(e) => setAvatarDraft((cur) => ({ ...cur, rarity: e.target.value as AvatarRarity }))} className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none">
                    {CUSTOM_AVATAR_RARITIES.map((rarity) => <option key={rarity.value} value={rarity.value}>{rarity.label}</option>)}
                  </select>
                  <select value={avatarDraft.type} onChange={(e) => setAvatarDraft((cur) => ({ ...cur, type: e.target.value as AvatarType }))} className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none">
                    {AVATAR_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <select value={avatarDraft.gender} onChange={(e) => setAvatarDraft((cur) => ({ ...cur, gender: e.target.value as typeof avatarDraft.gender }))} className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none">
                    <option value="neutro">Neutro</option>
                    <option value="masculino">Masc.</option>
                    <option value="feminino">Fem.</option>
                  </select>
                </div>
              </div>

              {/* Cores */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/30">Cores</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    { label: "Cor principal", key: "accentColor", placeholder: "#FACC15" },
                    { label: "Cor secundária", key: "secondaryColor", placeholder: "#FFF4A3" },
                    { label: "Fundo", key: "backgroundColor", placeholder: "#080808" },
                    { label: "Roupa", key: "outfitColor", placeholder: "#FACC15" },
                    { label: "Cabelo", key: "hairColor", placeholder: "#171717" },
                  ] as const).map(({ label, key, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.10em] text-[#F5F5F5]/28">{label}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/[0.12]"
                          style={{ background: avatarDraft[key] }}
                        >
                          <input
                            type="color"
                            value={avatarDraft[key]}
                            onChange={(e) => setAvatarDraft((cur) => ({ ...cur, [key]: e.target.value }))}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </span>
                        <input
                          value={avatarDraft[key]}
                          onChange={(e) => setAvatarDraft((cur) => ({ ...cur, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-[#B6FF00]/30"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aparência */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/30">Aparência</p>

                {/* Hair style tiles */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.10em] text-[#F5F5F5]/25">Cabelo</p>
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                    {HAIR_STYLE_OPTIONS.map((style) => {
                      const isActive = avatarDraft.hairStyle === style;
                      const tileDef: AvatarDefinition = {
                        ...avatarPreviewDefinition,
                        customVisual: { ...avatarPreviewDefinition.customVisual, hairStyle: style },
                      };
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setAvatarDraft((cur) => ({ ...cur, hairStyle: style }))}
                          className="flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-all duration-150"
                          style={{
                            borderColor: isActive ? `${avatarDraft.accentColor}60` : 'rgba(255,255,255,0.07)',
                            background: isActive ? `${avatarDraft.accentColor}10` : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div className="overflow-hidden rounded-lg">
                            <AvatarSVG avatarId={avatarPreviewId} accentColor={avatarDraft.accentColor} secondaryColor={avatarDraft.secondaryColor} size={36} definition={tileDef} />
                          </div>
                          <span className="text-[9px] font-semibold" style={{ color: isActive ? avatarDraft.accentColor : 'rgba(245,245,245,0.35)' }}>
                            {HAIR_STYLE_LABELS[style]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Face style tiles */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.10em] text-[#F5F5F5]/25">Rosto</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {FACE_STYLE_OPTIONS.map((style) => {
                      const isActive = avatarDraft.faceStyle === style;
                      const tileDef: AvatarDefinition = {
                        ...avatarPreviewDefinition,
                        customVisual: { ...avatarPreviewDefinition.customVisual, faceStyle: style },
                      };
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setAvatarDraft((cur) => ({ ...cur, faceStyle: style }))}
                          className="flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-all duration-150"
                          style={{
                            borderColor: isActive ? `${avatarDraft.accentColor}60` : 'rgba(255,255,255,0.07)',
                            background: isActive ? `${avatarDraft.accentColor}10` : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div className="overflow-hidden rounded-lg">
                            <AvatarSVG avatarId={avatarPreviewId} accentColor={avatarDraft.accentColor} secondaryColor={avatarDraft.secondaryColor} size={36} definition={tileDef} />
                          </div>
                          <span className="text-[9px] font-semibold" style={{ color: isActive ? avatarDraft.accentColor : 'rgba(245,245,245,0.35)' }}>
                            {FACE_STYLE_LABELS[style]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accessory tiles */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.10em] text-[#F5F5F5]/25">Acessório</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ACCESSORY_OPTIONS.map((opt) => {
                      const isActive = avatarDraft.accessory === opt.value;
                      const tileDef: AvatarDefinition = {
                        ...avatarPreviewDefinition,
                        customVisual: { ...avatarPreviewDefinition.customVisual, accessory: opt.value },
                      };
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAvatarDraft((cur) => ({ ...cur, accessory: opt.value }))}
                          className="flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-all duration-150"
                          style={{
                            borderColor: isActive ? `${avatarDraft.accentColor}60` : 'rgba(255,255,255,0.07)',
                            background: isActive ? `${avatarDraft.accentColor}10` : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div className="overflow-hidden rounded-lg">
                            <AvatarSVG avatarId={avatarPreviewId} accentColor={avatarDraft.accentColor} secondaryColor={avatarDraft.secondaryColor} size={36} definition={tileDef} />
                          </div>
                          <span className="text-[9px] font-semibold" style={{ color: isActive ? avatarDraft.accentColor : 'rgba(245,245,245,0.35)' }}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Desbloqueio */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/30">Desbloqueio</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={avatarSource}
                    onChange={(e) => {
                      setAvatarSource(e.target.value);
                      setAvatarDraft((cur) => ({ ...cur, unlockLabel: e.target.value === "trophy" ? "Trofeu exclusivo" : e.target.value === "season" ? "Temporada" : e.target.value === "achievement" ? "Conquista" : "Exclusivo" }));
                    }}
                    className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="admin">Exclusivo/Admin</option>
                    <option value="season">Temporada</option>
                    <option value="trophy">Troféu</option>
                    <option value="achievement">Conquista</option>
                  </select>
                  <input value={avatarDraft.unlockLabel} onChange={(e) => setAvatarDraft((cur) => ({ ...cur, unlockLabel: e.target.value }))} placeholder="Etiqueta ex: Exclusivo" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-[#F5F5F5]/55">
                  <input type="checkbox" checked={avatarDraft.isActive} onChange={(e) => setAvatarDraft((cur) => ({ ...cur, isActive: e.target.checked }))} className="accent-[#B6FF00]" />
                  Avatar ativo (visível para o usuário)
                </label>
              </div>

              {/* Troféu exclusivo */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/30">
                  Troféu exclusivo <span className="text-[#F5F5F5]/20">(opcional)</span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={avatarDraft.trophyName} onChange={(e) => setAvatarDraft((cur) => ({ ...cur, trophyName: e.target.value }))} placeholder="Nome do troféu" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
                  <input value={avatarDraft.trophyDescription} onChange={(e) => setAvatarDraft((cur) => ({ ...cur, trophyDescription: e.target.value }))} placeholder="Descrição do troféu" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  disabled={isPending || !selectedUserId || !avatarDraft.label.trim()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(250,204,21,0.15)] disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {editingAvatarId ? "Salvar alterações" : "Criar e conceder"}
                </button>
                {editingAvatarId && (
                  <button
                    type="button"
                    onClick={() => setEditingAvatarId(null)}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-[#F5F5F5]/55 hover:bg-white/[0.06]"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* ── Avatares criados ── */}
            <div className="mt-5 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5F5F5]/30">Criados</p>
              {customAvatars.length === 0 ? (
                <p className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-xs text-[#F5F5F5]/35">Nenhum avatar personalizado ainda.</p>
              ) : (
                <div className="grid gap-2">
                  {customAvatars.map((avatar) => {
                    const rarityColor = RARITY_COLORS[avatar.rarity] ?? "#FACC15";
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => editAvatar(avatar)}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-left transition hover:border-white/[0.10] hover:bg-white/[0.04]"
                      >
                        <div
                          className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border"
                          style={{
                            borderColor: `${avatar.accent_color}28`,
                            background: `radial-gradient(circle at 50% 35%, ${avatar.accent_color}20 0%, transparent 70%), rgba(0,0,0,0.4)`,
                          }}
                        >
                          <AvatarSVG
                            avatarId={avatar.id}
                            accentColor={avatar.primary_color ?? avatar.accent_color}
                            secondaryColor={avatar.secondary_color}
                            size={40}
                            definition={buildDefinitionFromRow(avatar)}
                          />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{avatar.name ?? avatar.label}</span>
                          <span className="block truncate text-[10px] text-[#F5F5F5]/32">
                            <span style={{ color: rarityColor }}>{RARITY_LABELS_PT[avatar.rarity] ?? avatar.rarity}</span>
                            {" · "}
                            {avatar.is_active === false ? "inativo" : "ativo"}
                          </span>
                        </span>
                        <span className="text-[10px] text-[#F5F5F5]/25">Editar</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-4 text-[#EAB308]" />
              <h2 className="font-display text-base font-semibold">Criar trofeu exclusivo</h2>
            </div>
            <div className="mb-4 rounded-2xl border p-4" style={{ borderColor: `${RARITY_COLORS[trophyDraft.rarity]}35`, background: `${RARITY_COLORS[trophyDraft.rarity]}0D` }}>
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-2xl text-[#080808]" style={{ background: RARITY_COLORS[trophyDraft.rarity] }}>
                  <Trophy className="size-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: RARITY_COLORS[trophyDraft.rarity] }}>
                    {trophyDraft.rarity} · {trophyDraft.visual || "trophy"}
                  </p>
                  <h3 className="truncate font-display text-base font-bold">{trophyDraft.name || "Previa do trofeu"}</h3>
                  <p className="line-clamp-2 text-xs text-[#F5F5F5]/38">{trophyDraft.description || "Descricao e visual aparecem aqui antes de criar."}</p>
                </div>
              </div>
            </div>
            <form action={createTrophy} className="grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Nome do trofeu" value={trophyDraft.name} onChange={(e) => setTrophyDraft((cur) => ({ ...cur, name: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
              <select name="rarity" value={trophyDraft.rarity} onChange={(e) => setTrophyDraft((cur) => ({ ...cur, rarity: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none">
                {RARITIES.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
              </select>
              <input name="visual" placeholder="Visual: trophy, crown, medal..." value={trophyDraft.visual} onChange={(e) => setTrophyDraft((cur) => ({ ...cur, visual: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
              <textarea name="description" placeholder="Descricao" rows={2} value={trophyDraft.description} onChange={(e) => setTrophyDraft((cur) => ({ ...cur, description: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30 sm:col-span-2" />
              <button disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-bold text-[#080808] disabled:opacity-50">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />}
                Criar trofeu
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Gift className="size-4 text-[#B6FF00]" />
              <h2 className="font-display text-base font-semibold">Entregar trofeu</h2>
            </div>
            <form action={awardTrophy} className="grid gap-3">
              <p className="text-xs text-[#F5F5F5]/35">
                Usuario selecionado: {selectedUser ? selectedUser.display_name ?? selectedUser.username : "nenhum"}
              </p>
              <select value={selectedTrophyId} onChange={(e) => setSelectedTrophyId(e.target.value)} required className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none">
                <option value="">Escolha o trofeu</option>
                {trophies.map((trophy) => <option key={trophy.id} value={trophy.id}>{trophy.name} · {trophy.rarity}</option>)}
              </select>
              <input name="note" placeholder="Nota interna opcional" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
              <button disabled={isPending || !selectedUserId || !selectedTrophyId} className="rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-bold text-[#080808] disabled:opacity-50">
                Entregar manualmente
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="size-4 text-[#22D3EE]" />
              <h2 className="font-display text-base font-semibold">Update para usuario especifico</h2>
            </div>
            <form action={sendUserNotification} className="grid gap-3">
              <input name="title" required placeholder="Titulo" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
              <textarea name="message" required rows={3} placeholder="Mensagem" className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
              <button disabled={isPending || !selectedUserId} className="rounded-xl bg-[#22D3EE] px-4 py-2.5 text-sm font-bold text-[#080808] disabled:opacity-50">
                Enviar para selecionado
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function PresenceDot({ lastSeenAt }: { lastSeenAt: string | null }) {
  const { dot, label } = getPresence(lastSeenAt);
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <div className="size-2 rounded-full" style={{ background: dot }} />
      <span className="text-[9px] text-[#F5F5F5]/30">{label}</span>
    </div>
  );
}
