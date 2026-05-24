"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, UserPlus, Zap } from "lucide-react";
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
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("neon-runner-velocity");
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
        data: {
          avatar_id: selectedAvatarId,
          avatar_type: selectedAvatarType,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage("Não foi possível criar a conta. Tente novamente.");
      setIsLoading(false);
      return;
    }

    if (data.session) {
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

    setIsSuccess(true);
    setMessage(
      "Conta criada. Confirme seu email para continuar. Seu avatar escolhido já aparecerá no perfil."
    );
    setIsLoading(false);
  }

  return (
    <main className="relative min-h-screen bg-[#080808] px-5 py-12 text-[#F5F5F5]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#B6FF00]/[0.025] blur-[100px]" />
      </div>

      <div className={`relative mx-auto w-full ${step === "avatar" ? "max-w-2xl" : "max-w-sm"}`}>
        {/* Logo */}
        <Link href="/landing" className="group mb-10 flex flex-col items-center gap-3">
          <div
            className="grid size-12 place-items-center rounded-2xl bg-[#B6FF00]"
            style={{ boxShadow: "0 0 28px rgba(182,255,0,0.3)" }}
          >
            <Zap className="size-6 text-[#080808]" strokeWidth={2.8} />
          </div>
          <div className="text-center">
            <p
              className="leading-none text-white"
              style={{ fontFamily: "var(--font-hero)", fontSize: "1.875rem", letterSpacing: "0.1em" }}
            >
              GymPace
            </p>
            <p className="mt-1.5 text-[11px] text-[#F5F5F5]/28 transition-colors group-hover:text-[#F5F5F5]/50">
              Voltar para apresentação
            </p>
          </div>
        </Link>

        {/* Step indicator */}
        <div className="mb-5 flex items-center justify-center gap-3">
          <StepDot active={step === "credentials"} done={step === "avatar"} number={1} label="Credenciais" />
          <div className="h-px w-8 bg-white/[0.1]" />
          <StepDot active={step === "avatar"} done={false} number={2} label="Avatar" />
        </div>

        {/* Card */}
        <div
          className="overflow-hidden rounded-2xl border border-white/[0.09]"
          style={{
            background: "linear-gradient(160deg, #111111, #0E0E0E)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.025)",
          }}
        >
          {/* Top accent line */}
          <div
            className="h-[1.5px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(182,255,0,0.55) 50%, transparent 100%)",
            }}
          />

          <div className="px-7 pb-7 pt-6">
            {step === "credentials" ? (
              <>
                <div className="mb-7">
                  <h1
                    className="leading-tight text-white"
                    style={{
                      fontFamily: "var(--font-hero)",
                      fontSize: "1.875rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Criar conta
                  </h1>
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
                    className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] text-sm font-bold text-[#080808] transition-all duration-200 hover:-translate-y-px active:translate-y-0"
                    style={{ boxShadow: "0 0 24px rgba(182,255,0,0.18), 0 4px 16px rgba(0,0,0,0.3)" }}
                  >
                    Continuar
                    <ArrowRight className="size-4" />
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="mb-4 flex items-center gap-1.5 text-xs font-medium text-[#F5F5F5]/38 transition-colors hover:text-[#F5F5F5]/70"
                  >
                    <ArrowLeft className="size-3.5" />
                    Voltar
                  </button>
                  <h1
                    className="leading-tight text-white"
                    style={{
                      fontFamily: "var(--font-hero)",
                      fontSize: "1.875rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Escolha seu avatar
                  </h1>
                  <p className="mt-1.5 text-sm text-[#F5F5F5]/40">
                    Escolha um mascote que represente seu estilo de treino.
                  </p>
                </div>

                {(
                  [
                    { id: "running" as AvatarCategory, label: "Corrida", accentColor: "#B6FF00" },
                    { id: "gym" as AvatarCategory, label: "Academia", accentColor: "#60A5FA" },
                    { id: "hybrid" as AvatarCategory, label: "Híbrido", accentColor: "#A78BFA" },
                  ]
                ).map((cat) => {
                  const avatars = AVATAR_REGISTRY.filter((a) => a.category === cat.id);
                  return (
                    <div key={cat.id} className="mb-4 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: cat.accentColor,
                            boxShadow: `0 0 5px ${cat.accentColor}`,
                          }}
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
                  );
                })}

                {message && (
                  <div
                    className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                      isSuccess
                        ? "border-[#B6FF00]/18 bg-[#B6FF00]/[0.07] text-[#B6FF00]/85"
                        : "border-red-500/20 bg-red-500/[0.07] text-red-300/90"
                    }`}
                  >
                    {message}
                  </div>
                )}

                {!isSuccess && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] text-sm font-bold text-[#080808] transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
                    style={{ boxShadow: "0 0 24px rgba(182,255,0,0.18), 0 4px 16px rgba(0,0,0,0.3)" }}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserPlus className="size-4" />
                    )}
                    {isLoading ? "Criando conta..." : "Criar conta grátis"}
                  </button>
                )}
              </>
            )}
          </div>

          {step === "credentials" && (
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
          )}
        </div>
      </div>
    </main>
  );
}

function StepDot({
  active,
  done,
  number,
  label,
}: {
  active: boolean;
  done: boolean;
  number: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`grid size-6 place-items-center rounded-full text-[10px] font-bold transition-all duration-300 ${
          done
            ? "bg-[#B6FF00] text-[#080808]"
            : active
            ? "border border-[#B6FF00]/60 bg-[#B6FF00]/10 text-[#B6FF00]"
            : "border border-white/[0.12] bg-white/[0.04] text-[#F5F5F5]/30"
        }`}
        style={active ? { boxShadow: "0 0 10px rgba(182,255,0,0.25)" } : {}}
      >
        {done ? "✓" : number}
      </div>
      <span
        className={`text-[11px] font-medium ${
          active || done ? "text-[#F5F5F5]/65" : "text-[#F5F5F5]/25"
        }`}
      >
        {label}
      </span>
    </div>
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
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#F5F5F5]/45">
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
        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/18 focus:border-[#B6FF00]/38 focus:bg-white/[0.055] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.06)]"
      />
    </label>
  );
}
