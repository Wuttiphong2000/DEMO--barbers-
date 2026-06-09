import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/api-response'
import { getAuthUser } from '@/lib/auth-guard'

const createSchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อช่าง').max(100),
  isActive: z.boolean().optional().default(true),
})

export async function GET() {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const barbers = await prisma.barber.findMany({ orderBy: { createdAt: 'asc' } })
  return ok(barbers)
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0].message)

  const barber = await prisma.barber.create({ data: parsed.data })
  return ok(barber)
}
