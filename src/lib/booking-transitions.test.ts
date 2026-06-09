import { describe, test, expect } from 'vitest'
import { isValidAdminTransition } from './booking-transitions'

describe('isValidAdminTransition', () => {
  test('pending_arrival → in_progress is allowed', () => {
    expect(isValidAdminTransition('pending_arrival', 'in_progress')).toBe(true)
  })

  test('pending_arrival → cancelled is allowed', () => {
    expect(isValidAdminTransition('pending_arrival', 'cancelled')).toBe(true)
  })

  test('pending_arrival → no_show is allowed', () => {
    expect(isValidAdminTransition('pending_arrival', 'no_show')).toBe(true)
  })

  test('in_progress → done is allowed', () => {
    expect(isValidAdminTransition('in_progress', 'done')).toBe(true)
  })

  test('in_progress → cancelled is allowed', () => {
    expect(isValidAdminTransition('in_progress', 'cancelled')).toBe(true)
  })

  test('done cannot transition further', () => {
    expect(isValidAdminTransition('done', 'cancelled')).toBe(false)
    expect(isValidAdminTransition('done', 'pending_arrival')).toBe(false)
    expect(isValidAdminTransition('done', 'in_progress')).toBe(false)
  })

  test('cancelled cannot transition further', () => {
    expect(isValidAdminTransition('cancelled', 'pending_arrival')).toBe(false)
    expect(isValidAdminTransition('cancelled', 'in_progress')).toBe(false)
  })

  test('no_show cannot transition further', () => {
    expect(isValidAdminTransition('no_show', 'pending_arrival')).toBe(false)
    expect(isValidAdminTransition('no_show', 'cancelled')).toBe(false)
  })

  test('pending_arrival cannot skip directly to done', () => {
    expect(isValidAdminTransition('pending_arrival', 'done')).toBe(false)
  })

  test('same-status transition is not allowed', () => {
    expect(isValidAdminTransition('pending_arrival', 'pending_arrival')).toBe(false)
    expect(isValidAdminTransition('in_progress', 'in_progress')).toBe(false)
  })
})
