"use client";

import {
  Dumbbell,
  Home,
  Medal,
  Plus,
  Rss,
  Swords,
  Timer,
  Users,
} from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

const LEFT_NAV = [
  { label: "Início",  href: "/",       icon: Home  },
  { label: "Treinos", href: "/treinos", icon: Dumbbell },
] as const;

const RIGHT_NAV = [
  { label: "Ranking", href: "/social", icon: Medal },
  { label: "Feed",   href: "/feed",  icon: Rss      },
] as const;

const ACTIONS = [
  {
    label: "Registrar corrida",
    desc:  "Adicione uma corrida",
    href:  "/corridas",
    icon:  Timer,
    color: "#B6FF00",
    bg:    "rgba(182,255,0,0.06)",
    border:"rgba(182,255,0,0.14)",
  },
  {
    label: "Registrar musculação",
    desc:  "Adicione um treino",
    href:  "/academia",
    icon:  Dumbbell,
    color: "#22D3EE",
    bg:    "rgba(34,211,238,0.06)",
    border:"rgba(34,211,238,0.14)",
  },
  {
    label: "Criar desafio",
    desc:  "Duelo 1×1 direto",
    href:  "/desafios/novo",
    icon:  Swords,
    color: "#FB923C",
    bg:    "rgba(251,146,60,0.06)",
    border:"rgba(251,146,60,0.14)",
  },
  {
    label: "Criar competição",
    desc:  "Grupo com ranking",
    href:  "/competicoes/criar",
    icon:  Users,
    color: "#A78BFA",
    bg:    "rgba(167,139,250,0.06)",
    border:"rgba(167,139,250,0.14)",
  },
] as const;

function NavItem({
  label,
  href,
  icon: Icon,
  pathname,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  pathname: string;
}) {
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex flex-1 flex-col items-center justify-center gap-1 py-3",
        "transition-all duration-200 active:scale-[0.88]",
        isActive ? "text-[#B6FF00]" : "text-[#F5F5F5]/32"
      )}
    >
      {isActive && (
        <span
          className="absolute inset-x-4 top-0 h-[2px] rounded-full bg-[#B6FF00]"
          style={{ boxShadow: "0 0 10px rgba(182,255,0,0.65)" }}
        />
      )}
      <Icon
        className="size-[22px] shrink-0 transition-all duration-200"
        strokeWidth={isActive ? 2.2 : 1.7}
        style={isActive ? { filter: "drop-shadow(0 0 6px rgba(182,255,0,0.55))" } : undefined}
      />
      <span
        className={cn(
          "text-[10px] font-semibold tracking-tight transition-all duration-200",
          isActive ? "opacity-100" : "opacity-40"
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const pathname   = usePathname();
  const router     = useRouter();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [sheetOpen, setSheetOpen]       = useState(false);
  const [mounted, setMounted]           = useState(false);
  const initialHeight = useRef(0);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  // Hide nav when software keyboard is open
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    initialHeight.current = vv.height;
    function onResize() {
      setKeyboardOpen(vv!.height < initialHeight.current * 0.75);
    }
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  // Close sheet on Escape
  useEffect(() => {
    if (!sheetOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSheetOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (!sheetOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  if (keyboardOpen) return null;

  function handleAction(href: string) {
    router.push(href);
    setSheetOpen(false);
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        aria-label="Navegação principal"
      >
        {/* Blurred background */}
        <div className="absolute inset-0 bg-[#090909]/92 backdrop-blur-2xl" />
        {/* Top border */}
        <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />

        <div
          className="relative flex items-stretch"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {LEFT_NAV.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}

          {/* Center FAB */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <button
              type="button"
              onClick={() => setSheetOpen((s) => !s)}
              aria-label="Criar atividade"
              aria-expanded={sheetOpen}
              className={cn(
                "grid size-[52px] place-items-center rounded-2xl text-[#080808]",
                "-translate-y-2.5 transition-all duration-300 active:scale-[0.92]",
                sheetOpen ? "rotate-45" : ""
              )}
              style={{
                background: sheetOpen ? "#D9D9D9" : "#B6FF00",
                boxShadow: sheetOpen
                  ? "0 4px 20px rgba(0,0,0,0.45)"
                  : "0 0 28px rgba(182,255,0,0.55), 0 4px 16px rgba(0,0,0,0.55)",
              }}
            >
              <Plus className="size-[22px]" strokeWidth={2.5} />
            </button>
          </div>

          {RIGHT_NAV.map((item) => (
            <NavItem key={item.href} {...item} pathname={pathname} />
          ))}
        </div>
      </nav>

      {/* Action sheet — portal to document.body */}
      {mounted && sheetOpen && createPortal(
        <>
          <style>{`
            @keyframes gpActBdIn  { from { opacity: 0; } to { opacity: 1; } }
            @keyframes gpActShIn  { from { transform: translateY(100%); } to { transform: translateY(0); } }
            .gp-act-bd   { animation: gpActBdIn 0.18s ease; }
            .gp-act-sh   { animation: gpActShIn 0.32s cubic-bezier(0.16,1,0.3,1); }
          `}</style>

          {/* Backdrop */}
          <div
            className="gp-act-bd fixed inset-0 z-[9997] bg-black/65 backdrop-blur-[3px]"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            className="gp-act-sh fixed inset-x-0 bottom-0 z-[9998] rounded-t-3xl border-t border-x border-white/[0.09] bg-[#0D0D0D]"
            style={{ boxShadow: "0 -8px 48px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.04)" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pb-1 pt-3">
              <div className="h-[5px] w-10 rounded-full bg-white/[0.14]" />
            </div>

            {/* Heading */}
            <div className="px-5 pb-3 pt-3">
              <p className="text-[12px] font-medium uppercase tracking-widest text-[#F5F5F5]/25">
                O que deseja fazer?
              </p>
            </div>

            {/* 2×2 action grid */}
            <div className="grid grid-cols-2 gap-2.5 px-4 pb-3">
              {ACTIONS.map(({ label, desc, href, icon: Icon, color, bg, border }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleAction(href)}
                  className="flex flex-col items-start gap-3 rounded-2xl p-4 text-left transition-all duration-150 active:scale-[0.97]"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <div
                    className="grid size-10 place-items-center rounded-xl"
                    style={{ background: `${color}1A` }}
                  >
                    <Icon className="size-5" strokeWidth={1.8} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold leading-snug text-[#F5F5F5]/90">
                      {label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#F5F5F5]/38">
                      {desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Cancel */}
            <div className="px-4 pb-4 pt-1">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex w-full items-center justify-center rounded-2xl bg-white/[0.04] py-3.5 text-[14px] font-semibold text-[#F5F5F5]/45 transition-colors active:bg-white/[0.07]"
              >
                Cancelar
              </button>
            </div>

            {/* iPhone home indicator safe area */}
            <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
          </div>
        </>,
        document.body
      )}
    </>
  );
}
