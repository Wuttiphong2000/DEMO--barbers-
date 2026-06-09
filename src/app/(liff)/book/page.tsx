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

interface BusinessHour {
  dayOfWeek: string
  isClosed: boolean
}

interface SpecialDay {
  date: string
  isClosed: boolean
}

interface InitData {
  services: Service[]
  barbers: Barber[]
  businessHours: BusinessHour[]
  specialDays: SpecialDay[]
}

interface BookingState {
  step: 1 | 2 | 3 | 4 | 5
  service: Service | null
  barberId: string | null
  barberName: string
  date: string
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
                ? 'bg-amber-500 text-stone-950'
                : i + 1 === current
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30'
                : 'bg-stone-800 text-stone-500'
            }`}
          >
            {i + 1 < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-6 rounded-full transition-all ${i + 1 < current ? 'bg-amber-500' : 'bg-stone-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Select Service ───────────────────────────────────────────────────

function StepService({ services, onSelect }: { services: Service[]; onSelect: (s: Service) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-stone-50">เลือกบริการ</h2>
      {services.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className="flex w-full items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 p-4 text-left transition-all active:scale-[0.98] hover:border-amber-500/50 hover:bg-stone-800"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Scissors className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-stone-100">{s.name}</p>
              <p className="text-sm text-stone-500">{s.durationMinutes} นาที</p>
            </div>
          </div>
          <p className="text-base font-semibold text-amber-400">฿{s.price.toLocaleString()}</p>
        </button>
      ))}
    </div>
  )
}

// ─── Step 2: Select Barber ────────────────────────────────────────────────────

function StepBarber({ barbers, onSelect }: { barbers: Barber[]; onSelect: (barberId: string | null, name: string) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-stone-50">เลือกช่าง</h2>

      <button
        onClick={() => onSelect(null, 'ไม่ระบุช่าง')}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-stone-700 bg-stone-900/50 p-4 text-left transition-all active:scale-[0.98] hover:border-amber-500/50 hover:bg-stone-800"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800">
          <User className="h-5 w-5 text-stone-400" />
        </div>
        <div>
          <p className="font-medium text-stone-300">ไม่ระบุช่าง</p>
          <p className="text-sm text-stone-500">ระบบจะจัดช่างให้อัตโนมัติ</p>
        </div>
      </button>

      {barbers.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b.id, b.name)}
          className="flex w-full items-center gap-3 rounded-2xl border border-stone-700 bg-stone-900 p-4 text-left transition-all active:scale-[0.98] hover:border-amber-500/50 hover:bg-stone-800"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 font-semibold text-sm">
            {b.name.charAt(0).toUpperCase()}
          </div>
          <p className="font-medium text-stone-100">{b.name}</p>
        </button>
      ))}
    </div>
  )
}

// ─── Step 3: Date Picker ──────────────────────────────────────────────────────

function StepDate({ businessHours, specialDays, onSelect }: {
  businessHours: BusinessHour[]
  specialDays: SpecialDay[]
  onSelect: (date: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return toLocalDateStr(d)
  })

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  const openDates = new Set<string>()
  dates.forEach((d) => {
    const dateObj = new Date(d)
    const special = specialDays.find((sd) => sd.date.slice(0, 10) === d)
    if (special !== undefined) {
      if (!special.isClosed) openDates.add(d)
      return
    }
    const dayName = dayNames[dateObj.getDay()]
    const hours = businessHours.find((h) => h.dayOfWeek === dayName)
    if (hours && !hours.isClosed) openDates.add(d)
  })

  const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const thDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-stone-50">เลือกวันที่</h2>
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
                  ? 'border border-stone-700 bg-stone-900 active:scale-[0.97] hover:border-amber-500/50 hover:bg-stone-800'
                  : 'bg-stone-900/30 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-xs text-stone-500">{thDays[dateObj.getDay()]}</span>
              <span className={`text-xl font-bold mt-0.5 ${isOpen ? 'text-stone-50' : 'text-stone-600'}`}>
                {dateObj.getDate()}
              </span>
              <span className="text-xs text-stone-500">{thMonths[dateObj.getMonth()]}</span>
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
  barbers,
  date,
  serviceId,
  onSelect,
}: {
  barberId: string | null
  barbers: Barber[]
  date: string
  serviceId: string
  onSelect: (slot: string) => void
}) {
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    const bid = barberId ?? (barbers.length > 0 ? barbers[0].id : null)
    if (!bid) { setLoading(false); return }

    fetch(`/api/available-slots?barberId=${bid}&date=${date}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setSlots(json.data.slots)
          setClosed(json.data.closed)
        }
        setLoading(false)
      })
  }, [barberId, barbers, date, serviceId])

  if (loading) return <LoadingSpinner />

  if (closed) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-stone-500">
        <Calendar className="h-10 w-10" />
        <p className="text-sm">ร้านปิดในวันนี้</p>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-stone-500">
        <Clock className="h-10 w-10" />
        <p className="text-sm">ไม่มีช่วงเวลาว่างในวันนี้</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-stone-50">เลือกเวลา</h2>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className="rounded-2xl border border-stone-700 bg-stone-900 py-3 text-center text-sm font-semibold text-stone-200 transition-all active:scale-[0.97] hover:border-amber-500/50 hover:bg-stone-800 hover:text-amber-400"
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
      <h2 className="text-base font-semibold text-stone-50">ยืนยันการจอง</h2>

      <div className="rounded-2xl border border-stone-700 bg-stone-900 p-5 space-y-3">
        <Row icon={<Scissors className="h-4 w-4 text-amber-400" />} label="บริการ" value={state.service!.name} />
        <div className="border-t border-stone-800" />
        <Row icon={<User className="h-4 w-4 text-amber-400" />} label="ช่าง" value={state.barberName} />
        <div className="border-t border-stone-800" />
        <Row icon={<Calendar className="h-4 w-4 text-amber-400" />} label="วันที่" value={dateDisplay} />
        <div className="border-t border-stone-800" />
        <Row icon={<Clock className="h-4 w-4 text-amber-400" />} label="เวลา" value={state.timeSlot} />
        <div className="border-t border-stone-800" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-500">ค่าบริการ</span>
          <span className="font-bold text-amber-400 text-base">฿{state.service!.price.toLocaleString()}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-950 border border-red-800 p-3 text-sm text-red-400">{error}</div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full rounded-2xl bg-amber-500 py-4 text-base font-semibold text-stone-950 shadow-md shadow-amber-500/20 transition-all active:scale-[0.98] hover:bg-amber-400 disabled:opacity-60"
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
      <div className="flex items-center gap-2 text-sm text-stone-500">
        {icon}
        {label}
      </div>
      <span className="text-sm font-medium text-stone-100">{value}</span>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookPage() {
  const router = useRouter()
  const { ready, profile } = useLiff()
  const [initData, setInitData] = useState<InitData | null>(null)

  useEffect(() => {
    fetch('/api/booking-init')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setInitData(json.data)
      })
  }, [])

  const [state, setState] = useState<BookingState>({
    step: 1,
    service: null,
    barberId: null,
    barberName: 'ไม่ระบุช่าง',
    date: '',
    timeSlot: '',
  })

  if (!ready || !initData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  function back() {
    setState((s) => ({ ...s, step: (Math.max(1, s.step - 1)) as BookingState['step'] }))
  }

  const data = initData!

  function renderStep() {
    switch (state.step) {
      case 1:
        return <StepService services={data.services} onSelect={(service) => setState((s) => ({ ...s, service, step: 2 }))} />
      case 2:
        return <StepBarber barbers={data.barbers} onSelect={(barberId, barberName) => setState((s) => ({ ...s, barberId, barberName, step: 3 }))} />
      case 3:
        return <StepDate businessHours={data.businessHours} specialDays={data.specialDays} onSelect={(date) => setState((s) => ({ ...s, date, step: 4 }))} />
      case 4:
        return (
          <StepSlot
            barberId={state.barberId}
            barbers={data.barbers}
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
    <div className="mx-auto max-w-md min-h-screen bg-stone-950">
      <div className="sticky top-0 z-10 bg-stone-950 border-b border-stone-800">
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {state.step > 1 && (
            <button onClick={back} className="rounded-xl p-2 hover:bg-stone-800 transition-colors">
              <ChevronLeft className="h-5 w-5 text-stone-400" />
            </button>
          )}
          <h1 className="text-lg font-bold text-stone-50">จองคิว</h1>
        </div>
        <StepDots current={state.step} />
      </div>

      <div className="p-4">
        {renderStep()}
      </div>
    </div>
  )
}
