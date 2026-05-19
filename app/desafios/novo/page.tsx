import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { CreateChallengeForm } from "@/components/challenges/create-challenge-form";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ userId?: string }> };

export default async function NovoDesafioPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { userId } = await searchParams;

  // If userId provided via URL, pre-load the profile
  let prefilledProfile: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_id: string | null;
  } | null = null;

  if (userId && userId !== user.id) {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_id")
      .eq("user_id", userId)
      .maybeSingle();
    prefilledProfile = data ?? null;
  }

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <Link
            href="/desafios"
            className="mt-1 grid size-9 shrink-0 place-items-center rounded-xl text-[#F5F5F5]/40 transition-all duration-150 hover:bg-white/[0.05] hover:text-[#F5F5F5]/70 active:scale-90"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
          </Link>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
              Novo duelo
            </p>
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
              <Swords className="size-5 text-[#B6FF00]" strokeWidth={2} />
              Criar desafio
            </h1>
            <p className="mt-1.5 text-sm text-[#F5F5F5]/35">
              Configure o duelo e envie o convite.
            </p>
          </div>
        </div>

        <div className="max-w-lg">
          <CreateChallengeForm
            prefilledUserId={prefilledProfile?.user_id}
            prefilledDisplayName={prefilledProfile?.display_name ?? undefined}
            prefilledUsername={prefilledProfile?.username ?? undefined}
            prefilledAvatarId={prefilledProfile?.avatar_id}
          />
        </div>
      </div>
    </AppShell>
  );
}
