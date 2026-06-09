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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_arrival: { label: 'รอมาถึงร้าน', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock className="h-5 w-5" /> },
  in_progress: { label: 'กำลังให้บริการ', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <Scissors className="h-5 w-5" /> },
  done: { label: 'เสร็จแล้ว', color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle className="h-5 w-5" /> },
  cancelled: { label: 'ยกเลิกแล้ว', color: 'text-gray-500 bg-gray-50 border-gray-200', icon: <XCircle className="h-5 w-5" /> },
  no_show: { label: 'ไม่มาตามนัด', color: 'text-red-600 bg-red-50 border-red-200', icon: <AlertCircle className="h-5 w-5" /> },
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
        if (!json.success) {
          setNotFound(true)
        } else {
          setBooking(json.data)
        }
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (notFound || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <XCircle className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500">ไม่พบการจองนี้</p>
      </div>
    )
  }

  async function handleCancel() {
    setCancelling(true)
    const res = await fetch(`/api/bookings/${id}`, { method: 'PATCH' })
    const json = await res.json()
    if (json.success) {
      setBooking((b) => b ? { ...b, status: 'cancelled' } : b)
    }
    setCancelling(false)
    setConfirmCancel(false)
  }

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG['pending_arrival']
  const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const thDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  const dateObj = new Date(booking.date)
  const dateDisplay = `${thDays[dateObj.getDay()]} ${dateObj.getDate()} ${thMonths[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`

  return (
    <div className="mx-auto max-w-md min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-600 to-green-500 px-6 pt-12 pb-8 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Scissors className="h-8 w-8 text-white" />
          </div>
        </div>
        <p className="text-green-100 text-sm mb-1">หมายเลขคิว</p>
        <p className="text-5xl font-black text-white tracking-wide">{booking.queueNumber}</p>
      </div>

      {/* Status */}
      <div className="px-4 -mt-4">
        <div className={`flex items-center justify-center gap-2 rounded-2xl border p-3 shadow-sm ${status.color}`}>
          {status.icon}
          <span className="font-semibold text-sm">{status.label}</span>
        </div>
      </div>

      {/* Details */}
      <div className="mx-4 mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <InfoRow icon={<Scissors className="h-4 w-4 text-green-600" />} label="บริการ" value={booking.serviceName} />
        <div className="border-t border-gray-100" />
        <InfoRow icon={<User className="h-4 w-4 text-green-600" />} label="ช่าง" value={booking.barberName} />
        <div className="border-t border-gray-100" />
        <InfoRow icon={<Calendar className="h-4 w-4 text-green-600" />} label="วันที่" value={dateDisplay} />
        <div className="border-t border-gray-100" />
        <InfoRow icon={<Clock className="h-4 w-4 text-green-600" />} label="เวลา" value={booking.timeSlot} />
        <div className="border-t border-gray-100" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">ค่าบริการ</span>
          <span className="font-bold text-green-600">฿{booking.servicePrice.toLocaleString()}</span>
        </div>
      </div>

      {booking.status === 'pending_arrival' && (
        <div className="mx-4 mt-4">
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full rounded-2xl border border-red-200 bg-white py-3 text-sm font-medium text-red-500 transition-all active:scale-[0.98] hover:bg-red-50"
            >
              ยกเลิกการจอง
            </button>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-medium text-red-700 text-center">ยืนยันการยกเลิก?</p>
              <p className="text-xs text-red-500 text-center">การจองจะถูกยกเลิกและ slot จะเปิดให้คนอื่นจองได้</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600"
                >
                  ไม่ยกเลิก
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {cancelling ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-4">
        จองเมื่อ {new Date(booking.createdAt).toLocaleString('th-TH')}
      </p>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
