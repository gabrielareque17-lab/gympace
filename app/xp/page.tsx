import {
  Activity,
  Award,
  Dumbbell,
  Flag,
  Flame,
  Info,
  Medal,
  Route,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { ATHLETE_TITLES } from "@/lib/athlete-title";
import { SEASON_LEAGUES } from "@/lib/season-league";
import { getRankForLevel, getXPRequiredForLevel, XP_RULES, type XPRank } from "@/lib/xp";

export const dynamic = "force-dynamic";

const RANK_STYLES: Record<XPRank, { label: string; color: string; range: string }> = {
  rookie: { ...ATHLETE_TITLES.rookie, range: "Níveis 1-2" },
  bronze: { ...ATHLETE_TITLES.bronze, range: "Níveis 3-7" },
  silver: { ...ATHLETE_TITLES.silver, range: "Níveis 8-14" },
  gold: { ...ATHLETE_TITLES.gold, range: "Níveis 15-21" },
  platinum: { ...ATHLETE_TITLES.platinum, range: "Níveis 22-29" },
  elite: { ...ATHLETE_TITLES.elite, range: "Nível 30+" },
};

const XP_SOURCES = [
  {
    title: "Corridas",
    icon: Route,
    color: "#B6FF00",
    formula: `${XP_RULES.runBaseXp} XP base + ${XP_RULES.runXpPerKm} XP por km`,
    detail: "Uma corrida de 5 km vale 80 XP.",
  },
  {
    title: "Treinos",
    icon: Dumbbell,
    color: "#60A5FA",
    formula: `${XP_RULES.workoutBaseXp} XP base + bônus por duração`,
    detail: `O bônus é ${XP_RULES.workoutDurationXpPerMinute} XP por minuto, limitado a ${XP_RULES.workoutDurationXpCap} XP.`,
  },
  {
    title: "Sequências",
    icon: Flame,
    color: "#FB923C",
    formula: `${XP_RULES.streakXpPerDay} XP por dia da melhor sequência`,
    detail: "O sistema considera a melhor sequência de corrida ou academia.",
  },
  {
    title: "Conquistas",
    icon: Award,
    color: "#A78BFA",
    formula: "100 a 450 XP por conquista",
    detail: "A raridade define o peso: comum, raro, épico ou lendário.",
  },
  {
    title: "Competições",
    icon: Trophy,
    color: "#EAB308",
    formula: `${XP_RULES.competitionBaseXp} XP base + progresso`,
    detail: `Progresso vale ${XP_RULES.competitionProgressXp} XP por ponto, com bônus final de ${XP_RULES.competitionFinishBonusXp} XP.`,
  },
];

const EXAMPLES = [
  {
    label: "Corrida curta",
    detail: "5 km registrados",
    xp: XP_RULES.runBaseXp + 5 * XP_RULES.runXpPerKm,
  },
  {
    label: "Treino completo",
    detail: "60 minutos de musculação",
    xp:
      XP_RULES.workoutBaseXp +
      Math.min(
        Math.round(60 * XP_RULES.workoutDurationXpPerMinute),
        XP_RULES.workoutDurationXpCap
      ),
  },
  {
    label: "Competição ativa",
    detail: "20 pontos de progresso",
    xp: XP_RULES.competitionBaseXp + 20 * XP_RULES.competitionProgressXp,
  },
];

const LEVELS = Array.from({ length: 15 }, (_, index) => {
  const level = index + 1;
  const totalXp = getXPRequiredForLevel(level);
  const nextTotalXp = getXPRequiredForLevel(level + 1);
  return {
    level,
    totalXp,
    nextStep: nextTotalXp - totalXp,
    rank: getRankForLevel(level),
  };
});

export default function XPPage() {
  return (
    <AppShell>
      <main className="min-w-0 flex-1 px-4 pb-5 pt-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
          <HeroSection />
          <SourceGrid />
          <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <LevelSection />
            <RankSection />
          </div>
          <SeasonLeagueSection />
          <ExampleSection />
          <TrustSection />
        </div>
      </main>
    </AppShell>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101010]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/35 to-transparent" />
      <div className="relative p-4 sm:p-6 lg:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/65">
              Sistema XP
            </p>
            <h1
              className="leading-none text-white"
              style={{ fontFamily: "var(--font-hero)", fontSize: "clamp(2rem, 4vw, 2.75rem)", letterSpacing: "0.04em" }}
            >
              Como seu progresso vira nível
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#F5F5F5]/46">
              XP, nível e título do atleta formam a progressão permanente. A medalha
              da season é uma competição temporária separada.
            </p>
          </div>
          <div
            className="grid size-12 shrink-0 place-items-center rounded-2xl text-[#080808] sm:size-14"
            style={{ background: "#B6FF00", boxShadow: "0 0 28px rgba(182,255,0,0.34)" }}
          >
            <Zap className="size-6" strokeWidth={2.6} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <HeroMetric label="Primeira subida de nível" value="150 XP" />
          <HeroMetric label="Base da corrida" value="+30 XP" />
          <HeroMetric label="Base do treino" value="+50 XP" />
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-white/[0.03] px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/32">
        {label}
      </p>
      <p className="mt-1 leading-none text-[#F5F5F5]/90" style={{ fontFamily: "var(--font-hero)", fontSize: "1.5rem", letterSpacing: "0.02em" }}>{value}</p>
    </div>
  );
}

