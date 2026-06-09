export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ok, err } from '@/lib/api-response'
import { getAuthUser } from '@/lib/auth-guard'
import { createWalkInBooking } from '@/lib/booking'

const walkInSchema = z.object({
  customerName: z.string().max(100).optional(),
  serviceId: z.string().min(1),
  barberId: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/),
})

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return err('Unauthorized', 401)

  const body = await request.json()
  const parsed = walkInSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues[0].message, 400)

  const result = await createWalkInBooking(parsed.data)

  if (!result.success) {
    const messages: Record<string, string> = {
      service_not_found: 'ไม่พบบริการนี้',
      barber_not_found: 'ไม่พบช่างนี้',
      no_barber_available: 'ไม่มีช่างว่างในเวลานี้',
      slot_taken: 'เวลานี้ถูกจองแล้ว กรุณาลองใหม่',
    }
    return err(messages[result.error] ?? result.error, 400)
  }

  return NextResponse.json({ success: true, data: result.booking }, { status: 201 })
}
