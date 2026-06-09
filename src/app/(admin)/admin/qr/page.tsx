'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Download, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function QRPage() {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')
  const bookingUrl = liffId
    ? `https://liff.line.me/${liffId}`
    : `${appUrl}/book`

  useEffect(() => {
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(bookingUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      }).then((url: string) => {
        setQrDataUrl(url)
        setLoading(false)
      })
    })
  }, [bookingUrl])

  function handleDownload() {
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = 'booking-qr.png'
    link.click()
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">QR Code จองคิว</h1>
        <p className="text-sm text-slate-400 mt-0.5">พิมพ์ QR Code นี้ติดหน้าร้านให้ลูกค้าสแกนเพื่อจองคิว</p>
      </div>

      <div className="max-w-sm">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col items-center gap-6">
          {loading ? (
            <div className="h-64 w-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : (
            <>
              <div className="rounded-xl overflow-hidden bg-white p-3 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code จองคิว" className="h-56 w-56" />
              </div>

              <div className="text-center space-y-1">
                <div className="flex items-center gap-2 text-slate-300">
                  <QrCode className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium">สแกนเพื่อจองคิว</span>
                </div>
                <p className="text-xs text-slate-500 break-all">{bookingUrl}</p>
              </div>

              <Button
                onClick={handleDownload}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                ดาวน์โหลด PNG
              </Button>
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
