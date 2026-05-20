'use client'

import { useState } from 'react'
import { Check, Loader2, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useProfileContext } from '@/components/providers/profile-provider'

interface EditProfileFormProps {
  initialDisplayName: string | null
  initialBio: string | null
  initialUsername: string | null
  fallbackName?: string
  fallbackBio?: string
}

export function EditProfileForm({
  initialDisplayName,
  initialBio,
  initialUsername,
  fallbackName = 'Atleta',
  fallbackBio,
}: EditProfileFormProps) {
  const { profile, updateProfile } = useProfileContext()
  const router = useRouter()

  // Live values: context is the source of truth after first edit
  const displayName = profile?.displayName ?? initialDisplayName
  const bio = profile?.bio ?? initialBio
  const username = profile?.username ?? initialUsername

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftBio, setDraftBio] = useState('')
  const [draftUsername, setDraftUsername] = useState('')

  function startEdit() {
    setDraftName(displayName ?? '')
    setDraftBio(bio ?? '')
    setDraftUsername(username ?? '')
    setError(null)
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
    setError(null)
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)

    const result = await updateProfile({
      displayName: draftName.trim() || null,
      bio: draftBio.trim() || null,
      username: draftUsername.trim() || null,
    })

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setIsEditing(false)
    router.refresh()
  }

  const shownName = displayName || fallbackName
  const shownBio = bio || fallbackBio

  if (!isEditing) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-2xl font-bold tracking-tight">{shownName}</h2>
          <button
            type="button"
            onClick={startEdit}
            className="mobile-tap grid size-6 place-items-center rounded-lg text-[#F5F5F5]/25 transition-transform duration-100 active:scale-[0.92] hover:bg-white/[0.06] hover:text-[#F5F5F5]/60"
            aria-label="Editar perfil"
          >
            <Pencil className="size-3.5" strokeWidth={2} />
          </button>
        </div>
        {username && (
          <p className="mt-0.5 text-xs font-medium text-[#F5F5F5]/30">@{username}</p>
        )}
        {shownBio && (
          <p className="mt-1.5 text-sm leading-relaxed text-[#F5F5F5]/45">{shownBio}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <input
        type="text"
        placeholder="Nome de exibição"
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        maxLength={50}
        autoFocus
        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-[#F5F5F5] placeholder-[#F5F5F5]/25 outline-none transition-colors focus:border-[#B6FF00]/40 focus:ring-1 focus:ring-[#B6FF00]/20"
      />

      <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 transition-colors focus-within:border-[#B6FF00]/40 focus-within:ring-1 focus-within:ring-[#B6FF00]/20">
        <span className="text-sm text-[#F5F5F5]/30">@</span>
        <input
          type="text"
          placeholder="username"
          value={draftUsername}
          onChange={(e) =>
            setDraftUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
          }
          maxLength={20}
          className="flex-1 bg-transparent text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/25 outline-none"
        />
      </div>

      <textarea
        placeholder="Bio — conte um pouco sobre você (máx. 200 caracteres)"
        value={draftBio}
        onChange={(e) => setDraftBio(e.target.value)}
        maxLength={200}
        rows={2}
        className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/25 outline-none transition-colors focus:border-[#B6FF00]/40 focus:ring-1 focus:ring-[#B6FF00]/20"
      />

      {error && <p className="text-xs font-medium text-red-400/80">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mobile-tap inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#B6FF00] px-3 text-xs font-bold text-[#080808] transition-transform duration-100 active:scale-[0.97] disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="size-3 animate-spin" strokeWidth={2.5} />
          ) : (
            <Check className="size-3" strokeWidth={3} />
          )}
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          disabled={isSaving}
          className="mobile-tap inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 text-xs font-medium text-[#F5F5F5]/50 transition-transform duration-100 active:scale-[0.97] hover:text-[#F5F5F5]/80 disabled:opacity-50"
        >
          <X className="size-3" strokeWidth={2} />
          Cancelar
        </button>
      </div>
    </div>
  )
}
