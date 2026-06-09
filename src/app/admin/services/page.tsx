'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Service {
  id: string
  name: string
  durationMinutes: number
  price: number
  isActive: boolean
}

const formSchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อบริการ'),
  durationMinutes: z.number().int().min(5, 'ต้องมากกว่า 5 นาที').max(480),
  price: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', durationMinutes: 30, price: 0, isActive: true },
  })

  async function fetchServices() {
    const res = await fetch('/api/services')
    const json = await res.json()
    if (json.success) setServices(json.data)
    setLoading(false)
  }

  useEffect(() => { fetchServices() }, [])

  function openCreate() {
    setEditTarget(null)
    form.reset({ name: '', durationMinutes: 30, price: 0, isActive: true })
    setDialogOpen(true)
  }

  function openEdit(service: Service) {
    setEditTarget(service)
    form.reset({
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
      isActive: service.isActive,
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const url = editTarget ? `/api/services/${editTarget.id}` : '/api/services'
      const method = editTarget ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setDialogOpen(false)
      fetchServices()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id)
    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' })
      fetchServices()
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">บริการ</h1>
          <p className="text-sm text-slate-400 mt-0.5">จัดการบริการที่ร้านให้บริการ</p>
        </div>
        <Button onClick={openCreate} className="bg-green-500 hover:bg-green-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มบริการ
        </Button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">ชื่อบริการ</TableHead>
                <TableHead className="text-slate-400">เวลา</TableHead>
                <TableHead className="text-slate-400">ราคา</TableHead>
                <TableHead className="text-slate-400">สถานะ</TableHead>
                <TableHead className="text-slate-400 w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-10">
                    ยังไม่มีบริการ — กด เพิ่มบริการ ด้านบน
                  </TableCell>
                </TableRow>
              ) : (
                services.map((s) => (
                  <TableRow key={s.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-white font-medium">{s.name}</TableCell>
                    <TableCell className="text-slate-300">{s.durationMinutes} นาที</TableCell>
                    <TableCell className="text-slate-300">฿{s.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={s.isActive ? 'default' : 'secondary'}
                        className={s.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-700 text-slate-400'}
                      >
                        {s.isActive ? 'เปิด' : 'ปิด'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-white"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400 hover:text-red-400"
                          onClick={() => handleDelete(s.id)}
                          disabled={deleteId === s.id}
                        >
                          {deleteId === s.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'แก้ไขบริการ' : 'เพิ่มบริการ'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">ชื่อบริการ</Label>
              <Input
                {...form.register('name')}
                placeholder="เช่น ตัดผมชาย"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">เวลา (นาที)</Label>
                <Input
                  {...form.register('durationMinutes', { valueAsNumber: true })}
                  type="number"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {form.formState.errors.durationMinutes && (
                  <p className="text-xs text-red-400">{form.formState.errors.durationMinutes.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">ราคา (บาท)</Label>
                <Input
                  {...form.register('price', { valueAsNumber: true })}
                  type="number"
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {form.formState.errors.price && (
                  <p className="text-xs text-red-400">{form.formState.errors.price.message}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                {...form.register('isActive')}
                className="h-4 w-4 rounded accent-green-500"
              />
              <Label htmlFor="isActive" className="text-slate-300 cursor-pointer">เปิดให้บริการ</Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400"
                onClick={() => setDialogOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
