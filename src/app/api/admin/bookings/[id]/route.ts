export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { ok, err } from '@/lib/api-response'
import { getAuthUser } from '@/lib/auth-guard'
import { isValidAdminTransition } from '@/lib/booking-transitions'
import { pushMessage } from '@/lib/line'
import type { BookingStatus } from '@/generated/prisma/client'

const patchSchema = z.object({
  status: z.enum(['in_progress', 'done', 'cancelled', 'no_show']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const { id } = await params
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0].message, 400)

  const { status: targetStatus } = parsed.data

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: { select: { lineUserId: true, name: true } },
      service: { select: { name: true } },
      barber: { select: { name: true } },
    },
  })

  if (!booking) return err('Booking not found', 404)

  if (!isValidAdminTransition(booking.status as BookingStatus, targetStatus as BookingStatus)) {
    return err(`Cannot transition from ${booking.status} to ${targetStatus}`, 400)
  }

  await prisma.booking.update({ where: { id }, data: { status: targetStatus } })

  const lineUserId = booking.customer.lineUserId
  const isLineCustomer = lineUserId && !lineUserId.startsWith('walkin_')

  if (targetStatus === 'cancelled' && isLineCustomer) {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID
    void pushMessage(lineUserId!, [{
      type: 'text',
      text: `❌ การจองของคุณถูกยกเลิก\nคิว: ${booking.queueNumber}\nบริการ: ${booking.service.name}\nช่าง: ${booking.barber.name}\n\nหากต้องการจองใหม่: https://liff.line.me/${liffId}`,
    }]).catch(() => {/* swallow push errors */})
  }

  if (targetStatus === 'in_progress' && isLineCustomer) {
    void pushMessage(lineUserId!, [{
      type: 'text',
      text: `✂️ คิว ${booking.queueNumber} ถึงแล้วครับ กรุณาเข้ามาเลย!`,
    }]).catch(() => {/* swallow push errors */})
  }

  return ok({ id, status: targetStatus })
}
