import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Termos de Uso · GymPace",
  description: "Termos e condições de uso da plataforma GymPace.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F5F5]">
      {/* Header */}
      <header className="border-b border-white/[0.05] bg-[#090909]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/landing" className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-[7px] bg-[#B6FF00]">
              <Zap className="size-3.5 text-[#080808]" strokeWidth={3} />
            </div>
            <span className="font-display text-[15px] font-bold">GymPace</span>
          </Link>
          <Link
            href="/landing"
            className="text-[12px] text-[#F5F5F5]/40 transition-colors hover:text-[#F5F5F5]/70"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Legal
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Termos de Uso
          </h1>
          <p className="mt-2 text-sm text-[#F5F5F5]/38">
            Última atualização: 17 de maio de 2026
          </p>
        </div>

        <div className="space-y-10 text-[14px] leading-[1.8] text-[#F5F5F5]/60">
          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Aceitação
            </h2>
            <p>
              Ao criar uma conta e usar o GymPace, você concorda com estes Termos de Uso. Se não
              concordar, não utilize a plataforma. Estes termos podem ser atualizados
              periodicamente — você será informado sobre mudanças relevantes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              A plataforma
            </h2>
            <p>
              O GymPace é uma plataforma de rastreamento e gamificação de treinos físicos,
              desenvolvida e operada pela Gravix Tech. Oferecemos recursos como registro de
              corridas e treinos de academia, analytics de performance, competições entre atletas
              e progressão por XP.
            </p>
            <p className="mt-3">
              Nos reservamos o direito de modificar, suspender ou encerrar funcionalidades da
              plataforma a qualquer momento, com aviso prévio quando possível.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Sua conta
            </h2>
            <p>Ao criar uma conta, você é responsável por:</p>
            <ul className="mt-3 space-y-1.5 pl-4">
              {[
                "Manter suas credenciais de acesso em sigilo",
                "Fornecer informações verídicas no perfil",
                "Toda atividade realizada através da sua conta",
                "Notificar-nos imediatamente sobre uso não autorizado",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[7px] block size-1 shrink-0 rounded-full bg-[#B6FF00]/50" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Contas criadas por menores de 13 anos não são permitidas. Entre 13 e 18 anos, é
              necessária autorização dos responsáveis.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Conduta na plataforma
            </h2>
            <p>É proibido:</p>
            <ul className="mt-3 space-y-1.5 pl-4">
              {[
                "Registrar dados falsos de treino para manipular rankings ou competições",
                "Assediar, ameaçar ou ofender outros usuários",
                "Usar a plataforma para fins ilegais",
                "Tentar acessar dados de outros usuários sem autorização",
                "Criar múltiplas contas para burlar restrições",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[7px] block size-1 shrink-0 rounded-full bg-[#B6FF00]/50" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Violações podem resultar em suspensão ou encerramento permanente da conta.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Propriedade intelectual
            </h2>
            <p>
              Todo o conteúdo da plataforma — design, código, marca, logotipo e funcionalidades —
              é de propriedade da Gravix Tech e protegido por leis de propriedade intelectual.
            </p>
            <p className="mt-3">
              Seus dados de treino pertencem a você. Ao usar a plataforma, você nos concede
              licença para processar e exibir esses dados dentro do GymPace.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Limitação de responsabilidade
            </h2>
            <p>
              O GymPace é uma ferramenta de acompanhamento de treinos e não substitui
              orientação médica ou de profissionais de educação física. Use as informações da
              plataforma como referência, não como prescrição.
            </p>
            <p className="mt-3">
              Não nos responsabilizamos por lesões, danos ou perdas decorrentes de atividades
              físicas realizadas com base nos dados da plataforma. A Gravix Tech não garante
              disponibilidade contínua do serviço e não se responsabiliza por eventuais
              interrupções.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Contato
            </h2>
            <p>
              Dúvidas sobre estes termos? Entre em contato:{" "}
              <span className="text-[#B6FF00]/70">gravix@outlook.com.br</span>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-[#080808] py-8">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-5 text-[11px] text-[#F5F5F5]/28">
              <Link href="/privacy" className="transition-colors hover:text-[#F5F5F5]/50">
                Privacidade
              </Link>
              <Link href="/terms" className="text-[#F5F5F5]/50">
                Termos
              </Link>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-right">
              <p className="text-[11px] text-[#F5F5F5]/20">
                © 2026 GymPace. Todos os direitos reservados.
              </p>
              <p className="text-[10px] text-[#F5F5F5]/12">
                Powered by{" "}
                <span className="font-semibold text-[#B6FF00]/36">Gravix Tech</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
