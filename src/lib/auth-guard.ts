import { createSupabaseServerClient } from '@/lib/db/supabase-server'

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
