import { MobileLayout } from '@/components/admin/MobileLayout'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <MobileLayout>{children}</MobileLayout>
}
