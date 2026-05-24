import type {
  AvatarCategory,
  AvatarDefinition,
  AvatarRarity,
  AvatarType,
  AvatarUnlockKind,
  CustomAvatarGender,
  CustomAvatarVisual,
} from "@/lib/avatar-registry";

export type CustomAvatarRow = {
  id: string;
  name?: string | null;
  type: AvatarType;
  category: AvatarCategory;
  label: string;
  description: string;
  primary_color?: string | null;
  accent_color: string;
  secondary_color: string;
  background_color?: string | null;
  outfit_color?: string | null;
  hair_style?: string | null;
  hair_color?: string | null;
  face_style?: string | null;
  accessory?: string | null;
  glow_color: string;
  rarity: AvatarRarity;
  gender?: CustomAvatarGender | null;
  unlock_kind: Exclude<AvatarUnlockKind, "free" | "level">;
  unlock_label: string;
  female: boolean;
  exclusive?: boolean | null;
  trophy_id?: string | null;
  assigned_to?: string | null;
  is_active?: boolean | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const TYPE_TOKEN: Record<AvatarType, string> = {
  runner: "run",
  gym_rat: "gym",
  hybrid_athlete: "hyb",
  power_athlete: "pwr",
};

const TOKEN_TYPE: Record<string, AvatarType> = {
  run: "runner",
  gym: "gym_rat",
  hyb: "hybrid_athlete",
  pwr: "power_athlete",
};

const TYPE_CATEGORY: Record<AvatarType, AvatarCategory> = {
  runner: "running",
  gym_rat: "gym",
  hybrid_athlete: "hybrid",
  power_athlete: "premium",
};

export function slugifyAvatarLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "avatar";
}

export function normalizeHexColor(value: string, fallback: string) {
  const raw = value.trim();
  const color = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : fallback;
}

export function getGlowColor(accentColor: string) {
  const hex = normalizeHexColor(accentColor, "#FACC15").slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.36)`;
}

export function normalizeCustomRarity(value: string): Exclude<AvatarRarity, "core" | "seasonal"> {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "comum" || normalized === "common" || normalized === "core") return "common";
  if (normalized === "raro" || normalized === "rare") return "rare";
  if (normalized === "epico" || normalized === "epic") return "epic";
  if (normalized === "lendario" || normalized === "legendary" || normalized === "seasonal") return "legendary";
  return "legendary";
}

export function normalizeGender(value: string): CustomAvatarGender {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "masculino" || normalized === "male" || normalized === "m") return "masculino";
  if (normalized === "feminino" || normalized === "female" || normalized === "f") return "feminino";
  return "neutro";
}

export function normalizeTextOption(value: unknown, fallback: string, maxLength = 40) {
  const text = String(value ?? "").trim();
  return (text || fallback).slice(0, maxLength);
}

export function buildCustomAvatarId(input: {
  label: string;
  type: AvatarType;
  rarity: AvatarRarity;
  accentColor: string;
  secondaryColor: string;
  female?: boolean;
}) {
  const slug = slugifyAvatarLabel(input.label);
  const accent = normalizeHexColor(input.accentColor, "#FACC15").slice(1).toLowerCase();
  const secondary = normalizeHexColor(input.secondaryColor, "#FFF4A3").slice(1).toLowerCase();
  const suffix = Math.random().toString(36).slice(2, 7);
  return `custom-${slug}-${TYPE_TOKEN[input.type]}-${input.rarity}-${accent}-${secondary}-${input.female ? "f" : "m"}-${suffix}`;
}

export function parseCustomAvatarId(id: string): AvatarDefinition | null {
  if (!id.startsWith("custom-")) return null;
  const parts = id.split("-");
  if (parts.length < 8) return null;
  const gender = parts[parts.length - 2];
  const secondary = `#${parts[parts.length - 3]}`;
  const accent = `#${parts[parts.length - 4]}`;
  const rarity = parts[parts.length - 5] as AvatarRarity;
  const type = TOKEN_TYPE[parts[parts.length - 6]] ?? "power_athlete";
  const slug = parts.slice(1, -6).join("-");
  const label = slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ") || "Avatar Exclusivo";

  return {
    id,
    type,
    category: TYPE_CATEGORY[type],
    label,
    description: "Avatar exclusivo",
    accentColor: normalizeHexColor(accent, "#FACC15"),
    secondaryColor: normalizeHexColor(secondary, "#FFF4A3"),
    glowColor: getGlowColor(accent),
    rarity,
    unlock: { kind: "admin", label: "Exclusivo" },
    female: gender === "f",
  };
}

export function customAvatarRowToDefinition(row: CustomAvatarRow): AvatarDefinition {
  const primaryColor = normalizeHexColor(row.primary_color ?? row.accent_color, row.accent_color);
  const backgroundColor = normalizeHexColor(row.background_color ?? "#080808", "#080808");
  const outfitColor = normalizeHexColor(row.outfit_color ?? row.accent_color, row.accent_color);
  const hairColor = normalizeHexColor(row.hair_color ?? "#171717", "#171717");
  const gender = normalizeGender(row.gender ?? (row.female ? "feminino" : "neutro"));
  const customVisual: CustomAvatarVisual = {
    gender,
    primaryColor,
    backgroundColor,
    outfitColor,
    hairStyle: row.hair_style ?? "curto",
    hairColor,
    faceStyle: row.face_style ?? "confiante",
    accessory: row.accessory ?? "none",
  };

  return {
    id: row.id,
    type: row.type,
    category: row.category,
    label: row.name ?? row.label,
    description: row.description,
    accentColor: primaryColor,
    secondaryColor: row.secondary_color,
    glowColor: row.glow_color,
    rarity: row.rarity,
    unlock: {
      kind: row.unlock_kind,
      label: row.unlock_label,
      trophyId: row.trophy_id ?? undefined,
    },
    female: gender === "feminino" || row.female,
    customVisual,
  };
}
