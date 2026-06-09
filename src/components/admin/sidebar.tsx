'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/db/supabase'
import { Scissors, LayoutDashboard, Wrench, Users, Clock, Settings, LogOut, QrCode, CalendarDays, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/calendar', label: 'ปฏิทิน', icon: CalendarDays },
  { href: '/admin/customers', label: 'ลูกค้า', icon: UserRound },
  { href: '/admin/services', label: 'บริการ', icon: Wrench },
  { href: '/admin/barbers', label: 'ช่าง', icon: Users },
  { href: '/admin/hours', label: 'เวลาร้าน', icon: Clock },
  { href: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
  { href: '/admin/qr', label: 'QR Code', icon: QrCode },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
          <Scissors className="h-4 w-4 text-green-400" />
        </div>
        <span className="font-semibold text-white text-sm">Admin Panel</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-slate-800 text-green-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
