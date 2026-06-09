'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scissors } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } else {
      router.push('/admin')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-stone-900 border-stone-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 p-3 rounded-full bg-amber-500/10 ring-1 ring-amber-500/20 w-fit">
            <Scissors className="w-6 h-6 text-amber-400" />
          </div>
          <CardTitle className="text-stone-50 text-xl">เข้าสู่ระบบ</CardTitle>
          <p className="text-stone-400 text-sm">Classic Cut Barbershop</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-stone-300">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-stone-800 border-stone-700 text-stone-50 placeholder:text-stone-500 focus-visible:ring-amber-500"
                placeholder="owner@barbershop.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-stone-300">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-stone-800 border-stone-700 text-stone-50 focus-visible:ring-amber-500"
                required
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
