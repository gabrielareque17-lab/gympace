import { NextResponse } from "next/server";

import { AVATAR_REGISTRY, getAvatarById, type AvatarRarity, type AvatarType } from "@/lib/avatar-registry";
import {
  buildCustomAvatarId,
  customAvatarRowToDefinition,
  getGlowColor,
  normalizeCustomRarity,
  normalizeGender,
  normalizeHexColor,
  normalizeTextOption,
  type CustomAvatarRow,
} from "@/lib/custom-avatars";
import { createOptionalSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { awardTrophy } from "@/lib/trophies";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  return profile?.is_admin ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createOptionalSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for admin avatars." }, { status: 503 });
  }

  const { data: unlocks, error } = await supabase
    .from("user_avatar_unlocks")
    .select("id,user_id,avatar_id,source,source_ref,unlocked_at")
    .order("unlocked_at", { ascending: false })
    .limit(80);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: customAvatars } = await supabase
    .from("custom_avatars")
    .select("id,name,type,category,label,description,primary_color,accent_color,secondary_color,background_color,outfit_color,hair_style,hair_color,face_style,accessory,glow_color,rarity,gender,unlock_kind,unlock_label,female,exclusive,trophy_id,assigned_to,is_active,metadata,created_at,updated_at")
    .order("created_at", { ascending: false });

  const customRows = (customAvatars ?? []) as CustomAvatarRow[];

  return NextResponse.json({
    avatars: [
      ...AVATAR_REGISTRY,
      ...customRows.map(customAvatarRowToDefinition),
    ],
    customAvatars: customRows,
    unlocks: unlocks ?? [],
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const userId = String(b.user_id ?? "");
  let avatarId = String(b.avatar_id ?? "");
  const source = String(b.source ?? "admin");
  const sourceRef = String(b.source_ref ?? "").trim() || null;

  if (!userId) {
    return NextResponse.json({ error: "user_id e obrigatorio" }, { status: 400 });
  }
  if (!["season", "trophy", "achievement", "admin"].includes(source)) {
    return NextResponse.json({ error: "Origem invalida" }, { status: 400 });
  }

  const supabase = createOptionalSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for admin avatars." }, { status: 503 });
  }

  const customAvatar = b.custom_avatar as Record<string, unknown> | undefined;
  let trophyId: string | null = null;

  if (customAvatar) {
    const label = String(customAvatar.label ?? "").trim();
    const description = String(customAvatar.description ?? "").trim() || "Avatar exclusivo criado pela equipe GymPace.";
    const type = String(customAvatar.type ?? "power_athlete") as AvatarType;
    const rarity = normalizeCustomRarity(String(customAvatar.rarity ?? "legendary")) as AvatarRarity;
    const gender = normalizeGender(String(customAvatar.gender ?? (customAvatar.female ? "feminino" : "neutro")));
    const unlockLabel = String(customAvatar.unlock_label ?? "").trim() || "Exclusivo";
    const trophyName = String(customAvatar.trophy_name ?? "").trim();
    const trophyDescription = String(customAvatar.trophy_description ?? "").trim() || `Avatar exclusivo: ${label}`;
    const accentColor = normalizeHexColor(String(customAvatar.accent_color ?? "#FACC15"), "#FACC15");
    const primaryColor = normalizeHexColor(String(customAvatar.primary_color ?? accentColor), accentColor);
    const secondaryColor = normalizeHexColor(String(customAvatar.secondary_color ?? "#FFF4A3"), "#FFF4A3");
    const backgroundColor = normalizeHexColor(String(customAvatar.background_color ?? "#080808"), "#080808");
    const outfitColor = normalizeHexColor(String(customAvatar.outfit_color ?? primaryColor), primaryColor);
    const hairColor = normalizeHexColor(String(customAvatar.hair_color ?? "#171717"), "#171717");
    const hairStyle = normalizeTextOption(customAvatar.hair_style, "curto");
    const faceStyle = normalizeTextOption(customAvatar.face_style, "confiante");
    const accessory = normalizeTextOption(customAvatar.accessory, "none");
    const metadata = typeof customAvatar.metadata === "object" && customAvatar.metadata !== null ? customAvatar.metadata : {};
    const female = gender === "feminino";

    if (!label) return NextResponse.json({ error: "Nome do avatar e obrigatorio" }, { status: 400 });
    if (!["runner", "gym_rat", "hybrid_athlete", "power_athlete"].includes(type)) {
      return NextResponse.json({ error: "Tipo de avatar invalido" }, { status: 400 });
    }
    if (!["common", "rare", "epic", "legendary"].includes(rarity)) {
      return NextResponse.json({ error: "Raridade de avatar invalida" }, { status: 400 });
    }

    avatarId = buildCustomAvatarId({ label, type, rarity, accentColor: primaryColor, secondaryColor, female });
    const category = type === "runner" ? "running" : type === "gym_rat" ? "gym" : type === "hybrid_athlete" ? "hybrid" : "premium";

    if (trophyName) {
      const trophyRarity = rarity === "seasonal" ? "legendary" : rarity;
      const { data: trophy, error: trophyError } = await supabase
        .from("exclusive_trophies")
        .insert({
          slug: `avatar-${avatarId}`,
          name: trophyName,
          description: trophyDescription,
          rarity: trophyRarity,
          visual: "sparkles",
          is_unique: true,
          created_by: admin.id,
        })
        .select("id")
        .single();

      if (trophyError) return NextResponse.json({ error: trophyError.message }, { status: 500 });
      trophyId = trophy.id;
    }

    const { error: avatarError } = await supabase.from("custom_avatars").insert({
      id: avatarId,
      name: label,
      type,
      category,
      label,
      description,
      accent_color: primaryColor,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      background_color: backgroundColor,
      outfit_color: outfitColor,
      hair_style: hairStyle,
      hair_color: hairColor,
      face_style: faceStyle,
      accessory,
      glow_color: getGlowColor(primaryColor),
      rarity,
      gender,
      unlock_kind: source,
      unlock_label: unlockLabel,
      female,
      exclusive: true,
      trophy_id: trophyId,
      created_by: admin.id,
      assigned_to: userId,
      is_active: customAvatar.is_active !== false,
      metadata,
    });

    if (avatarError) return NextResponse.json({ error: avatarError.message }, { status: 500 });
  }

  if (!avatarId) {
    return NextResponse.json({ error: "avatar_id e obrigatorio" }, { status: 400 });
  }

  const customDefinition = customAvatar
    ? null
    : avatarId.startsWith("custom-")
      ? await supabase
          .from("custom_avatars")
          .select("id,name,type,category,label,description,primary_color,accent_color,secondary_color,background_color,outfit_color,hair_style,hair_color,face_style,accessory,glow_color,rarity,gender,unlock_kind,unlock_label,female,exclusive,trophy_id,assigned_to,is_active,metadata,created_at,updated_at")
          .eq("id", avatarId)
          .maybeSingle()
      : null;
  const avatar = customDefinition?.data
    ? customAvatarRowToDefinition(customDefinition.data as CustomAvatarRow)
    : getAvatarById(avatarId);
  if (!avatar) return NextResponse.json({ error: "Avatar desconhecido" }, { status: 400 });
  if (avatar.unlock.kind === "free") {
    return NextResponse.json({ error: "Este avatar ja e livre para todos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_avatar_unlocks")
    .insert({
      user_id: userId,
      avatar_id: avatar.id,
      source,
      source_ref: sourceRef,
      unlocked_by: admin.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Usuario ja possui este avatar" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("admin_events").insert({
    admin_id: admin.id,
    event_type: customAvatar ? "create_unlock_custom_avatar" : "unlock_avatar",
    target_user_id: userId,
    payload: { avatar_id: avatar.id, source, trophy_id: trophyId },
  });

  if (trophyId) {
    await awardTrophy(supabase, {
      userId,
      trophyId,
      awardedBy: admin.id,
      note: "Avatar exclusivo liberado pela equipe GymPace.",
      feed: true,
    });
  }

  return NextResponse.json({ unlock: data, avatar_id: avatar.id, trophy_id: trophyId }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const avatarId = String(b.id ?? b.avatar_id ?? "").trim();
  if (!avatarId || !avatarId.startsWith("custom-")) {
    return NextResponse.json({ error: "id de avatar personalizado e obrigatorio" }, { status: 400 });
  }

  const supabase = createOptionalSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is required for admin avatars." }, { status: 503 });
  }

  const label = String(b.label ?? b.name ?? "").trim();
  const primaryColor = normalizeHexColor(String(b.primary_color ?? b.accent_color ?? "#FACC15"), "#FACC15");
  const update: Record<string, unknown> = {
    ...(label && { name: label, label }),
    ...(b.description !== undefined && { description: String(b.description ?? "").trim() }),
    ...(b.rarity !== undefined && { rarity: normalizeCustomRarity(String(b.rarity)) }),
    ...(b.gender !== undefined && {
      gender: normalizeGender(String(b.gender)),
      female: normalizeGender(String(b.gender)) === "feminino",
    }),
    ...(b.type !== undefined && { type: String(b.type) }),
    ...(b.category !== undefined && { category: String(b.category) }),
    ...(b.primary_color !== undefined || b.accent_color !== undefined ? {
      primary_color: primaryColor,
      accent_color: primaryColor,
      glow_color: getGlowColor(primaryColor),
    } : {}),
    ...(b.secondary_color !== undefined && { secondary_color: normalizeHexColor(String(b.secondary_color), "#FFF4A3") }),
    ...(b.background_color !== undefined && { background_color: normalizeHexColor(String(b.background_color), "#080808") }),
    ...(b.outfit_color !== undefined && { outfit_color: normalizeHexColor(String(b.outfit_color), primaryColor) }),
    ...(b.hair_style !== undefined && { hair_style: normalizeTextOption(b.hair_style, "curto") }),
    ...(b.hair_color !== undefined && { hair_color: normalizeHexColor(String(b.hair_color), "#171717") }),
    ...(b.face_style !== undefined && { face_style: normalizeTextOption(b.face_style, "confiante") }),
    ...(b.accessory !== undefined && { accessory: normalizeTextOption(b.accessory, "none") }),
    ...(b.unlock_label !== undefined && { unlock_label: String(b.unlock_label ?? "").trim() || "Exclusivo" }),
    ...(b.assigned_to !== undefined && { assigned_to: String(b.assigned_to ?? "").trim() || null }),
    ...(b.is_active !== undefined && { is_active: Boolean(b.is_active) }),
    ...(typeof b.metadata === "object" && b.metadata !== null && { metadata: b.metadata }),
  };

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteracao enviada" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("custom_avatars")
    .update(update)
    .eq("id", avatarId)
    .select("id,name,type,category,label,description,primary_color,accent_color,secondary_color,background_color,outfit_color,hair_style,hair_color,face_style,accessory,glow_color,rarity,gender,unlock_kind,unlock_label,female,exclusive,trophy_id,assigned_to,is_active,metadata,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (update.assigned_to) {
    await supabase.from("user_avatar_unlocks").upsert({
      user_id: update.assigned_to,
      avatar_id: avatarId,
      source: "admin",
      source_ref: "custom_avatar_edit",
      unlocked_by: admin.id,
    }, { onConflict: "user_id,avatar_id" });
  }

  await supabase.from("admin_events").insert({
    admin_id: admin.id,
    event_type: "update_custom_avatar",
    target_user_id: (update.assigned_to as string | undefined) ?? null,
    payload: { avatar_id: avatarId, changes: Object.keys(update) },
  });

  return NextResponse.json({ customAvatar: data });
}
