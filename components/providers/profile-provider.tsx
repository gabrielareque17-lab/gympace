'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { ProfileData, ProfilePatch } from '@/lib/profile'

interface ProfileContextValue {
  profile: ProfileData | null
  isLoading: boolean
  updateProfile: (patch: ProfilePatch) => Promise<{ error?: string }>
  refetch: () => void
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  isLoading: true,
  updateProfile: async () => ({}),
  refetch: () => {},
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchKey, setFetchKey] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    fetch('/api/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileData | null) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false))
  }, [fetchKey])

  const updateProfile = useCallback(async (patch: ProfilePatch): Promise<{ error?: string }> => {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { error: (data as { error?: string }).error ?? 'Erro ao salvar.' }
    }

    setProfile((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        ...(patch.displayName !== undefined && { displayName: patch.displayName }),
        ...(patch.bio !== undefined && { bio: patch.bio }),
        ...(patch.username !== undefined && { username: patch.username }),
        ...(patch.avatarId !== undefined && { avatarId: patch.avatarId }),
        ...(patch.avatarType !== undefined && { avatarType: patch.avatarType as ProfileData['avatarType'] }),
      }
    })

    return {}
  }, [])

  const refetch = useCallback(() => setFetchKey((k) => k + 1), [])

  return (
    <ProfileContext.Provider value={{ profile, isLoading, updateProfile, refetch }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfileContext() {
  return useContext(ProfileContext)
}
