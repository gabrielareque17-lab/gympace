export type AvatarType = 'runner' | 'gym_rat' | 'hybrid_athlete' | 'power_athlete'
export type AvatarCategory = 'running' | 'gym' | 'hybrid' | 'premium'
export type AvatarRarity = 'core' | 'rare' | 'epic' | 'legendary' | 'seasonal'
export type AvatarUnlockKind = 'free' | 'level' | 'season' | 'trophy' | 'achievement' | 'admin'

export interface AvatarUnlockRule {
  kind: AvatarUnlockKind
  level?: number
  seasonKey?: string
  trophyId?: string
  achievementId?: string
  label: string
}

export interface AvatarDefinition {
  id: string
  type: AvatarType
  category: AvatarCategory
  label: string
  description: string
  accentColor: string
  secondaryColor: string
  glowColor: string
  rarity: AvatarRarity
  unlock: AvatarUnlockRule
}

const running = {
  type: 'runner' as const,
  category: 'running' as const,
  secondaryColor: '#39FF88',
  rarity: 'core' as const,
  unlock: { kind: 'free' as const, label: 'Livre' },
}

const gym = {
  type: 'gym_rat' as const,
  category: 'gym' as const,
  secondaryColor: '#F0ABFC',
  rarity: 'core' as const,
  unlock: { kind: 'free' as const, label: 'Livre' },
}

const hybrid = {
  type: 'hybrid_athlete' as const,
  category: 'hybrid' as const,
  secondaryColor: '#A78BFA',
  rarity: 'rare' as const,
  unlock: { kind: 'free' as const, label: 'Livre' },
}

