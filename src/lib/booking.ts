import { prisma } from '@/lib/db/prisma'
import { generateQueueNumber } from './queue'
import { generateTimeSlots } from './slots'
import type { BookingSource } from '@/generated/prisma/client'

export interface CreateBookingInput {
  lineUserId: string
  displayName: string
  serviceId: string
  barberId: string | null
  date: string
  timeSlot: string
  source?: BookingSource
  notes?: string
}

export interface BookingSummary {
  id: string
  queueNumber: string
  timeSlot: string
  date: string
  status: string
  barberId: string
  barberName: string
  serviceName: string
  servicePrice: number
  serviceDuration: number
}

export type CreateBookingResult =
  | { success: true; booking: BookingSummary }
  | { success: false; error: 'slot_taken' | 'no_barber_available' | 'service_not_found' | 'barber_not_found' }

export interface GetAvailableSlotsInput {
  barberId: string
  date: string
  serviceId: string
  openTime: string
  closeTime: string
  bufferMinutes: number
}

export async function getAvailableSlotsForDate(input: GetAvailableSlotsInput): Promise<string[]> {
  const { barberId, date, serviceId, openTime, closeTime, bufferMinutes } = input

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) return []

  const takenBookings = await prisma.booking.findMany({
    where: {
      barberId,
      date: new Date(date),
      status: { not: 'cancelled' },
    },
    select: { timeSlot: true },
  })

  const takenSlots = takenBookings.map((b) => b.timeSlot)

  return generateTimeSlots({
    openTime,
    closeTime,
    durationMinutes: service.durationMinutes,
    bufferMinutes,
    takenSlots,
  })
}

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { lineUserId, displayName, serviceId, date, timeSlot, source = 'line', notes } = input
  let { barberId } = input

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) return { success: false, error: 'service_not_found' }

  if (barberId !== null) {
    const barber = await prisma.barber.findUnique({ where: { id: barberId } })
    if (!barber) return { success: false, error: 'barber_not_found' }
  } else {
    const activeBarbers = await prisma.barber.findMany({ where: { isActive: true } })
    if (activeBarbers.length === 0) return { success: false, error: 'no_barber_available' }

    const dateObj = new Date(date)
    const taken = await prisma.booking.findMany({
      where: {
        date: dateObj,
        timeSlot,
        status: { not: 'cancelled' },
      },
      select: { barberId: true },
    })

    const takenBarberIds = new Set(taken.map((b) => b.barberId))
    const available = activeBarbers.filter((b) => !takenBarberIds.has(b.id))
    if (available.length === 0) return { success: false, error: 'no_barber_available' }

    barberId = available[Math.floor(Math.random() * available.length)].id
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { lineUserId },
        create: { lineUserId, name: displayName },
        update: { name: displayName },
      })

      const existingQueueNumbers = await tx.booking.findMany({
        where: {
          date: new Date(date),
          status: { not: 'cancelled' },
        },
        select: { queueNumber: true },
      })

      const queueNumber = generateQueueNumber(existingQueueNumbers.map((b) => b.queueNumber))

      return tx.booking.create({
        data: {
          customerId: customer.id,
          serviceId,
          barberId: barberId!,
          date: new Date(date),
          timeSlot,
          queueNumber,
          source,
          notes: notes ?? null,
        },
        include: {
          barber: { select: { name: true } },
          service: { select: { name: true, price: true, durationMinutes: true } },
        },
      })
    })

    return {
      success: true,
      booking: {
        id: booking.id,
        queueNumber: booking.queueNumber,
        timeSlot: booking.timeSlot,
        date: booking.date.toISOString().slice(0, 10),
        status: booking.status,
        barberId: booking.barberId,
        barberName: booking.barber.name,
        serviceName: booking.service.name,
        servicePrice: booking.service.price.toNumber(),
        serviceDuration: booking.service.durationMinutes,
      },
    }
  } catch (err: unknown) {
    if (isPrismaUniqueConstraintError(err)) {
      return { success: false, error: 'slot_taken' }
    }
    throw err
  }
}

export interface CreateWalkInInput {
  customerName?: string
  serviceId: string
  barberId?: string | null
  date: string
  timeSlot: string
}

export async function createWalkInBooking(input: CreateWalkInInput): Promise<CreateBookingResult> {
  const { customerName, serviceId, date, timeSlot } = input
  let { barberId } = input

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) return { success: false, error: 'service_not_found' }

  if (barberId) {
    const barber = await prisma.barber.findUnique({ where: { id: barberId } })
    if (!barber) return { success: false, error: 'barber_not_found' }
  } else {
    const activeBarbers = await prisma.barber.findMany({ where: { isActive: true } })
    if (activeBarbers.length === 0) return { success: false, error: 'no_barber_available' }

    const dateObj = new Date(date)
    const taken = await prisma.booking.findMany({
      where: { date: dateObj, timeSlot, status: { not: 'cancelled' } },
      select: { barberId: true },
    })
    const takenBarberIds = new Set(taken.map((b) => b.barberId))
    const available = activeBarbers.filter((b) => !takenBarberIds.has(b.id))
    if (available.length === 0) return { success: false, error: 'no_barber_available' }
    barberId = available[Math.floor(Math.random() * available.length)].id
  }

  try {
    const uniqueLineUserId = `walkin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const booking = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: { lineUserId: uniqueLineUserId, name: customerName ?? 'Walk-in' },
      })

      const existingQueueNumbers = await tx.booking.findMany({
        where: { date: new Date(date), status: { not: 'cancelled' } },
        select: { queueNumber: true },
      })
      const queueNumber = generateQueueNumber(existingQueueNumbers.map((b) => b.queueNumber))

      return tx.booking.create({
        data: {
          customerId: customer.id,
          serviceId,
          barberId: barberId!,
          date: new Date(date),
          timeSlot,
          queueNumber,
          source: 'walk_in',
        },
        include: {
          barber: { select: { name: true } },
          service: { select: { name: true, price: true, durationMinutes: true } },
        },
      })
    })

    return {
      success: true,
      booking: {
        id: booking.id,
        queueNumber: booking.queueNumber,
        timeSlot: booking.timeSlot,
        date: booking.date.toISOString().slice(0, 10),
        status: booking.status,
        barberId: booking.barberId,
        barberName: booking.barber.name,
        serviceName: booking.service.name,
        servicePrice: booking.service.price.toNumber(),
        serviceDuration: booking.service.durationMinutes,
      },
    }
  } catch (err: unknown) {
    if (isPrismaUniqueConstraintError(err)) {
      return { success: false, error: 'slot_taken' }
    }
    throw err
  }
}

function isPrismaUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2002'
  )
}
