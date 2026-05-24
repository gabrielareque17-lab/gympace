"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Share, X, Zap } from "lucide-react";

type Platform = "android" | "ios" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "gp-pwa-dismissed-at";
const DISMISS_DAYS = 14;

function wasDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function saveDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
}

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [nativePrompt, setNativePrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0);

    // Already running as installed PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone || wasDismissedRecently()) return;

    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isIOSSafari = isIOS && /safari/i.test(ua) && !/crios|fxios|opios|mercury/i.test(ua);

    // Android / Chrome — listen for native prompt
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setNativePrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setTimeout(() => setVisible(true), 2500);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari — show manual instructions after delay
    if (isIOSSafari) {
      const timer = setTimeout(() => {
        setPlatform("ios");
        setVisible(true);
      }, 3000);
      return () => {
        clearTimeout(mountTimer);
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", onPrompt);
      };
    }

    // Hide prompt if user installs
    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      clearTimeout(mountTimer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    saveDismiss();
  }

  async function install() {
    if (!nativePrompt) return;
    await nativePrompt.prompt();
    const { outcome } = await nativePrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
  }

  if (!mounted || !visible || !platform) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes gpInstallSlideUp {
          from { transform: translateY(110%); opacity: 0.7; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .gp-install-sheet {
          animation: gpInstallSlideUp 0.42s cubic-bezier(0.16,1,0.3,1) both;
        }
      `}</style>

      {/* Sheet */}
      <div
        className="gp-install-sheet fixed inset-x-0 bottom-0 z-[9990] md:inset-x-auto md:bottom-6 md:right-6 md:w-[360px] md:rounded-3xl"
        style={{ boxShadow: "0 -4px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        <div className="rounded-t-3xl border border-b-0 border-white/[0.08] bg-[#0F0F0F] px-5 pb-2 pt-5 md:rounded-3xl md:border-b">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#B6FF00]"
                style={{ boxShadow: "0 0 20px rgba(182,255,0,0.35)" }}
              >
                <Zap className="size-5 text-[#080808]" strokeWidth={2.8} />
              </div>
              <div>
                <p className="font-display text-[15px] font-bold tracking-tight text-[#F5F5F5]">
                  GymPace
                </p>
                <p className="text-[12px] text-[#F5F5F5]/45">
                  {platform === "ios" ? "Adicione à Tela de Início" : "Instale para acesso rápido"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar"
              className="grid size-7 place-items-center rounded-full bg-white/[0.07] text-[#F5F5F5]/40 transition-colors hover:bg-white/[0.11] active:scale-90"
            >
              <X className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Divider */}
          <div className="my-4 h-px bg-white/[0.07]" />

          {platform === "ios" ? (
            <IOSInstructions />
          ) : (
            <AndroidCTA onInstall={install} />
          )}

          {/* Safe area */}
          <div style={{ height: "env(safe-area-inset-bottom, 12px)", minHeight: "12px" }} />
        </div>
      </div>
    </>,
    document.body
  );
}

function AndroidCTA({ onInstall }: { onInstall(): void }) {
  return (
    <div className="pb-1">
      {/* Feature list */}
      <div className="mb-4 space-y-2.5">
        {[
          { emoji: "⚡", text: "Acesso instantâneo, sem abrir o navegador" },
          { emoji: "🔔", text: "Notificações push de seguidores e competições" },
          { emoji: "📴", text: "Funciona offline com dados em cache" },
        ].map(({ emoji, text }) => (
          <div key={text} className="flex items-center gap-2.5">
            <span className="text-[15px]">{emoji}</span>
            <p className="text-[12px] text-[#F5F5F5]/55">{text}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onInstall}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#B6FF00] py-3.5 text-[14px] font-bold text-[#080808] transition-all active:scale-[0.97]"
        style={{ boxShadow: "0 0 24px rgba(182,255,0,0.30)" }}
      >
        Instalar agora
      </button>
    </div>
  );
}

function IOSInstructions() {
  return (
    <div className="pb-1">
      <div className="space-y-3 pb-3">
        {[
          {
            step: "1",
            icon: <Share className="size-3.5 shrink-0" style={{ color: "#3B82F6" }} strokeWidth={2} />,
            text: (
              <>
                Toque em{" "}
                <span className="font-semibold text-[#3B82F6]">Compartilhar</span>{" "}
                <span className="text-[#F5F5F5]/35">(ícone de seta na barra do Safari)</span>
              </>
            ),
          },
          {
            step: "2",
            icon: <span className="text-[11px]">📲</span>,
            text: (
              <>
                Role para baixo e toque em{" "}
                <span className="font-semibold text-[#B6FF00]">&ldquo;Adicionar à Tela de Início&rdquo;</span>
              </>
            ),
          },
          {
            step: "3",
            icon: <span className="text-[11px]">✅</span>,
            text: (
              <>
                Toque em <span className="font-semibold text-[#F5F5F5]/75">&ldquo;Adicionar&rdquo;</span> no canto superior direito
              </>
            ),
          },
        ].map(({ step, icon, text }) => (
          <div key={step} className="flex items-start gap-3">
            <div className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[10px] font-bold text-[#F5F5F5]/40">
              {step}
            </div>
            <div className="flex items-center gap-1.5">
              {icon}
              <p className="text-[12px] leading-relaxed text-[#F5F5F5]/55">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
