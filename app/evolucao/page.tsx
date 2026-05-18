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

export const dynamic = "force-dynamic";

export default async function EvolucaoPage() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return <PageLayout data={buildEmptyAnalytics()} />;
    }

    const [runsResult, workoutsResult, profileResult] = await Promise.all([
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
      supabase
        .from("profiles")
        .select("total_xp,current_level,rank")
        .eq("user_id", user.id)
        .maybeSingle(),
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

    const profile = (profileResult.data ?? null) as ProfileRow | null;
    const data = computeAnalytics(runs, workouts, profile);

    return <PageLayout data={data} />;
  } catch {
    return <PageLayout data={buildEmptyAnalytics()} />;
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
