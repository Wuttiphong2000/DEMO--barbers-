'use client'

import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, Smartphone, Footprints } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomerBooking {
  id: string
  queueNumber: string
  date: string
  timeSlot: string
  serviceName: string
  servicePrice: number
  status: string
  source: string
}

interface Customer {
  id: string
  name: string
  lineUserId: string
  isLine: boolean
  bookingCount: number
  totalSpent: number
  lastVisit: string | null
  createdAt: string
  recentBookings: CustomerBooking[]
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending_arrival: { label: 'รอ', cls: 'text-blue-400 bg-blue-950' },
  in_progress: { label: 'กำลังทำ', cls: 'text-green-400 bg-green-950' },
  done: { label: 'เสร็จ', cls: 'text-slate-400 bg-slate-800' },
  cancelled: { label: 'ยกเลิก', cls: 'text-red-400 bg-red-950' },
  no_show: { label: 'ไม่มา', cls: 'text-amber-400 bg-amber-950' },
}

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-full bg-slate-950 p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">ลูกค้า</h1>
          <p className="text-xs text-slate-400">{customers.length} คนทั้งหมด</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อลูกค้า..."
          className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Customer list */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden divide-y divide-slate-800">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">ไม่พบลูกค้า</div>
        ) : (
          filtered.map((c) => (
            <CustomerRow
              key={c.id}
              customer={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId((id) => (id === c.id ? null : c.id))}
            />
          ))
        )}
      </div>
    </div>
  )
}

function CustomerRow({
  customer: c,
  expanded,
  onToggle,
}: {
  customer: Customer
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/50 transition-colors"
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-slate-300">
          {c.name.slice(0, 1)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-100 truncate">{c.name}</span>
            {c.isLine ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-800 bg-cyan-950 px-1.5 py-0.5 text-[10px] text-cyan-400">
                <Smartphone className="h-2.5 w-2.5" />
                LINE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-800 bg-violet-950 px-1.5 py-0.5 text-[10px] text-violet-400">
                <Footprints className="h-2.5 w-2.5" />
                Walk-in
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {c.bookingCount} ครั้ง · ฿{c.totalSpent.toLocaleString()}
            {c.lastVisit && ` · ล่าสุด ${c.lastVisit}`}
          </p>
        </div>

        {expanded ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-800 bg-slate-950/50 px-4 pb-3">
          {c.recentBookings.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">ยังไม่มีประวัติการจอง</p>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-medium text-slate-500 py-1">ประวัติการจอง (10 รายการล่าสุด)</p>
              {c.recentBookings.map((b) => {
                const status = STATUS_LABEL[b.status] ?? { label: b.status, cls: 'text-slate-400 bg-slate-800' }
                return (
                  <div key={b.id} className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-slate-400 w-10">{b.queueNumber}</span>
                    <span className="text-xs text-slate-500 w-20">{b.date}</span>
                    <span className="text-xs text-slate-500 w-10">{b.timeSlot}</span>
                    <span className="flex-1 truncate text-xs text-slate-300">{b.serviceName}</span>
                    <span className="text-xs text-slate-400">฿{b.servicePrice.toLocaleString()}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', status.cls)}>
                      {status.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
