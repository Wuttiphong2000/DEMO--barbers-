export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createBooking, type BookingSummary } from '@/lib/booking'
import { ok, err } from '@/lib/api-response'
import { pushMessage, buildBookingConfirmMessage, buildNewBookingOwnerMessage } from '@/lib/line'

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

  const { booking } = result
  const { lineUserId, displayName } = parsed.data

  // fire-and-forget: push failures must not fail the booking
  void sendNotifications(lineUserId, displayName, booking)

  return ok(booking, undefined)
}

async function sendNotifications(lineUserId: string, customerName: string, booking: BookingSummary) {
  const ownerUserId = process.env.LINE_OWNER_USER_ID
  const notificationData = {
    queueNumber: booking.queueNumber,
    timeSlot: booking.timeSlot,
    date: booking.date,
    barberName: booking.barberName,
    serviceName: booking.serviceName,
    servicePrice: booking.servicePrice,
  }

  await Promise.allSettled([
    pushMessage(lineUserId, [buildBookingConfirmMessage(notificationData)]),
    ownerUserId
      ? pushMessage(ownerUserId, [buildNewBookingOwnerMessage({ ...notificationData, customerName })])
      : Promise.resolve(),
  ])
}
