export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { pushMessage } from '@/lib/line'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const bangkokOffset = 7 * 60 * 60 * 1000
  const bangkokNow = new Date(now.getTime() + bangkokOffset)
  const tomorrow = new Date(Date.UTC(bangkokNow.getUTCFullYear(), bangkokNow.getUTCMonth(), bangkokNow.getUTCDate() + 1) - bangkokOffset)
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

  const bangkokTomorrow = new Date(bangkokNow.getTime() + 86_400_000)
  const TH_DAYS_LONG = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
  const TH_MONTHS_LONG = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
  const tomorrowStr = `วัน${TH_DAYS_LONG[bangkokTomorrow.getUTCDay()]}ที่ ${bangkokTomorrow.getUTCDate()} ${TH_MONTHS_LONG[bangkokTomorrow.getUTCMonth()]}`

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
