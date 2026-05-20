import { redirect } from "next/navigation";
import { Activity, Compass, Dumbbell, Rss } from "lucide-react";
import Link from "next/link";

import { FeedList } from "@/components/feed/FeedList";
import { AppShell } from "@/components/ui/layout/app-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getFeedEvents } from "@/lib/feed";

export const dynamic = "force-dynamic";

const INITIAL_LIMIT = 15;

function FeedEmpty() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111111] px-5 py-16 text-center">
      <div className="mx-auto mb-4 flex items-center justify-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/10">
          <Activity className="size-5 text-[#B6FF00]" strokeWidth={1.8} />
        </div>
        <div className="grid size-10 place-items-center rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10">
          <Dumbbell className="size-5 text-[#3B82F6]" strokeWidth={1.8} />
        </div>
      </div>
      <p className="text-sm font-semibold text-[#F5F5F5]/45">Seu feed ainda está quieto</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#F5F5F5]/25">
        Siga atletas, registre treinos e participe de desafios para ver o feed ganhar vida.
      </p>
      <Link
        href="/explorar"
        prefetch
        className="mobile-tap mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#B6FF00]/20 bg-[#B6FF00]/[0.07] px-4 py-1.5 text-xs font-semibold text-[#B6FF00]/75 transition-transform duration-100 active:scale-[0.97] active:opacity-80 hover:border-[#B6FF00]/35 hover:bg-[#B6FF00]/[0.12]"
      >
        <Compass className="size-3.5" strokeWidth={2} />
        Explorar atletas
      </Link>
    </div>
  );
}

export default async function FeedPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const events = await getFeedEvents(supabase, user.id, INITIAL_LIMIT + 1);
  const hasMore = events.length > INITIAL_LIMIT;
  const initialEvents = hasMore ? events.slice(0, INITIAL_LIMIT) : events;

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-2xl px-3.5 pb-4 pt-4 sm:px-4 sm:py-8 md:px-6">
        <header className="mb-4 sm:mb-8">
          <div className="mb-2.5 flex items-center gap-2.5">
            <div className="grid size-7 place-items-center rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/10">
              <Rss className="size-4 text-[#B6FF00]" strokeWidth={2} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
              Social
            </p>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Feed</h1>
          <p className="mt-1 text-sm text-[#F5F5F5]/40 sm:mt-2">
            Atividade da sua rede GymPace
          </p>
        </header>

        {initialEvents.length === 0 ? (
          <FeedEmpty />
        ) : (
          <FeedList initialEvents={initialEvents} initialHasMore={hasMore} />
        )}
      </main>
    </AppShell>
  );
}
