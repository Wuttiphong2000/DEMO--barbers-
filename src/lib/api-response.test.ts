import { describe, it, expect } from 'vitest'
import { ok, err } from './api-response'

describe('ok', () => {
  it('returns success response with data', async () => {
    const res = ok({ foo: 'bar' })
    const json = await res.json()
    expect(json).toEqual({ success: true, data: { foo: 'bar' } })
  })

  it('returns 200 status by default', () => {
    const res = ok('hello')
    expect(res.status).toBe(200)
  })

  it('includes meta when provided', async () => {
    const res = ok([1, 2, 3], { total: 3, page: 1, limit: 10 })
    const json = await res.json()
    expect(json).toEqual({
      success: true,
      data: [1, 2, 3],
      meta: { total: 3, page: 1, limit: 10 },
    })
  })

  it('omits meta when not provided', async () => {
    const json = await ok(null).json()
    expect(json).not.toHaveProperty('meta')
  })
})

describe('err', () => {
  it('returns error response with message', async () => {
    const res = err('something went wrong')
    const json = await res.json()
    expect(json).toEqual({ success: false, error: 'something went wrong' })
  })

  it('defaults to 400 status', () => {
    const res = err('bad request')
    expect(res.status).toBe(400)
  })

  it('uses custom status code when provided', () => {
    const res = err('not found', 404)
    expect(res.status).toBe(404)
  })

  it('accepts 500 status', () => {
    const res = err('server error', 500)
    expect(res.status).toBe(500)
  })
})
