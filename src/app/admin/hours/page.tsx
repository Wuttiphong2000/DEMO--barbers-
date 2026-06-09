'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const DAYS = [
  { key: 'monday', label: 'จันทร์' },
  { key: 'tuesday', label: 'อังคาร' },
  { key: 'wednesday', label: 'พุธ' },
  { key: 'thursday', label: 'พฤหัสบดี' },
  { key: 'friday', label: 'ศุกร์' },
  { key: 'saturday', label: 'เสาร์' },
  { key: 'sunday', label: 'อาทิตย์' },
]

interface DayHours { id?: string; dayOfWeek: string; openTime: string; closeTime: string; isClosed: boolean }
interface SpecialDay { id: string; date: string; isClosed: boolean; note?: string | null }

function dayDefault(dayOfWeek: string): DayHours {
  return { dayOfWeek, openTime: '09:00', closeTime: '18:00', isClosed: false }
}

export default function HoursPage() {
  const [hours, setHours] = useState<DayHours[]>(DAYS.map((d) => dayDefault(d.key)))
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([])
  const [loading, setLoading] = useState(true)
  const [savingDay, setSavingDay] = useState<string | null>(null)
  const [newSpecial, setNewSpecial] = useState({ date: '', isClosed: true, note: '' })
  const [addingSpecial, setAddingSpecial] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchAll() {
    const [hoursRes, specialRes] = await Promise.all([
      fetch('/api/hours'),
      fetch('/api/special-days'),
    ])
    const [hoursJson, specialJson] = await Promise.all([hoursRes.json(), specialRes.json()])

    if (hoursJson.success) {
      const fetched: DayHours[] = hoursJson.data
      setHours(DAYS.map((d) => fetched.find((h) => h.dayOfWeek === d.key) ?? dayDefault(d.key)))
    }
    if (specialJson.success) {
      setSpecialDays(specialJson.data.map((s: SpecialDay) => ({
        ...s,
        date: String(s.date).slice(0, 10),
      })))
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  function updateDay(dayOfWeek: string, patch: Partial<DayHours>) {
    setHours((prev) => prev.map((h) => h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h))
  }

  async function saveDay(day: DayHours) {
    setSavingDay(day.dayOfWeek)
    try {
      await fetch('/api/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(day),
      })
    } finally {
      setSavingDay(null)
    }
  }

  async function addSpecialDay() {
    if (!newSpecial.date) return
    setAddingSpecial(true)
    try {
      const res = await fetch('/api/special-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpecial),
      })
      const json = await res.json()
      if (json.success) {
        setNewSpecial({ date: '', isClosed: true, note: '' })
        fetchAll()
      }
    } finally {
      setAddingSpecial(false)
    }
  }

  async function deleteSpecialDay(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/special-days/${id}`, { method: 'DELETE' })
      fetchAll()
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-stone-500" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-50">เวลาทำการ</h1>
        <p className="text-sm text-stone-400 mt-0.5">ตั้งเวลาเปิด-ปิดร้านรายวัน และวันหยุดพิเศษ</p>
      </div>

      {/* Business Hours */}
      <div className="rounded-xl border border-stone-800 bg-stone-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-800">
          <h2 className="text-sm font-medium text-stone-50">ตารางเวลาประจำสัปดาห์</h2>
        </div>
        <div className="divide-y divide-stone-800">
          {hours.map((h) => {
            const day = DAYS.find((d) => d.key === h.dayOfWeek)!
            return (
              <div key={h.dayOfWeek} className="flex items-center gap-4 px-6 py-4">
                <span className="w-28 text-sm font-medium text-stone-300">{day.label}</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={h.isClosed}
                    onChange={(e) => updateDay(h.dayOfWeek, { isClosed: e.target.checked })}
                    className="h-4 w-4 rounded accent-red-500"
                  />
                  <span className="text-sm text-stone-400">ปิดร้าน</span>
                </label>
                {!h.isClosed && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-stone-500 w-8">เปิด</Label>
                      <Input
                        type="time"
                        value={h.openTime}
                        onChange={(e) => updateDay(h.dayOfWeek, { openTime: e.target.value })}
                        className="h-8 w-28 bg-stone-800 border-stone-700 text-stone-50 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-stone-500 w-6">ปิด</Label>
                      <Input
                        type="time"
                        value={h.closeTime}
                        onChange={(e) => updateDay(h.dayOfWeek, { closeTime: e.target.value })}
                        className="h-8 w-28 bg-stone-800 border-stone-700 text-stone-50 text-sm"
                      />
                    </div>
                  </>
                )}
                <div className="ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-stone-700 bg-transparent text-stone-300 hover:bg-stone-800 hover:text-stone-50"
                    onClick={() => saveDay(h)}
                    disabled={savingDay === h.dayOfWeek}
                  >
                    {savingDay === h.dayOfWeek ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'บันทึก'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Special Days */}
      <div className="rounded-xl border border-stone-800 bg-stone-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-800">
          <h2 className="text-sm font-medium text-stone-50">วันหยุดพิเศษ / เปิดพิเศษ</h2>
        </div>

        <div className="px-6 py-4 border-b border-stone-800">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-stone-400">วันที่</Label>
              <Input
                type="date"
                value={newSpecial.date}
                onChange={(e) => setNewSpecial((p) => ({ ...p, date: e.target.value }))}
                className="h-9 bg-stone-800 border-stone-700 text-stone-50 w-40"
              />
            </div>
            <label className="flex items-center gap-2 pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newSpecial.isClosed}
                onChange={(e) => setNewSpecial((p) => ({ ...p, isClosed: e.target.checked }))}
                className="h-4 w-4 rounded accent-red-500"
              />
              <span className="text-sm text-stone-400">ปิดร้าน</span>
            </label>
            <div className="space-y-1 flex-1">
              <Label className="text-xs text-stone-400">หมายเหตุ (ไม่บังคับ)</Label>
              <Input
                value={newSpecial.note}
                onChange={(e) => setNewSpecial((p) => ({ ...p, note: e.target.value }))}
                placeholder="เช่น วันสงกรานต์"
                className="h-9 bg-stone-800 border-stone-700 text-stone-50 placeholder:text-stone-600"
              />
            </div>
            <Button
              onClick={addSpecialDay}
              disabled={!newSpecial.date || addingSpecial}
              className="bg-amber-500 hover:bg-amber-600 text-stone-950 h-9"
            >
              {addingSpecial ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1.5" />เพิ่ม</>}
            </Button>
          </div>
        </div>

        {specialDays.length === 0 ? (
          <div className="px-6 py-8 text-center text-stone-500 text-sm">ยังไม่มีวันพิเศษ</div>
        ) : (
          <div className="divide-y divide-stone-800">
            {specialDays.map((s) => (
              <div key={s.id} className="flex items-center px-6 py-3 gap-4">
                <span className="text-sm text-stone-300 w-32">{s.date}</span>
                <Badge className={s.isClosed ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}>
                  {s.isClosed ? 'ปิดร้าน' : 'เปิดพิเศษ'}
                </Badge>
                {s.note && <span className="text-sm text-stone-500 flex-1">{s.note}</span>}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 ml-auto text-stone-500 hover:text-red-400"
                  onClick={() => deleteSpecialDay(s.id)}
                  disabled={deletingId === s.id}
                >
                  {deletingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
