import Link from "next/link";
import { BarChart2, Bell, Flag, Megaphone, Shield, Trophy, Users, Zap } from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function fetchStats() {
  const supabase = createSupabaseAdminClient();
  const [usersRes, notifsRes, competitionsRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("type", "gympace_update"),
    supabase
      .from("competitions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ]);
  return {
    users: usersRes.count ?? 0,
    notifs: notifsRes.count ?? 0,
    competitions: competitionsRes.count ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await fetchStats().catch(() => ({
    users: 0,
    notifs: 0,
    competitions: 0,
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#F5F5F5]/40">
          Visão geral da plataforma GymPace
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          label="Usuários"
          value={stats.users}
          icon={Users}
          color="#B6FF00"
          glow="rgba(182,255,0,0.12)"
        />
        <StatCard
          label="Updates enviados"
          value={stats.notifs}
          icon={Bell}
          color="#22D3EE"
          glow="rgba(34,211,238,0.12)"
        />
        <StatCard
          label="Competições ativas"
          value={stats.competitions}
          icon={Trophy}
          color="#EAB308"
          glow="rgba(234,179,8,0.12)"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F5]/30">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QuickAction
            href="/admin/updates"
            icon={Megaphone}
            label="Enviar Update"
            description="Notificação global para todos os usuários"
            color="#B6FF00"
            glow="rgba(182,255,0,0.08)"
          />
          <QuickAction
            href="#"
            icon={Users}
            label="Gerenciar Usuários"
            description="Em breve"
            color="#F5F5F5"
            glow="rgba(255,255,255,0.04)"
            disabled
          />
        </div>
      </div>

      {/* Coming soon modules */}
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F5]/30">
          Módulos futuros
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Analytics",    icon: BarChart2, color: "#A78BFA" },
            { label: "Moderação",    icon: Shield,    color: "#FB923C" },
            { label: "Métricas",     icon: Zap,       color: "#B6FF00" },
            { label: "Feature Flags",icon: Flag,      color: "#22D3EE" },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.05] bg-[#0D0D0D] px-4 py-5 opacity-40"
              >
                <div
                  className="grid size-9 place-items-center rounded-xl"
                  style={{ background: m.color + "14" }}
                >
                  <Icon className="size-4" style={{ color: m.color }} strokeWidth={1.8} />
                </div>
                <span className="text-[11px] font-medium text-[#F5F5F5]/60">{m.label}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#F5F5F5]/25">
                  Em breve
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  glow,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  color: string;
  glow: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#0D0D0D] p-5"
      style={{ boxShadow: `0 0 0 1px ${glow}` }}
    >
      <div
        className="grid size-9 place-items-center rounded-xl"
        style={{ background: color + "14" }}
      >
        <Icon className="size-4" style={{ color }} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums tracking-tight text-[#F5F5F5]">
          {value.toLocaleString("pt-BR")}
        </p>
        <p className="mt-0.5 text-[12px] text-[#F5F5F5]/40">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  color,
  glow,
  disabled = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  label: string;
  description: string;
  color: string;
  glow: string;
  disabled?: boolean;
}) {
  const inner = (
    <div
      className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#0D0D0D] p-5 transition-all duration-150"
      style={{
        background: disabled ? undefined : glow,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div
        className="grid size-10 shrink-0 place-items-center rounded-xl"
        style={{ background: color + "18" }}
      >
        <Icon className="size-5" style={{ color }} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#F5F5F5]">{label}</p>
        <p className="mt-0.5 text-[11px] text-[#F5F5F5]/40">{description}</p>
      </div>
    </div>
  );

  if (disabled) return <div className="cursor-not-allowed">{inner}</div>;
  return (
    <Link href={href} className="group block hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150">
      {inner}
    </Link>
  );
}
