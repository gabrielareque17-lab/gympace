import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart2,
  Calendar,
  Dumbbell,
  Flame,
  Layers,
  MapPin,
  Route,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AchievementCategory = "corrida" | "academia";

export interface AchievementStats {
  // Running
  totalRuns: number;
  totalKm: number;
  longestRun: number;
  currentStreak: number;
  bestPaceSeconds: number | null;
  // Gym (populated when gym logging is implemented)
  gymTotalSessions: number;
  gymChestSessions: number;
  gymLegSessions: number;
  gymStreak: number;
  gymHasPersonalRecord: boolean;
  hasPerfectWeek: boolean;
}

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: LucideIcon;
  accentHex: string;
  check: (stats: AchievementStats) => boolean;
}

// ─── Category metadata ────────────────────────────────────────────────────────

export const CATEGORIES: {
  key: AchievementCategory;
  label: string;
  color: string;
}[] = [
  { key: "corrida", label: "Corrida", color: "#B6FF00" },
  { key: "academia", label: "Academia", color: "#60A5FA" },
];

// ─── Achievement registry ─────────────────────────────────────────────────────

export const ACHIEVEMENT_REGISTRY: AchievementDefinition[] = [
  // ── Corrida ──────────────────────────────────────────────────────────────
  {
    id: "first-run",
    category: "corrida",
    name: "Primeiro Passo",
    description: "Complete a primeira corrida registrada",
    icon: Route,
    accentHex: "#B6FF00",
    check: (s) => s.totalRuns >= 1,
  },
  {
    id: "5k",
    category: "corrida",
    name: "Primeiro 5K",
    description: "Alcance 5km em uma única corrida",
    icon: MapPin,
    accentHex: "#B6FF00",
    check: (s) => s.longestRun >= 5,
  },
  {
    id: "10k",
    category: "corrida",
    name: "Primeiro 10K",
    description: "Alcance 10km em uma única corrida",
    icon: TrendingUp,
    accentHex: "#B6FF00",
    check: (s) => s.longestRun >= 10,
  },
  {
    id: "half-marathon",
    category: "corrida",
    name: "Primeiro 21K",
    description: "Complete a distância de meio maratona",
    icon: Award,
    accentHex: "#A78BFA",
    check: (s) => s.longestRun >= 21.1,
  },
  {
    id: "50km-total",
    category: "corrida",
    name: "50km Acumulados",
    description: "50km de corridas registradas no total",
    icon: Target,
    accentHex: "#60A5FA",
    check: (s) => s.totalKm >= 50,
  },
  {
    id: "100km-total",
    category: "corrida",
    name: "100km Acumulados",
    description: "100km de corridas registradas no total",
    icon: Trophy,
    accentHex: "#FB923C",
    check: (s) => s.totalKm >= 100,
  },
  {
    id: "sub5",
    category: "corrida",
    name: "Sub 5/km",
    description: "Alcance pace de 5:00/km ou melhor",
    icon: Zap,
    accentHex: "#B6FF00",
    check: (s) => s.bestPaceSeconds !== null && s.bestPaceSeconds <= 300,
  },
  {
    id: "run-streak",
    category: "corrida",
    name: "Sequência de Corrida",
    description: "7 dias consecutivos com corrida registrada",
    icon: Flame,
    accentHex: "#FB923C",
    check: (s) => s.currentStreak >= 7,
  },

  // ── Academia ──────────────────────────────────────────────────────────────
  {
    id: "first-gym",
    category: "academia",
    name: "Primeiro Treino",
    description: "Registre o primeiro treino de força",
    icon: Dumbbell,
    accentHex: "#60A5FA",
    check: (s) => s.gymTotalSessions >= 1,
  },
  {
    id: "first-chest",
    category: "academia",
    name: "Treino de Peito",
    description: "Complete o primeiro treino de peito",
    icon: Shield,
    accentHex: "#60A5FA",
    check: (s) => s.gymChestSessions >= 1,
  },
  {
    id: "first-legs",
    category: "academia",
    name: "Dia de Perna",
    description: "Complete o primeiro treino de pernas",
    icon: Layers,
    accentHex: "#A78BFA",
    check: (s) => s.gymLegSessions >= 1,
  },
  {
    id: "7-active",
    category: "academia",
    name: "7 Dias Ativos",
    description: "Registre treinos em 7 dias diferentes",
    icon: Calendar,
    accentHex: "#60A5FA",
    check: (s) => s.gymTotalSessions >= 7,
  },
  {
    id: "30-sessions",
    category: "academia",
    name: "30 Treinos",
    description: "Complete 30 sessões de musculação",
    icon: Trophy,
    accentHex: "#FB923C",
    check: (s) => s.gymTotalSessions >= 30,
  },
  {
    id: "gym-streak",
    category: "academia",
    name: "Sequência de Academia",
    description: "Treine na academia por 7 dias seguidos",
    icon: Flame,
    accentHex: "#FB923C",
    check: (s) => s.gymStreak >= 7,
  },
  {
    id: "personal-record",
    category: "academia",
    name: "Recorde Pessoal",
    description: "Supere sua carga máxima em um exercício",
    icon: BarChart2,
    accentHex: "#A78BFA",
    check: (s) => s.gymHasPersonalRecord,
  },
  {
    id: "perfect-week",
    category: "academia",
    name: "Semana Perfeita",
    description: "Treine 5 ou mais dias em uma única semana",
    icon: Star,
    accentHex: "#A78BFA",
    check: (s) => s.hasPerfectWeek,
  },
];
