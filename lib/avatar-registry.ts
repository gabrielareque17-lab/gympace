export type AvatarType = 'runner' | 'gym_rat' | 'hybrid_athlete' | 'power_athlete'

export interface AvatarDefinition {
  id: string
  type: AvatarType
  label: string
  description: string
  accentColor: string
  glowColor: string
}

export const AVATAR_REGISTRY: AvatarDefinition[] = [
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
]

export const getAvatarById = (id: string): AvatarDefinition | undefined =>
  AVATAR_REGISTRY.find((a) => a.id === id)

export const getDefaultAvatar = (): AvatarDefinition => AVATAR_REGISTRY[0]
