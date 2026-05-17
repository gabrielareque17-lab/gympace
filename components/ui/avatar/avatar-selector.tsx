'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { AVATAR_REGISTRY, type AvatarType } from '@/lib/avatar-registry'
import { useProfileContext } from '@/components/providers/profile-provider'
import { AvatarCard } from './avatar-card'

interface AvatarSelectorProps {
  initialAvatarId: string | null
}

export function AvatarSelector({ initialAvatarId }: AvatarSelectorProps) {
  const { updateProfile } = useProfileContext()
  const router = useRouter()

  const [selectedId, setSelectedId] = useState<string | null>(initialAvatarId)
  const [selectedType, setSelectedType] = useState<AvatarType | null>(null)
  const [savedId, setSavedId] = useState<string | null>(initialAvatarId)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const def = AVATAR_REGISTRY.find((a) => a.id === initialAvatarId)
    if (def) setSelectedType(def.type)
  }, [initialAvatarId])

  function handleSelect(id: string, type: AvatarType) {
    setSelectedId(id)
    setSelectedType(type)
    setError(null)
  }

  async function handleSave() {
    if (!selectedId || !selectedType) return
    setIsSaving(true)
    setError(null)

    const result = await updateProfile({ avatarId: selectedId, avatarType: selectedType })

    if (result.error) {
      setError(result.error)
      setIsSaving(false)
      return
    }

    setSavedId(selectedId)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 1500)
    setIsSaving(false)
    router.refresh()
  }

  const isDirty = selectedId !== savedId

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {AVATAR_REGISTRY.map((def) => (
          <AvatarCard
            key={def.id}
            definition={def}
            isSelected={selectedId === def.id}
            onSelect={handleSelect}
            isLoading={isSaving}
          />
        ))}
      </div>

      {error && <p className="text-xs font-medium text-red-400/80">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || isSaving || !selectedId}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(182,255,0,0.15)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_28px_rgba(182,255,0,0.25)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
      >
        {isSaving && <Loader2 className="size-4 animate-spin" />}
        {isSaving ? 'Salvando...' : showSaved ? 'Avatar salvo!' : 'Salvar avatar'}
      </button>
    </div>
  )
}
