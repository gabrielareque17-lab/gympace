import {
  Activity,
  Armchair,
  BicepsFlexed,
  Bone,
  CircleDot,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Move3D,
  PersonStanding,
  Shield,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type MuscleGroup = {
  value: string;
  name: string;
  category: "upper" | "arms" | "core" | "lower" | "conditioning";
  color: string;
  icon: LucideIcon;
  details: string[];
};

export const MUSCLE_GROUPS: MuscleGroup[] = [
  { value: "peito", name: "Peito", category: "upper", color: "#60A5FA", icon: Shield, details: ["peitoral-superior", "peitoral-medio", "peitoral-inferior"] },
  { value: "costas", name: "Costas", category: "upper", color: "#A78BFA", icon: PersonStanding, details: ["latissimo", "romboides", "redondo-maior", "eretores-da-espinha"] },
  { value: "ombros", name: "Ombros", category: "upper", color: "#FB923C", icon: CircleDot, details: ["deltoide-anterior", "deltoide-lateral", "deltoide-posterior"] },
  { value: "trapezio", name: "Trapézio", category: "upper", color: "#C084FC", icon: Sparkles, details: ["trapezio-superior", "trapezio-medio", "trapezio-inferior"] },
  { value: "biceps", name: "Bíceps", category: "arms", color: "#F472B6", icon: BicepsFlexed, details: ["biceps", "braquial", "braquiorradial"] },
  { value: "triceps", name: "Tríceps", category: "arms", color: "#38BDF8", icon: Armchair, details: ["triceps-lateral", "triceps-longo", "triceps-medial"] },
  { value: "antebraco", name: "Antebraço", category: "arms", color: "#2DD4BF", icon: Bone, details: ["flexores-do-antebraco", "extensores-do-antebraco", "pegada"] },
  { value: "abdomen", name: "Abdômen", category: "core", color: "#22D3EE", icon: Flame, details: ["reto-abdominal", "obliquos", "transverso"] },
  { value: "lombar", name: "Lombar", category: "core", color: "#818CF8", icon: PersonStanding, details: ["lombar", "eretores-lombares"] },
  { value: "quadriceps", name: "Quadríceps", category: "lower", color: "#B6FF00", icon: Footprints, details: ["vasto-lateral", "vasto-medial", "reto-femoral"] },
  { value: "posterior-coxa", name: "Posterior de coxa", category: "lower", color: "#84CC16", icon: Footprints, details: ["isquiotibiais", "biceps-femoral", "semitendinoso"] },
  { value: "gluteos", name: "Glúteos", category: "lower", color: "#F97316", icon: Dumbbell, details: ["gluteo-maximo", "gluteo-medio", "gluteo-minimo"] },
  { value: "panturrilhas", name: "Panturrilhas", category: "lower", color: "#EAB308", icon: Footprints, details: ["gastrocnemio", "soleo"] },
  { value: "adutores", name: "Adutores", category: "lower", color: "#F59E0B", icon: Move3D, details: ["adutor-longo", "adutor-magno", "gracil"] },
  { value: "abdutores", name: "Abdutores", category: "lower", color: "#34D399", icon: Move3D, details: ["gluteo-medio", "tensor-da-fascia-lata"] },
  { value: "full-body", name: "Corpo inteiro", category: "conditioning", color: "#B6FF00", icon: Zap, details: ["cadeia-anterior", "cadeia-posterior", "core"] },
  { value: "cardio", name: "Cardio", category: "conditioning", color: "#EF4444", icon: HeartPulse, details: ["zona-2", "hiit", "condicionamento"] },
  { value: "mobilidade", name: "Mobilidade", category: "conditioning", color: "#14B8A6", icon: Move3D, details: ["quadril", "toracica", "tornozelos", "ombros-mobilidade"] },
  { value: "funcional", name: "Funcional", category: "conditioning", color: "#FACC15", icon: Activity, details: ["potencia", "estabilidade", "coordenacao"] },
];

export const MUSCLE_CATEGORY_SECTIONS = [
  { key: "upper", label: "Tronco superior", description: "Peito, costas, ombros e trapézio." },
  { key: "arms", label: "Braços", description: "Bíceps, tríceps e antebraço." },
  { key: "core", label: "Core", description: "Abdômen e lombar." },
  { key: "lower", label: "Pernas e glúteos", description: "Quadríceps, posterior, glúteos, panturrilhas, adutores e abdutores." },
  { key: "conditioning", label: "Condicionamento", description: "Corpo inteiro, cardio, mobilidade e funcional." },
] as const;

export const LEGACY_GROUP_ALIASES: Record<string, string[]> = {
  pernas: ["quadriceps", "posterior-coxa", "gluteos", "panturrilhas"],
  bracos: ["biceps", "triceps", "antebraco"],
};

export const MUSCLE_DETAIL_LABELS: Record<string, string> = {
  "peitoral-superior": "Peitoral superior",
  "peitoral-medio": "Peitoral médio",
  "peitoral-inferior": "Peitoral inferior",
  latissimo: "Latíssimo",
  romboides: "Romboides",
  "redondo-maior": "Redondo maior",
  "eretores-da-espinha": "Eretores da espinha",
  "deltoide-anterior": "Deltoide anterior",
  "deltoide-lateral": "Deltoide lateral",
  "deltoide-posterior": "Deltoide posterior",
  biceps: "Bíceps",
  braquial: "Braquial",
  braquiorradial: "Braquiorradial",
  "triceps-lateral": "Tríceps lateral",
  "triceps-longo": "Tríceps longo",
  "triceps-medial": "Tríceps medial",
  "flexores-do-antebraco": "Flexores do antebraço",
  "extensores-do-antebraco": "Extensores do antebraço",
  pegada: "Pegada",
  "reto-abdominal": "Reto abdominal",
  obliquos: "Oblíquos",
  transverso: "Transverso",
  lombar: "Lombar",
  "eretores-lombares": "Eretores lombares",
  "vasto-lateral": "Vasto lateral",
  "vasto-medial": "Vasto medial",
  "reto-femoral": "Reto femoral",
  isquiotibiais: "Isquiotibiais",
  "biceps-femoral": "Bíceps femoral",
  semitendinoso: "Semitendinoso",
  "gluteo-maximo": "Glúteo máximo",
  "gluteo-medio": "Glúteo médio",
  "gluteo-minimo": "Glúteo mínimo",
  gastrocnemio: "Gastrocnêmio",
  soleo: "Sóleo",
  "trapezio-superior": "Trapézio superior",
  "trapezio-medio": "Trapézio médio",
  "trapezio-inferior": "Trapézio inferior",
  "adutor-longo": "Adutor longo",
  "adutor-magno": "Adutor magno",
  gracil: "Grácil",
  "tensor-da-fascia-lata": "Tensor da fáscia lata",
  "cadeia-anterior": "Cadeia anterior",
  "cadeia-posterior": "Cadeia posterior",
  core: "Core",
  "zona-2": "Zona 2",
  hiit: "HIIT",
  condicionamento: "Condicionamento",
  quadril: "Quadril",
  toracica: "Torácica",
  tornozelos: "Tornozelos",
  "ombros-mobilidade": "Ombros",
  potencia: "Potência",
  estabilidade: "Estabilidade",
  coordenacao: "Coordenação",
};

export const WORKOUT_SPLITS = [
  { value: "push", label: "Push", groups: ["peito", "ombros", "triceps"] },
  { value: "pull", label: "Pull", groups: ["costas", "biceps", "antebraco", "trapezio"] },
  { value: "legs", label: "Legs", groups: ["quadriceps", "posterior-coxa", "gluteos", "panturrilhas"] },
  { value: "upper", label: "Upper", groups: ["peito", "costas", "ombros", "biceps", "triceps"] },
  { value: "lower", label: "Lower", groups: ["quadriceps", "posterior-coxa", "gluteos", "panturrilhas", "adutores", "abdutores"] },
  { value: "full-body", label: "Full Body", groups: ["full-body", "peito", "costas", "quadriceps", "gluteos"] },
] as const;

export const VALID_MUSCLE_GROUPS = new Set([
  ...MUSCLE_GROUPS.map((group) => group.value),
  ...Object.keys(LEGACY_GROUP_ALIASES),
]);

export const VALID_MUSCLE_DETAILS = new Set(Object.keys(MUSCLE_DETAIL_LABELS));

export function normalizeMuscleGroups(values: string[]) {
  const normalized = values
    .flatMap((value) => LEGACY_GROUP_ALIASES[value] ?? [value])
    .filter((value, index, arr) => VALID_MUSCLE_GROUPS.has(value) && arr.indexOf(value) === index);
  return normalized.length > 0 ? normalized : ["full-body"];
}

export function getMuscleGroup(value: string | null | undefined) {
  const normalized = value ? (LEGACY_GROUP_ALIASES[value]?.[0] ?? value) : "full-body";
  return MUSCLE_GROUPS.find((group) => group.value === normalized) ?? MUSCLE_GROUPS.find((group) => group.value === "full-body")!;
}

export function getMuscleGroupLabel(value: string) {
  return getMuscleGroup(value).name;
}

export function getMuscleDetailLabel(value: string) {
  return MUSCLE_DETAIL_LABELS[value] ?? value;
}
