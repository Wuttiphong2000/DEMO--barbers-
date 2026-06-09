export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/api-response'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      barber: { select: { name: true, avatarUrl: true } },
      service: { select: { name: true, price: true, durationMinutes: true } },
    },
  })

  if (!booking) return err('Booking not found', 404)

  return ok({
    id: booking.id,
    queueNumber: booking.queueNumber,
    timeSlot: booking.timeSlot,
    date: booking.date.toISOString().slice(0, 10),
    status: booking.status,
    barberName: booking.barber.name,
    barberAvatar: booking.barber.avatarUrl,
    serviceName: booking.service.name,
    servicePrice: booking.service.price.toNumber(),
    serviceDuration: booking.service.durationMinutes,
    notes: booking.notes,
    createdAt: booking.createdAt.toISOString(),
  })
}
