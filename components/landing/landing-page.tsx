"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  Dumbbell,
  Flame,
  Footprints,
  MapPin,
  MessageCircle,
  Route,
  Shield,
  Smartphone,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView<T extends HTMLElement = HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 1600;
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target]);

  return (
    <span ref={ref}>
      {current.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.05] bg-[#080808]/85 shadow-[0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl"
          : ""
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="grid size-[30px] place-items-center rounded-[8px] bg-[#B6FF00] shadow-[0_0_16px_rgba(182,255,0,0.4)]">
            <Zap className="size-[15px] text-[#080808]" strokeWidth={3} />
          </div>
          <span className="font-display text-[16px] font-bold tracking-[-0.02em] sm:text-[17px]">GymPace</span>
        </div>

        <nav className="hidden items-center gap-7 md:flex">
          {[
            ["Funcionalidades", "#features"],
            ["Analytics", "#analytics"],
            ["PWA", "#mobile"],
            ["Competições", "#competitions"],
            ["Evolução", "#evolution"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-[13px] text-[#F5F5F5]/45 transition-colors duration-150 hover:text-[#F5F5F5]/90"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-[13px] text-[#F5F5F5]/45 transition-colors hover:text-[#F5F5F5]/90 md:block"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-[40px] items-center rounded-[10px] bg-[#B6FF00] px-3.5 py-1.5 text-[13px] font-bold text-[#080808] transition-all duration-200 hover:bg-[#CAFF30] hover:shadow-[0_0_20px_rgba(182,255,0,0.4)] sm:px-4 sm:py-2"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── App Preview Mockup ───────────────────────────────────────────────────────

function AppPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[#080808] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-[#080808] to-transparent" />

      <div className="absolute inset-0 scale-95 rounded-3xl bg-[#B6FF00]/[0.06] blur-3xl" />

      <div className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0C0C0C] shadow-[0_40px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.05] bg-[#0A0A0A] px-4 py-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="size-[11px] rounded-full bg-white/10" />
            ))}
          </div>
          <div className="mx-auto flex h-6 w-44 items-center justify-center rounded-md bg-white/[0.04] text-[10px] text-white/20">
            gympace.app
          </div>
        </div>

        {/* Dashboard content */}
        <div className="bg-[#090909] p-5">
          <div className="mb-5">
            <div className="mb-1.5 h-1.5 w-10 rounded-full bg-[#B6FF00]/50" />
            <div className="h-4 w-28 rounded bg-white/10" />
          </div>

          {/* 4 metric cards */}
          <div className="mb-4 grid grid-cols-4 gap-2.5">
            {[
              { label: "KM Semanal", value: "47.3", unit: "km", p: 94 },
              { label: "Pace Médio", value: "5:12", unit: "/km", p: 72 },
              { label: "Treinos", value: "6", unit: "sessões", p: 100 },
              { label: "Meta", value: "94", unit: "%", p: 94 },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-white/[0.06] bg-[#111111] p-3"
              >
                <div className="mb-2.5 text-[8px] font-semibold uppercase tracking-widest text-white/25">
                  {m.label}
                </div>
                <div className="mb-2 flex items-baseline gap-1">
                  <span className="font-display text-[18px] font-bold leading-none">
                    {m.value}
                  </span>
                  <span className="text-[8px] font-bold text-[#B6FF00]">{m.unit}</span>
                </div>
                <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-[#B6FF00]"
                    style={{ width: `${m.p}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-[1fr_160px] gap-2.5">
            <div className="h-32 rounded-xl border border-white/[0.06] bg-[#111111] p-4">
              <div className="mb-3 flex justify-between text-[8px] text-white/28">
                <span className="font-semibold uppercase tracking-wider">Volume Semanal</span>
                <span className="text-[#B6FF00]">↑ 12%</span>
              </div>
              <div className="flex h-16 items-end gap-1">
                {[35, 58, 42, 72, 48, 65, 80, 94].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background:
                        i === 7
                          ? "#B6FF00"
                          : `rgba(182,255,0,${i === 6 ? 0.3 : 0.08 + i * 0.025})`,
                      boxShadow: i === 7 ? "0 0 8px rgba(182,255,0,0.35)" : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#111111] p-4">
              <div className="relative size-14">
                <svg viewBox="0 0 56 56" className="size-full -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="4.5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="#B6FF00"
                    strokeWidth="4.5"
                    strokeDasharray={`${2 * Math.PI * 22 * 0.7} ${2 * Math.PI * 22}`}
                    strokeLinecap="round"
                    style={{ filter: "drop-shadow(0 0 5px rgba(182,255,0,0.5))" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-sm font-bold text-[#B6FF00]">14</span>
                </div>
              </div>
              <div className="text-[8px] font-bold tracking-widest text-[#B6FF00]">SILVER</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#080808] pt-16">
      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[900px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B6FF00]/[0.05] blur-[130px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-[#4ADE80]/[0.04] blur-[80px]" />
        <div className="absolute bottom-1/4 left-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-[#B6FF00]/[0.03] blur-[60px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-12 text-center sm:px-6 sm:py-20">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#B6FF00]/22 bg-[#B6FF00]/[0.07] px-4 py-1.5 sm:mb-7">
          <Flame className="size-3 text-[#B6FF00]" />
          <span className="text-[11px] font-semibold tracking-wide text-[#B6FF00]">
            Para atletas híbridos — corrida + academia
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-5 font-display font-bold leading-[1.02] tracking-[-0.03em] [font-size:clamp(3rem,12vw,5rem)]">
          Treine.{" "}
          <span className="sm:hidden">
            <br />
          </span>
          Evolua.
          <br />
          <span style={{ color: "#B6FF00" }}>Supere.</span>
        </h1>

        <p className="mx-auto mb-8 max-w-[90vw] text-[15px] leading-[1.75] text-[#F5F5F5]/42 sm:mb-10 sm:max-w-[560px]">
          O centro de comando para quem corre, treina, compete e evolui. Registre rotas por GPS,
          musculação, XP, metas, feed, rankings e notificações em uma experiência mobile-first.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2.5 rounded-[12px] bg-[#B6FF00] px-7 text-[15px] font-bold text-[#080808] shadow-[0_0_40px_rgba(182,255,0,0.28)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_56px_rgba(182,255,0,0.45)] sm:w-auto"
            style={{ minHeight: "52px" }}
          >
            Começar agora — é grátis
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="flex items-center justify-center gap-2 rounded-[12px] border border-white/[0.09] bg-white/[0.04] px-6 text-[14px] font-medium text-[#F5F5F5]/60 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-[#F5F5F5]/90 sm:w-auto"
            style={{ minHeight: "52px" }}
          >
            Ver funcionalidades
          </a>
        </div>

        {/* Trust */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-[#F5F5F5]/26">
          {["Instale como PWA", "Feito para corrida + academia", "XP transparente"].map(
            (t) => (
              <div key={t} className="flex items-center gap-1.5">
                <div className="size-1 rounded-full bg-[#B6FF00]/50" />
                {t}
              </div>
            )
          )}
        </div>

        {/* Dashboard preview */}
        <div className="relative mt-16 w-full">
          <AppPreview />
        </div>
      </div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { label: "Modalidades integradas", value: 2, suffix: "" },
    { label: "Fontes de XP", value: 5, suffix: "" },
    { label: "Dias no heatmap", value: 84, suffix: "" },
    { label: "Ranks competitivos", value: 6, suffix: "" },
  ];

  return (
    <section className="border-y border-white/[0.04] bg-[#0A0A0A] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="mb-1 font-display text-3xl font-bold text-[#B6FF00]">
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </div>
              <div className="text-[12px] text-[#F5F5F5]/35">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Route,
    title: "Corridas com GPS",
    description:
      "Registre distância, pace, duração, calorias, velocidade média e rota no mapa para acompanhar cada treino com contexto.",
    tag: "Corrida",
    color: "#B6FF00",
  },
  {
    icon: Dumbbell,
    title: "Academia completa",
    description:
      "Cadastre treinos por grupo muscular, músculos específicos, divisão, intensidade, duração e observações.",
    tag: "Força",
    color: "#60A5FA",
  },
  {
    icon: TrendingUp,
    title: "XP, níveis e ranks",
    description:
      "Sistema de progressão com XP recalculado, nível atual, quanto falta para o próximo nível e faixas de rank.",
    tag: "Gamificado",
    color: "#A78BFA",
  },
  {
    icon: BarChart3,
    title: "Analytics de evolução",
    description:
      "Heatmap, pace mensal, volume semanal, carga de academia, score do atleta e visão dos últimos 84 dias.",
    tag: "Dados",
    color: "#B6FF00",
  },
  {
    icon: Trophy,
    title: "Competições",
    description:
      "Crie disputas por corrida, academia, streak ou híbrido, convide atletas e acompanhe rankings atualizados.",
    tag: "Ranking",
    color: "#FACC15",
  },
  {
    icon: Footprints,
    title: "Desafios 1x1",
    description:
      "Desafie outro atleta diretamente e acompanhe respostas, progresso e resultados dentro do ecossistema.",
    tag: "Duelo",
    color: "#FB923C",
  },
  {
    icon: MessageCircle,
    title: "Feed social",
    description:
      "Compartilhe corridas, treinos, level ups, recordes, streaks e troféus com curtidas e comentários.",
    tag: "Comunidade",
    color: "#22D3EE",
  },
  {
    icon: Users,
    title: "Perfis de atletas",
    description:
      "Siga atletas, veja seguidores, conquistas, troféus, avatar, bio e histórico de evolução pública.",
    tag: "Perfil",
    color: "#38BDF8",
  },
  {
    icon: Award,
    title: "Conquistas e troféus",
    description:
      "Desbloqueie conquistas por marcos de corrida e academia, além de troféus exclusivos concedidos no app.",
    tag: "Coleção",
    color: "#EAB308",
  },
  {
    icon: Target,
    title: "Metas e calendário",
    description:
      "Acompanhe metas de KM, frequência, pace, calendário mensal, streaks e consistência diária.",
    tag: "Foco",
    color: "#F472B6",
  },
  {
    icon: Bell,
    title: "Notificações e updates",
    description:
      "Receba convites, interações, avisos, novidades do GymPace e atualizações importantes no painel.",
    tag: "Alertas",
    color: "#C084FC",
  },
  {
    icon: Smartphone,
    title: "PWA mobile-first",
    description:
      "Interface otimizada para celular, navegação inferior, instalação como app e experiência rápida no treino.",
    tag: "Mobile",
    color: "#34D399",
  },
];

function FeaturesSection() {
  const [ref, inView] = useInView<HTMLElement>();

  return (
    <section id="features" ref={ref} className="bg-[#080808] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`mb-16 text-center transition-all duration-700 ${inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] text-[#F5F5F5]/50">
            Funcionalidades
          </div>
          <h2 className="mb-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Todas as funções
            <br />
            <span style={{ color: "#B6FF00" }}>do GymPace</span>
          </h2>
          <p className="mx-auto max-w-md text-[14px] leading-relaxed text-[#F5F5F5]/38">
            Do registro ao feed, do XP ao ranking: o app conecta corrida, academia e comunidade
            em uma experiência pensada para uso diário no celular.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 transition-all duration-700 hover:border-white/[0.11] hover:bg-[#141414] hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)] ${
                  inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${i * 75}ms` }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <div
                  className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: f.color + "20" }}
                />

                <div className="mb-4 flex items-start justify-between">
                  <div className="grid size-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
                    <Icon className="size-5" style={{ color: f.color }} strokeWidth={1.8} />
                  </div>
                  <span className="rounded-full border border-white/[0.07] px-2.5 py-0.5 text-[10px] font-medium text-[#F5F5F5]/35">
                    {f.tag}
                  </span>
                </div>

                <h3 className="mb-2 font-display text-[17px] font-semibold">{f.title}</h3>
                <p className="text-[13px] leading-[1.65] text-[#F5F5F5]/42">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Analytics Section ────────────────────────────────────────────────────────

const HEATMAP_PATTERN = Array.from({ length: 12 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => {
    const seed = week * 13 + day * 7;
    return (seed % 4 === 0 ? 3 : seed % 3 === 0 ? 2 : seed % 7 === 0 ? 1 : 0) as 0 | 1 | 2 | 3;
  })
);

function AnalyticsMockup() {
  return (
    <div className="relative">
      <div className="absolute inset-0 scale-90 rounded-3xl bg-[#B6FF00]/[0.05] blur-3xl" />
      <div className="relative rounded-2xl border border-white/[0.07] bg-[#111111] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        {/* Score + Ring */}
        <div className="mb-4 grid grid-cols-[1fr_116px] gap-3">
          <div className="rounded-xl border border-white/[0.05] bg-[#0F0F0F] p-4">
            <div className="mb-3 text-[8px] font-semibold uppercase tracking-widest text-white/25">
              Performance Score
            </div>
            {[
              { label: "Consistência", value: 82, color: "#B6FF00" },
              { label: "Volume", value: 67, color: "#60A5FA" },
              { label: "Streak", value: 55, color: "#F472B6" },
              { label: "Nível", value: 70, color: "#A78BFA" },
            ].map((s) => (
              <div key={s.label} className="mb-2.5 last:mb-0">
                <div className="mb-1 flex justify-between text-[8px]">
                  <span className="text-white/38">{s.label}</span>
                  <span className="font-mono text-white/48">{s.value}%</span>
                </div>
                <div className="h-[3px] rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.value}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/[0.05] bg-[#0F0F0F] p-4">
            <div className="relative size-16">
              <svg viewBox="0 0 64 64" className="size-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke="#B6FF00"
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 26 * 0.74} ${2 * Math.PI * 26}`}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 6px rgba(182,255,0,0.5))" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-lg font-bold text-[#B6FF00]">74</span>
              </div>
            </div>
            <div className="text-[8px] font-bold tracking-widest text-[#B6FF00]">OVERALL</div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="rounded-xl border border-white/[0.05] bg-[#0F0F0F] p-4">
          <div className="mb-3 text-[8px] font-semibold uppercase tracking-widest text-white/25">
            Consistência — últimas 12 semanas
          </div>
          <div className="flex gap-1">
            {HEATMAP_PATTERN.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((level, di) => (
                  <div
                    key={di}
                    className="size-[10px] rounded-sm"
                    style={{
                      background:
                        level === 3
                          ? "#B6FF00"
                          : level === 2
                            ? "rgba(182,255,0,0.42)"
                            : level === 1
                              ? "rgba(96,165,250,0.48)"
                              : "rgba(255,255,255,0.05)",
                      boxShadow: level === 3 ? "0 0 4px rgba(182,255,0,0.4)" : "none",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-[8px] text-white/24">
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-sm bg-white/[0.05]" />
              Nenhum
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-sm bg-[#60A5FA]/48" />
              Academia
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-sm bg-[#B6FF00]/42" />
              Corrida
            </div>
            <div className="flex items-center gap-1">
              <div
                className="size-2 rounded-sm bg-[#B6FF00]"
                style={{ boxShadow: "0 0 4px rgba(182,255,0,0.5)" }}
              />
              Ambos
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsSection() {
  const [ref, inView] = useInView<HTMLElement>();

  return (
    <section id="analytics" ref={ref} className="bg-[#0A0A0A] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div
            className={`transition-all duration-700 ${inView ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"}`}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#B6FF00]/20 bg-[#B6FF00]/[0.07] px-3 py-1.5 text-[11px] font-semibold text-[#B6FF00]">
              <BarChart3 className="size-3" />
              Analytics Premium
            </div>
            <h2 className="mb-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Dados que
              <br />
              <span style={{ color: "#B6FF00" }}>transformam</span>
              <br />
              performance
            </h2>
            <p className="mb-8 text-[14px] leading-[1.75] text-[#F5F5F5]/40">
              Heatmap de consistência estilo GitHub, tendências de pace mês a mês, volume semanal
              comparativo e um score de performance geral baseado em consistência, volume, streak e
              nível.
            </p>

            <div className="space-y-3">
              {[
                "Heatmap de atividade dos últimos 84 dias",
                "Tendências de pace com comparação mensal",
                "Score de performance multidimensional",
                "Volume semanal com histórico de 8 semanas",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex size-5 items-center justify-center rounded-full bg-[#B6FF00]/15">
                    <div className="size-1.5 rounded-full bg-[#B6FF00]" />
                  </div>
                  <span className="text-[13px] text-[#F5F5F5]/55">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`transition-all delay-150 duration-700 ${inView ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
          >
            <AnalyticsMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Competitions Section ─────────────────────────────────────────────────────

function MobilePWAMockup() {
  const nav = [
    { icon: Activity, label: "Início", active: true },
    { icon: MessageCircle, label: "Feed", active: false },
    { icon: Trophy, label: "Ranking", active: false },
    { icon: Users, label: "Perfil", active: false },
  ];

  return (
    <div className="relative mx-auto max-w-[330px]">
      <div className="absolute inset-0 rounded-[42px] bg-[#22D3EE]/[0.08] blur-3xl" />
      <div className="relative overflow-hidden rounded-[34px] border border-white/[0.1] bg-[#090909] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="rounded-[26px] border border-white/[0.06] bg-[#0D0D0D]">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-xl bg-[#B6FF00]">
                <Zap className="size-3.5 text-[#080808]" strokeWidth={2.8} />
              </div>
              <span className="text-sm font-bold">GymPace</span>
            </div>
            <Bell className="size-4 text-white/35" />
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded-2xl border border-[#B6FF00]/15 bg-[#B6FF00]/[0.06] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B6FF00]/70">
                  Hoje
                </span>
                <span className="rounded-full bg-[#B6FF00]/15 px-2 py-1 text-[10px] font-bold text-[#B6FF00]">
                  PWA
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["5.2", "km"],
                  ["60", "min"],
                  ["Nv. 8", "Silver"],
                  ["82%", "meta"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl bg-black/20 p-3">
                    <p className="font-display text-xl font-bold">{value}</p>
                    <p className="text-[10px] text-white/35">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="size-4 text-[#B6FF00]" />
                <span className="text-xs font-semibold">Rota GPS salva</span>
              </div>
              <div className="h-20 rounded-xl border border-white/[0.05] bg-[linear-gradient(135deg,rgba(182,255,0,0.18),rgba(34,211,238,0.08))]">
                <div className="relative h-full">
                  <div className="absolute left-8 top-10 h-1 w-28 rotate-[-18deg] rounded-full bg-[#B6FF00]/75" />
                  <div className="absolute left-28 top-8 h-1 w-20 rotate-[22deg] rounded-full bg-[#B6FF00]/75" />
                  <div className="absolute left-7 top-9 size-2 rounded-full bg-[#22D3EE]" />
                  <div className="absolute right-10 top-12 size-2 rounded-full bg-[#B6FF00]" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold">Atalhos rápidos</span>
                <Smartphone className="size-4 text-white/35" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <span className="rounded-lg bg-white/[0.04] px-2 py-2 text-white/48">Corrida</span>
                <span className="rounded-lg bg-white/[0.04] px-2 py-2 text-white/48">Academia</span>
                <span className="rounded-lg bg-white/[0.04] px-2 py-2 text-white/48">Desafio</span>
                <span className="rounded-lg bg-white/[0.04] px-2 py-2 text-white/48">Competição</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 border-t border-white/[0.05] px-2 pb-3 pt-2">
            {nav.map(({ icon: Icon, label, active }) => (
              <div key={label} className={`flex flex-col items-center gap-1 text-[9px] ${active ? "text-[#B6FF00]" : "text-white/25"}`}>
                <Icon className="size-4" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSection() {
  const [ref, inView] = useInView<HTMLElement>();

  return (
    <section id="mobile" ref={ref} className="bg-[#080808] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div
            className={`transition-all duration-700 ${inView ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"}`}
          >
            <MobilePWAMockup />
          </div>

          <div
            className={`transition-all delay-150 duration-700 ${inView ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/[0.07] px-3 py-1.5 text-[11px] font-semibold text-[#22D3EE]">
              <Smartphone className="size-3" />
              Mobile & PWA
            </div>
            <h2 className="mb-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Feito para usar
              <br />
              <span style={{ color: "#22D3EE" }}>durante o treino</span>
            </h2>
            <p className="mb-8 text-[14px] leading-[1.75] text-[#F5F5F5]/40">
              A experiência principal é mobile: navegação inferior, atalhos de registro, telas densas
              e instalação como PWA para abrir o GymPace como app no celular.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Instalação como aplicativo",
                "Navegação inferior para uma mão",
                "Registro rápido de corrida e academia",
                "Layout com safe area para iOS e Android",
                "Push e central de notificações",
                "Páginas otimizadas para PWA",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                  <div className="grid size-5 shrink-0 place-items-center rounded-full bg-[#22D3EE]/15">
                    <div className="size-1.5 rounded-full bg-[#22D3EE]" />
                  </div>
                  <span className="text-[13px] text-[#F5F5F5]/55">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CompetitionsMockup() {
  const competitors = [
    { initials: "LM", name: "Lucas M.", sub: "Atleta Silver", value: "47.3 km", rank: 1, color: "#FACC15" },
    { initials: "AS", name: "Ana S.", sub: "Atleta Gold", value: "43.8 km", rank: 2, color: "#A1A1AA" },
    { initials: "PR", name: "Pedro R.", sub: "Atleta Bronze", value: "38.2 km", rank: 3, color: "#CD7F32" },
    { initials: "JC", name: "Julia C.", sub: "Atleta Rookie", value: "31.5 km", rank: 4, color: "#71717A" },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 scale-90 rounded-3xl bg-[#FACC15]/[0.04] blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="border-b border-white/[0.05] px-5 py-4">
          <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#FACC15]/60">
            Competição Ativa
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[15px] font-semibold">
              Desafio Semanal — KM Total
            </h3>
            <span className="rounded-full border border-[#FACC15]/20 bg-[#FACC15]/[0.08] px-2.5 py-1 text-[10px] font-semibold text-[#FACC15]">
              3 dias restantes
            </span>
          </div>
        </div>

        <div className="space-y-2 p-4">
          {competitors.map((c, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl p-3 ${
                i === 0
                  ? "border border-[#FACC15]/15 bg-[#FACC15]/[0.05]"
                  : "border border-white/[0.04] bg-[#0F0F0F]"
              }`}
            >
              <span className="w-5 text-center font-display text-base font-bold text-white/20">
                {c.rank}
              </span>
              <div
                className="grid size-8 place-items-center rounded-full text-[10px] font-bold"
                style={{ background: `${c.color}18`, color: c.color }}
              >
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">{c.name}</div>
                <div className="text-[10px] text-white/30">{c.sub}</div>
              </div>
              <div
                className="font-mono text-[13px] font-bold tabular-nums"
                style={{ color: c.color }}
              >
                {c.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.04] px-5 py-3 text-[10px] text-white/24">
          <span>8 participantes</span>
          <span>Atualizado agora</span>
        </div>
      </div>
    </div>
  );
}

function CompetitionsSection() {
  const [ref, inView] = useInView<HTMLElement>();

  return (
    <section id="competitions" ref={ref} className="bg-[#080808] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div
            className={`order-2 lg:order-1 transition-all duration-700 ${inView ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"}`}
          >
            <CompetitionsMockup />
          </div>

          <div
            className={`order-1 lg:order-2 transition-all delay-150 duration-700 ${inView ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FACC15]/20 bg-[#FACC15]/[0.07] px-3 py-1.5 text-[11px] font-semibold text-[#FACC15]">
              <Trophy className="size-3" />
              Competições
            </div>
            <h2 className="mb-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Compete.
              <br />
              <span style={{ color: "#FACC15" }}>Conquiste</span>
              <br />a liderança.
            </h2>
            <p className="mb-8 text-[14px] leading-[1.75] text-[#F5F5F5]/40">
              Crie competições por KM total, sessões ou streaks. Convide atletas, acompanhe o
              ranking em tempo real e descubra quem é o mais consistente da semana.
            </p>

            <div className="space-y-3">
              {[
                "Rankings atualizados a cada novo registro",
                "Modalidades: corrida, academia, streak ou híbrido",
                "Convites, respostas e progresso sincronizado",
                "Desafios 1x1 e competições em grupo",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex size-5 items-center justify-center rounded-full bg-[#FACC15]/15">
                    <div className="size-1.5 rounded-full bg-[#FACC15]" />
                  </div>
                  <span className="text-[13px] text-[#F5F5F5]/55">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── XP & Evolution Section ───────────────────────────────────────────────────

const RANKS = [
  { name: "Rookie", color: "#71717A", xp: "0 XP" },
  { name: "Bronze", color: "#CD7F32", xp: "324 XP" },
  { name: "Silver", color: "#A1A1AA", xp: "1.712 XP" },
  { name: "Gold", color: "#EAB308", xp: "6.551 XP" },
  { name: "Platinum", color: "#22D3EE", xp: "20.225 XP" },
  { name: "Elite", color: "#B6FF00", xp: "68.443 XP" },
];

function XPSection() {
  const [ref, inView] = useInView<HTMLElement>();

  return (
    <section id="evolution" ref={ref} className="bg-[#0A0A0A] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`mb-14 text-center transition-all duration-700 ${inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#A78BFA]/20 bg-[#A78BFA]/[0.07] px-3 py-1.5 text-[11px] font-semibold text-[#A78BFA]">
            <Star className="size-3" />
            XP & Evolução
          </div>
          <h2 className="mb-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Cada treino te leva
            <br />
            <span style={{ color: "#A78BFA" }}>mais longe</span>
          </h2>
          <p className="mx-auto max-w-md text-[14px] leading-relaxed text-[#F5F5F5]/38">
            Sistema de progressão transparente. Ganhe XP por corrida, academia, streak,
            conquistas e competições, com cálculo visível de quanto falta para cada nível.
          </p>
          <Link
            href="/landing/xp"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#A78BFA]/20 bg-[#A78BFA]/[0.07] px-4 py-2 text-[12px] font-bold text-[#D8B4FE] transition-colors hover:bg-[#A78BFA]/[0.11]"
          >
            Ver regras completas de XP
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Rank progression */}
        <div
          className={`mb-12 flex justify-center overflow-x-auto pb-2 transition-all delay-200 duration-700 ${inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        >
          <div className="flex items-end gap-0">
            {RANKS.map((rank, i) => (
              <div key={rank.name} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-2">
                  <div
                    className="relative flex size-12 items-center justify-center rounded-full border-2 sm:size-14"
                    style={{
                      borderColor: rank.color,
                      background: i === RANKS.length - 1 ? `${rank.color}18` : "transparent",
                      boxShadow:
                        i === RANKS.length - 1 ? `0 0 28px ${rank.color}50` : "none",
                    }}
                  >
                    <Zap className="size-5 sm:size-6" style={{ color: rank.color }} strokeWidth={2} />
                    {i === RANKS.length - 1 && (
                      <div className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#B6FF00]">
                        <Star className="size-2.5 fill-[#080808] text-[#080808]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: rank.color }}>
                    {rank.name}
                  </span>
                  <span className="text-[9px] text-white/22">{rank.xp}</span>
                </div>
                {i < RANKS.length - 1 && (
                  <div
                    className="h-px w-5 sm:w-8"
                    style={{
                      background: `linear-gradient(90deg, ${rank.color}50, ${RANKS[i + 1].color}50)`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Route,
              title: "30 XP + 10/km",
              sub: "Corridas com distância, pace e rota",
              color: "#B6FF00",
            },
            {
              icon: Dumbbell,
              title: "50 XP + duração",
              sub: "Treinos de força também evoluem o rank",
              color: "#60A5FA",
            },
            {
              icon: Award,
              title: "Conquistas e troféus",
              sub: "Marcos raros aceleram a progressão",
              color: "#A78BFA",
            },
          ].map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className={`rounded-2xl border border-white/[0.07] bg-[#111111] p-5 transition-all duration-700 ${inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                <div className="mb-3 grid size-10 place-items-center rounded-xl bg-white/[0.04]">
                  <Icon className="size-5" style={{ color: b.color }} strokeWidth={1.8} />
                </div>
                <div className="mb-1 font-display text-[16px] font-semibold">{b.title}</div>
                <div className="text-[12px] text-[#F5F5F5]/35">{b.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Social / Testimonials ────────────────────────────────────────────────────

function SocialSection() {
  const [ref, inView] = useInView<HTMLElement>();

  const socialFeatures = [
    {
      icon: MessageCircle,
      title: "Feed de atividades",
      text: "Corridas, treinos, level ups, recordes, streaks, bônus híbrido e troféus aparecem em um feed vivo.",
      color: "#B6FF00",
    },
    {
      icon: Users,
      title: "Perfis e seguidores",
      text: "Cada atleta tem bio, avatar, seguidores, seguindo, histórico público, conquistas e vitrine de evolução.",
      color: "#22D3EE",
    },
    {
      icon: Shield,
      title: "Privacidade e controle",
      text: "Campos sensíveis de XP, rank, admin e feed são protegidos por regras de escrita confiável no servidor.",
      color: "#A78BFA",
    },
  ];

  return (
    <section ref={ref} className="bg-[#080808] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`mb-14 text-center transition-all duration-700 ${inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/[0.06] px-3 py-1.5 text-[11px] font-semibold text-[#22D3EE]">
            <Users className="size-3" />
            Comunidade
          </div>
          <h2 className="mb-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Comunidade,
            <br />
            <span style={{ color: "#22D3EE" }}>feed e reputação.</span>
          </h2>
          <p className="mx-auto max-w-xl text-[14px] leading-relaxed text-[#F5F5F5]/38">
            O GymPace transforma cada atividade em contexto social: atletas podem seguir, reagir,
            comentar, comparar ranking e acompanhar conquistas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {socialFeatures.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-6 transition-all duration-700 hover:border-white/[0.11] hover:bg-[#141414] ${inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

                <div
                  className="mb-5 grid size-11 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.04]"
                  style={{ color: item.color }}
                >
                  <Icon className="size-5" strokeWidth={1.8} />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{item.title}</h3>
                <p className="text-[13px] leading-[1.7] text-[#F5F5F5]/45">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  const [ref, inView] = useInView<HTMLElement>();

  return (
    <section ref={ref} className="bg-[#0A0A0A] py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div
          className={`relative overflow-hidden rounded-3xl border border-[#B6FF00]/14 bg-[#111111] px-8 py-16 text-center transition-all duration-700 ${inView ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        >
          {/* Glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[320px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B6FF00]/[0.06] blur-[90px]" />
            <div className="absolute bottom-0 left-1/4 h-[200px] w-[200px] translate-y-1/2 rounded-full bg-[#B6FF00]/[0.04] blur-[60px]" />
          </div>

          {/* Grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(182,255,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(182,255,0,0.8) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          <div className="relative z-10">
            <div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl bg-[#B6FF00] shadow-[0_0_40px_rgba(182,255,0,0.4)]">
              <Zap className="size-7 text-[#080808]" strokeWidth={3} />
            </div>

            <h2 className="mb-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Pronto para
              <br />
              <span style={{ color: "#B6FF00" }}>começar?</span>
            </h2>

            <p className="mx-auto mb-10 max-w-md text-[14px] leading-[1.75] text-[#F5F5F5]/40">
              Junte-se a atletas que já transformaram seu treino com analytics premium, competições
              e progressão gamificada.
            </p>

            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[#B6FF00] px-8 py-4 text-[15px] font-bold text-[#080808] shadow-[0_0_40px_rgba(182,255,0,0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_56px_rgba(182,255,0,0.5)]"
            >
              Começar agora — é grátis
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

            <p className="mt-5 text-[11px] text-[#F5F5F5]/24">
              Sem cartão de crédito · Grátis para sempre · Configuração em 2 minutos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="border-t border-white/[0.04] bg-[#080808] pt-10"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2.5rem)" }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-[7px] bg-[#B6FF00]">
              <Zap className="size-3.5 text-[#080808]" strokeWidth={3} />
            </div>
            <span className="font-display text-[15px] font-bold">GymPace</span>
          </div>

          <div className="flex items-center gap-6 text-[12px] text-[#F5F5F5]/30">
            <Link href="/privacy" className="transition-colors hover:text-[#F5F5F5]/60">
              Privacidade
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#F5F5F5]/60">
              Termos
            </Link>
          </div>

          <div className="flex flex-col items-center gap-1 text-right">
            <div className="text-[11px] text-[#F5F5F5]/20">
              © 2026 GymPace. Todos os direitos reservados.
            </div>
            <div className="text-[10px] text-[#F5F5F5]/14">
              Powered by{" "}
              <span className="font-semibold text-[#B6FF00]/40">Gravix Tech</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#080808] text-[#F5F5F5] antialiased">
      <NavBar />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <AnalyticsSection />
      <MobileSection />
      <CompetitionsSection />
      <XPSection />
      <SocialSection />
      <CTASection />
      <Footer />
    </div>
  );
}
