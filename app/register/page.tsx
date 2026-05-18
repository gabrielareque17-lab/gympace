"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, UserPlus, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AvatarCard } from "@/components/ui/avatar/avatar-card";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { AVATAR_REGISTRY, type AvatarCategory, AvatarType } from "@/lib/avatar-registry";

type Step = "credentials" | "avatar";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("runner-sprint");
  const [selectedAvatarType, setSelectedAvatarType] = useState<AvatarType>("runner");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleCredentialsNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || password.length < 6) return;
    setStep("avatar");
  }

  function handleAvatarSelect(id: string, type: AvatarType) {
    setSelectedAvatarId(id);
    setSelectedAvatarType(type);
  }

  async function handleSubmit() {
    setIsLoading(true);
    setMessage("");
    setIsSuccess(false);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage("Não foi possível criar a conta. Tente novamente.");
      setIsLoading(false);
      return;
    }

    if (data.session) {
      // Immediate session — save avatar right away
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarId: selectedAvatarId,
          avatarType: selectedAvatarType,
        }),
      });
      router.replace("/");
      router.refresh();
      return;
    }

    // Email confirmation required — avatar can be set in settings
    setIsSuccess(true);
    setMessage(
      "Conta criada. Confirme seu email para continuar. Você pode configurar seu avatar nas Configurações."
    );
    setIsLoading(false);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0D0D0D] px-5 py-12 text-[#F5F5F5]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#B6FF00]/[0.035] blur-[100px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2.5">
          <div className="grid size-11 place-items-center rounded-2xl bg-[#B6FF00] shadow-[0_0_32px_rgba(182,255,0,0.28)]">
            <Zap className="size-5 text-[#080808]" strokeWidth={2.8} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B6FF00]/60">
            GymPace
          </p>
        </div>

        {step === "credentials" ? (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
            <div className="relative px-7 pb-7 pt-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

              <div className="mb-6 text-center">
                <h1 className="font-display text-xl font-bold tracking-tight">Criar conta</h1>
                <p className="mt-1.5 text-sm text-[#F5F5F5]/40">
                  Comece a registrar treinos e acompanhe sua evolução.
                </p>
              </div>

              <form onSubmit={handleCredentialsNext} className="space-y-4">
                <AuthField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="voce@email.com"
                  autoComplete="email"
                />
                <AuthField
                  label="Senha"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  minLength={6}
                />

                <button
                  type="submit"
                  className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] text-sm font-bold text-[#080808] shadow-[0_0_28px_rgba(182,255,0,0.18)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_36px_rgba(182,255,0,0.28)] active:translate-y-0"
                >
                  Continuar
                </button>
              </form>
            </div>

            <div className="border-t border-white/[0.05] px-7 py-4 text-center">
              <p className="text-sm text-[#F5F5F5]/35">
                Já tem uma conta?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#B6FF00]/80 transition-colors hover:text-[#B6FF00]"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
            <div className="relative px-7 pb-7 pt-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="mb-4 flex items-center gap-1.5 text-xs font-medium text-[#F5F5F5]/38 transition-colors hover:text-[#F5F5F5]/70"
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar
                </button>
                <h1 className="font-display text-xl font-bold tracking-tight">
                  Escolha seu avatar
                </h1>
                <p className="mt-1.5 text-sm text-[#F5F5F5]/40">
                  Representa seu estilo de treino.
                </p>
              </div>

              {/* Avatar categories */}
              {(
                [
                  { id: 'running' as AvatarCategory, label: 'Corrida',  accentColor: '#B6FF00' },
                  { id: 'gym'     as AvatarCategory, label: 'Academia', accentColor: '#60A5FA' },
                  { id: 'hybrid'  as AvatarCategory, label: 'Híbrido',  accentColor: '#A78BFA' },
                ]
              ).map((cat) => {
                const avatars = AVATAR_REGISTRY.filter((a) => a.category === cat.id)
                return (
                  <div key={cat.id} className="mb-4 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.accentColor, boxShadow: `0 0 5px ${cat.accentColor}` }}
                      />
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{ color: cat.accentColor }}
                      >
                        {cat.label}
                      </span>
                      <div className="h-px flex-1" style={{ background: `${cat.accentColor}18` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {avatars.map((def) => (
                        <AvatarCard
                          key={def.id}
                          definition={def}
                          isSelected={selectedAvatarId === def.id}
                          onSelect={handleAvatarSelect}
                          isLoading={isLoading}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {message ? (
                <div
                  className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                    isSuccess
                      ? "border-[#B6FF00]/18 bg-[#B6FF00]/[0.07] text-[#B6FF00]/85"
                      : "border-red-500/20 bg-red-500/[0.07] text-red-300/90"
                  }`}
                >
                  {message}
                </div>
              ) : null}

              {!isSuccess && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] text-sm font-bold text-[#080808] shadow-[0_0_28px_rgba(182,255,0,0.18)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_36px_rgba(182,255,0,0.28)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserPlus className="size-4" />
                  )}
                  {isLoading ? "Criando conta..." : "Criar conta grátis"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function AuthField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: {
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/50">
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/18 focus:border-[#B6FF00]/38 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.06)]"
      />
    </label>
  );
}
