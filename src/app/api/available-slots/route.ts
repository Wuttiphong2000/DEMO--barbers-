export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { getAvailableSlotsForDate } from '@/lib/booking'
import { isShopOpenOnDate } from '@/lib/hours'
import { ok, err } from '@/lib/api-response'

const querySchema = z.object({
  barberId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string().min(1),
})

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const parsed = querySchema.safeParse({
    barberId: sp.get('barberId'),
    date: sp.get('date'),
    serviceId: sp.get('serviceId'),
  })

  if (!parsed.success) return err(parsed.error.issues[0].message, 400)

  const { barberId, date, serviceId } = parsed.data
  const dateObj = new Date(date)

  const [specialDays, businessHours, settings] = await Promise.all([
    prisma.specialDay.findMany(),
    prisma.businessHour.findMany(),
    prisma.setting.findMany(),
  ])

  const specialDaysFormatted = specialDays.map((s) => ({
    ...s,
    date: new Date(s.date),
  }))

  if (!isShopOpenOnDate(dateObj, specialDaysFormatted, businessHours)) {
    return ok({ slots: [], closed: true })
  }

  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    dateObj.getDay()
  ]
  const todayHours = businessHours.find((h) => h.dayOfWeek === dayName)

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const bufferMinutes = parseInt(settingsMap['buffer_minutes'] ?? '0', 10)

  const slots = await getAvailableSlotsForDate({
    barberId,
    date,
    serviceId,
    openTime: todayHours?.openTime ?? '09:00',
    closeTime: todayHours?.closeTime ?? '18:00',
    bufferMinutes,
  })

  return ok({ slots, closed: false })
}
