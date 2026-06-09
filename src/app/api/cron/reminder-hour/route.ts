export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { pushMessage } from '@/lib/line'
import { filterBookingsForHourReminder, parseTimeToMinutes } from '@/lib/cron-utils'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86_400_000)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const rawBookings = await prisma.booking.findMany({
    where: {
      date: { gte: today, lt: tomorrow },
      status: 'pending_arrival',
    },
    include: {
      customer: { select: { lineUserId: true } },
      service: { select: { name: true } },
      barber: { select: { name: true } },
    },
  })

  const eligible = filterBookingsForHourReminder(
    rawBookings.map((b) => ({
      id: b.id,
      timeSlot: b.timeSlot,
      customerLineUserId: b.customer.lineUserId ?? '',
      queueNumber: b.queueNumber,
      serviceName: b.service.name,
      barberName: b.barber.name,
    })),
    currentMinutes,
    60
  )

  // Build a lookup for LINE IDs
  const lineIdMap = new Map(rawBookings.map((b) => [b.id, b.customer.lineUserId ?? '']))

  const results = await Promise.allSettled(
    eligible.map((b) => {
      const slotMinutes = parseTimeToMinutes(b.timeSlot)
      const diffMin = slotMinutes - currentMinutes
      const timeLabel = diffMin <= 10 ? 'อีกไม่ถึง 10 นาที' : `อีก ${diffMin} นาที`
      return pushMessage(lineIdMap.get(b.id)!, [{
        type: 'text',
        text: `⏰ ใกล้ถึงเวลานัดแล้ว! (${timeLabel})\nคิว ${b.queueNumber} · ${b.timeSlot} น.\nบริการ: ${b.serviceName} (ช่าง${b.barberName})\n\nกรุณามาที่ร้านครับ 💈`,
      }])
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length

  return NextResponse.json({ ok: true, total: eligible.length, sent })
}
