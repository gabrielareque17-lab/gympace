import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { GpsPoint } from "@/lib/geo";

type Params = { params: Promise<{ id: string }> };

const MAX_PREVIEW_POINTS = 150;

function downsample(points: GpsPoint[], max: number): GpsPoint[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("runs")
    .select("route_points")
    .eq("id", id)
    .maybeSingle();

  const rawPoints = (data?.route_points ?? []) as GpsPoint[];
  const points = downsample(rawPoints, MAX_PREVIEW_POINTS);

  return NextResponse.json({ route_points: points });
}
