'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-slate-950 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">เกิดข้อผิดพลาด</h2>
        <p className="mt-1 text-sm text-slate-400">
          {error.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่'}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        ลองใหม่
      </button>
    </div>
  )
}
