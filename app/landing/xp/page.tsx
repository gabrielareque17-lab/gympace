import Link from "next/link";
import { ArrowLeft, ArrowRight, Trophy, Zap } from "lucide-react";

export const metadata = {
  title: "Sistema XP — GymPace",
  description:
    "Entenda XP, níveis, ranks e temporadas no GymPace sem sair da experiência da landing page.",
};

export default function LandingXPPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-[#F5F5F5]">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/landing"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#F5F5F5]/60 transition hover:text-[#F5F5F5]"
        >
          <ArrowLeft className="size-4" />
          Voltar para a landing
        </Link>

        <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-6 sm:p-8">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#A78BFA]/30 bg-[#A78BFA]/10 px-3 py-1 text-[11px] font-semibold text-[#D8B4FE]">
            <Zap className="size-3.5" />
            Sistema XP
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Como funciona sua jornada de evolução
          </h1>

          <div className="mt-6 space-y-4 text-sm leading-7 text-[#F5F5F5]/75">
            <p>
              Você ganha XP ao registrar corrida, treinos de academia, sequências, conquistas e progresso em competições.
            </p>
            <p>
              Seu <strong>XP total acumulado</strong> define sua posição no ranking global e também o nível/rank atual.
            </p>
            <p>
              A <strong>temporada</strong> funciona como uma disputa paralela: ela cria um ranking do período atual, sem apagar sua evolução geral da conta.
            </p>
            <p>
              No perfil e no dashboard, você vê o total acumulado + quanto já avançou dentro do nível atual (estilo game).
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#B6FF00]/75">Ranking Global</p>
              <p className="mt-2 text-sm text-[#F5F5F5]/70">Ordenado pelo XP total acumulado do atleta.</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#FACC15]/90">
                <Trophy className="size-3.5" />
                Temporada
              </p>
              <p className="mt-2 text-sm text-[#F5F5F5]/70">Ranking especial do período ativo, focado na fase atual.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2 text-sm font-bold text-[#0A0A0A]"
            >
              Criar conta
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.15] px-4 py-2 text-sm font-semibold text-[#F5F5F5]/85"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
