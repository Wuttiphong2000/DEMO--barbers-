import { describe, it, expect } from 'vitest'
import { generateQueueNumber, parseQueueNumber } from './queue'

describe('generateQueueNumber', () => {
  it('returns Q001 when no bookings exist for the day', () => {
    expect(generateQueueNumber([])).toBe('Q001')
  })

  it('increments from existing queue numbers', () => {
    expect(generateQueueNumber(['Q001', 'Q002'])).toBe('Q003')
  })

  it('pads to 3 digits', () => {
    expect(generateQueueNumber(['Q009'])).toBe('Q010')
  })

  it('handles gaps in sequence and finds next after max', () => {
    expect(generateQueueNumber(['Q001', 'Q003'])).toBe('Q004')
  })

  it('handles large queue numbers', () => {
    const existing = Array.from({ length: 99 }, (_, i) =>
      `Q${String(i + 1).padStart(3, '0')}`
    )
    expect(generateQueueNumber(existing)).toBe('Q100')
  })

  it('returns Q001 for empty array', () => {
    expect(generateQueueNumber([])).toBe('Q001')
  })
})

describe('parseQueueNumber', () => {
  it('extracts numeric value from queue number string', () => {
    expect(parseQueueNumber('Q001')).toBe(1)
    expect(parseQueueNumber('Q042')).toBe(42)
    expect(parseQueueNumber('Q100')).toBe(100)
  })
})
