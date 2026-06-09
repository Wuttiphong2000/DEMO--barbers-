import { NextResponse } from 'next/server'

interface ApiMeta {
  total?: number
  page?: number
  limit?: number
}

export function ok<T>(data: T, meta?: ApiMeta) {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}
