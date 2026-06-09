'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { ServiceOption, BarberOption } from './types'

interface WalkInModalProps {
  services: ServiceOption[]
  barbers: BarberOption[]
  onClose: () => void
  onSuccess: () => void
}

function nowTimeSlot(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function WalkInModal({ services, barbers, onClose, onSuccess }: WalkInModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [barberId, setBarberId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queueResult, setQueueResult] = useState<string | null>(null)

  async function handleSubmit() {
    if (!serviceId) { setError('กรุณาเลือกบริการ'); return }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/admin/walk-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: customerName.trim() || undefined,
        serviceId,
        barberId: barberId || null,
        date: todayDate(),
        timeSlot: nowTimeSlot(),
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (!json.success) {
      setError(json.error ?? 'เกิดข้อผิดพลาด')
      return
    }

    setQueueResult(json.data.queueNumber)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">+ เพิ่มคิว Walk-in</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {queueResult ? (
          /* Success state */
          <div className="flex flex-col items-center gap-3 px-5 py-8">
            <p className="text-slate-400 text-sm">ออกคิวสำเร็จ</p>
            <p className="font-mono text-5xl font-bold text-white">{queueResult}</p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-500 transition-colors"
            >
              ปิด
            </button>
          </div>
        ) : (
          /* Form */
          <div className="p-5 space-y-4">
            {/* Customer name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                ชื่อลูกค้า <span className="text-slate-600">(ไม่บังคับ)</span>
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="นาย..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Service */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                บริการ <span className="text-red-400">*</span>
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} นาที) — ฿{s.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Barber */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">ช่าง</label>
              <div className="flex flex-wrap gap-2">
                {barbers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBarberId(b.id === barberId ? null : b.id)}
                    className={`rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                      barberId === b.id
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
                <button
                  onClick={() => setBarberId(null)}
                  className={`rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                    barberId === null
                      ? 'border-blue-500 bg-blue-600 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  ไม่ระบุ
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-950 border border-red-800 px-4 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !serviceId}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังออกคิว...
                </>
              ) : (
                'ออกคิว'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
