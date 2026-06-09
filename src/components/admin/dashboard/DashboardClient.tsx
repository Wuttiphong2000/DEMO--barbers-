'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/db/supabase'
import { StatsCards } from './StatsCards'
import { QueueCard } from './QueueCard'
import { WalkInModal } from './WalkInModal'
import type { DashboardBooking, DashboardStats, ServiceOption, BarberOption } from './types'

interface DashboardClientProps {
  bookings: DashboardBooking[]
  stats: DashboardStats
  services: ServiceOption[]
  barbers: BarberOption[]
  dateLabel: string
}

export function DashboardClient({
  bookings,
  stats,
  services,
  barbers,
  dateLabel,
}: DashboardClientProps) {
  const router = useRouter()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Supabase Realtime — requires Realtime enabled on "bookings" table in Supabase dashboard
  // (Database → Replication → Supabase Realtime → toggle on for bookings table)
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        router.refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [router])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    router.refresh()
    // Give the server component time to re-render
    setTimeout(() => setRefreshing(false), 800)
  }, [router])

  async function handleAction(id: string, action: 'start' | 'done' | 'cancel' | 'no_show') {
    const statusMap = { start: 'in_progress', done: 'done', cancel: 'cancelled', no_show: 'no_show' } as const
    setActionLoading(id)

    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusMap[action] }),
    })

    setActionLoading(null)
    if (res.ok) refresh()
  }

  const inProgress = bookings.filter((b) => b.status === 'in_progress')
  const pending = bookings.filter((b) => b.status === 'pending_arrival')
  const done = bookings.filter((b) => b.status === 'done')

  return (
    <div className="min-h-full bg-slate-950 p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">คิววันนี้</h1>
          <p className="text-xs text-slate-400">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowWalkIn(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Walk-in
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Queue sections */}
      {inProgress.length === 0 && pending.length === 0 && done.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 py-16 text-center">
          <p className="text-slate-400 text-sm">ยังไม่มีการจองวันนี้</p>
          <p className="text-slate-600 text-xs mt-1">กด + Walk-in เพื่อเพิ่มคิว</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inProgress.length > 0 && (
            <QueueSection
              title="กำลังให้บริการ"
              titleColor="text-green-400"
              indicator="bg-green-500"
              bookings={inProgress}
              actionLoading={actionLoading}
              onAction={handleAction}
            />
          )}
          {pending.length > 0 && (
            <QueueSection
              title="รอคิว"
              titleColor="text-blue-400"
              indicator="bg-blue-500"
              bookings={pending}
              actionLoading={actionLoading}
              onAction={handleAction}
            />
          )}
          {done.length > 0 && (
            <QueueSection
              title={`เสร็จแล้ว (${done.length})`}
              titleColor="text-slate-500"
              indicator="bg-slate-600"
              bookings={done}
              actionLoading={actionLoading}
              onAction={handleAction}
              collapsible
            />
          )}
        </div>
      )}

      {showWalkIn && (
        <WalkInModal
          services={services}
          barbers={barbers}
          onClose={() => setShowWalkIn(false)}
          onSuccess={() => {
            setShowWalkIn(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}

interface QueueSectionProps {
  title: string
  titleColor: string
  indicator: string
  bookings: DashboardBooking[]
  actionLoading: string | null
  onAction: (id: string, action: 'start' | 'done' | 'cancel' | 'no_show') => void
  collapsible?: boolean
}

function QueueSection({
  title,
  titleColor,
  indicator,
  bookings,
  actionLoading,
  onAction,
  collapsible,
}: QueueSectionProps) {
  const [collapsed, setCollapsed] = useState(collapsible ?? false)

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => collapsible && setCollapsed((c) => !c)}
        className={`flex w-full items-center gap-2 px-4 py-3 ${collapsible ? 'cursor-pointer hover:bg-slate-800/50' : 'cursor-default'}`}
      >
        <span className={`h-2 w-2 rounded-full ${indicator}`} />
        <span className={`text-sm font-medium ${titleColor}`}>{title}</span>
        {collapsible && (
          <span className="ml-auto text-xs text-slate-500">{collapsed ? '▶' : '▼'}</span>
        )}
      </button>
      {!collapsed && (
        <div className="divide-y divide-slate-800/50 px-4 pb-3 space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="pt-2">
              <QueueCard
                booking={b}
                actionLoading={actionLoading === b.id}
                onAction={onAction}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
