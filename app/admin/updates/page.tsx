import { SendUpdateForm } from "@/components/admin/send-update-form";

export const dynamic = "force-dynamic";

export default function UpdatesPage() {
  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
          Publicar atualizacao
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#F5F5F5]/40">
          Crie um registro visível em /updates e envie uma notificação global para os usuários.
        </p>
      </div>
      <SendUpdateForm />
    </div>
  );
}
