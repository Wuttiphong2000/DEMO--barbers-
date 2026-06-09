'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2, Check, Scissors, Calendar, Clock, User } from 'lucide-react'
import { useLiff } from '@/hooks/useLiff'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  id: string
  name: string
  durationMinutes: number
  price: number
  isActive: boolean
}

interface Barber {
  id: string
  name: string
  avatarUrl: string | null
  isActive: boolean
}

interface BookingState {
  step: 1 | 2 | 3 | 4 | 5
  service: Service | null
  barberId: string | null  // null = any barber
  barberName: string
  date: string             // YYYY-MM-DD
  timeSlot: string
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = ['บริการ', 'ช่าง', 'วันที่', 'เวลา', 'ยืนยัน']

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
              i + 1 < current
                ? 'bg-green-500 text-white'
                : i + 1 === current
                ? 'bg-green-600 text-white shadow-md shadow-green-200'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {i + 1 < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-6 rounded-full transition-all ${i + 1 < current ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Select Service ───────────────────────────────────────────────────

function StepService({ onSelect }: { onSelect: (s: Service) => void }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setServices(json.data.filter((s: Service) => s.isActive))
        setLoading(false)
      })
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800">เลือกบริการ</h2>
      {services.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.98] hover:border-green-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <Scissors className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{s.name}</p>
              <p className="text-sm text-gray-500">{s.durationMinutes} นาที</p>
            </div>
          </div>
          <p className="text-base font-semibold text-green-600">฿{s.price.toLocaleString()}</p>
        </button>
      ))}
    </div>
  )
}

// ─── Step 2: Select Barber ────────────────────────────────────────────────────

function StepBarber({ onSelect }: { onSelect: (barberId: string | null, name: string) => void }) {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/barbers')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setBarbers(json.data.filter((b: Barber) => b.isActive))
        setLoading(false)
      })
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800">เลือกช่าง</h2>

      {/* Any barber option */}
      <button
        onClick={() => onSelect(null, 'ไม่ระบุช่าง')}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-left transition-all active:scale-[0.98] hover:border-green-300 hover:bg-green-50"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
          <User className="h-5 w-5 text-gray-500" />
        </div>
        <div>
          <p className="font-medium text-gray-700">ไม่ระบุช่าง</p>
          <p className="text-sm text-gray-400">ระบบจะจัดช่างให้อัตโนมัติ</p>
        </div>
      </button>

      {barbers.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b.id, b.name)}
          className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all active:scale-[0.98] hover:border-green-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white font-semibold text-sm">
            {b.name.charAt(0).toUpperCase()}
          </div>
          <p className="font-medium text-gray-900">{b.name}</p>
        </button>
      ))}
    </div>
  )
}

// ─── Step 3: Date Picker ──────────────────────────────────────────────────────

