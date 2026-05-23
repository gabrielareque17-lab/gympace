"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Bell, Gift, Loader2, Lock, Search, Shield, Sparkles, Trophy, UserRound } from "lucide-react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { AvatarSVG } from "@/components/ui/avatar/avatar-svg";
import type { AvatarDefinition } from "@/lib/avatar-registry";

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

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function getPresence(lastSeenAt: string | null): { dot: string; label: string } {
  if (!lastSeenAt) return { dot: "rgba(245,245,245,0.15)", label: "Nunca" };
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  if (diff < ONLINE_THRESHOLD_MS) return { dot: "#22C55E", label: "Online" };
  if (diff < 60 * 60 * 1000) return { dot: "#EAB308", label: `${Math.floor(diff / 60000)}min atrás` };
  if (diff < 24 * 60 * 60 * 1000) return { dot: "rgba(245,245,245,0.30)", label: `${Math.floor(diff / 3600000)}h atrás` };
  return { dot: "rgba(245,245,245,0.15)", label: `${Math.floor(diff / 86400000)}d atrás` };
}

type TrophyRow = {
  id: string;
  name: string;
  description: string | null;
  rarity: string;
  visual: string;
};

const RARITIES = ["common", "rare", "epic", "legendary", "mythic"];
const RARITY_COLORS: Record<string, string> = {
  common: "#94A3B8",
  rare: "#22D3EE",
  epic: "#A78BFA",
  legendary: "#EAB308",
  mythic: "#B6FF00",
};

export default function AdminSocialPage() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [trophies, setTrophies] = useState<TrophyRow[]>([]);
  const [avatars, setAvatars] = useState<AvatarDefinition[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedTrophyId, setSelectedTrophyId] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [avatarSource, setAvatarSource] = useState("admin");
  const [avatarSourceRef, setAvatarSourceRef] = useState("");
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
  const selectedAvatar = useMemo(
    () => avatars.find((avatar) => avatar.id === selectedAvatarId),
    [avatars, selectedAvatarId]
  );

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
    if (!res.ok) return;
    const locked = ((json.avatars ?? []) as AvatarDefinition[]).filter(
      (avatar) => avatar.unlock.kind !== "free"
    );
    setAvatars(locked);
    setSelectedAvatarId((current) => current || locked[0]?.id || "");
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
        setError(json.error ?? "Erro ao criar troféu.");
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
        setError(json.error ?? "Erro ao entregar troféu.");
        return;
      }
      setNotice("Trofeu entregue.");
    });
  }

  function unlockAvatar(formData: FormData) {
    setNotice("");
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUserId,
          avatar_id: selectedAvatarId,
          source: avatarSource,
          source_ref: formData.get("source_ref"),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Erro ao liberar avatar.");
        return;
      }
      setNotice("Avatar exclusivo liberado.");
      setAvatarSourceRef("");
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
        setError(json.error ?? "Erro ao enviar notificação.");
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
          Gerencie usuários, troféus, avatares exclusivos e updates direcionados.
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
              <h2 className="font-display text-base font-semibold">Criar acesso a avatar exclusivo</h2>
            </div>
            {selectedAvatar && (
              <div className="mb-4 rounded-2xl border border-[#FACC15]/20 bg-[#FACC15]/[0.045] p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40">
                    <AvatarSVG
                      avatarId={selectedAvatar.id}
                      accentColor={selectedAvatar.accentColor}
                      secondaryColor={selectedAvatar.secondaryColor}
                      size={64}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FACC15]/70">
                      {selectedAvatar.rarity} · {selectedAvatar.unlock.label}
                    </p>
                    <h3 className="truncate font-display text-base font-bold">{selectedAvatar.label}</h3>
                    <p className="line-clamp-2 text-xs text-[#F5F5F5]/38">{selectedAvatar.description}</p>
                  </div>
                </div>
              </div>
            )}
            <form action={unlockAvatar} className="grid gap-3">
              <p className="text-xs text-[#F5F5F5]/35">
                Usuario selecionado: {selectedUser ? selectedUser.display_name ?? selectedUser.username : "nenhum"}
              </p>
              <select
                value={selectedAvatarId}
                onChange={(e) => setSelectedAvatarId(e.target.value)}
                required
                className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none"
              >
                {avatars.map((avatar) => (
                  <option key={avatar.id} value={avatar.id}>
                    {avatar.label} · {avatar.rarity} · {avatar.unlock.label}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={avatarSource}
                  onChange={(e) => setAvatarSource(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="season">Temporada</option>
                  <option value="trophy">Trofeu</option>
                  <option value="achievement">Conquista</option>
                </select>
                <input
                  name="source_ref"
                  value={avatarSourceRef}
                  onChange={(e) => setAvatarSourceRef(e.target.value)}
                  placeholder="Ref opcional"
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30"
                />
              </div>
              <button disabled={isPending || !selectedUserId || !selectedAvatarId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#080808] disabled:opacity-50">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                Liberar avatar exclusivo
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-4 text-[#EAB308]" />
              <h2 className="font-display text-base font-semibold">Criar troféu exclusivo</h2>
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
                  <h3 className="truncate font-display text-base font-bold">{trophyDraft.name || "Prévia do troféu"}</h3>
                  <p className="line-clamp-2 text-xs text-[#F5F5F5]/38">{trophyDraft.description || "Descricao e visual aparecem aqui antes de criar."}</p>
                </div>
              </div>
            </div>
            <form action={createTrophy} className="grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder="Nome do troféu" value={trophyDraft.name} onChange={(e) => setTrophyDraft((cur) => ({ ...cur, name: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
              <select name="rarity" value={trophyDraft.rarity} onChange={(e) => setTrophyDraft((cur) => ({ ...cur, rarity: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none">
                {RARITIES.map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
              </select>
              <input name="visual" placeholder="Visual: trophy, crown, medal..." value={trophyDraft.visual} onChange={(e) => setTrophyDraft((cur) => ({ ...cur, visual: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30" />
              <textarea name="description" placeholder="Descricao" rows={2} value={trophyDraft.description} onChange={(e) => setTrophyDraft((cur) => ({ ...cur, description: e.target.value }))} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-[#B6FF00]/30 sm:col-span-2" />
              <button disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-bold text-[#080808] disabled:opacity-50">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />}
                Criar troféu
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Gift className="size-4 text-[#B6FF00]" />
              <h2 className="font-display text-base font-semibold">Entregar troféu</h2>
            </div>
            <form action={awardTrophy} className="grid gap-3">
              <p className="text-xs text-[#F5F5F5]/35">
                Usuario selecionado: {selectedUser ? selectedUser.display_name ?? selectedUser.username : "nenhum"}
              </p>
              <select value={selectedTrophyId} onChange={(e) => setSelectedTrophyId(e.target.value)} required className="rounded-xl border border-white/[0.08] bg-[#161616] px-3 py-2.5 text-sm outline-none">
                <option value="">Escolha o troféu</option>
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
