'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, TrendingUp } from 'lucide-react'

interface Props {
  competitionId: string
  currentProgress: number
  unit: string
  color: string
}

export function ProgressUpdater({ competitionId, currentProgress, unit, color }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(String(currentProgress))
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(false)

  async function handleSave() {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return
    setIsSaving(true)
    setError(false)
    try {
      const res = await fetch(`/api/competitions/${competitionId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: num }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        router.refresh()
      } else {
        setError(true)
        setTimeout(() => setError(false), 2500)
      }
    } catch {
      setError(true)
      setTimeout(() => setError(false), 2500)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-white/[0.05] pt-3">
      <input
        type="number"
        min={0}
        step={0.1}
        value={value}
        onChange={e => { setValue(e.target.value); setSaved(false); setError(false) }}
        className="w-24 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 text-sm font-semibold text-[#F5F5F5] outline-none focus:border-white/[0.22] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-xs text-[#F5F5F5]/35">{unit}</span>
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50"
        style={
          error
            ? { background: 'rgba(239,68,68,0.15)', color: 'rgba(252,165,165,0.9)' }
            : saved
            ? { background: 'rgba(34,197,94,0.15)', color: 'rgba(134,239,172,0.9)' }
            : { background: color, color: '#080808' }
        }
      >
        {isSaving ? (
          <Loader2 className="size-3 animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="size-3" strokeWidth={2.5} />
        ) : (
          <TrendingUp className="size-3" strokeWidth={2.5} />
        )}
        {isSaving ? 'Salvando...' : saved ? 'Salvo!' : error ? 'Erro' : 'Atualizar'}
      </button>
    </div>
  )
}
