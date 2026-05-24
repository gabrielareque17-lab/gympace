"use client";

import { FormEvent, Suspense, useState } from "react";
import { Loader2, LogIn, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#080808] px-5">
          <div className="h-96 w-full max-w-sm animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111]" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

const BRAND_STATS = [
  { value: "47.3", unit: "km", label: "Volume semanal" },
  { value: "4:52", unit: "/km", label: "Pace pessoal" },
  { value: "180", unit: "dias", label: "Sequência recorde" },
];

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#060606] lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">
      {/* Noise grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Right divider */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />
      {/* Glow */}
      <div className="pointer-events-none absolute -left-28 top-1/2 size-96 -translate-y-1/2 rounded-full bg-[#B6FF00]/[0.065] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 size-48 rounded-full bg-[#B6FF00]/[0.03] blur-[70px]" />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div
          className="grid size-9 place-items-center rounded-xl bg-[#B6FF00]"
          style={{ boxShadow: "0 0 20px rgba(182,255,0,0.35)" }}
        >
          <Zap className="size-[18px] text-[#080808]" strokeWidth={2.8} />
        </div>
        <span
          className="leading-none text-white"
          style={{ fontFamily: "var(--font-hero)", fontSize: "1.5rem", letterSpacing: "0.1em" }}
        >
          GymPace
        </span>
      </div>

      {/* Headline + stats */}
      <div className="relative">
        <h2
          className="leading-[0.9] text-white"
          style={{
            fontFamily: "var(--font-hero)",
            fontSize: "clamp(3rem, 4.5vw, 4.5rem)",
            letterSpacing: "0.02em",
          }}
        >
          Treine.<br />Evolua.<br />
          <span style={{ color: "#B6FF00" }}>Supere.</span>
        </h2>
        <p className="mt-5 max-w-xs text-sm leading-7 text-[#F5F5F5]/38">
          Corrida com GPS, academia, XP, ranking e competições em tempo real.
        </p>

        <div className="mt-10 flex gap-8 border-t border-white/[0.07] pt-8">
          {BRAND_STATS.map((stat) => (
            <div key={stat.label}>
              <div className="flex items-baseline gap-0.5">
                <span
                  className="leading-none text-white"
                  style={{
                    fontFamily: "var(--font-hero)",
                    fontSize: "1.875rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {stat.value}
                </span>
                <span className="ml-0.5 text-xs font-bold text-[#B6FF00]">{stat.unit}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#F5F5F5]/30">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Email ou senha incorretos. Tente novamente.");
      setIsLoading(false);
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/";
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <main className="relative min-h-screen bg-[#080808] text-[#F5F5F5] lg:grid lg:grid-cols-[40%,1fr]">
      <BrandPanel />

      {/* Form column */}
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#B6FF00]/[0.025] blur-[100px]" />
        </div>

        <div className="relative w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/landing" className="group mb-10 flex flex-col items-center gap-3 lg:hidden">
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
              <div className="mb-7">
                <h1
                  className="leading-tight text-white"
                  style={{
                    fontFamily: "var(--font-hero)",
                    fontSize: "1.875rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  Entrar na conta
                </h1>
                <p className="mt-1.5 text-sm text-[#F5F5F5]/40">
                  Acesse seu dashboard e acompanhe sua evolução.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="voce@email.com"
                  autoComplete="email"
                />
                <div>
                  <AuthField
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Sua senha"
                    autoComplete="current-password"
                  />
                  <div className="mt-2 text-right">
                    <Link
                      href="/esqueci-senha"
                      className="text-xs font-medium text-[#F5F5F5]/38 transition-colors hover:text-[#B6FF00]/80"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm font-medium text-red-300/90">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] text-sm font-bold text-[#080808] transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
                  style={{ boxShadow: "0 0 24px rgba(182,255,0,0.18), 0 4px 16px rgba(0,0,0,0.3)" }}
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                  {isLoading ? "Entrando..." : "Entrar"}
                </button>
              </form>
            </div>

            <div className="border-t border-white/[0.05] px-7 py-4 text-center">
              <p className="text-sm text-[#F5F5F5]/35">
                Não tem conta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-[#B6FF00]/80 transition-colors hover:text-[#B6FF00]"
                >
                  Criar agora
                </Link>
              </p>
            </div>
          </div>

          {/* Desktop back link */}
          <div className="mt-5 hidden text-center lg:block">
            <Link
              href="/landing"
              className="text-xs text-[#F5F5F5]/28 transition-colors hover:text-[#F5F5F5]/55"
            >
              ← Voltar para apresentação
            </Link>
          </div>
        </div>
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
}: {
  label: string;
  type: "email" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
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
        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/18 focus:border-[#B6FF00]/38 focus:bg-white/[0.055] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.06)]"
      />
    </label>
  );
}
