export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { pushMessage } from '@/lib/line'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const dayAfter = new Date(tomorrow.getTime() + 86_400_000)

  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: tomorrow, lt: dayAfter },
      status: 'pending_arrival',
    },
    include: {
      customer: { select: { lineUserId: true, name: true } },
      service: { select: { name: true } },
      barber: { select: { name: true } },
    },
  })

  const shopNameRow = await prisma.setting.findUnique({ where: { key: 'shop_name' } })
  const shopName = shopNameRow?.value ?? 'ร้านตัดผม'

  const tomorrowStr = tomorrow.toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  let sent = 0
  const results = await Promise.allSettled(
    bookings
      .filter((b) => b.customer.lineUserId && !b.customer.lineUserId.startsWith('walkin_'))
      .map((b) =>
        pushMessage(b.customer.lineUserId!, [{
          type: 'text',
          text: `🔔 เตือนนัดพรุ่งนี้\nคิว ${b.queueNumber} · ${tomorrowStr} เวลา ${b.timeSlot} น.\nบริการ: ${b.service.name} (ช่าง${b.barber.name})\n\n${shopName} รอต้อนรับครับ 💈`,
        }])
      )
  )

  sent = results.filter((r) => r.status === 'fulfilled').length

  return NextResponse.json({ ok: true, total: bookings.length, sent })
}
