"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Mail, X } from "lucide-react";

interface InviteBannerProps {
  inviteId: string;
  competitionId: string;
  inviterUsername: string | null;
  inviterDisplayName: string | null;
  competitionColor: string;
}

type Status = "idle" | "accepting" | "rejecting" | "accepted" | "rejected";

export function InviteBanner({
  inviteId,
  competitionId,
  inviterUsername,
  inviterDisplayName,
  competitionColor,
}: InviteBannerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const inviterName = inviterDisplayName || inviterUsername || "Atleta";

  async function respond(action: "accept" | "reject") {
    setError(null);
    setStatus(action === "accept" ? "accepting" : "rejecting");
    try {
      const res = await fetch(`/api/competitions/${competitionId}/invites/${inviteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus(action === "accept" ? "accepted" : "rejected");
        router.refresh();
        if (action === "accept") {
          setTimeout(() => router.refresh(), 850);
        }
      } else {
        setStatus("idle");
        setError(data.error ?? "Não foi possível responder ao convite.");
      }
    } catch {
      setStatus("idle");
      setError("Falha de conexão. Tente novamente.");
    }
  }

  if (status === "rejected") return null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border px-5 py-4"
      style={{
        borderColor: competitionColor + "28",
        background: competitionColor + "08",
        boxShadow: `0 0 32px ${competitionColor}0A`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${competitionColor}35, transparent)` }}
      />

      {status === "accepted" ? (
        <div className="flex items-center gap-3">
          <div
            className="grid size-9 shrink-0 place-items-center rounded-full"
            style={{ background: competitionColor + "20", color: competitionColor }}
          >
            <Check className="size-4" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: competitionColor }}>
              Convite aceito!
            </p>
            <p className="text-xs text-[#F5F5F5]/40">Entrando na competição...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid size-9 shrink-0 place-items-center rounded-full border"
              style={{
                borderColor: competitionColor + "35",
                background: competitionColor + "14",
                color: competitionColor,
              }}
            >
              <Mail className="size-4" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F5F5F5]/85">
                <span style={{ color: competitionColor }}>{inviterName}</span> te convidou para esta competição
              </p>
              {inviterUsername && <p className="text-[10px] text-[#F5F5F5]/30">@{inviterUsername}</p>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => respond("reject")}
              disabled={status !== "idle"}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 text-xs font-semibold text-[#F5F5F5]/45 transition-all hover:border-red-500/25 hover:text-red-400/70 disabled:pointer-events-none disabled:opacity-50"
            >
              {status === "rejecting" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <X className="size-3" strokeWidth={2} />
              )}
              Recusar
            </button>
            <button
              type="button"
              onClick={() => respond("accept")}
              disabled={status !== "idle"}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl px-4 text-xs font-bold text-[#080808] transition-all hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50"
              style={{
                background: competitionColor,
                boxShadow: `0 0 18px ${competitionColor}35`,
              }}
            >
              {status === "accepting" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Check className="size-3" strokeWidth={2.5} />
              )}
              Aceitar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300/80">
          {error}
        </p>
      )}
    </section>
  );
}
