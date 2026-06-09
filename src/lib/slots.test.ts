import { describe, it, expect } from 'vitest'
import { generateTimeSlots, isSlotAvailable, addMinutesToTime, timeToMinutes } from './slots'

describe('timeToMinutes', () => {
  it('converts HH:MM to total minutes', () => {
    expect(timeToMinutes('09:00')).toBe(540)
    expect(timeToMinutes('10:30')).toBe(630)
    expect(timeToMinutes('18:00')).toBe(1080)
    expect(timeToMinutes('00:00')).toBe(0)
  })
})

describe('addMinutesToTime', () => {
  it('adds minutes and returns HH:MM string', () => {
    expect(addMinutesToTime('09:00', 60)).toBe('10:00')
    expect(addMinutesToTime('09:00', 90)).toBe('10:30')
    expect(addMinutesToTime('23:00', 60)).toBe('00:00')
  })
})

describe('isSlotAvailable', () => {
  it('returns true when slot is not taken', () => {
    expect(isSlotAvailable('09:00', ['10:00', '11:00'])).toBe(true)
  })

  it('returns false when slot is taken', () => {
    expect(isSlotAvailable('10:00', ['10:00', '11:00'])).toBe(false)
  })
})

describe('generateTimeSlots', () => {
  it('generates slots from open to close time', () => {
    const slots = generateTimeSlots({
      openTime: '09:00',
      closeTime: '11:00',
      durationMinutes: 60,
      bufferMinutes: 0,
      takenSlots: [],
    })
    expect(slots).toEqual(['09:00', '10:00'])
  })

  it('does not include slot if it would extend past close time', () => {
    const slots = generateTimeSlots({
      openTime: '09:00',
      closeTime: '10:30',
      durationMinutes: 60,
      bufferMinutes: 0,
      takenSlots: [],
    })
    expect(slots).toEqual(['09:00'])
  })

  it('applies buffer between slots', () => {
    // 09:00→10:00, 10:15→11:15, 11:30→12:30 (past close 12:00) — 11:30 excluded
    const slots = generateTimeSlots({
      openTime: '09:00',
      closeTime: '12:00',
      durationMinutes: 60,
      bufferMinutes: 15,
      takenSlots: [],
    })
    expect(slots).toEqual(['09:00', '10:15'])
  })

  it('excludes taken slots', () => {
    const slots = generateTimeSlots({
      openTime: '09:00',
      closeTime: '12:00',
      durationMinutes: 60,
      bufferMinutes: 0,
      takenSlots: ['10:00'],
    })
    expect(slots).toEqual(['09:00', '11:00'])
  })

  it('returns empty array when shop is fully booked', () => {
    const slots = generateTimeSlots({
      openTime: '09:00',
      closeTime: '11:00',
      durationMinutes: 60,
      bufferMinutes: 0,
      takenSlots: ['09:00', '10:00'],
    })
    expect(slots).toEqual([])
  })

  it('returns empty array when duration equals shop hours', () => {
    const slots = generateTimeSlots({
      openTime: '09:00',
      closeTime: '10:00',
      durationMinutes: 60,
      bufferMinutes: 0,
      takenSlots: [],
    })
    expect(slots).toEqual(['09:00'])
  })

  it('handles 30-minute service with 10-minute buffer', () => {
    // step=40min: 09:00, 09:40, 10:20, next would be 11:00 but 11:00+30=11:30 > 11:00 close
    const slots = generateTimeSlots({
      openTime: '09:00',
      closeTime: '11:00',
      durationMinutes: 30,
      bufferMinutes: 10,
      takenSlots: [],
    })
    expect(slots).toEqual(['09:00', '09:40', '10:20'])
  })
})
