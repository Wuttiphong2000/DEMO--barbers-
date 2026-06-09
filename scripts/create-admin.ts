import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function createAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'owner@barbershop.local',
    password: 'password123',
    email_confirm: true,
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log('Admin user already exists')
    } else {
      console.error('Error:', error.message)
      process.exit(1)
    }
  } else {
    console.log('Created admin user:', data.user?.email)
  }

  console.log('')
  console.log('Login at: http://localhost:3000/login')
  console.log('Email:    owner@barbershop.local')
  console.log('Password: password123')
}

createAdmin()
