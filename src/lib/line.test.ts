import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  validateSignature,
  buildBookingConfirmMessage,
  buildNewBookingOwnerMessage,
  pushMessage,
  replyMessage,
  getUserProfile,
} from './line'

const MOCK_TOKEN = 'mock-channel-access-token'
const MOCK_SECRET = 'mock-channel-secret'

function makeSignature(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64')
}

describe('validateSignature', () => {
  it('returns true for a correct signature', () => {
    const body = '{"events":[]}'
    const sig = makeSignature(body, MOCK_SECRET)
    expect(validateSignature(body, MOCK_SECRET, sig)).toBe(true)
  })

  it('returns false for a wrong signature', () => {
    const body = '{"events":[]}'
    expect(validateSignature(body, MOCK_SECRET, 'wrongsignature==')).toBe(false)
  })

  it('returns false when body differs from signed payload', () => {
    const signed = '{"events":[]}'
    const received = '{"events":[{"type":"follow"}]}'
    const sig = makeSignature(signed, MOCK_SECRET)
    expect(validateSignature(received, MOCK_SECRET, sig)).toBe(false)
  })
})

describe('buildBookingConfirmMessage', () => {
  const booking = {
    queueNumber: 'Q001',
    timeSlot: '10:00',
    date: '2026-06-09',
    barberName: 'สมชาย',
    serviceName: 'ตัดผมชาย',
    servicePrice: 150,
  }

  it('returns a text message type', () => {
    const msg = buildBookingConfirmMessage(booking)
    expect(msg.type).toBe('text')
  })

  it('includes queue number in text', () => {
    const msg = buildBookingConfirmMessage(booking)
    expect(msg.text).toContain('Q001')
  })

  it('includes date and time in text', () => {
    const msg = buildBookingConfirmMessage(booking)
    expect(msg.text).toContain('2026-06-09')
    expect(msg.text).toContain('10:00')
  })

  it('includes barber name and service info', () => {
    const msg = buildBookingConfirmMessage(booking)
    expect(msg.text).toContain('สมชาย')
    expect(msg.text).toContain('ตัดผมชาย')
    expect(msg.text).toContain('150')
  })
})

describe('buildNewBookingOwnerMessage', () => {
  const booking = {
    queueNumber: 'Q002',
    timeSlot: '11:00',
    date: '2026-06-09',
    barberName: 'วิชัย',
    serviceName: 'สระผม',
    servicePrice: 80,
    customerName: 'นายทดสอบ',
  }

  it('returns a text message type', () => {
    const msg = buildNewBookingOwnerMessage(booking)
    expect(msg.type).toBe('text')
  })

  it('includes customer name', () => {
    const msg = buildNewBookingOwnerMessage(booking)
    expect(msg.text).toContain('นายทดสอบ')
  })

  it('includes queue number and time', () => {
    const msg = buildNewBookingOwnerMessage(booking)
    expect(msg.text).toContain('Q002')
    expect(msg.text).toContain('11:00')
  })
})

describe('pushMessage', () => {
  beforeEach(() => {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = MOCK_TOKEN
    vi.stubGlobal('fetch', vi.fn())
  })

  it('calls the LINE push API with correct payload', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }))

    const messages = [{ type: 'text' as const, text: 'Hello' }]
    await pushMessage('U123', messages)

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.line.me/v2/bot/message/push')
    expect(init?.method).toBe('POST')

    const body = JSON.parse(init?.body as string)
    expect(body).toEqual({ to: 'U123', messages })
    expect(init?.headers).toMatchObject({
      Authorization: `Bearer ${MOCK_TOKEN}`,
    })
  })

  it('throws when LINE API returns an error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('error', { status: 500 }))
    await expect(pushMessage('U123', [{ type: 'text', text: 'x' }])).rejects.toThrow('LINE push failed: 500')
  })

  it('throws when token is missing', async () => {
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN
    await expect(pushMessage('U123', [{ type: 'text', text: 'x' }])).rejects.toThrow(
      'LINE_CHANNEL_ACCESS_TOKEN not configured'
    )
  })
})

describe('replyMessage', () => {
  beforeEach(() => {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = MOCK_TOKEN
    vi.stubGlobal('fetch', vi.fn())
  })

  it('calls the LINE reply API with replyToken', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }))

    const messages = [{ type: 'text' as const, text: 'Hi' }]
    await replyMessage('replyToken123', messages)

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://api.line.me/v2/bot/message/reply')
    const body = JSON.parse(init?.body as string)
    expect(body.replyToken).toBe('replyToken123')
    expect(body.messages).toEqual(messages)
  })

  it('throws when LINE API returns an error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('error', { status: 400 }))
    await expect(replyMessage('tok', [{ type: 'text', text: 'x' }])).rejects.toThrow('LINE reply failed: 400')
  })
})

describe('getUserProfile', () => {
  beforeEach(() => {
    process.env.LINE_CHANNEL_ACCESS_TOKEN = MOCK_TOKEN
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns profile data from LINE API', async () => {
    const mockProfile = { userId: 'U123', displayName: 'สมชาย' }
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(mockProfile), { status: 200 }))

    const profile = await getUserProfile('U123')
    expect(profile.userId).toBe('U123')
    expect(profile.displayName).toBe('สมชาย')

    const [url] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://api.line.me/v2/bot/profile/U123')
  })

  it('throws when profile fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('not found', { status: 404 }))
    await expect(getUserProfile('U999')).rejects.toThrow('LINE getProfile failed: 404')
  })
})
