import { describe, test, expect } from 'vitest'
import { filterBookingsForHourReminder, parseTimeToMinutes } from './cron-utils'

describe('parseTimeToMinutes', () => {
  test('parses "09:00" to 540', () => {
    expect(parseTimeToMinutes('09:00')).toBe(540)
  })

  test('parses "14:30" to 870', () => {
    expect(parseTimeToMinutes('14:30')).toBe(870)
  })

  test('parses "00:00" to 0', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0)
  })

  test('parses "23:59" to 1439', () => {
    expect(parseTimeToMinutes('23:59')).toBe(1439)
  })
})

describe('filterBookingsForHourReminder', () => {
  const booking = (timeSlot: string) => ({
    id: '1',
    timeSlot,
    customerLineUserId: 'U123',
    queueNumber: 'Q001',
    serviceName: 'ตัดผม',
    barberName: 'ช่างต้น',
  })

  test('includes booking exactly 60 minutes away', () => {
    const result = filterBookingsForHourReminder([booking('14:00')], 13 * 60, 60)
    expect(result).toHaveLength(1)
  })

  test('includes booking 30 minutes away', () => {
    const result = filterBookingsForHourReminder([booking('14:00')], 13 * 60 + 30, 60)
    expect(result).toHaveLength(1)
  })

  test('excludes booking more than 60 minutes away', () => {
    const result = filterBookingsForHourReminder([booking('14:01')], 13 * 60, 60)
    expect(result).toHaveLength(0)
  })

  test('excludes booking at current time (already passed or now)', () => {
    const result = filterBookingsForHourReminder([booking('14:00')], 14 * 60, 60)
    expect(result).toHaveLength(0)
  })

  test('excludes past bookings', () => {
    const result = filterBookingsForHourReminder([booking('13:00')], 14 * 60, 60)
    expect(result).toHaveLength(0)
  })

  test('filters only bookings within window from multiple', () => {
    const bookings = [
      booking('14:00'),  // 60 min away from 13:00 → included
      booking('14:01'),  // 61 min away → excluded
      booking('13:30'),  // 30 min away → included
      booking('12:00'),  // past → excluded
    ]
    const result = filterBookingsForHourReminder(bookings, 13 * 60, 60)
    expect(result).toHaveLength(2)
  })

  test('excludes walk-in customers (walkin_ prefix)', () => {
    const walkIn = { ...booking('14:00'), customerLineUserId: 'walkin_123abc' }
    const result = filterBookingsForHourReminder([walkIn], 13 * 60, 60)
    expect(result).toHaveLength(0)
  })
})
