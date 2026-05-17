import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade · GymPace",
  description: "Como coletamos, usamos e protegemos seus dados no GymPace.",
};

export default function PrivacyPage() {
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
            Política de Privacidade
          </h1>
          <p className="mt-2 text-sm text-[#F5F5F5]/38">
            Última atualização: 17 de maio de 2026
          </p>
        </div>

        <div className="space-y-10 text-[14px] leading-[1.8] text-[#F5F5F5]/60">
          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              O que coletamos
            </h2>
            <p>
              Coletamos apenas as informações necessárias para oferecer a experiência do GymPace:
              endereço de e-mail, nome de usuário, dados de treinos registrados (corridas,
              distâncias, ritmos, sessões de academia) e preferências de perfil (avatar, bio).
            </p>
            <p className="mt-3">
              Não coletamos dados sensíveis como documentos de identidade, dados bancários ou
              informações de saúde além do que você registra voluntariamente nos seus treinos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Como usamos seus dados
            </h2>
            <p>
              Seus dados são usados exclusivamente para:
            </p>
            <ul className="mt-3 space-y-1.5 pl-4">
              {[
                "Exibir seu progresso, histórico e analytics de treino",
                "Calcular conquistas, XP e ranking",
                "Permitir competições e interações sociais com outros atletas",
                "Enviar notificações relacionadas à plataforma (se habilitadas)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[7px] block size-1 shrink-0 rounded-full bg-[#B6FF00]/50" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins
              publicitários.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Armazenamento e segurança
            </h2>
            <p>
              Seus dados são armazenados com segurança via Supabase, com criptografia em trânsito
              (TLS) e em repouso. O acesso é restrito por políticas de segurança em nível de linha
              (RLS), garantindo que cada usuário acesse somente seus próprios dados.
            </p>
            <p className="mt-3">
              Mantemos seus dados enquanto sua conta estiver ativa. Caso deseje excluir sua conta,
              todos os dados são removidos permanentemente.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Seus direitos
            </h2>
            <p>Você pode, a qualquer momento:</p>
            <ul className="mt-3 space-y-1.5 pl-4">
              {[
                "Acessar e exportar seus dados de treino",
                "Corrigir ou atualizar suas informações de perfil",
                "Solicitar a exclusão da sua conta e todos os dados associados",
                "Retirar seu consentimento para coleta de dados não essenciais",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-[7px] block size-1 shrink-0 rounded-full bg-[#B6FF00]/50" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Cookies
            </h2>
            <p>
              Utilizamos cookies essenciais para manter sua sessão autenticada. Não utilizamos
              cookies de rastreamento ou publicidade de terceiros.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-base font-semibold text-[#F5F5F5]/90">
              Contato
            </h2>
            <p>
              Dúvidas sobre privacidade? Entre em contato:{" "}
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
              <Link href="/privacy" className="text-[#F5F5F5]/50">
                Privacidade
              </Link>
              <Link href="/terms" className="transition-colors hover:text-[#F5F5F5]/50">
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
