export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from 'next/server'
import { validateSignature, getUserProfile, replyMessage } from '@/lib/line'
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

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  const replyText = liffId
    ? `สวัสดีครับ! 💈\nกดจองคิวได้เลยที่นี่:\nhttps://liff.line.me/${liffId}`
    : 'สวัสดีครับ! กรุณาติดต่อร้านเพื่อจองคิว'

  await replyMessage(event.replyToken, [{ type: 'text', text: replyText }])
}
