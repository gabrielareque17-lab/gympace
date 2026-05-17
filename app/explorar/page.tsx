import { AppShell } from '@/components/ui/layout/app-shell'
import { AthleteSearch } from '@/components/athletes/athlete-search'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { AthleteCardData } from '@/components/athletes/athlete-card'

export const dynamic = 'force-dynamic'

export default async function ExplorarPage() {
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, bio, avatar_id, avatar_type, level, rank')
    .not('username', 'is', null)
    .order('level', { ascending: false })
    .limit(24)

  const initialAthletes: AthleteCardData[] = (data ?? []) as AthleteCardData[]

  return (
    <AppShell>
      <div className="min-w-0 flex-1 p-6 sm:p-8 lg:p-10">
        <header className="mb-8">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/60">
            Comunidade
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Explorar</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#F5F5F5]/40">
            Descubra atletas, acompanhe perfis e inspire-se com a comunidade GymPace.
          </p>
        </header>

        <div className="max-w-4xl">
          <AthleteSearch initialAthletes={initialAthletes} />
        </div>
      </div>
    </AppShell>
  )
}
