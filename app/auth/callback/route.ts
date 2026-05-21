import { NextResponse, type NextRequest } from "next/server";

import { getAvatarById } from "@/lib/avatar-registry";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    const user = data.user;
    const avatarId =
      typeof user?.user_metadata?.avatar_id === "string"
        ? user.user_metadata.avatar_id
        : null;
    const avatar = getAvatarById(avatarId);

    if (user && avatar && avatar.unlock.kind === "free") {
      await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          avatar_id: avatar.id,
          avatar_type: avatar.type,
        },
        { onConflict: "user_id" }
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
