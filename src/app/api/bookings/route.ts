import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createBooking } from '@/lib/booking'
import { ok, err } from '@/lib/api-response'

const bookingSchema = z.object({
  lineUserId: z.string().min(1),
  displayName: z.string().min(1),
  serviceId: z.string().min(1),
  barberId: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const body: unknown = await request.json()
  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.issues[0].message, 400)
  }

  const result = await createBooking(parsed.data)

  if (!result.success) {
    const status = result.error === 'slot_taken' ? 409 : 400
    return err(result.error, status)
  }

  return ok(result.booking, undefined)
}
