"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldAlert, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase";

// ─── Password strength ────────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3;

function getStrength(password: string): StrengthLevel {
  if (password.length === 0) return 0;
  if (password.length < 8) return 1;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const bonus = (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (bonus >= 2) return 3;
  if (bonus >= 1) return 2;
  return 1;
}

const STRENGTH_CONFIG: Record<
  StrengthLevel,
  { label: string; color: string; segments: number }
> = {
  0: { label: "", color: "bg-white/[0.07]", segments: 0 },
  1: { label: "Fraca", color: "bg-red-400", segments: 1 },
  2: { label: "Média", color: "bg-yellow-400", segments: 2 },
  3: { label: "Forte", color: "bg-[#B6FF00]", segments: 3 },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NovaSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"checking" | "ready" | "loading" | "success" | "expired">(
    "checking"
  );

  // Verify there is an active session (set by the auth callback)
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? "ready" : "expired");
    });
  }, []);

  const strength = getStrength(password);
  const strengthConfig = STRENGTH_CONFIG[strength];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setStatus("loading");

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(
        updateError.message.includes("same password")
          ? "A nova senha não pode ser igual à anterior."
          : "Erro ao atualizar a senha. Tente novamente."
      );
      setStatus("ready");
      return;
    }

    setStatus("success");

    // Sign out and redirect after the user sees the success state
    setTimeout(async () => {
      await supabase.auth.signOut();
      router.replace("/login");
    }, 2800);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0D0D0D] px-5 py-12 text-[#F5F5F5]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#B6FF00]/[0.04] blur-[100px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2.5">
          <div
            className="grid size-11 place-items-center rounded-2xl bg-[#B6FF00]"
            style={{ boxShadow: "0 0 32px rgba(182,255,0,0.28)" }}
          >
            <Zap className="size-5 text-[#080808]" strokeWidth={2.8} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B6FF00]/60">
            GymPace
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
          {status === "checking" && <CheckingSkeleton />}
          {status === "expired" && <ExpiredState />}
          {status === "success" && <SuccessState />}
          {(status === "ready" || status === "loading") && (
            <FormContent
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirm={showConfirm}
              setShowConfirm={setShowConfirm}
              strength={strength}
              strengthConfig={strengthConfig}
              error={error}
              isLoading={status === "loading"}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        {(status === "ready" || status === "loading") && (
          <div className="mt-6 text-center">
            <Link
              href="/esqueci-senha"
              className="text-sm text-[#F5F5F5]/32 transition-colors hover:text-[#F5F5F5]/55"
            >
              Solicitar novo link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckingSkeleton() {
  return (
    <div className="px-7 py-10">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 animate-pulse rounded-2xl bg-white/[0.06]" />
        <div className="space-y-2 text-center">
          <div className="mx-auto h-5 w-40 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="mx-auto h-3.5 w-56 animate-pulse rounded-lg bg-white/[0.04]" />
        </div>
        <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="mt-1 h-11 w-full animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

function ExpiredState() {
  return (
    <div className="relative px-7 pb-8 pt-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/[0.18] to-transparent" />

      <div className="flex flex-col items-center text-center">
        <div className="mb-5 grid size-14 place-items-center rounded-2xl border border-red-500/20 bg-red-500/[0.08]">
          <ShieldAlert className="size-7 text-red-400" strokeWidth={1.7} />
        </div>

        <h2 className="font-display text-xl font-bold tracking-tight">
          Link expirado
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#F5F5F5]/45">
          Este link de redefinição expirou ou já foi utilizado. Solicite um novo link para continuar.
        </p>

        <Link
          href="/esqueci-senha"
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] text-sm font-bold text-[#080808] shadow-[0_0_28px_rgba(182,255,0,0.18)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_36px_rgba(182,255,0,0.28)] active:translate-y-0"
        >
          Solicitar novo link
        </Link>

        <Link
          href="/login"
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-medium text-[#F5F5F5]/40 transition-colors hover:text-[#F5F5F5]/65"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="relative px-7 pb-8 pt-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/[0.18] to-transparent" />

      <div className="flex flex-col items-center text-center">
        <div
          className="mb-5 grid size-14 place-items-center rounded-2xl border border-[#B6FF00]/20 bg-[#B6FF00]/[0.08]"
          style={{ boxShadow: "0 0 28px rgba(182,255,0,0.07)" }}
        >
          <CheckCircle2
            className="size-7 text-[#B6FF00]"
            strokeWidth={1.8}
            style={{ filter: "drop-shadow(0 0 6px rgba(182,255,0,0.5))" }}
          />
        </div>

        <h2 className="font-display text-xl font-bold tracking-tight">
          Senha atualizada!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#F5F5F5]/45">
          Sua senha foi redefinida com sucesso. Você será redirecionado para o login em instantes.
        </p>

        <div className="mt-5 flex w-full items-center gap-2">
          <Loader2 className="size-4 shrink-0 animate-spin text-[#B6FF00]/60" />
          <span className="text-xs text-[#F5F5F5]/35">Redirecionando para o login...</span>
        </div>
      </div>
    </div>
  );
}

function FormContent({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirm,
  setShowConfirm,
  strength,
  strengthConfig,
  error,
  isLoading,
  onSubmit,
}: {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirm: boolean;
  setShowConfirm: (v: boolean) => void;
  strength: StrengthLevel;
  strengthConfig: (typeof STRENGTH_CONFIG)[StrengthLevel];
  error: string;
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="relative px-7 pb-7 pt-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <KeyRound className="size-5 text-[#F5F5F5]/50" strokeWidth={1.7} />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight">
          Nova senha
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#F5F5F5]/40">
          Escolha uma senha forte para proteger sua conta.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Password field */}
        <div>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/50">
              Nova senha
            </span>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 pr-11 text-sm font-medium text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/18 focus:border-[#B6FF00]/38 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.06)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F5F5F5]/30 transition-colors hover:text-[#F5F5F5]/60"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" strokeWidth={1.8} />
                ) : (
                  <Eye className="size-4" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </label>

          {/* Strength meter */}
          {password.length > 0 && (
            <div className="mt-2.5">
              <div className="flex gap-1.5">
                {[1, 2, 3].map((seg) => (
                  <div
                    key={seg}
                    className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                      strength >= seg ? strengthConfig.color : "bg-white/[0.07]"
                    }`}
                    style={
                      strength >= seg && strength === 3
                        ? { boxShadow: "0 0 6px rgba(182,255,0,0.35)" }
                        : {}
                    }
                  />
                ))}
              </div>
              {strengthConfig.label && (
                <p
                  className="mt-1.5 text-[11px] font-semibold"
                  style={{
                    color:
                      strength === 1
                        ? "rgba(248,113,113,0.8)"
                        : strength === 2
                          ? "rgba(250,204,21,0.8)"
                          : "rgba(182,255,0,0.8)",
                  }}
                >
                  Senha {strengthConfig.label.toLowerCase()}
                  {strength === 1 && " — adicione letras maiúsculas e números"}
                  {strength === 2 && " — adicione um caractere especial para fortalecer"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirm password field */}
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/50">
            Confirmar senha
          </span>
          <div className="relative">
            <input
              required
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
              className={`h-11 w-full rounded-xl border bg-white/[0.04] px-4 pr-11 text-sm font-medium text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/18 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.06)] ${
                confirmPassword.length > 0 && confirmPassword !== password
                  ? "border-red-500/30 focus:border-red-500/50 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.06)]"
                  : "border-white/[0.08] focus:border-[#B6FF00]/38"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F5F5F5]/30 transition-colors hover:text-[#F5F5F5]/60"
              aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
            >
              {showConfirm ? (
                <EyeOff className="size-4" strokeWidth={1.8} />
              ) : (
                <Eye className="size-4" strokeWidth={1.8} />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <p className="mt-1.5 text-[11px] font-semibold text-red-400/80">
              As senhas não coincidem
            </p>
          )}
        </label>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm font-medium text-red-300/90">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || (confirmPassword.length > 0 && confirmPassword !== password)}
          className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] text-sm font-bold text-[#080808] shadow-[0_0_28px_rgba(182,255,0,0.18)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_36px_rgba(182,255,0,0.28)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          {isLoading ? "Salvando..." : "Definir nova senha"}
        </button>
      </form>
    </div>
  );
}
