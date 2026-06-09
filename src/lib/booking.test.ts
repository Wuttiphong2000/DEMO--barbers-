import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db/prisma'
import { createBooking, getAvailableSlotsForDate } from './booking'

// Shared test data IDs
let serviceId: string
let barberId: string

beforeEach(async () => {
  // Clean up bookings and customers from previous runs
  await prisma.booking.deleteMany({ where: { notes: 'TEST' } })
  await prisma.customer.deleteMany({ where: { lineUserId: { startsWith: 'Utest_' } } })

  const service = await prisma.service.create({
    data: {
      name: 'TEST_SERVICE',
      durationMinutes: 30,
      price: 100,
      isActive: true,
    },
  })
  serviceId = service.id

  const barber = await prisma.barber.create({
    data: {
      name: 'TEST_BARBER',
      isActive: true,
    },
  })
  barberId = barber.id
})

afterEach(async () => {
  await prisma.booking.deleteMany({ where: { notes: 'TEST' } })
  await prisma.customer.deleteMany({ where: { lineUserId: { startsWith: 'Utest_' } } })
  await prisma.service.deleteMany({ where: { name: 'TEST_SERVICE' } })
  await prisma.barber.deleteMany({ where: { name: 'TEST_BARBER' } })
})

describe('createBooking', () => {
  test('creates booking successfully and returns queue number', async () => {
    // Arrange
    const date = '2030-01-15'

    // Act
    const result = await createBooking({
      lineUserId: 'Utest_001',
      displayName: 'Test Customer',
      serviceId,
      barberId,
      date,
      timeSlot: '10:00',
      notes: 'TEST',
    })

    // Assert
    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.booking.queueNumber).toMatch(/^Q\d{3}$/)
    expect(result.booking.timeSlot).toBe('10:00')
    expect(result.booking.status).toBe('pending_arrival')
  })

  test('upserts customer by lineUserId — same customer re-books', async () => {
    // Arrange
    const date1 = '2030-01-16'
    const date2 = '2030-01-17'

    // Act
    const r1 = await createBooking({
      lineUserId: 'Utest_002',
      displayName: 'Repeat Customer',
      serviceId,
      barberId,
      date: date1,
      timeSlot: '09:00',
      notes: 'TEST',
    })
    const r2 = await createBooking({
      lineUserId: 'Utest_002',
      displayName: 'Repeat Customer',
      serviceId,
      barberId,
      date: date2,
      timeSlot: '09:00',
      notes: 'TEST',
    })

    // Assert
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)

    const customers = await prisma.customer.findMany({ where: { lineUserId: 'Utest_002' } })
    expect(customers).toHaveLength(1)
  })

  test('returns slot_taken when double-booking same barber+date+slot', async () => {
    // Arrange
    const date = '2030-01-18'

    await createBooking({
      lineUserId: 'Utest_003a',
      displayName: 'First',
      serviceId,
      barberId,
      date,
      timeSlot: '11:00',
      notes: 'TEST',
    })

    // Act — second booking for same slot
    const result = await createBooking({
      lineUserId: 'Utest_003b',
      displayName: 'Second',
      serviceId,
      barberId,
      date,
      timeSlot: '11:00',
      notes: 'TEST',
    })

    // Assert
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error).toBe('slot_taken')
  })

  test('auto-assigns an active barber when barberId is null', async () => {
    // Arrange
    const date = '2030-01-19'

    // Act
    const result = await createBooking({
      lineUserId: 'Utest_004',
      displayName: 'Any Barber',
      serviceId,
      barberId: null,
      date,
      timeSlot: '14:00',
      notes: 'TEST',
    })

    // Assert
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.booking.barberId).toBeDefined()
  })

  test('returns no_barber_available when all barbers are inactive', async () => {
    // Deactivate ALL active barbers temporarily for isolation
    const activeBarbers = await prisma.barber.findMany({ where: { isActive: true } })
    await prisma.barber.updateMany({ where: { isActive: true }, data: { isActive: false } })

    try {
      const date = '2030-01-20'

      // Act
      const result = await createBooking({
        lineUserId: 'Utest_005',
        displayName: 'Test',
        serviceId,
        barberId: null,
        date,
        timeSlot: '10:00',
        notes: 'TEST',
      })

      // Assert
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.error).toBe('no_barber_available')
    } finally {
      // Restore original active state
      await prisma.barber.updateMany({
        where: { id: { in: activeBarbers.map((b) => b.id) } },
        data: { isActive: true },
      })
    }
  })

  test('queue numbers are sequential per day', async () => {
    // Arrange
    const date = '2030-01-21'

    // Act — book two different slots on same day
    const r1 = await createBooking({
      lineUserId: 'Utest_006a',
      displayName: 'First',
      serviceId,
      barberId,
      date,
      timeSlot: '09:00',
      notes: 'TEST',
    })
    const r2 = await createBooking({
      lineUserId: 'Utest_006b',
      displayName: 'Second',
      serviceId,
      barberId,
      date,
      timeSlot: '10:00',
      notes: 'TEST',
    })

    // Assert
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
    if (!r1.success || !r2.success) return

    const n1 = parseInt(r1.booking.queueNumber.replace('Q', ''), 10)
    const n2 = parseInt(r2.booking.queueNumber.replace('Q', ''), 10)
    expect(n2).toBe(n1 + 1)
  })

  test('queue numbers reset on a new day', async () => {
    // Arrange
    const day1 = '2030-01-22'
    const day2 = '2030-01-23'

    // Act
    const r1 = await createBooking({
      lineUserId: 'Utest_007a',
      displayName: 'Day1',
      serviceId,
      barberId,
      date: day1,
      timeSlot: '09:00',
      notes: 'TEST',
    })
    const r2 = await createBooking({
      lineUserId: 'Utest_007b',
      displayName: 'Day2',
      serviceId,
      barberId,
      date: day2,
      timeSlot: '09:00',
      notes: 'TEST',
    })

    // Assert
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)
    if (!r1.success || !r2.success) return

    expect(r2.booking.queueNumber).toBe('Q001')
  })
})

describe('getAvailableSlotsForDate', () => {
  test('returns slots for a given barber+date (excluding taken)', async () => {
    // Arrange
    const date = '2030-02-01'

    // Book one slot first
    await createBooking({
      lineUserId: 'Utest_100',
      displayName: 'Taker',
      serviceId,
      barberId,
      date,
      timeSlot: '10:00',
      notes: 'TEST',
    })

    // Act
    const slots = await getAvailableSlotsForDate({
      barberId,
      date,
      serviceId,
      openTime: '09:00',
      closeTime: '18:00',
      bufferMinutes: 0,
    })

    // Assert
    expect(slots).not.toContain('10:00')
    expect(slots).toContain('10:30')
  })

  test('returns empty array when all slots are taken', async () => {
    // For a 1-hour service in a 1-hour window (single slot at 09:00)
    const date = '2030-02-02'

    await createBooking({
      lineUserId: 'Utest_101',
      displayName: 'Taker',
      serviceId,
      barberId,
      date,
      timeSlot: '09:00',
      notes: 'TEST',
    })

    // Act — narrow window of exactly 1 slot
    const slots = await getAvailableSlotsForDate({
      barberId,
      date,
      serviceId,
      openTime: '09:00',
      closeTime: '09:30',
      bufferMinutes: 0,
    })

    // Assert
    expect(slots).toHaveLength(0)
  })
})
