import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Classic Cut Barbershop',
  description: 'ระบบจองคิวออนไลน์',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={dmSans.variable}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
