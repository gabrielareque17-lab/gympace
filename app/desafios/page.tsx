import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Swords } from "lucide-react";

import { AppShell } from "@/components/ui/layout/app-shell";
import { ChallengeTabs } from "@/components/challenges/challenge-tabs";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { ChallengeRow, ChallengeProfile } from "@/lib/challenge-progress";

export const dynamic = "force-dynamic";

export default async function DesafiosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all challenges where user is a participant
  const { data: rawChallenges } = await supabase
    .from("challenges")
    .select("*")
    .or(`creator_id.eq.${user.id},challenged_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const challenges: ChallengeRow[] = (rawChallenges ?? []) as ChallengeRow[];

  // Collect all unique participant IDs and fetch profiles in one query
  const userIds = [
    ...new Set([
      ...challenges.map((c) => c.creator_id),
      ...challenges.map((c) => c.challenged_id),
    ]),
  ];

  const { data: profilesData } = userIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_id")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = Object.fromEntries(
    (profilesData ?? []).map((p) => [p.user_id, p as ChallengeProfile])
  );

  function getProfile(userId: string): ChallengeProfile {
    return (
      profileMap[userId] ?? {
        user_id: userId,
        username: null,
        display_name: null,
        avatar_id: null,
      }
    );
  }

  // Categorize challenges
  const received = challenges
    .filter((c) => c.challenged_id === user.id && c.status === "pending")
    .map((c) => ({ challenge: c, creator: getProfile(c.creator_id), challenged: getProfile(c.challenged_id) }));

  const sent = challenges
    .filter((c) => c.creator_id === user.id && c.status === "pending")
    .map((c) => ({ challenge: c, creator: getProfile(c.creator_id), challenged: getProfile(c.challenged_id) }));

  const active = challenges
    .filter((c) => c.status === "active")
    .map((c) => ({ challenge: c, creator: getProfile(c.creator_id), challenged: getProfile(c.challenged_id) }));

  const history = challenges
    .filter((c) => ["finished", "declined", "canceled"].includes(c.status))
    .map((c) => ({ challenge: c, creator: getProfile(c.creator_id), challenged: getProfile(c.challenged_id) }));

  const totalPending = received.length + sent.length;

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
              Social
            </p>
            <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold tracking-tight">
              <Swords className="size-6 text-[#B6FF00]" strokeWidth={2} />
              Desafios
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#F5F5F5]/40">
              Duelos 1×1 diretos. Desafie qualquer atleta e prove quem é melhor.
            </p>
          </div>

          <Link
            href="/desafios/novo"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#B6FF00] px-4 py-2.5 text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(182,255,0,0.12)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_28px_rgba(182,255,0,0.22)] active:translate-y-0"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Desafiar
          </Link>
        </header>

        {/* Pending badge */}
        {totalPending > 0 && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-[#B6FF00]/[0.14] bg-[#B6FF00]/[0.06] px-4 py-3">
            <div className="size-2 animate-pulse rounded-full bg-[#B6FF00]" />
            <p className="text-sm font-semibold text-[#B6FF00]/80">
              {totalPending === 1
                ? "1 desafio aguarda sua atenção"
                : `${totalPending} desafios aguardam sua atenção`}
            </p>
          </div>
        )}

        <div className="max-w-2xl">
          <ChallengeTabs
            received={received}
            sent={sent}
            active={active}
            history={history}
            currentUserId={user.id}
          />
        </div>
      </div>
    </AppShell>
  );
}
