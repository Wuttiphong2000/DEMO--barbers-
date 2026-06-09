import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/api-response'
import { getAuthUser } from '@/lib/auth-guard'

const updateSchema = z.object({
  shopName: z.string().min(1).max(100).optional(),
  gracePeriodMinutes: z.number().int().min(0).max(60).optional(),
  bufferMinutes: z.number().int().min(0).max(60).optional(),
})

export async function GET() {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const rows = await prisma.setting.findMany()
  const settings = Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value]))
  return ok(settings)
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0].message)

  const updates: Record<string, string> = {}
  if (parsed.data.shopName !== undefined) updates['shop_name'] = parsed.data.shopName
  if (parsed.data.gracePeriodMinutes !== undefined)
    updates['grace_period_minutes'] = String(parsed.data.gracePeriodMinutes)
  if (parsed.data.bufferMinutes !== undefined)
    updates['buffer_minutes'] = String(parsed.data.bufferMinutes)

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  )

  const rows = await prisma.setting.findMany()
  return ok(Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value])))
}
