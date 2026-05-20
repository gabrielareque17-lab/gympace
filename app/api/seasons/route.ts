import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getActiveSeason, getAllSeasons } from "@/lib/seasons";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const url = new URL(req.url);
  const all = url.searchParams.get("all") === "true";

  if (all) {
    const seasons = await getAllSeasons(supabase);
    return NextResponse.json({ seasons });
  }

  const season = await getActiveSeason(supabase);
  return NextResponse.json({ season });
}
