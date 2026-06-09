export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/api-response'
import { getAuthUser } from '@/lib/auth-guard'
import { validateBusinessHoursDay } from '@/lib/hours'

const DAY_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

const updateDaySchema = z.object({
  dayOfWeek: z.enum(DAY_OF_WEEK),
  openTime: z.string(),
  closeTime: z.string(),
  isClosed: z.boolean(),
})

export async function GET() {
  const hours = await prisma.businessHour.findMany({
    orderBy: { dayOfWeek: 'asc' },
  })
  return ok(hours)
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const body = await req.json()
  const parsed = updateDaySchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0].message)

  const { dayOfWeek, openTime, closeTime, isClosed } = parsed.data

  const validation = validateBusinessHoursDay(openTime, closeTime, isClosed)
  if (!validation.valid) return err(validation.error!)

  const hours = await prisma.businessHour.upsert({
    where: { dayOfWeek },
    create: { dayOfWeek, openTime, closeTime, isClosed },
    update: { openTime, closeTime, isClosed },
  })
  return ok(hours)
}
