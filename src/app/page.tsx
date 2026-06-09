import Link from 'next/link'
import { Scissors, CalendarCheck, MessageCircle } from 'lucide-react'
import { prisma } from '@/lib/db/prisma'

async function getShopName(): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'shop_name' } })
    return row?.value ?? 'ร้านตัดผม'
  } catch {
    return 'ร้านตัดผม'
  }
}

const LIFF_URL = process.env.NEXT_PUBLIC_LIFF_ID
  ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`
  : '/book'

const STEPS = [
  { icon: Scissors, label: 'เลือกบริการ', desc: 'ตัดผม ทำสี แต่งหนวด ฯลฯ' },
  { icon: CalendarCheck, label: 'เลือกวันและเวลา', desc: 'ดูสล็อตว่างแบบ real-time' },
  { icon: MessageCircle, label: 'รับยืนยันทาง LINE', desc: 'หมายเลขคิวส่งถึงมือคุณ' },
]

export default async function Home() {
  const shopName = await getShopName()

  return (
    <div className="flex min-h-screen flex-col bg-stone-950">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        {/* Brand icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/10">
          <Scissors className="h-10 w-10 text-amber-400" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight text-stone-50 sm:text-5xl">
          {shopName}
        </h1>
        <p className="mt-3 text-lg text-stone-400">
          จองคิวออนไลน์ได้ตลอด 24 ชั่วโมง ไม่ต้องโทรนัด
        </p>

        {/* LINE CTA */}
        <a
          href={LIFF_URL}
          className="mt-8 flex items-center gap-2.5 rounded-2xl bg-amber-500 px-8 py-4 text-lg font-semibold text-stone-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-stone-950">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          จองคิวผ่าน LINE
        </a>

        {/* Steps */}
        <div className="mt-14 grid w-full max-w-lg gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900/60 px-4 py-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800">
                <step.icon className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-xs font-medium text-stone-300">{step.label}</span>
              <span className="text-center text-xs text-stone-500">{step.desc}</span>
            </div>
          ))}
        </div>
      </main>

      <footer className="flex items-center justify-center pb-8 pt-4">
        <Link
          href="/login"
          className="text-xs text-stone-600 transition-colors hover:text-stone-400"
        >
          เข้าสู่ระบบสำหรับเจ้าของร้าน
        </Link>
      </footer>
    </div>
  )
}
