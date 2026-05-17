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
        <main className="grid min-h-screen place-items-center bg-[#0D0D0D] px-5 py-12">
          <div className="h-96 w-full max-w-sm animate-pulse rounded-2xl border border-white/[0.07] bg-[#111111]" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0D0D0D] px-5 py-12 text-[#F5F5F5]">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#B6FF00]/[0.04] blur-[100px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2.5">
          <div className="grid size-11 place-items-center rounded-2xl bg-[#B6FF00] shadow-[0_0_32px_rgba(182,255,0,0.28)]">
            <Zap className="size-5 text-[#080808]" strokeWidth={2.8} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B6FF00]/60">
            GymPace
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
          <div className="relative px-7 pb-7 pt-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

            <div className="mb-6 text-center">
              <h1 className="font-display text-xl font-bold tracking-tight">
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

              {error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm font-medium text-red-300/90">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] text-sm font-bold text-[#080808] shadow-[0_0_28px_rgba(182,255,0,0.18)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_36px_rgba(182,255,0,0.28)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogIn className="size-4" />
                )}
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
        className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/18 focus:border-[#B6FF00]/38 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.06)]"
      />
    </label>
  );
}
