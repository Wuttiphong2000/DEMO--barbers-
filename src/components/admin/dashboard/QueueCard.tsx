'use client'

import { Loader2, Scissors, Clock, AlertTriangle, Smartphone, Footprints } from 'lucide-react'
import type { DashboardBooking } from './types'

interface QueueCardProps {
  booking: DashboardBooking
  actionLoading: boolean
  onAction: (id: string, action: 'start' | 'done' | 'cancel' | 'no_show') => void
}

const SOURCE_BADGE = {
  line: { label: 'LINE', icon: <Smartphone className="h-3 w-3" />, cls: 'bg-cyan-950 text-cyan-400 border-cyan-800' },
  walk_in: { label: 'Walk-in', icon: <Footprints className="h-3 w-3" />, cls: 'bg-violet-950 text-violet-400 border-violet-800' },
  qr: { label: 'QR', icon: <Smartphone className="h-3 w-3" />, cls: 'bg-cyan-950 text-cyan-400 border-cyan-800' },
}

export function QueueCard({ booking, actionLoading, onAction }: QueueCardProps) {
  const source = SOURCE_BADGE[booking.source]

  return (
    <div className={`rounded-xl border bg-stone-900 p-4 transition-all ${booking.isLate ? 'border-amber-700/50' : 'border-stone-800'}`}>
      <div className="flex items-start gap-3">
        {/* Queue number */}
        <div className="flex-shrink-0 text-center">
          <p className="font-mono text-2xl font-bold text-stone-50 leading-none">{booking.queueNumber}</p>
          <p className="text-xs text-stone-500 mt-1">{booking.timeSlot}</p>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-stone-100 truncate">{booking.customerName}</p>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${source.cls}`}>
              {source.icon}
              {source.label}
            </span>
            {booking.notes === 'LATE_REPORTED' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-700/50 bg-orange-950 px-2 py-0.5 text-xs font-medium text-orange-400">
                <AlertTriangle className="h-3 w-3" />
                แจ้งมาสาย
              </span>
            )}
            {booking.isLate && booking.notes !== 'LATE_REPORTED' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-700/50 bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-400 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                มาช้า {booking.lateMinutes} นาที
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <Scissors className="h-3 w-3" />
              {booking.serviceName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {booking.serviceDuration} นาที
            </span>
            <span className="text-stone-500">{booking.barberName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {booking.status === 'pending_arrival' && (
            <>
              <ActionButton
                label="เรียกคิว"
                className="bg-amber-500 hover:bg-amber-400 text-stone-950"
                loading={actionLoading}
                onClick={() => onAction(booking.id, 'start')}
              />
              <ActionButton
                label="✕"
                className="bg-stone-800 hover:bg-red-900 text-stone-300 hover:text-red-400"
                loading={actionLoading}
                onClick={() => onAction(booking.id, 'cancel')}
              />
            </>
          )}
          {booking.status === 'in_progress' && (
            <ActionButton
              label="เสร็จ ✓"
              className="bg-emerald-700 hover:bg-emerald-600 text-white"
              loading={actionLoading}
              onClick={() => onAction(booking.id, 'done')}
            />
          )}
        </div>
      </div>

      {/* Late actions */}
      {booking.isLate && booking.status === 'pending_arrival' && (
        <div className="mt-3 flex gap-2 border-t border-amber-900/30 pt-3">
          <button
            onClick={() => onAction(booking.id, 'no_show')}
            disabled={actionLoading}
            className="flex-1 rounded-lg border border-red-800 bg-red-950 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900 transition-colors disabled:opacity-50"
          >
            No-show
          </button>
        </div>
      )}
    </div>
  )
}

function ActionButton({
  label,
  className,
  loading,
  onClick,
}: {
  label: string
  className: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : label}
    </button>
  )
}
