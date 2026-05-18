export type AvatarType = 'runner' | 'gym_rat' | 'hybrid_athlete' | 'power_athlete'
export type AvatarCategory = 'running' | 'gym' | 'hybrid'

export interface AvatarDefinition {
  id: string
  type: AvatarType
  category?: AvatarCategory
  label: string
  description: string
  accentColor: string
  glowColor: string
}

export const AVATAR_REGISTRY: AvatarDefinition[] = [
  // ── Legacy avatars (kept for backward compatibility) ──────────────────────
  {
    id: 'runner-v1',
    type: 'runner',
    label: 'Corredor',
    description: 'Velocidade e resistência',
    accentColor: '#B6FF00',
    glowColor: 'rgba(182,255,0,0.25)',
  },
  {
    id: 'gym-v1',
    type: 'gym_rat',
    label: 'Academia',
    description: 'Força e hipertrofia',
    accentColor: '#60A5FA',
    glowColor: 'rgba(96,165,250,0.25)',
  },
  {
    id: 'hybrid-v1',
    type: 'hybrid_athlete',
    label: 'Híbrido',
    description: 'Potência e mobilidade',
    accentColor: '#A78BFA',
    glowColor: 'rgba(167,139,250,0.25)',
  },
  {
    id: 'power-v1',
    type: 'power_athlete',
    label: 'Força',
    description: 'Explosão e potência',
    accentColor: '#FB923C',
    glowColor: 'rgba(251,146,60,0.25)',
  },

  // ── 🟢 Corrida ─────────────────────────────────────────────────────────────
  {
    id: 'runner-sprint',
    type: 'runner',
    category: 'running',
    label: 'Sprint',
    description: 'Explosão e velocidade',
    accentColor: '#B6FF00',
    glowColor: 'rgba(182,255,0,0.25)',
  },
  {
    id: 'runner-marathon',
    type: 'runner',
    category: 'running',
    label: 'Marathon',
    description: 'Ritmo e resistência',
    accentColor: '#A3E635',
    glowColor: 'rgba(163,230,53,0.25)',
  },
  {
    id: 'runner-trail',
    type: 'runner',
    category: 'running',
    label: 'Trail',
    description: 'Off-road e superação',
    accentColor: '#4ADE80',
    glowColor: 'rgba(74,222,128,0.25)',
  },
  {
    id: 'runner-night',
    type: 'runner',
    category: 'running',
    label: 'Night Runner',
    description: 'Treino nas sombras',
    accentColor: '#00FF88',
    glowColor: 'rgba(0,255,136,0.25)',
  },
  {
    id: 'runner-elite',
    type: 'runner',
    category: 'running',
    label: 'Elite Runner',
    description: 'Performance de elite',
    accentColor: '#86EFAC',
    glowColor: 'rgba(134,239,172,0.25)',
  },
  {
    id: 'runner-endurance',
    type: 'runner',
    category: 'running',
    label: 'Endurance',
    description: 'Volume e consistência',
    accentColor: '#22C55E',
    glowColor: 'rgba(34,197,94,0.25)',
  },
  {
    id: 'runner-speed',
    type: 'runner',
    category: 'running',
    label: 'Speed Runner',
    description: 'Ritmo e eficiência',
    accentColor: '#C4FF3D',
    glowColor: 'rgba(196,255,61,0.25)',
  },

  // ── 🔵 Academia ────────────────────────────────────────────────────────────
  {
    id: 'gym-bodybuilder',
    type: 'gym_rat',
    category: 'gym',
    label: 'Bodybuilder',
    description: 'Escultura e proporção',
    accentColor: '#60A5FA',
    glowColor: 'rgba(96,165,250,0.25)',
  },
  {
    id: 'gym-powerlifting',
    type: 'gym_rat',
    category: 'gym',
    label: 'Powerlifting',
    description: 'Força máxima bruta',
    accentColor: '#3B82F6',
    glowColor: 'rgba(59,130,246,0.25)',
  },
  {
    id: 'gym-calistenia',
    type: 'gym_rat',
    category: 'gym',
    label: 'Calistenia',
    description: 'Controle e habilidade',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56,189,248,0.25)',
  },
  {
    id: 'gym-strong',
    type: 'gym_rat',
    category: 'gym',
    label: 'Strong',
    description: 'Força e potência',
    accentColor: '#0EA5E9',
    glowColor: 'rgba(14,165,233,0.25)',
  },
  {
    id: 'gym-hypertrophy',
    type: 'gym_rat',
    category: 'gym',
    label: 'Hypertrophy',
    description: 'Volume e progressão',
    accentColor: '#93C5FD',
    glowColor: 'rgba(147,197,253,0.25)',
  },
  {
    id: 'gym-hardcore',
    type: 'gym_rat',
    category: 'gym',
    label: 'Hardcore',
    description: 'Intensidade máxima',
    accentColor: '#1D4ED8',
    glowColor: 'rgba(29,78,216,0.25)',
  },
  {
    id: 'gym-iron',
    type: 'gym_rat',
    category: 'gym',
    label: 'Iron Athlete',
    description: 'Dedicação de ferro',
    accentColor: '#7DD3FC',
    glowColor: 'rgba(125,211,252,0.25)',
  },

  // ── 🟣 Híbrido ─────────────────────────────────────────────────────────────
  {
    id: 'hybrid-functional',
    type: 'hybrid_athlete',
    category: 'hybrid',
    label: 'Functional',
    description: 'Movimento completo',
    accentColor: '#A78BFA',
    glowColor: 'rgba(167,139,250,0.25)',
  },
  {
    id: 'hybrid-cross',
    type: 'hybrid_athlete',
    category: 'hybrid',
    label: 'Cross Athlete',
    description: 'Alta intensidade',
    accentColor: '#8B5CF6',
    glowColor: 'rgba(139,92,246,0.25)',
  },
  {
    id: 'hybrid-mobility',
    type: 'hybrid_athlete',
    category: 'hybrid',
    label: 'Mobility',
    description: 'Flexibilidade e controle',
    accentColor: '#C084FC',
    glowColor: 'rgba(192,132,252,0.25)',
  },
  {
    id: 'hybrid-pro',
    type: 'hybrid_athlete',
    category: 'hybrid',
    label: 'Hybrid Pro',
    description: 'Força e resistência',
    accentColor: '#E879F9',
    glowColor: 'rgba(232,121,249,0.25)',
  },
  {
    id: 'hybrid-endurance',
    type: 'hybrid_athlete',
    category: 'hybrid',
    label: 'Endurance Hybrid',
    description: 'Potência aeróbica',
    accentColor: '#7C3AED',
    glowColor: 'rgba(124,58,237,0.25)',
  },
  {
    id: 'hybrid-tactical',
    type: 'hybrid_athlete',
    category: 'hybrid',
    label: 'Tactical',
    description: 'Físico e mente',
    accentColor: '#D946EF',
    glowColor: 'rgba(217,70,239,0.25)',
  },
  {
    id: 'hybrid-performance',
    type: 'hybrid_athlete',
    category: 'hybrid',
    label: 'Performance',
    description: 'Resultado e evolução',
    accentColor: '#F0ABFC',
    glowColor: 'rgba(240,171,252,0.25)',
  },
]

export const getAvatarById = (id: string): AvatarDefinition | undefined =>
  AVATAR_REGISTRY.find((a) => a.id === id)

export const getDefaultAvatar = (): AvatarDefinition => AVATAR_REGISTRY[0]
