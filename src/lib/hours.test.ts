import { describe, it, expect } from 'vitest'
import {
  isValidTimeFormat,
  validateBusinessHoursDay,
  isBarberAvailable,
  isShopOpenOnDate,
} from './hours'

describe('isValidTimeFormat', () => {
  it('accepts valid HH:MM times', () => {
    expect(isValidTimeFormat('09:00')).toBe(true)
    expect(isValidTimeFormat('18:30')).toBe(true)
    expect(isValidTimeFormat('00:00')).toBe(true)
    expect(isValidTimeFormat('23:59')).toBe(true)
  })

  it('rejects hours above 23', () => {
    expect(isValidTimeFormat('24:00')).toBe(false)
    expect(isValidTimeFormat('25:30')).toBe(false)
  })

  it('rejects minutes above 59', () => {
    expect(isValidTimeFormat('09:60')).toBe(false)
    expect(isValidTimeFormat('12:99')).toBe(false)
  })

  it('rejects non-zero-padded times', () => {
    expect(isValidTimeFormat('9:00')).toBe(false)
    expect(isValidTimeFormat('09:0')).toBe(false)
  })

  it('rejects empty string and non-time strings', () => {
    expect(isValidTimeFormat('')).toBe(false)
    expect(isValidTimeFormat('abc')).toBe(false)
    expect(isValidTimeFormat('9am')).toBe(false)
  })
})

describe('validateBusinessHoursDay', () => {
  it('returns valid when shop is closed (times ignored)', () => {
    const result = validateBusinessHoursDay('', '', true)
    expect(result.valid).toBe(true)
  })

  it('returns valid for correct open < close times', () => {
    const result = validateBusinessHoursDay('09:00', '18:00', false)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('returns error when close time is before open time', () => {
    const result = validateBusinessHoursDay('18:00', '09:00', false)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('returns error when open and close times are equal', () => {
    const result = validateBusinessHoursDay('09:00', '09:00', false)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('returns error when open time has invalid format', () => {
    const result = validateBusinessHoursDay('9:00', '18:00', false)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('returns error when close time has invalid format', () => {
    const result = validateBusinessHoursDay('09:00', '', false)
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('isBarberAvailable', () => {
  it('returns true when barber is active', () => {
    expect(isBarberAvailable({ isActive: true })).toBe(true)
  })

  it('returns false when barber is inactive', () => {
    expect(isBarberAvailable({ isActive: false })).toBe(false)
  })
})

describe('isShopOpenOnDate', () => {
  it('returns false when date is a special closed day', () => {
    const date = new Date('2026-06-15')
    const specialDays = [{ date: new Date('2026-06-15'), isClosed: true }]
    expect(isShopOpenOnDate(date, specialDays, [])).toBe(false)
  })

  it('returns true when date is a special open day (override)', () => {
    const date = new Date('2026-06-14') // Sunday
    const specialDays = [{ date: new Date('2026-06-14'), isClosed: false }]
    const businessHours = [{ dayOfWeek: 'sunday', isClosed: true }]
    expect(isShopOpenOnDate(date, specialDays, businessHours)).toBe(true)
  })

  it('returns false when no business hours configured for that day', () => {
    const date = new Date('2026-06-14') // Sunday
    expect(isShopOpenOnDate(date, [], [])).toBe(false)
  })

  it('returns false when business hours for that day are closed', () => {
    const date = new Date('2026-06-14') // Sunday = 0
    const businessHours = [{ dayOfWeek: 'sunday', isClosed: true }]
    expect(isShopOpenOnDate(date, [], businessHours)).toBe(false)
  })

  it('returns true when business hours for that day are open', () => {
    const date = new Date('2026-06-09') // Tuesday
    const businessHours = [{ dayOfWeek: 'tuesday', isClosed: false }]
    expect(isShopOpenOnDate(date, [], businessHours)).toBe(true)
  })
})
