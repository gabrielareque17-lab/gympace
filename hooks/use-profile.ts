'use client'

import { useProfileContext } from '@/components/providers/profile-provider'

export type { ProfileData } from '@/lib/profile'

export function useProfile() {
  return useProfileContext()
}
