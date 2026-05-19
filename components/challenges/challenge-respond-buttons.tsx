"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Ban } from "lucide-react";

interface Props {
  challengeId: string;
  isCreator: boolean;
  isChallenged: boolean;
  status: string;
}

export function ChallengeRespondButtons({
  challengeId,
  isCreator,
  isChallenged,
  status,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "decline" | "cancel") {
    setLoading(action);
    setError(null);

    const res = await fetch(`/api/challenges/${challengeId}/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? "Erro ao processar");
      setLoading(null);
      return;
    }

    router.refresh();
    setLoading(null);
  }

  // Challenged user seeing a pending challenge
  if (isChallenged && status === "pending") {
    return (
      <div className="space-y-2.5">
        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => respond("accept")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-[#080808] transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "#B6FF00",
              boxShadow: "0 0 20px rgba(182,255,0,0.35)",
            }}
          >
            <CheckCircle2 className="size-4" strokeWidth={2.5} />
            {loading === "accept" ? "Aceitando..." : "Aceitar"}
          </button>
          <button
            type="button"
            onClick={() => respond("decline")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] py-3.5 text-sm font-semibold text-[#F5F5F5]/55 transition-all duration-150 hover:bg-red-500/[0.07] hover:text-red-400/80 active:scale-[0.97] disabled:opacity-50"
          >
            <XCircle className="size-4" strokeWidth={1.8} />
            {loading === "decline" ? "Recusando..." : "Recusar"}
          </button>
        </div>
      </div>
    );
  }

  // Creator or challenged seeing a cancelable challenge
  const canCancel =
    (isCreator || isChallenged) && ["pending", "active"].includes(status);

  if (canCancel) {
    return (
      <div className="space-y-2">
        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => respond("cancel")}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/[0.15] bg-red-500/[0.05] py-3 text-[13px] font-semibold text-red-400/65 transition-all duration-150 hover:bg-red-500/[0.10] hover:text-red-400/90 active:scale-[0.97] disabled:opacity-50"
        >
          <Ban className="size-4" strokeWidth={1.8} />
          {loading === "cancel" ? "Cancelando..." : "Cancelar desafio"}
        </button>
      </div>
    );
  }

  return null;
}
