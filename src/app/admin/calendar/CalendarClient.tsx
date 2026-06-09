'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarBooking {
  id: string
  queueNumber: string
  timeSlot: string
  customerName: string
  serviceName: string
  barberName: string
  source: string
  status: string
}

interface CalendarDay {
  date: string
  count: number
  bookings: CalendarBooking[]
}

interface CalendarClientProps {
  year: number
  month: number
  days: CalendarDay[]
  today: string
}

const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const TH_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const STATUS_COLOR: Record<string, string> = {
  pending_arrival: 'bg-blue-500',
  in_progress: 'bg-green-500',
  done: 'bg-slate-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-amber-500',
}

function buildCalendarGrid(year: number, month: number, dayDataMap: Map<string, CalendarDay>) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const cells: (CalendarDay & { isCurrentMonth: boolean; dateObj: Date } | null)[] = []

  for (let i = 0; i < firstDay.getDay(); i++) {
    cells.push(null)
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const data = dayDataMap.get(dateStr) ?? { date: dateStr, count: 0, bookings: [] }
    cells.push({ ...data, isCurrentMonth: true, dateObj: new Date(year, month - 1, d) })
  }

  return cells
}

export function CalendarClient({ year, month, days, today }: CalendarClientProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const dayDataMap = new Map(days.map((d) => [d.date, d]))

  const cells = buildCalendarGrid(year, month, dayDataMap)
  const selectedDay = selectedDate ? dayDataMap.get(selectedDate) : null

  function navigate(delta: number) {
    let newMonth = month + delta
    let newYear = year
    if (newMonth > 12) { newMonth = 1; newYear++ }
    if (newMonth < 1) { newMonth = 12; newYear-- }
    router.push(`/admin/calendar?month=${newYear}-${String(newMonth).padStart(2, '0')}`)
  }

  function handleDayClick(dateStr: string) {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr))
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1)

  return (
    <div className="min-h-full bg-slate-950 p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">ปฏิทิน</h1>
          <p className="text-xs text-slate-400">{TH_MONTHS[month - 1]} {year + 543}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push(`/admin/calendar`)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            วันนี้
          </button>
          <button
            onClick={() => navigate(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-800">
          {TH_DAYS_SHORT.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-slate-500">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            if (!cell) {
              return <div key={`empty-${i}`} className="aspect-square border-b border-r border-slate-800/50" />
            }
            const isToday = cell.date === today
            const isSelected = cell.date === selectedDate
            const intensity = cell.count > 0 ? Math.max(0.15, Math.min(1, cell.count / maxCount)) : 0

            return (
              <button
                key={cell.date}
                onClick={() => handleDayClick(cell.date)}
                className={cn(
                  'group relative aspect-square border-b border-r border-slate-800/50 p-1.5 text-left transition-all hover:bg-slate-800/50',
                  isSelected && 'bg-slate-800',
                  isToday && 'ring-1 ring-inset ring-blue-500/50'
                )}
              >
                <span className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  isToday ? 'bg-blue-500 text-white' : 'text-slate-300'
                )}>
                  {cell.dateObj.getDate()}
                </span>

                {cell.count > 0 && (
                  <>
                    <div
                      className="mt-1 h-1 rounded-full bg-green-500"
                      style={{ opacity: intensity, width: `${Math.min(100, cell.count * 20)}%` }}
                    />
                    <span className="absolute bottom-1 right-1.5 text-[10px] text-slate-500 group-hover:text-slate-400">
                      {cell.count}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail */}
      {selectedDay && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-800 px-4 py-3">
            <p className="text-sm font-medium text-white">
              {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('th-TH', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
            <p className="text-xs text-slate-400">{selectedDay.count} การจอง</p>
          </div>

          {selectedDay.bookings.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">ไม่มีการจอง</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {selectedDay.bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={cn('h-2 w-2 rounded-full flex-shrink-0', STATUS_COLOR[b.status] ?? 'bg-slate-500')} />
                  <span className="font-mono text-sm font-bold text-slate-300 w-12">{b.queueNumber}</span>
                  <span className="text-xs text-slate-400 w-10">{b.timeSlot}</span>
                  <span className="flex-1 truncate text-xs text-slate-300">{b.customerName}</span>
                  <span className="text-xs text-slate-500 hidden sm:block">{b.serviceName}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Scissors className="h-3 w-3" />
                    {b.barberName}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
