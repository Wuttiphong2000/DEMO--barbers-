import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/api-response'
import { getAuthUser } from '@/lib/auth-guard'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const { id } = await params
  const existing = await prisma.specialDay.findUnique({ where: { id } })
  if (!existing) return err('ไม่พบวันพิเศษ', 404)

  await prisma.specialDay.delete({ where: { id } })
  return ok({ id })
}