function StepDate({ onSelect }: { onSelect: (date: string) => void }) {
  const [openDates, setOpenDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  useEffect(() => {
    Promise.all([fetch('/api/hours'), fetch('/api/special-days')]).then(async ([h, s]) => {
      const [hoursJson, specialJson] = await Promise.all([h.json(), s.json()])

      const businessHours: Array<{ dayOfWeek: string; isClosed: boolean }> = hoursJson.success ? hoursJson.data : []
      const specialDays: Array<{ date: string; isClosed: boolean }> = specialJson.success ? specialJson.data.map(
        (sd: { date: string; isClosed: boolean }) => ({ ...sd, date: String(sd.date).slice(0, 10) })
      ) : []

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

      const open = new Set<string>()
      dates.forEach((d) => {
        const dateObj = new Date(d)
        const special = specialDays.find((sd) => sd.date === d)
        if (special !== undefined) {
          if (!special.isClosed) open.add(d)
          return
        }
        const dayName = dayNames[dateObj.getDay()]
        const hours = businessHours.find((h) => h.dayOfWeek === dayName)
        if (hours && !hours.isClosed) open.add(d)
      })

      setOpenDates(open)
      setLoading(false)
    })
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSpinner />

  const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const thDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800">เลือกวันที่</h2>
      <div className="grid grid-cols-3 gap-2">
        {dates.map((d) => {
          const dateObj = new Date(d)
          const isOpen = openDates.has(d)
          return (
            <button
              key={d}
              disabled={!isOpen}
              onClick={() => onSelect(d)}
              data-testid={isOpen ? 'date-open' : 'date-closed'}
              className={`flex flex-col items-center rounded-2xl p-3 transition-all ${
                isOpen
                  ? 'bg-white border border-gray-100 shadow-sm active:scale-[0.97] hover:border-green-300 hover:shadow-md'
                  : 'bg-gray-50 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-xs text-gray-400">{thDays[dateObj.getDay()]}</span>
              <span className={`text-xl font-bold mt-0.5 ${isOpen ? 'text-gray-900' : 'text-gray-400'}`}>
                {dateObj.getDate()}
              </span>
              <span className="text-xs text-gray-400">{thMonths[dateObj.getMonth()]}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 4: Time Slot Picker ─────────────────────────────────────────────────

function StepSlot({
  barberId,
  date,
  serviceId,
  onSelect,
}: {
  barberId: string | null
  date: string
  serviceId: string
  onSelect: (slot: string) => void
}) {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    if (!barberId) {
      // For "any barber", fetch barbers first, pick first active, then get slots
      fetch('/api/barbers')
        .then((r) => r.json())
        .then((json) => {
          const active = json.data?.filter((b: Barber) => b.isActive) ?? []
          if (active.length === 0) { setLoading(false); return }
          // Use first barber as proxy for slot availability
          const firstBarberId = active[0].id
          return fetchSlots(firstBarberId)
        })
    } else {
      fetchSlots(barberId)
    }

    function fetchSlots(bid: string) {
      return fetch(`/api/available-slots?barberId=${bid}&date=${date}&serviceId=${serviceId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setSlots(json.data.slots)
            setClosed(json.data.closed)
          }
          setLoading(false)
        })
    }
  }, [barberId, date, serviceId])

  if (loading) return <LoadingSpinner />

  if (closed) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
        <Calendar className="h-10 w-10" />
        <p className="text-sm">ร้านปิดในวันนี้</p>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
        <Clock className="h-10 w-10" />
        <p className="text-sm">ไม่มีช่วงเวลาว่างในวันนี้</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-gray-800">เลือกเวลา</h2>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className="rounded-2xl border border-gray-100 bg-white py-3 text-center text-sm font-semibold text-gray-800 shadow-sm transition-all active:scale-[0.97] hover:border-green-400 hover:bg-green-50 hover:text-green-700"
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 5: Confirm ──────────────────────────────────────────────────────────

function StepConfirm({
  state,
  lineUserId,
  displayName,
  onSuccess,
}: {
  state: BookingState
  lineUserId: string
  displayName: string
  onSuccess: (bookingId: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const dateObj = new Date(state.date)
  const thDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  const dateDisplay = `${thDays[dateObj.getDay()]} ${dateObj.getDate()} ${thMonths[dateObj.getMonth()]} ${dateObj.getFullYear() + 543}`

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId,
          displayName,
          serviceId: state.service!.id,
          barberId: state.barberId,
          date: state.date,
          timeSlot: state.timeSlot,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error === 'slot_taken' ? 'เวลานี้ถูกจองแล้ว กรุณาเลือกเวลาใหม่' : json.error)
        return
      }
      onSuccess(json.data.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800">ยืนยันการจอง</h2>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <Row icon={<Scissors className="h-4 w-4 text-green-600" />} label="บริการ" value={state.service!.name} />
        <div className="border-t border-gray-100" />
        <Row icon={<User className="h-4 w-4 text-green-600" />} label="ช่าง" value={state.barberName} />
        <div className="border-t border-gray-100" />
        <Row icon={<Calendar className="h-4 w-4 text-green-600" />} label="วันที่" value={dateDisplay} />
        <div className="border-t border-gray-100" />
        <Row icon={<Clock className="h-4 w-4 text-green-600" />} label="เวลา" value={state.timeSlot} />
        <div className="border-t border-gray-100" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">ค่าบริการ</span>
          <span className="font-bold text-green-600 text-base">฿{state.service!.price.toLocaleString()}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full rounded-2xl bg-green-600 py-4 text-base font-semibold text-white shadow-md shadow-green-100 transition-all active:scale-[0.98] hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            กำลังจอง...
          </span>
        ) : (
          'ยืนยันการจอง'
        )}
      </button>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-green-500" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookPage() {
  const router = useRouter()
  const { ready, profile } = useLiff()

  const [state, setState] = useState<BookingState>({
    step: 1,
    service: null,
    barberId: null,
    barberName: 'ไม่ระบุช่าง',
    date: '',
    timeSlot: '',
  })

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  function back() {
    setState((s) => ({ ...s, step: (Math.max(1, s.step - 1)) as BookingState['step'] }))
  }

  function renderStep() {
    switch (state.step) {
      case 1:
        return (
          <StepService
            onSelect={(service) => setState((s) => ({ ...s, service, step: 2 }))}
          />
        )
      case 2:
        return (
          <StepBarber
            onSelect={(barberId, barberName) => setState((s) => ({ ...s, barberId, barberName, step: 3 }))}
          />
        )
      case 3:
        return (
          <StepDate
            onSelect={(date) => setState((s) => ({ ...s, date, step: 4 }))}
          />
        )
      case 4:
        return (
          <StepSlot
            barberId={state.barberId}
            date={state.date}
            serviceId={state.service!.id}
            onSelect={(timeSlot) => setState((s) => ({ ...s, timeSlot, step: 5 }))}
          />
        )
      case 5:
        return (
          <StepConfirm
            state={state}
            lineUserId={profile!.userId}
            displayName={profile!.displayName}
            onSuccess={(id) => router.push(`/booking/${id}`)}
          />
        )
    }
  }

  return (
    <div className="mx-auto max-w-md min-h-screen">
      <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {state.step > 1 && (
            <button onClick={back} className="rounded-xl p-2 hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-900">จองคิว</h1>
        </div>
        <StepDots current={state.step} />
      </div>

      <div className="p-4">
        {renderStep()}
      </div>
    </div>
  )
}
