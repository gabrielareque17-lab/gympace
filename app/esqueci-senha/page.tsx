"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Zap } from "lucide-react";
import Link from "next/link";

import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/nova-senha`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      setErrorMessage("Não foi possível enviar o email. Tente novamente.");
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0D0D0D] px-5 py-12 text-[#F5F5F5]">
      {/* Background glow */}
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
          {status === "success" ? (
            <SuccessState email={email} />
          ) : (
            <FormState
              email={email}
              setEmail={setEmail}
              status={status}
              errorMessage={errorMessage}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-[#F5F5F5]/35 transition-colors hover:text-[#F5F5F5]/60"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            Voltar para o login
          </Link>
        </div>
      </div>
    </main>
  );
}

function FormState({
  email,
  setEmail,
  status,
  errorMessage,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  status: "idle" | "loading" | "error";
  errorMessage: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="relative px-7 pb-7 pt-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />

      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Mail className="size-5 text-[#F5F5F5]/50" strokeWidth={1.7} />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight">
          Esqueceu sua senha?
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#F5F5F5]/40">
          Sem problema. Informe seu email e enviaremos um link para redefinir.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-[#F5F5F5]/50">
            Email cadastrado
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-[#F5F5F5] outline-none transition-all duration-200 placeholder:text-[#F5F5F5]/18 focus:border-[#B6FF00]/38 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(182,255,0,0.06)]"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm font-medium text-red-300/90">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] text-sm font-bold text-[#080808] shadow-[0_0_28px_rgba(182,255,0,0.18)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_36px_rgba(182,255,0,0.28)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-55"
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Mail className="size-4" />
          )}
          {status === "loading" ? "Enviando..." : "Enviar link de redefinição"}
        </button>
      </form>

      <div className="mt-6 border-t border-white/[0.05] pt-5 text-center">
        <p className="text-sm text-[#F5F5F5]/35">
          Lembrou a senha?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#B6FF00]/80 transition-colors hover:text-[#B6FF00]"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

function SuccessState({ email }: { email: string }) {
  return (
    <div className="relative px-7 pb-8 pt-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/[0.18] to-transparent" />

      <div className="flex flex-col items-center text-center">
        <div
          className="mb-5 grid size-14 place-items-center rounded-2xl bg-[#B6FF00]/[0.1] border border-[#B6FF00]/20"
          style={{ boxShadow: "0 0 28px rgba(182,255,0,0.08)" }}
        >
          <CheckCircle2
            className="size-7 text-[#B6FF00]"
            strokeWidth={1.8}
            style={{ filter: "drop-shadow(0 0 6px rgba(182,255,0,0.5))" }}
          />
        </div>

        <h2 className="font-display text-xl font-bold tracking-tight">
          Email enviado!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#F5F5F5]/45">
          Enviamos um link para{" "}
          <span className="font-semibold text-[#F5F5F5]/75">{email}</span>.
          <br />
          Verifique sua caixa de entrada e spam.
        </p>

        <div className="mt-6 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
          <p className="text-xs leading-relaxed text-[#F5F5F5]/38">
            O link expira em <span className="font-semibold text-[#F5F5F5]/55">1 hora</span>. Caso não receba, verifique a pasta de spam ou tente novamente.
          </p>
        </div>

        <Link
          href="/login"
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-[#F5F5F5]/65 transition-all duration-200 hover:bg-white/[0.07] hover:text-[#F5F5F5]/85"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
