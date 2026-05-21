import type { AvatarType } from './avatar-registry'
import type { XPLevelMilestone } from './xp'

export interface ProfileData {
  userId: string
  username: string | null
  displayName: string | null
  bio: string | null
  avatarId: string | null
  avatarType: AvatarType | null
  level: number
  currentLevel: number
  totalXp: number
  xpIntoLevel: number
  xpForNextLevel: number | null
  xpRemainingForNextLevel: number
  currentLevelXp: number
  nextLevelXp: number | null
  nextLevels: XPLevelMilestone[]
  levelProgress: number
  rank: string
  isAdmin: boolean
  unlockedAvatarIds: string[]
  timezone: string
  createdAt: string | null
}

export interface ProfilePatch {
  displayName?: string | null
  bio?: string | null
  username?: string | null
  avatarId?: string
  avatarType?: string
  timezone?: string
}