export const AVATAR_REGISTRY: AvatarDefinition[] = [
  {
    id: 'neon-runner-velocity',
    ...running,
    label: 'Velocity',
    description: 'Visor de sprint',
    accentColor: '#B6FF00',
    glowColor: 'rgba(182,255,0,0.34)',
  },
  {
    id: 'neon-runner-aero',
    ...running,
    label: 'Aero',
    description: 'Ritmo limpo',
    accentColor: '#A3FF12',
    glowColor: 'rgba(163,255,18,0.32)',
  },
  {
    id: 'neon-runner-pulse',
    ...running,
    label: 'Pulse',
    description: 'Energia urbana',
    accentColor: '#7CFF3A',
    glowColor: 'rgba(124,255,58,0.32)',
  },
  {
    id: 'neon-runner-ghost',
    ...running,
    label: 'Ghost',
    description: 'Night run',
    accentColor: '#00FF88',
    glowColor: 'rgba(0,255,136,0.30)',
  },
  {
    id: 'neon-runner-stride',
    ...running,
    label: 'Stride',
    description: 'Tecnica e cadencia',
    accentColor: '#C4FF3D',
    glowColor: 'rgba(196,255,61,0.30)',
  },
  {
    id: 'neon-runner-orbit',
    ...running,
    label: 'Orbit',
    description: 'Foco constante',
    accentColor: '#4ADE80',
    glowColor: 'rgba(74,222,128,0.30)',
  },
  {
    id: 'neon-runner-prime',
    ...running,
    label: 'Prime',
    description: 'Performance alta',
    accentColor: '#D9FF5C',
    glowColor: 'rgba(217,255,92,0.32)',
  },
  {
    id: 'neon-runner-vesta',
    ...running,
    label: 'Vesta',
    description: 'Sprint feminino',
    accentColor: '#B6FF00',
    secondaryColor: '#86EFAC',
    glowColor: 'rgba(182,255,0,0.34)',
  },
  {
    id: 'neon-runner-luma',
    ...running,
    label: 'Luma',
    description: 'Pace elegante',
    accentColor: '#84FF5F',
    secondaryColor: '#22D3EE',
    glowColor: 'rgba(132,255,95,0.30)',
  },

  {
    id: 'neon-lifter-iron',
    ...gym,
    label: 'Iron',
    description: 'Forca bruta',
    accentColor: '#A855F7',
    glowColor: 'rgba(168,85,247,0.34)',
  },
  {
    id: 'neon-lifter-titan',
    ...gym,
    label: 'Titan',
    description: 'Carga maxima',
    accentColor: '#C084FC',
    glowColor: 'rgba(192,132,252,0.32)',
  },
  {
    id: 'neon-lifter-volt',
    ...gym,
    label: 'Volt',
    description: 'Intensidade',
    accentColor: '#D946EF',
    glowColor: 'rgba(217,70,239,0.30)',
  },
  {
    id: 'neon-lifter-forge',
    ...gym,
    label: 'Forge',
    description: 'Disciplina pesada',
    accentColor: '#8B5CF6',
    glowColor: 'rgba(139,92,246,0.32)',
  },
  {
    id: 'neon-lifter-arc',
    ...gym,
    label: 'Arc',
    description: 'Controle total',
    accentColor: '#E879F9',
    glowColor: 'rgba(232,121,249,0.30)',
  },
  {
    id: 'neon-lifter-crown',
    ...gym,
    label: 'Crown',
    description: 'Presenca forte',
    accentColor: '#9333EA',
    glowColor: 'rgba(147,51,234,0.34)',
  },
  {
    id: 'neon-lifter-core',
    ...gym,
    label: 'Core',
    description: 'Potencia limpa',
    accentColor: '#F0ABFC',
    glowColor: 'rgba(240,171,252,0.28)',
  },
  {
    id: 'neon-lifter-athena',
    ...gym,
    label: 'Athena',
    description: 'Forca premium',
    accentColor: '#C084FC',
    secondaryColor: '#F0ABFC',
    glowColor: 'rgba(192,132,252,0.34)',
  },
  {
    id: 'neon-lifter-nova',
    ...gym,
    label: 'Nova',
    description: 'Intensidade limpa',
    accentColor: '#E879F9',
    secondaryColor: '#A855F7',
    glowColor: 'rgba(232,121,249,0.30)',
  },

  {
    id: 'neon-hybrid-apex',
    ...hybrid,
    label: 'Apex',
    description: 'Forca + pace',
    accentColor: '#B6FF00',
    secondaryColor: '#A78BFA',
    glowColor: 'rgba(182,255,0,0.24)',
  },
  {
    id: 'neon-hybrid-fusion',
    ...hybrid,
    label: 'Fusion',
    description: 'Raro e versatil',
    accentColor: '#A78BFA',
    secondaryColor: '#B6FF00',
    glowColor: 'rgba(167,139,250,0.30)',
  },
  {
    id: 'neon-hybrid-zenith',
    ...hybrid,
    label: 'Zenith',
    description: 'Dupla performance',
    accentColor: '#D946EF',
    secondaryColor: '#7CFF3A',
    glowColor: 'rgba(217,70,239,0.28)',
  },
  {
    id: 'neon-hybrid-rogue',
    ...hybrid,
    label: 'Rogue',
    description: 'Alta intensidade',
    accentColor: '#22D3EE',
    secondaryColor: '#B6FF00',
    glowColor: 'rgba(34,211,238,0.25)',
  },
  {
    id: 'neon-hybrid-vector',
    ...hybrid,
    label: 'Vector',
    description: 'Movimento preciso',
    accentColor: '#C084FC',
    secondaryColor: '#39FF88',
    glowColor: 'rgba(192,132,252,0.28)',
  },
  {
    id: 'neon-hybrid-matrix',
    ...hybrid,
    label: 'Matrix',
    description: 'Status hibrido',
    accentColor: '#B6FF00',
    secondaryColor: '#F0ABFC',
    glowColor: 'rgba(182,255,0,0.26)',
  },
  {
    id: 'neon-hybrid-phantom',
    ...hybrid,
    label: 'Phantom',
    description: 'Endurance forte',
    accentColor: '#7C3AED',
    secondaryColor: '#B6FF00',
    glowColor: 'rgba(124,58,237,0.30)',
  },
  {
    id: 'neon-hybrid-iris',
    ...hybrid,
    label: 'Iris',
    description: 'Foco hibrido',
    accentColor: '#B6FF00',
    secondaryColor: '#D946EF',
    glowColor: 'rgba(182,255,0,0.28)',
  },
  {
    id: 'neon-hybrid-sable',
    ...hybrid,
    label: 'Sable',
    description: 'Rara e forte',
    accentColor: '#A78BFA',
    secondaryColor: '#39FF88',
    glowColor: 'rgba(167,139,250,0.31)',
  },

  {
    id: 'season-gold-champion',
    type: 'power_athlete',
    category: 'premium',
    label: 'Champion',
    description: 'Temporada Elite',
    accentColor: '#FACC15',
    secondaryColor: '#FFF4A3',
    glowColor: 'rgba(250,204,21,0.34)',
    rarity: 'legendary',
    unlock: { kind: 'season', seasonKey: 'elite-01', label: 'Temporada' },
  },
  {
    id: 'season-gold-immortal',
    type: 'power_athlete',
    category: 'premium',
    label: 'Immortal',
    description: 'Troféu exclusivo',
    accentColor: '#EAB308',
    secondaryColor: '#B6FF00',
    glowColor: 'rgba(234,179,8,0.34)',
    rarity: 'legendary',
    unlock: { kind: 'trophy', trophyId: 'exclusive-season', label: 'Troféu' },
  },
  {
    id: 'season-gold-admin',
    type: 'power_athlete',
    category: 'premium',
    label: 'Founder',
    description: 'Admin drop',
    accentColor: '#F59E0B',
    secondaryColor: '#FDE68A',
    glowColor: 'rgba(245,158,11,0.34)',
    rarity: 'seasonal',
    unlock: { kind: 'admin', label: 'Admin' },
  },
  {
    id: 'season-gold-valkyrie',
    type: 'power_athlete',
    category: 'premium',
    label: 'Valkyrie',
    description: 'Elite feminina',
    accentColor: '#FACC15',
    secondaryColor: '#F0ABFC',
    glowColor: 'rgba(250,204,21,0.36)',
    rarity: 'seasonal',
    unlock: { kind: 'season', seasonKey: 'elite-02', label: 'Temporada' },
  },
]

