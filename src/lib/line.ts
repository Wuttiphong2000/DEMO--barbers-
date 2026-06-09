import { createHmac } from 'node:crypto'

const LINE_API_BASE = 'https://api.line.me'

export interface LineTextMessage {
  type: 'text'
  text: string
}

export type LineMessage = LineTextMessage

export interface LineUserProfile {
  userId: string
  displayName: string
  pictureUrl?: string
}

export interface BookingNotificationData {
  queueNumber: string
  timeSlot: string
  date: string
  barberName: string
  serviceName: string
  servicePrice: number
}

export interface OwnerNotificationData extends BookingNotificationData {
  customerName: string
}

function getToken(): string {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN not configured')
  return token
}

export function validateSignature(rawBody: string, secret: string, signature: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('base64')
  return expected === signature
}

export function buildBookingConfirmMessage(data: BookingNotificationData): LineTextMessage {
  return {
    type: 'text',
    text: [
      '✅ จองคิวสำเร็จ!',
      `หมายเลขคิว: ${data.queueNumber}`,
      `วันที่: ${data.date}`,
      `เวลา: ${data.timeSlot} น.`,
      `ช่างตัดผม: ${data.barberName}`,
      `บริการ: ${data.serviceName}`,
      `ราคา: ${data.servicePrice.toLocaleString('th-TH')} บาท`,
    ].join('\n'),
  }
}

export function buildNewBookingOwnerMessage(data: OwnerNotificationData): LineTextMessage {
  return {
    type: 'text',
    text: [
      '🔔 มีการจองคิวใหม่!',
      `หมายเลขคิว: ${data.queueNumber}`,
      `ลูกค้า: ${data.customerName}`,
      `วันที่: ${data.date}`,
      `เวลา: ${data.timeSlot} น.`,
      `ช่างตัดผม: ${data.barberName}`,
      `บริการ: ${data.serviceName}`,
    ].join('\n'),
  }
}

export async function getUserProfile(userId: string): Promise<LineUserProfile> {
  const resp = await fetch(`${LINE_API_BASE}/v2/bot/profile/${userId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!resp.ok) throw new Error(`LINE getProfile failed: ${resp.status}`)
  return resp.json() as Promise<LineUserProfile>
}

export async function pushMessage(userId: string, messages: LineMessage[]): Promise<void> {
  const resp = await fetch(`${LINE_API_BASE}/v2/bot/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  })
  if (!resp.ok) throw new Error(`LINE push failed: ${resp.status}`)
}

export async function replyMessage(replyToken: string, messages: LineMessage[]): Promise<void> {
  const resp = await fetch(`${LINE_API_BASE}/v2/bot/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
  if (!resp.ok) throw new Error(`LINE reply failed: ${resp.status}`)
}
