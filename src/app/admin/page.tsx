import { createSupabaseServerClient } from '@/lib/db/supabase-server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      <p className="text-slate-400 mt-1">Phase 1 complete — Phase 5 ต่อไป</p>
    </div>
  )
}
