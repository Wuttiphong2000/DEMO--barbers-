'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const formSchema = z.object({
  shopName: z.string().min(1, 'ต้องระบุชื่อร้าน'),
  gracePeriodMinutes: z.number().int().min(0).max(60),
  bufferMinutes: z.number().int().min(0).max(60),
})
type FormValues = z.infer<typeof formSchema>

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { shopName: '', gracePeriodMinutes: 15, bufferMinutes: 10 },
  })

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const s = json.data as Record<string, string>
          form.reset({
            shopName: s['shop_name'] ?? '',
            gracePeriodMinutes: parseInt(s['grace_period_minutes'] ?? '15'),
            bufferMinutes: parseInt(s['buffer_minutes'] ?? '10'),
          })
        }
        setLoading(false)
      })
  }, [form])

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (json.success) setSaved(true)
    } finally {
      setSaving(false)
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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-stone-50">ตั้งค่าร้าน</h1>
        <p className="text-sm text-stone-400 mt-0.5">ข้อมูลพื้นฐานและกฎการจองคิว</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-6 space-y-5">
          <h2 className="text-sm font-medium text-stone-50 border-b border-stone-800 pb-3">ข้อมูลร้าน</h2>
          <div className="space-y-1.5">
            <Label className="text-stone-300">ชื่อร้าน</Label>
            <Input
              {...form.register('shopName')}
              placeholder="ร้านตัดผม..."
              className="bg-stone-800 border-stone-700 text-stone-50 placeholder:text-stone-500"
            />
            {form.formState.errors.shopName && (
              <p className="text-xs text-red-400">{form.formState.errors.shopName.message}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-stone-800 bg-stone-900 p-6 space-y-5">
          <h2 className="text-sm font-medium text-stone-50 border-b border-stone-800 pb-3">กฎการจองคิว</h2>
          <div className="space-y-1.5">
            <Label className="text-stone-300">Grace Period (นาที)</Label>
            <Input
              {...form.register('gracePeriodMinutes', { valueAsNumber: true })}
              type="number"
              className="bg-stone-800 border-stone-700 text-stone-50"
            />
            <p className="text-xs text-stone-500">ระยะเวลาที่ยังรอลูกค้ามาช้าได้ก่อนตัดสิทธิ์</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-stone-300">Buffer Time (นาที)</Label>
            <Input
              {...form.register('bufferMinutes', { valueAsNumber: true })}
              type="number"
              className="bg-stone-800 border-stone-700 text-stone-50"
            />
            <p className="text-xs text-stone-500">เวลาเผื่อระหว่างลูกค้าแต่ละคน</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            บันทึก
          </Button>
          {saved && <span className="text-sm text-emerald-400">บันทึกสำเร็จ</span>}
        </div>
      </form>
    </div>
  )
}
