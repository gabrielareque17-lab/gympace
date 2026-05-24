import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { updateActiveCompetitionProgressForUser } from "@/lib/competition-progress";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { awardXP } from "@/lib/xp";

type Params = { params: Promise<{ id: string; inviteId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id, inviteId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action !== "accept" && action !== "reject" && action !== "cancel") {
    return NextResponse.json({ error: 'action must be "accept", "reject" or "cancel"' }, { status: 400 });
  }

  const { data: invite, error: inviteErr } = await supabase
    .from("competition_invites")
    .select("id, competition_id, invited_by, invited_user_id, status")
    .eq("id", inviteId)
    .eq("competition_id", id)
    .maybeSingle();

  if (inviteErr) return NextResponse.json({ error: inviteErr.message }, { status: 500 });
  if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });

  if (action === "cancel") {
    if (invite.invited_by !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (invite.invited_user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nextStatus = action === "accept" ? "accepted" : action === "cancel" ? "canceled" : "rejected";

  if (invite.status === nextStatus) {
    return NextResponse.json({ ok: true, status: nextStatus, alreadyResponded: true });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Convite já respondido" }, { status: 409 });
  }

  if (action === "accept") {
    const { data: competition, error: competitionErr } = await supabase
      .from("competitions")
      .select("id, end_date")
      .eq("id", id)
      .maybeSingle();

    if (competitionErr) return NextResponse.json({ error: competitionErr.message }, { status: 500 });
    if (!competition) return NextResponse.json({ error: "Competição não encontrada" }, { status: 404 });
    if (new Date(competition.end_date) < new Date()) {
      return NextResponse.json({ error: "Competição encerrada" }, { status: 400 });
    }

    const { data: existingParticipant, error: participantErr } = await supabase
      .from("competition_participants")
      .select("user_id")
      .eq("competition_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (participantErr) return NextResponse.json({ error: participantErr.message }, { status: 500 });

    if (!existingParticipant) {
      const { error: joinErr } = await supabase
        .from("competition_participants")
        .insert({ competition_id: id, user_id: user.id });

      if (joinErr && joinErr.code !== "23505") {
        return NextResponse.json({ error: joinErr.message }, { status: 500 });
      }
    }
  }

  const { data: updatedInvite, error: updateErr } = await supabase
    .from("competition_invites")
    .update({ status: nextStatus })
    .eq("id", inviteId)
    .eq("status", "pending")
    .select("id, status")
    .maybeSingle();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  if (!updatedInvite) return NextResponse.json({ error: "Convite já respondido" }, { status: 409 });

  if (action === "accept") {
    await updateActiveCompetitionProgressForUser(supabase, user.id);
  }

  const xpFeedback = action === "accept" ? await awardXP(supabase, { userId: user.id, source: "competition", sourceId: id }) : null;

  revalidatePath("/competicoes");
  revalidatePath("/convites");
  revalidatePath("/desafios-competicoes");
  revalidatePath(`/competicoes/${id}`);

  return NextResponse.json({ ok: true, status: nextStatus, xpFeedback });
}
