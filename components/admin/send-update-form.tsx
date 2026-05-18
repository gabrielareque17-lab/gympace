"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_TITLE = 120;
const MAX_MSG = 500;

export function SendUpdateForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState({ msg: "", count: 0 });

  const canSubmit =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    status !== "loading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setFeedback({ msg: "", count: 0 });

    try {
      const res = await fetch("/api/admin/send-update", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setFeedback({ msg: json.error ?? "Erro ao enviar", count: 0 });
        return;
      }

      setStatus("success");
      setFeedback({ msg: "", count: json.sent ?? 0 });
      setTitle("");
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback({ msg: "Erro de conexão. Tente novamente.", count: 0 });
    }
  }

  function handleChange() {
    if (status !== "idle") setStatus("idle");
  }

  const titleWarn = title.length > MAX_TITLE * 0.85;
  const msgWarn = message.length > MAX_MSG * 0.85;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Title */}
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F5]/40">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); handleChange(); }}
            placeholder="Ex: Nova funcionalidade disponível 🎉"
            maxLength={MAX_TITLE}
            autoComplete="off"
            className={cn(
              "w-full rounded-xl border bg-[#0D0D0D] px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#F5F5F5]/20",
              "transition-all duration-150 focus:outline-none",
              "focus:border-[#B6FF00]/40 focus:ring-1 focus:ring-[#B6FF00]/20",
              titleWarn ? "border-orange-500/50" : "border-white/[0.08]"
            )}
          />
          <div className="mt-1.5 flex justify-end">
            <CharCount current={title.length} max={MAX_TITLE} warn={titleWarn} />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F5]/40">
            Mensagem
          </label>
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); handleChange(); }}
            placeholder="Escreva aqui a mensagem completa da notificação... Suporta emojis e caracteres PT-BR 🇧🇷"
            maxLength={MAX_MSG}
            rows={6}
            className={cn(
              "w-full resize-none rounded-xl border bg-[#0D0D0D] px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#F5F5F5]/20",
              "transition-all duration-150 focus:outline-none",
              "focus:border-[#B6FF00]/40 focus:ring-1 focus:ring-[#B6FF00]/20",
              msgWarn ? "border-orange-500/50" : "border-white/[0.08]"
            )}
          />
          <div className="mt-1.5 flex justify-end">
            <CharCount current={message.length} max={MAX_MSG} warn={msgWarn} />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[13px] font-semibold transition-all duration-200",
            canSubmit
              ? "bg-[#B6FF00] text-[#080808] hover:bg-[#c9ff33] active:scale-[0.98]"
              : "cursor-not-allowed bg-[#B6FF00]/15 text-[#B6FF00]/35"
          )}
        >
          {status === "loading" ? (
            <>
              <RefreshCw className="size-4 animate-spin" strokeWidth={2} />
              Enviando...
            </>
          ) : (
            <>
              <Send className="size-4" strokeWidth={2} />
              Enviar para todos os usuários
            </>
          )}
        </button>

        {/* Feedback */}
        {status === "success" && (
          <FeedbackBanner
            variant="success"
            title="Update enviado com sucesso!"
            body={`Notificação entregue para ${feedback.count.toLocaleString("pt-BR")} usuário${feedback.count !== 1 ? "s" : ""}.`}
          />
        )}
        {status === "error" && (
          <FeedbackBanner variant="error" title="Erro ao enviar" body={feedback.msg} />
        )}
      </form>

      {/* ── Live preview ─────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F5]/40">
          Preview em tempo real
        </p>
        <NotificationPreview title={title} message={message} />
        <p className="mt-3 text-[11px] text-[#F5F5F5]/25">
          É assim que a notificação vai aparecer no sino dos usuários.
        </p>
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CharCount({
  current,
  max,
  warn,
}: {
  current: number;
  max: number;
  warn: boolean;
}) {
  return (
    <span
      className={cn(
        "text-[11px] tabular-nums transition-colors",
        warn ? "text-orange-400" : "text-[#F5F5F5]/25"
      )}
    >
      {current}/{max}
    </span>
  );
}

function FeedbackBanner({
  variant,
  title,
  body,
}: {
  variant: "success" | "error";
  title: string;
  body: string;
}) {
  const isSuccess = variant === "success";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3.5",
        isSuccess
          ? "border-[#B6FF00]/20 bg-[#B6FF00]/8"
          : "border-red-500/20 bg-red-500/8"
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#B6FF00]" strokeWidth={2} />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" strokeWidth={2} />
      )}
      <div>
        <p
          className={cn(
            "text-[13px] font-semibold",
            isSuccess ? "text-[#B6FF00]" : "text-red-400"
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[12px]",
            isSuccess ? "text-[#B6FF00]/60" : "text-red-400/70"
          )}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

function NotificationPreview({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const hasContent = title.trim() || message.trim();

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D0D0D]">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Bell className="size-3 text-[#F5F5F5]/25" strokeWidth={1.8} />
          <span className="text-[11px] font-semibold text-[#F5F5F5]/35">Notificações</span>
        </div>
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#080808]"
          style={{ background: "#B6FF00", opacity: 0.7 }}
        >
          PREVIEW
        </span>
      </div>

      {/* Notification item */}
      <div className="px-4 py-4">
        {hasContent ? (
          <div className="flex items-start gap-3.5">
            {/* Icon bubble */}
            <div className="relative mt-0.5 shrink-0">
              <div
                className="grid size-9 place-items-center rounded-xl"
                style={{ background: "rgba(182,255,0,0.08)" }}
              >
                <Zap
                  className="size-[18px]"
                  strokeWidth={1.8}
                  style={{ color: "#B6FF00" }}
                />
              </div>
              <span
                className="absolute -right-0.5 -top-0.5 size-[9px] rounded-full bg-[#B6FF00]"
                style={{ boxShadow: "0 0 6px rgba(182,255,0,0.75)" }}
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold leading-snug text-[#F5F5F5]/92">
                  {title.trim() || (
                    <span className="italic text-[#F5F5F5]/25">Título da notificação</span>
                  )}
                </p>
                <span className="mt-px shrink-0 text-[11px] tabular-nums text-[#F5F5F5]/25">
                  agora
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-[#F5F5F5]/48">
                {message.trim() || (
                  <span className="italic text-[#F5F5F5]/20">Mensagem da notificação...</span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-[12px] text-[#F5F5F5]/25">
            Comece a digitar para ver o preview
          </p>
        )}
      </div>
    </div>
  );
}
