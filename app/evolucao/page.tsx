import { AppShell } from "@/components/ui/layout/app-shell";
import { PageHeader } from "@/components/ui/page-layout";
import { AnalyticsShell } from "@/components/analytics/analytics-shell";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  buildEmptyAnalytics,
  computeAnalytics,
  type RunRow,
  type WorkoutRow,
  type ProfileRow,
} from "@/lib/analytics";
import { syncUserXP } from "@/lib/xp";

export const dynamic = "force-dynamic";

export default async function EvolucaoPage() {
  const data = await getAnalyticsData();

  return <PageLayout data={data} />;
}

async function getAnalyticsData() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return buildEmptyAnalytics();
    }

    const [runsResult, workoutsResult, xpSync] = await Promise.all([
      supabase
        .from("runs")
        .select("distance,pace,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("workouts")
        .select("muscle_group,muscle_groups,duration_minutes,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      syncUserXP(supabase, user.id),
    ]);

    const runs = (runsResult.data ?? []) as RunRow[];

    let workouts: WorkoutRow[] = [];
    if (workoutsResult.error) {
      const isTableMissing =
        workoutsResult.error.code === "42P01" ||
        workoutsResult.error.message.toLowerCase().includes("workouts");
      if (!isTableMissing) throw workoutsResult.error;
    } else {
      workouts = (workoutsResult.data ?? []) as WorkoutRow[];
    }

    const profile = {
      total_xp: xpSync.totalXp,
      current_level: xpSync.currentLevel,
      rank: xpSync.rank,
    } satisfies ProfileRow;
    const data = computeAnalytics(runs, workouts, profile);

    return data;
  } catch {
    return buildEmptyAnalytics();
  }
}

function PageLayout({ data }: { data: ReturnType<typeof buildEmptyAnalytics> }) {
  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <PageHeader
          eyebrow="Analytics"
          title="Evolução"
          description="Volume, pace, consistência e performance em um painel focado na sua evolução."
        />
        <AnalyticsShell data={data} />
      </div>
    </AppShell>
  );
}
