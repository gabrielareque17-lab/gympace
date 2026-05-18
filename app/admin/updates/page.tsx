import { SendUpdateForm } from "@/components/admin/send-update-form";

export const dynamic = "force-dynamic";

export default function UpdatesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F5]">
          Enviar Update
        </h1>
        <p className="mt-1 text-sm text-[#F5F5F5]/40">
          Notificação global entregue para todos os usuários da plataforma
        </p>
      </div>
      <SendUpdateForm />
    </div>
  );
}
