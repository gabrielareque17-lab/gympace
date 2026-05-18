'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { AVATAR_REGISTRY, type AvatarCategory, type AvatarType } from '@/lib/avatar-registry'
import { useProfileContext } from '@/components/providers/profile-provider'
import { AvatarCard } from './avatar-card'

interface AvatarSelectorProps {
  initialAvatarId: string | null
}

const CATEGORY_DEFS: Array<{ id: AvatarCategory; label: string; accentColor: string }> = [
  { id: 'running', label: 'Corrida',  accentColor: '#B6FF00' },
  { id: 'gym',     label: 'Academia', accentColor: '#60A5FA' },
  { id: 'hybrid',  label: 'Híbrido',  accentColor: '#A78BFA' },
]

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
    <div className="space-y-6">
      {CATEGORY_DEFS.map((cat) => {
        const avatars = AVATAR_REGISTRY.filter((a) => a.category === cat.id)
        return (
          <div key={cat.id} className="space-y-3">
            {/* Category header */}
            <div className="flex items-center gap-2.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: cat.accentColor,
                  boxShadow: `0 0 6px ${cat.accentColor}`,
                }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: cat.accentColor }}
              >
                {cat.label}
              </span>
              <div
                className="h-px flex-1"
                style={{ background: `${cat.accentColor}18` }}
              />
              <span className="text-[10px] text-white/20">{avatars.length}</span>
            </div>

            {/* Avatar grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
              {avatars.map((def) => (
                <AvatarCard
                  key={def.id}
                  definition={def}
                  isSelected={selectedId === def.id}
                  onSelect={handleSelect}
                  isLoading={isSaving}
                />
              ))}
            </div>
          </div>
        )
      })}

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
