export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { validateSignature, getUserProfile, replyMessage, pushMessage } from '@/lib/line'
import { prisma } from '@/lib/db/prisma'

interface LineSource {
  type: string
  userId?: string
}

interface LineFollowEvent {
  type: 'follow'
  replyToken: string
  source: LineSource
}

interface LineMessageEvent {
  type: 'message'
  replyToken: string
  source: LineSource
  message: { type: string; text?: string }
}

type LineEvent = LineFollowEvent | LineMessageEvent | { type: string; replyToken?: string; source?: LineSource }

interface LineWebhookBody {
  destination: string
  events: LineEvent[]
}

const LATE_KEYWORDS = ['แจ้งมาสาย', 'มาสาย', 'มาช้า', 'แจ้งช้า', 'late']

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text()
  const signature = request.headers.get('x-line-signature')

  const secret = process.env.LINE_CHANNEL_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })
  }

  if (!signature || !validateSignature(rawBody, secret, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let body: LineWebhookBody
  try {
    body = JSON.parse(rawBody) as LineWebhookBody
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  await Promise.allSettled(body.events.map(processEvent))

  return NextResponse.json({ ok: true })
}

async function processEvent(event: LineEvent): Promise<void> {
  if (event.type === 'follow') {
    await handleFollow(event as LineFollowEvent)
  } else if (event.type === 'message') {
    await handleMessage(event as LineMessageEvent)
  }
}

async function handleFollow(event: LineFollowEvent): Promise<void> {
  const userId = event.source.userId
  if (!userId) return

  let displayName = 'ลูกค้า'
  try {
    const profile = await getUserProfile(userId)
    displayName = profile.displayName
  } catch {
    // profile fetch fails → use default name
  }

  await prisma.customer.upsert({
    where: { lineUserId: userId },
    update: { name: displayName },
    create: { lineUserId: userId, name: displayName },
  })
}

async function handleMessage(event: LineMessageEvent): Promise<void> {
  const userId = event.source.userId
  if (!userId) return

  const text = event.message.type === 'text' ? (event.message.text ?? '') : ''
  const isLateReport = LATE_KEYWORDS.some((kw) => text.toLowerCase().includes(kw))

  if (isLateReport) {
    await handleLateReport(userId, event.replyToken)
    return
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  const replyText = liffId
    ? `สวัสดีครับ! 💈\nกดจองคิวได้เลยที่นี่:\nhttps://liff.line.me/${liffId}`
    : 'สวัสดีครับ! กรุณาติดต่อร้านเพื่อจองคิว'

  await replyMessage(event.replyToken, [{ type: 'text', text: replyText }])
}

async function handleLateReport(userId: string, replyToken: string): Promise<void> {
  const now = new Date()
  const bangkokOffset = 7 * 60 * 60 * 1000
  const bangkokNow = new Date(now.getTime() + bangkokOffset)
  const today = new Date(Date.UTC(bangkokNow.getUTCFullYear(), bangkokNow.getUTCMonth(), bangkokNow.getUTCDate()) - bangkokOffset)
  const tomorrow = new Date(today.getTime() + 86_400_000)

  const booking = await prisma.booking.findFirst({
    where: {
      customer: { lineUserId: userId },
      date: { gte: today, lt: tomorrow },
      status: 'pending_arrival',
    },
    include: {
      service: { select: { name: true } },
      barber: { select: { name: true } },
    },
    orderBy: { timeSlot: 'asc' },
  })

  if (!booking) {
    await replyMessage(replyToken, [{
      type: 'text',
      text: 'ขออภัยครับ ไม่พบการจองวันนี้ของคุณ\nกรุณาติดต่อร้านโดยตรงครับ',
    }])
    return
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { notes: 'LATE_REPORTED' },
  })

  await replyMessage(replyToken, [{
    type: 'text',
    text: `✅ รับทราบแล้วครับ!\nคิว ${booking.queueNumber} · ${booking.timeSlot} น.\nเจ้าของร้านจะรับทราบว่าคุณกำลังเดินทางมาอยู่ครับ 🙏`,
  }])

  const ownerUserId = process.env.LINE_OWNER_USER_ID
  if (ownerUserId) {
    void pushMessage(ownerUserId, [{
      type: 'text',
      text: `⚠️ ลูกค้าแจ้งมาสาย\nคิว ${booking.queueNumber} · ${booking.timeSlot} น.\nบริการ: ${booking.service.name} (ช่าง${booking.barber.name})`,
    }]).catch(() => {/* swallow */})
  }
}
