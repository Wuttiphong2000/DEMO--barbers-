import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/db/supabase-server'
import { prisma } from '@/lib/db/prisma'
import { DashboardClient } from '@/components/admin/dashboard/DashboardClient'
import type { DashboardBooking, DashboardStats, ServiceOption, BarberOption } from '@/components/admin/dashboard/types'

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const bangkokOffset = 7 * 60 * 60 * 1000
  const bangkokNow = new Date(now.getTime() + bangkokOffset)

  // Bangkok midnight expressed as UTC timestamp for DB queries
  const today = new Date(
    Date.UTC(bangkokNow.getUTCFullYear(), bangkokNow.getUTCMonth(), bangkokNow.getUTCDate()) - bangkokOffset
  )
  const tomorrow = new Date(today.getTime() + 86_400_000)

  const currentTimeMinutes = bangkokNow.getUTCHours() * 60 + bangkokNow.getUTCMinutes()

  const [rawBookings, services, barbers, newCustomers, gracePeriodRow] = await Promise.all([
    prisma.booking.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        status: { notIn: ['cancelled', 'no_show'] },
      },
      include: {
        customer: { select: { name: true, lineUserId: true } },
        service: { select: { name: true, price: true, durationMinutes: true } },
        barber: { select: { name: true } },
      },
      orderBy: { timeSlot: 'asc' },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, durationMinutes: true },
    }),
    prisma.barber.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    }),
    prisma.customer.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    }),
    prisma.setting.findUnique({ where: { key: 'grace_period_minutes' } }),
  ])
  const gracePeriodMinutes = parseInt(gracePeriodRow?.value ?? '15', 10)

  function parseTimeMinutes(slot: string): number {
    const [h, m] = slot.split(':').map(Number)
    return h * 60 + m
  }

  const bookings: DashboardBooking[] = rawBookings.map((b) => {
    const slotMinutes = parseTimeMinutes(b.timeSlot)
    const overdueMinutes = currentTimeMinutes - slotMinutes - gracePeriodMinutes
    const isLate = b.status === 'pending_arrival' && overdueMinutes > 0
    return {
      id: b.id,
      queueNumber: b.queueNumber,
      timeSlot: b.timeSlot,
      date: b.date.toISOString().slice(0, 10),
      status: b.status as DashboardBooking['status'],
      source: b.source as DashboardBooking['source'],
      customerName: b.customer.name ?? 'Walk-in',
      customerLineUserId: b.customer.lineUserId,
      serviceName: b.service.name,
      servicePrice: b.service.price.toNumber(),
      serviceDuration: b.service.durationMinutes,
      barberName: b.barber.name,
      notes: b.notes,
      createdAt: b.createdAt.toISOString(),
      isLate,
      lateMinutes: isLate ? overdueMinutes : 0,
    }
  })

  // Compute stats
  const doneBookings = bookings.filter((b) => b.status === 'done')
  const todayRevenue = doneBookings.reduce((sum, b) => sum + b.servicePrice, 0)

  const serviceCount = rawBookings.reduce<Record<string, { name: string; count: number }>>((acc, b) => {
    const key = b.serviceId
    if (!acc[key]) acc[key] = { name: b.service.name, count: 0 }
    acc[key].count++
    return acc
  }, {})
  const popularService = Object.values(serviceCount).sort((a, b) => b.count - a.count)[0]?.name ?? null

  const stats: DashboardStats = {
    total: bookings.length,
    inProgressCount: bookings.filter((b) => b.status === 'in_progress').length,
    pendingCount: bookings.filter((b) => b.status === 'pending_arrival').length,
    doneCount: doneBookings.length,
    walkInCount: bookings.filter((b) => b.source === 'walk_in').length,
    todayRevenue,
    popularService,
    newCustomers,
  }

  const serviceOptions: ServiceOption[] = services.map((s) => ({
    ...s,
    price: s.price.toNumber(),
  }))

  const barberOptions: BarberOption[] = barbers

  const dateLabel = `${TH_DAYS[bangkokNow.getUTCDay()]} ${bangkokNow.getUTCDate()} ${TH_MONTHS[bangkokNow.getUTCMonth()]} ${bangkokNow.getUTCFullYear() + 543}`

  return (
    <DashboardClient
      bookings={bookings}
      stats={stats}
      services={serviceOptions}
      barbers={barberOptions}
      dateLabel={dateLabel}
    />
  )
}
