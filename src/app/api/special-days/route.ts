export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/api-response'
import { getAuthUser } from '@/lib/auth-guard'

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'วันที่ต้องเป็น YYYY-MM-DD'),
  isClosed: z.boolean(),
  note: z.string().max(200).optional(),
})

export async function GET() {
  const specialDays = await prisma.specialDay.findMany({
    orderBy: { date: 'asc' },
  })
  return ok(specialDays)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0].message)

  const { date, isClosed, note } = parsed.data

  const specialDay = await prisma.specialDay.upsert({
    where: { date: new Date(date) },
    create: { date: new Date(date), isClosed, note },
    update: { isClosed, note },
  })
  return ok(specialDay)
}
