export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/api-response'
import { getAuthUser } from '@/lib/auth-guard'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  price: z.number().min(0).max(99999).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0].message)

  const existing = await prisma.service.findUnique({ where: { id } })
  if (!existing) return err('ไม่พบบริการ', 404)

  const service = await prisma.service.update({ where: { id }, data: parsed.data })
  return ok({ ...service, price: service.price.toNumber() })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const { id } = await params
  const existing = await prisma.service.findUnique({ where: { id } })
  if (!existing) return err('ไม่พบบริการ', 404)

  await prisma.service.delete({ where: { id } })
  return ok({ id })
}
