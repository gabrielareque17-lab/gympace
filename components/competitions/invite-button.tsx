'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'

import { InviteModal } from './invite-modal'

interface InviteButtonProps {
  competitionId: string
}

export function InviteButton({ competitionId }: InviteButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 text-sm font-semibold text-[#F5F5F5]/60 transition-all duration-200 hover:border-[#B6FF00]/25 hover:bg-[#B6FF00]/[0.06] hover:text-[#B6FF00]/80 hover:shadow-[0_0_18px_rgba(182,255,0,0.06)]"
      >
        <UserPlus className="size-3.5" strokeWidth={2} />
        Convidar
      </button>

      {open && (
        <InviteModal
          competitionId={competitionId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
