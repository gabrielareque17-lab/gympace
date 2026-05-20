import type { ReactNode } from "react";
import {
  Bell,
  ChevronRight,
  Clock3,
  ExternalLink,
  Link2,
  LogOut,
  Mail,
  Palette,
  Shield,
  Zap,
} from "lucide-react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/ui/layout/app-shell";
import { ComingSoonBadge, PageHeader, SectionCard } from "@/components/ui/page-layout";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function logoutAction() {
  "use server";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function timezoneAction(formData: FormData) {
  "use server";
  const timezone = String(formData.get("timezone") ?? "America/Manaus");
  if (!["America/Manaus", "America/Sao_Paulo"].includes(timezone)) return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .upsert({ user_id: user.id, timezone }, { onConflict: "user_id" });
}

export default async function ConfiguracoesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "—";
  const { data: profileWithTimezone, error: timezoneError } = user
    ? await supabase
        .from("profiles")
        .select("timezone")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null, error: null };
  const timezone = timezoneError ? "America/Manaus" : profileWithTimezone?.timezone ?? "America/Manaus";

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <PageHeader
          eyebrow="Sistema"
          title="Configurações"
          description="Preferências da aplicação, integrações e gerenciamento da conta."
        />

        <div className="space-y-4 max-w-2xl">
          {/* ── Conta ── */}
          <SectionCard label="Conta" title="Informações">
            <div className="p-5 space-y-2">
              <AccountRow
                icon={<Mail className="size-3.5" strokeWidth={2} />}
                label="Email"
                value={email}
              />
              <AccountRow
                icon={
                  <div className="size-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                }
                label="Status"
                value="Conta ativa"
              />

              <div className="pt-1">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-xl border border-red-500/[0.12] bg-red-500/[0.04] px-4 py-3 transition-colors hover:border-red-500/20 hover:bg-red-500/[0.07]"
                  >
                    <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-red-500/[0.1] text-red-400/70">
                      <LogOut className="size-3.5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium text-red-300/80">Sair da conta</p>
                      <p className="text-xs text-[#F5F5F5]/28">Encerra a sessão atual</p>
                    </div>
                    <ChevronRight
                      className="ml-auto size-4 shrink-0 text-red-400/30"
                      strokeWidth={1.5}
                    />
                  </button>
                </form>
              </div>
            </div>
          </SectionCard>

          <SectionCard label="Localização" title="Fuso horário">
            <form action={timezoneAction} className="space-y-3 p-5">
              <p className="text-sm leading-6 text-[#F5F5F5]/40">
                Manaus fica como padrão do GymPace. Use Brasília se quiser que datas e lembretes sigam UTC-3.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <TimezoneOption
                  value="America/Manaus"
                  title="Manaus"
                  description="UTC-4 · padrão"
                  checked={timezone === "America/Manaus"}
                />
                <TimezoneOption
                  value="America/Sao_Paulo"
                  title="Brasília"
                  description="UTC-3"
                  checked={timezone === "America/Sao_Paulo"}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-bold text-[#080808] transition active:scale-[0.98]"
              >
                <Clock3 className="size-4" />
                Salvar fuso horário
              </button>
            </form>
          </SectionCard>

          {/* ── Aparência ── */}
          <SectionCard label="Visual" title="Aparência" badge={<ComingSoonBadge />}>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-7 place-items-center rounded-lg bg-white/[0.05] text-[#F5F5F5]/50">
                    <Palette className="size-3.5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tema</p>
                    <p className="text-xs text-[#F5F5F5]/35">Dark mode ativo</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex size-6 items-center justify-center rounded-md border border-white/[0.12] bg-[#090909] ring-1 ring-[#B6FF00]/40">
                    <div className="size-2 rounded-full bg-[#B6FF00]" />
                  </div>
                  <div className="flex size-6 items-center justify-center rounded-md border border-white/[0.1] bg-white/[0.85] opacity-30" />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-7 place-items-center rounded-lg bg-white/[0.05] text-[#B6FF00]/70">
                    <Zap className="size-3.5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cor de destaque</p>
                    <p className="text-xs text-[#F5F5F5]/35">Neon green #B6FF00</p>
                  </div>
                </div>
                <div className="size-5 rounded-full bg-[#B6FF00] shadow-[0_0_10px_rgba(182,255,0,0.4)]" />
              </div>
            </div>
          </SectionCard>

          {/* ── Notificações ── */}
          <SectionCard label="Alertas" title="Notificações" badge={<ComingSoonBadge />}>
            <div className="p-5 space-y-2">
              <NotificationRow
                label="Resumo semanal"
                description="Receba um resumo de treinos toda segunda-feira"
              />
              <NotificationRow
                label="Lembretes de treino"
                description="Notificações para manter a consistência"
              />
              <NotificationRow
                label="Metas alcançadas"
                description="Alertas quando você bater um objetivo"
              />
            </div>
          </SectionCard>

          {/* ── Integrações ── */}
          <SectionCard label="Integrações" title="Conectar apps">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#FC4C02]/20 bg-[#FC4C02]/10">
                  <Link2 className="size-4 text-[#FC4C02]/80" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Strava</p>
                    <ComingSoonBadge />
                  </div>
                  <p className="mt-0.5 text-xs text-[#F5F5F5]/35">
                    Sincronize corridas automaticamente
                  </p>
                </div>
                <ExternalLink className="size-4 shrink-0 text-[#F5F5F5]/20" strokeWidth={1.5} />
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3.5 opacity-50">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
                  <Link2 className="size-4 text-[#F5F5F5]/40" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">Garmin Connect</p>
                    <ComingSoonBadge />
                  </div>
                  <p className="mt-0.5 text-xs text-[#F5F5F5]/35">
                    Importe dados do seu dispositivo Garmin
                  </p>
                </div>
                <ExternalLink className="size-4 shrink-0 text-[#F5F5F5]/20" strokeWidth={1.5} />
              </div>
            </div>
          </SectionCard>

          {/* ── Privacidade ── */}
          <SectionCard label="Privacidade" title="Dados e privacidade" badge={<ComingSoonBadge />}>
            <div className="p-5 space-y-2">
              <ToggleRow
                label="Perfil público"
                description="Permitir que outros atletas vejam seu perfil"
              />
              <ToggleRow
                label="Compartilhar atividades"
                description="Exibir corridas e treinos publicamente"
              />
              <ToggleRow
                label="Exportar dados"
                description="Baixe um arquivo com todos os seus dados"
              />
            </div>
          </SectionCard>

          {/* ── Zona de perigo ── */}
          <SectionCard label="Conta" title="Zona de perigo">
            <div className="p-5">
              <div className="flex items-center justify-between rounded-xl border border-red-500/[0.12] bg-red-500/[0.04] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-7 place-items-center rounded-lg bg-red-500/[0.1] text-red-400/60">
                    <Shield className="size-3.5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-300/80">Excluir conta</p>
                    <p className="text-xs text-[#F5F5F5]/28">
                      Todos os dados serão removidos permanentemente
                    </p>
                  </div>
                </div>
                <ComingSoonBadge />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AccountRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-[#F5F5F5]/40">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#F5F5F5]/35">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-[#F5F5F5]/70">{value}</p>
      </div>
    </div>
  );
}

function TimezoneOption({
  value,
  title,
  description,
  checked,
}: {
  value: string;
  title: string;
  description: string;
  checked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]">
      <input
        type="radio"
        name="timezone"
        value={value}
        defaultChecked={checked}
        className="size-4 accent-[#B6FF00]"
      />
      <div>
        <p className="text-sm font-semibold text-[#F5F5F5]/80">{title}</p>
        <p className="text-xs text-[#F5F5F5]/35">{description}</p>
      </div>
    </label>
  );
}

function NotificationRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="grid size-7 place-items-center rounded-lg bg-white/[0.04] text-[#F5F5F5]/40">
          <Bell className="size-3.5" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-[#F5F5F5]/35">{description}</p>
        </div>
      </div>
      <div className="h-5 w-9 rounded-full border border-white/[0.08] bg-white/[0.08]" />
    </div>
  );
}

function ToggleRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="grid size-7 place-items-center rounded-lg bg-white/[0.04] text-[#F5F5F5]/40">
          <Shield className="size-3.5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-[#F5F5F5]/35">{description}</p>
        </div>
      </div>
      <div className="h-5 w-9 rounded-full border border-white/[0.08] bg-white/[0.08]" />
    </div>
  );
}
