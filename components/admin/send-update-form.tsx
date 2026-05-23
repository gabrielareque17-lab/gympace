"use client";

import { useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Megaphone,
  RefreshCw,
  Send,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_TITLE = 120;
const MAX_MSG = 500;
const MAX_FEATURES = 2000;

const UPDATE_TYPES = [
  { value: "feature", label: "Novidade", icon: Sparkles },
  { value: "bugfix", label: "Correcao", icon: Wrench },
  { value: "season", label: "Temporada", icon: Zap },
  { value: "announcement", label: "Comunicado", icon: Megaphone },
] as const;

type UpdateType = (typeof UPDATE_TYPES)[number]["value"];

export function SendUpdateForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [features, setFeatures] = useState("");
  const [updateType, setUpdateType] = useState<UpdateType>("feature");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState({ msg: "", count: 0 });

  const canSubmit =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    features.trim().length > 0 &&
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
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          features: features.trim(),
          updateType,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setFeedback({ msg: json.error ?? "Erro ao publicar", count: 0 });
        return;
      }

      setStatus("success");
      setFeedback({ msg: "", count: json.sent ?? 0 });
      setTitle("");
      setMessage("");
      setFeatures("");
      setUpdateType("feature");
    } catch {
      setStatus("error");
      setFeedback({ msg: "Erro de conexao. Tente novamente.", count: 0 });
    }
  }

  function handleChange() {
    if (status !== "idle") setStatus("idle");
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:gap-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F5]/40">
            Tipo de update
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {UPDATE_TYPES.map(({ value, label, icon: Icon }) => {
              const active = updateType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setUpdateType(value);
                    handleChange();
                  }}
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-xl border text-[12px] font-semibold transition-all active:scale-[0.98]",
                    active
                      ? "border-[#B6FF00]/45 bg-[#B6FF00]/12 text-[#B6FF00]"
                      : "border-white/[0.08] bg-[#0D0D0D] text-[#F5F5F5]/38 hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={2} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <Field
          label="Título da atualização"
          value={title}
          onChange={setTitle}
          onDirty={handleChange}
          placeholder="Ex: Temporada Neon Rush chegou"
          maxLength={MAX_TITLE}
        />

        <TextArea
          label="Resumo da notificação"
          value={message}
          onChange={setMessage}
          onDirty={handleChange}
          placeholder="Mensagem curta que aparece no sino dos usuários."
          maxLength={MAX_MSG}
          rows={4}
        />

        <TextArea
          label="Novas funcionalidades / detalhes"
          value={features}
          onChange={setFeatures}
          onDirty={handleChange}
          placeholder={"Escreva uma novidade por linha:\nNovo sistema de avatares premium\nPerfil mobile mais compacto\nCorrecoes no feed"}
          maxLength={MAX_FEATURES}
          rows={8}
        />

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
              Publicando...
            </>
          ) : (
            <>
              <Send className="size-4" strokeWidth={2} />
              Publicar update para todos
            </>
          )}
        </button>

        {status === "success" && (
          <FeedbackBanner
            variant="success"
            title="Update publicado!"
            body={`Histórico atualizado e notificação enviada para ${feedback.count.toLocaleString("pt-BR")} usuário${feedback.count !== 1 ? "s" : ""}.`}
          />
        )}
        {status === "error" && (
          <FeedbackBanner variant="error" title="Erro ao publicar" body={feedback.msg} />
        )}
      </form>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F5]/40">
          Preview
        </p>
        <UpdatePreview title={title} message={message} features={features} updateType={updateType} />
        <p className="mt-3 text-[11px] leading-relaxed text-[#F5F5F5]/25">
          O resumo vai para a notificação. Os detalhes ficam salvos na página de atualizações.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onDirty,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onDirty: () => void;
  placeholder: string;
  maxLength: number;
}) {
  const warn = value.length > maxLength * 0.85;
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F5]/40">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onDirty();
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        className={cn(
          "w-full rounded-xl border bg-[#0D0D0D] px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#F5F5F5]/20",
          "transition-all duration-150 focus:outline-none focus:border-[#B6FF00]/40 focus:ring-1 focus:ring-[#B6FF00]/20",
          warn ? "border-orange-500/50" : "border-white/[0.08]"
        )}
      />
      <CharCount current={value.length} max={maxLength} warn={warn} />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  onDirty,
  placeholder,
  maxLength,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onDirty: () => void;
  placeholder: string;
  maxLength: number;
  rows: number;
}) {
  const warn = value.length > maxLength * 0.85;
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-[#F5F5F5]/40">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onDirty();
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-xl border bg-[#0D0D0D] px-4 py-3 text-sm leading-relaxed text-[#F5F5F5] placeholder:text-[#F5F5F5]/20",
          "transition-all duration-150 focus:outline-none focus:border-[#B6FF00]/40 focus:ring-1 focus:ring-[#B6FF00]/20",
          warn ? "border-orange-500/50" : "border-white/[0.08]"
        )}
      />
      <CharCount current={value.length} max={maxLength} warn={warn} />
    </div>
  );
}

function CharCount({ current, max, warn }: { current: number; max: number; warn: boolean }) {
  return (
    <div className="mt-1.5 flex justify-end">
      <span className={cn("text-[11px] tabular-nums", warn ? "text-orange-400" : "text-[#F5F5F5]/25")}>
        {current}/{max}
      </span>
    </div>
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
        isSuccess ? "border-[#B6FF00]/20 bg-[#B6FF00]/8" : "border-red-500/20 bg-red-500/8"
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#B6FF00]" strokeWidth={2} />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" strokeWidth={2} />
      )}
      <div>
        <p className={cn("text-[13px] font-semibold", isSuccess ? "text-[#B6FF00]" : "text-red-400")}>
          {title}
        </p>
        <p className={cn("mt-0.5 text-[12px]", isSuccess ? "text-[#B6FF00]/60" : "text-red-400/70")}>
          {body}
        </p>
      </div>
    </div>
  );
}

function UpdatePreview({
  title,
  message,
  features,
  updateType,
}: {
  title: string;
  message: string;
  features: string;
  updateType: UpdateType;
}) {
  const type = UPDATE_TYPES.find((item) => item.value === updateType) ?? UPDATE_TYPES[0];
  const Icon = type.icon;
  const featureLines = features
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D0D0D]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Bell className="size-3 text-[#F5F5F5]/25" strokeWidth={1.8} />
          <span className="text-[11px] font-semibold text-[#F5F5F5]/35">Atualizações</span>
        </div>
        <span className="rounded bg-[#B6FF00]/75 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-[#080808]">
          PREVIEW
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3.5">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/10">
            <Icon className="size-[18px] text-[#B6FF00]" strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#B6FF00]/75">
              {type.label}
            </div>
            <h3 className="text-[15px] font-bold leading-snug text-[#F5F5F5]">
              {title.trim() || "Título da atualização"}
            </h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#F5F5F5]/48">
              {message.trim() || "Resumo curto da notificação para todos os usuários."}
            </p>
            {featureLines.length > 0 && (
              <div className="mt-3 space-y-2">
                {featureLines.map((line) => (
                  <div key={line} className="flex gap-2 text-[12px] leading-relaxed text-[#F5F5F5]/62">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#B6FF00]" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
