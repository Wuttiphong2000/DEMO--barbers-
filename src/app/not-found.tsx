import Link from 'next/link'
import { Scissors } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-950 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
        <Scissors className="h-8 w-8 text-amber-400" />
      </div>
      <div>
        <p className="font-mono text-6xl font-black text-stone-700">404</p>
        <h1 className="mt-2 text-lg font-semibold text-stone-50">ไม่พบหน้านี้</h1>
        <p className="mt-1 text-sm text-stone-500">หน้าที่คุณต้องการไม่มีอยู่หรือถูกย้ายไปแล้ว</p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-stone-800 px-5 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-700 hover:text-stone-50"
      >
        กลับหน้าแรก
      </Link>
    </div>
  )
}