const LEGACY_AVATAR_MAP: Record<string, string> = {
  'runner-v1': 'neon-runner-velocity',
  'gym-v1': 'neon-lifter-iron',
  'hybrid-v1': 'neon-hybrid-apex',
  'power-v1': 'neon-lifter-titan',
  'runner-sprint': 'neon-runner-velocity',
  'runner-marathon': 'neon-runner-aero',
  'runner-trail': 'neon-runner-orbit',
  'runner-night': 'neon-runner-ghost',
  'runner-elite': 'neon-runner-prime',
  'runner-endurance': 'neon-runner-stride',
  'runner-speed': 'neon-runner-pulse',
  'gym-bodybuilder': 'neon-lifter-iron',
  'gym-powerlifting': 'neon-lifter-titan',
  'gym-calistenia': 'neon-lifter-core',
  'gym-strong': 'neon-lifter-forge',
  'gym-hypertrophy': 'neon-lifter-volt',
  'gym-hardcore': 'neon-lifter-crown',
  'gym-iron': 'neon-lifter-arc',
  'hybrid-functional': 'neon-hybrid-apex',
  'hybrid-cross': 'neon-hybrid-fusion',
  'hybrid-mobility': 'neon-hybrid-vector',
  'hybrid-pro': 'neon-hybrid-zenith',
  'hybrid-endurance': 'neon-hybrid-phantom',
  'hybrid-tactical': 'neon-hybrid-rogue',
  'hybrid-performance': 'neon-hybrid-matrix',
}

export const SELECTABLE_AVATARS = AVATAR_REGISTRY

export function resolveAvatarId(id: string | null | undefined): string {
  if (!id) return getDefaultAvatar().id
  return LEGACY_AVATAR_MAP[id] ?? id
}

export const getAvatarById = (id: string | null | undefined): AvatarDefinition | undefined =>
  AVATAR_REGISTRY.find((a) => a.id === resolveAvatarId(id))

export const getDefaultAvatar = (): AvatarDefinition => AVATAR_REGISTRY[0]

export function isAvatarUnlocked(
  avatar: AvatarDefinition,
  context: { level?: number | null; isAdmin?: boolean | null; unlockedAvatarIds?: string[] } = {}
): boolean {
  if (avatar.unlock.kind === 'free') return true
  if (context.isAdmin) return true
  if (context.unlockedAvatarIds?.includes(avatar.id)) return true
  if (avatar.unlock.kind === 'level') return (context.level ?? 0) >= (avatar.unlock.level ?? Infinity)
  return false
}
