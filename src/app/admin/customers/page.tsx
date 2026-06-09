import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/db/supabase-server'
import { prisma } from '@/lib/db/prisma'
import { CustomersClient } from './CustomersClient'

export default async function CustomersPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const customers = await prisma.customer.findMany({
    include: {
      bookings: {
        where: { status: { notIn: ['cancelled', 'no_show'] } },
        include: { service: { select: { name: true, price: true } } },
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const customerData = customers.map((c) => {
    const bookings = c.bookings
    const lastBooking = bookings[0]
    const totalSpent = bookings.reduce((sum, b) => sum + b.service.price.toNumber(), 0)
    return {
      id: c.id,
      name: c.name ?? 'Walk-in',
      lineUserId: c.lineUserId ?? '',
      isLine: c.lineUserId ? !c.lineUserId.startsWith('walkin_') : false,
      bookingCount: bookings.length,
      totalSpent,
      lastVisit: lastBooking?.date?.toISOString().slice(0, 10) ?? null,
      createdAt: c.createdAt.toISOString().slice(0, 10),
      recentBookings: bookings.map((b) => ({
        id: b.id,
        queueNumber: b.queueNumber,
        date: b.date.toISOString().slice(0, 10),
        timeSlot: b.timeSlot,
        serviceName: b.service.name,
        servicePrice: b.service.price.toNumber(),
        status: b.status,
        source: b.source,
      })),
    }
  })

  return <CustomersClient customers={customerData} />
}
