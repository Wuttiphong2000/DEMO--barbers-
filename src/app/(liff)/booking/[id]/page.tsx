'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Scissors, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface BookingDetail {
  id: string
  queueNumber: string
  timeSlot: string
  date: string
  status: string
  barberName: string
  barberAvatar: string | null
  serviceName: string
  servicePrice: number
  serviceDuration: number
  notes: string | null
  createdAt: string
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending_arrival: {
    label: 'รอมาถึงร้าน',
    cls: 'text-amber-400 bg-amber-950 border-amber-800',
    icon: <Clock className="h-5 w-5" />,
  },
  in_progress: {
    label: 'กำลังให้บริการ',
    cls: 'text-sky-400 bg-sky-950 border-sky-800',
    icon: <Scissors className="h-5 w-5" />,
  },
  done: {
    label: 'เสร็จแล้ว',
    cls: 'text-emerald-400 bg-emerald-950 border-emerald-800',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  cancelled: {
    label: 'ยกเลิกแล้ว',
    cls: 'text-stone-400 bg-stone-800 border-stone-700',
    icon: <XCircle className="h-5 w-5" />,
  },
  no_show: {
    label: 'ไม่มาตามนัด',
    cls: 'text-red-400 bg-red-950 border-red-800',
    icon: <AlertCircle className="h-5 w-5" />,
  },
}

export default function BookingStatusPage() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    fetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) setNotFound(true)
        else setBooking(json.data)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (notFound || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-950 p-6">
        <XCircle className="h-12 w-12 text-stone-600" />
        <p className="text-stone-500">ไม่พบการจองนี้</p>
      </div>
    )
  }

  async function handleCancel() {
    setCancelling(true)
    const res = await fetch(`/api/bookings/${id}`, { method: 'PATCH' })
    const json = await res.json()
    if (json.success) setBooking((b) => b ? { ...b, status: 'cancelled' } : b)
    setCancelling(false)
    setConfirmCancel(false)
  }

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG['pending_arrival']
  const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const thDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  const dateObj = new Date(booking.date)
  const dateDisplay = `${thDays[dateObj.getDay()]} ${dateObj.getDate()} ${thMonths[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`

  return (
    <div className="mx-auto max-w-md min-h-screen bg-stone-950 pb-8">
      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-700 px-6 pt-12 pb-8 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <Scissors className="h-8 w-8 text-amber-400" />
          </div>
        </div>
        <p className="text-stone-500 text-sm mb-1">หมายเลขคิว</p>
        <p className="text-5xl font-black text-stone-50 tracking-wide font-mono">{booking.queueNumber}</p>
      </div>

      {/* Status */}
      <div className="px-4 -mt-4">
        <div className={`flex items-center justify-center gap-2 rounded-2xl border p-3 shadow-sm ${status.cls}`}>
          {status.icon}
          <span className="font-semibold text-sm">{status.label}</span>
        </div>
      </div>

      {/* Details */}
      <div className="mx-4 mt-4 rounded-2xl border border-stone-700 bg-stone-900 p-5 space-y-3">
        <InfoRow icon={<Scissors className="h-4 w-4 text-amber-400" />} label="บริการ" value={booking.serviceName} />
        <div className="border-t border-stone-800" />
        <InfoRow icon={<User className="h-4 w-4 text-amber-400" />} label="ช่าง" value={booking.barberName} />
        <div className="border-t border-stone-800" />
        <InfoRow icon={<Calendar className="h-4 w-4 text-amber-400" />} label="วันที่" value={dateDisplay} />
        <div className="border-t border-stone-800" />
        <InfoRow icon={<Clock className="h-4 w-4 text-amber-400" />} label="เวลา" value={booking.timeSlot} />
        <div className="border-t border-stone-800" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-500">ค่าบริการ</span>
          <span className="font-bold text-amber-400">฿{booking.servicePrice.toLocaleString()}</span>
        </div>
      </div>

      {booking.status === 'pending_arrival' && (
        <div className="mx-4 mt-4">
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full rounded-2xl border border-stone-700 bg-stone-900 py-3 text-sm font-medium text-stone-400 transition-all active:scale-[0.98] hover:border-red-800 hover:text-red-400"
            >
              ยกเลิกการจอง
            </button>
          ) : (
            <div className="rounded-2xl border border-red-800 bg-red-950 p-4 space-y-3">
              <p className="text-sm font-medium text-red-300 text-center">ยืนยันการยกเลิก?</p>
              <p className="text-xs text-red-500 text-center">การจองจะถูกยกเลิกและ slot จะเปิดให้คนอื่นจองได้</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 rounded-xl border border-stone-700 bg-stone-900 py-2.5 text-sm font-medium text-stone-400"
                >
                  ไม่ยกเลิก
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {cancelling ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-stone-600 mt-4">
        จองเมื่อ {new Date(booking.createdAt).toLocaleString('th-TH')}
      </p>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-stone-500">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium text-stone-100">{value}</span>
    </div>
  )
}
