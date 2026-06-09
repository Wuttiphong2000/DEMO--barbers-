import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/db/supabase-server'
import { prisma } from '@/lib/db/prisma'
import { CalendarClient } from './CalendarClient'

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const bangkokOffset = 7 * 60
  const bangkokNow = new Date(now.getTime() + bangkokOffset * 60 * 1000)

  let year = bangkokNow.getUTCFullYear()
  let month = bangkokNow.getUTCMonth() + 1

  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split('-').map(Number)
    year = y
    month = m
  }

  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  const rawBookings = await prisma.booking.findMany({
    where: {
      date: { gte: firstDay, lte: lastDay },
      status: { notIn: ['cancelled', 'no_show'] },
    },
    include: {
      customer: { select: { name: true } },
      service: { select: { name: true } },
      barber: { select: { name: true } },
    },
    orderBy: { timeSlot: 'asc' },
  })

  const dayMap = new Map<string, {
    date: string
    count: number
    bookings: {
      id: string
      queueNumber: string
      timeSlot: string
      customerName: string
      serviceName: string
      barberName: string
      source: string
      status: string
    }[]
  }>()

  for (const b of rawBookings) {
    const dateStr = b.date.toISOString().slice(0, 10)
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, { date: dateStr, count: 0, bookings: [] })
    }
    const day = dayMap.get(dateStr)!
    day.count++
    day.bookings.push({
      id: b.id,
      queueNumber: b.queueNumber,
      timeSlot: b.timeSlot,
      customerName: b.customer.name ?? 'Walk-in',
      serviceName: b.service.name,
      barberName: b.barber.name,
      source: b.source,
      status: b.status,
    })
  }

  const today = bangkokNow.toISOString().slice(0, 10)

  return (
    <CalendarClient
      year={year}
      month={month}
      days={Array.from(dayMap.values())}
      today={today}
    />
  )
}