function SourceGrid() {
  return (
    <section>
      <SectionTitle eyebrow="Ganhos" title="De onde vem o XP" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {XP_SOURCES.map(({ title, icon: Icon, color, formula, detail }) => (
          <article key={title} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
            <div
              className="mb-4 grid size-10 place-items-center rounded-xl"
              style={{ background: `${color}18`, color }}
            >
              <Icon className="size-5" strokeWidth={2} />
            </div>
            <h2 className="font-display text-base font-bold">{title}</h2>
            <p className="mt-2 text-xs font-semibold leading-5" style={{ color }}>
              {formula}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#F5F5F5]/38">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function LevelSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="border-b border-white/[0.05] p-4 sm:p-5">
      <SectionTitle eyebrow="Níveis" title="Curva de progressão" compact />
        <p className="mt-2 text-xs leading-5 text-[#F5F5F5]/38">
          Cada nível exige um pouco mais que o anterior. XP, nível e título do atleta formam
          uma progressão permanente e não zeram entre seasons.
        </p>
      </div>
      <div className="divide-y divide-white/[0.045]">
        {LEVELS.map((item) => {
          const rankStyle = RANK_STYLES[item.rank];
          return (
            <div key={item.level} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <div
                className="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold"
                style={{ background: `${rankStyle.color}18`, color: rankStyle.color }}
              >
                {item.level}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Nível {item.level}</p>
                  <p className="font-mono text-xs tabular-nums text-[#F5F5F5]/54">
                    {item.totalXp.toLocaleString("pt-BR")} XP
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-[#F5F5F5]/30">
                  Próximo salto: +{item.nextStep.toLocaleString("pt-BR")} XP
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RankSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="border-b border-white/[0.05] p-4 sm:p-5">
        <SectionTitle eyebrow="Títulos" title="Progressão permanente" compact />
        <p className="mt-2 text-xs leading-5 text-[#F5F5F5]/38">
          O título nasce do seu nível atual e não zera quando uma nova season começa.
        </p>
      </div>
      <div className="grid gap-2 p-4 sm:p-5">
        {(Object.entries(RANK_STYLES) as Array<[XPRank, (typeof RANK_STYLES)[XPRank]]>).map(
          ([rank, style]) => (
            <div key={rank} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.055] bg-white/[0.025] px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold" style={{ color: style.color }}>{style.label}</span>
              </div>
              <span className="text-xs text-[#F5F5F5]/36">{style.range}</span>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function SeasonLeagueSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111]">
      <div className="border-b border-white/[0.05] p-4 sm:p-5">
        <SectionTitle eyebrow="Season" title="Liga Ranqueada" compact />
        <p className="mt-2 text-xs leading-5 text-[#F5F5F5]/38">
          Bronze, Prata, Ouro, Platina e Diamante representam sua Liga Ranqueada na temporada ativa.
          A pontuação usa os pontos da season e reinicia a cada nova temporada.
        </p>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-5 sm:p-5">
        {SEASON_LEAGUES.map((league) => (
          <div key={league.key} className="rounded-xl border border-white/[0.055] bg-white/[0.025] px-3 py-3">
            <div
              className="mb-2 grid size-9 place-items-center rounded-full"
              style={{ background: `${league.color}18`, color: league.color }}
            >
              <Medal className="size-4" strokeWidth={2.2} />
            </div>
            <p className="text-sm font-semibold" style={{ color: league.color }}>{league.label}</p>
            <p className="mt-1 text-[11px] text-[#F5F5F5]/32">
              {league.minPoints.toLocaleString("pt-BR")}+ pts
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExampleSection() {
  return (
    <section>
      <SectionTitle eyebrow="Exemplos" title="Quanto algumas ações rendem" />
      <div className="grid gap-3 sm:grid-cols-3">
        {EXAMPLES.map((example) => (
          <article key={example.label} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Sparkles className="size-5 text-[#B6FF00]" />
              <span className="rounded-lg bg-[#B6FF00]/10 px-2 py-1 font-mono text-xs font-bold text-[#B6FF00]">
                +{example.xp.toLocaleString("pt-BR")} XP
              </span>
            </div>
            <h2 className="font-display text-base font-bold">{example.label}</h2>
            <p className="mt-2 text-xs leading-5 text-[#F5F5F5]/38">{example.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <InfoCard
        icon={Activity}
        title="Recalculado pelos registros"
        text="O XP vem do estado real das suas atividades. Editar ou apagar um registro pode ajustar o total."
      />
      <InfoCard
        icon={Flag}
        title="Sem prêmio duplicado"
        text="Como o total é derivado dos dados salvos, o sistema evita somar a mesma atividade duas vezes."
      />
      <InfoCard
        icon={Info}
        title="Transparência no perfil"
        text="Perfil e dashboard mostram XP total, XP no nível e quanto falta para os próximos níveis."
      />
    </section>
  );
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
      <Icon className="mb-3 size-5 text-[#F5F5F5]/48" />
      <h2 className="text-sm font-bold">{title}</h2>
      <p className="mt-2 text-xs leading-5 text-[#F5F5F5]/38">{text}</p>
    </article>
  );
}

function SectionTitle({
  eyebrow,
  title,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]/58">
        {eyebrow}
      </p>
      <h2 className={`font-display font-bold tracking-tight ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}>
        {title}
      </h2>
    </div>
  );
}

