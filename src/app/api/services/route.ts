import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/api-response'
import { getAuthUser } from '@/lib/auth-guard'

const createSchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อบริการ').max(100),
  durationMinutes: z.number().int().min(5).max(480),
  price: z.number().min(0).max(99999),
  isActive: z.boolean().optional().default(true),
})

export async function GET() {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const services = await prisma.service.findMany({
    orderBy: { createdAt: 'asc' },
  })

  return ok(services.map((s) => ({ ...s, price: s.price.toNumber() })))
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0].message)

  const { name, durationMinutes, price, isActive } = parsed.data

  const service = await prisma.service.create({
    data: { name, durationMinutes, price, isActive },
  })

  return ok({ ...service, price: service.price.toNumber() }, undefined)
}
