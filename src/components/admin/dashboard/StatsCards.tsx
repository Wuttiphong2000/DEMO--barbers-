import type { DashboardStats } from './types'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="คิววันนี้"
        value={stats.total}
        sub={stats.walkInCount > 0 ? `+${stats.walkInCount} walk-in` : undefined}
        color="blue"
      />
      <StatCard
        label="กำลังให้บริการ"
        value={stats.inProgressCount}
        sub={stats.pendingCount > 0 ? `${stats.pendingCount} รออยู่` : 'ว่างอยู่'}
        color="green"
      />
      <StatCard
        label="รายได้วันนี้"
        value={`฿${stats.todayRevenue.toLocaleString()}`}
        sub={stats.popularService ?? undefined}
        color="amber"
      />
      <StatCard
        label="เสร็จแล้ว"
        value={stats.doneCount}
        sub={stats.newCustomers > 0 ? `${stats.newCustomers} ลูกค้าใหม่` : undefined}
        color="violet"
      />
    </div>
  )
}

const COLOR_MAP = {
  blue: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
  green: 'border-sky-500/20 bg-sky-500/5 text-sky-400',
  amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
  violet: 'border-violet-500/20 bg-violet-500/5 text-violet-400',
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color: keyof typeof COLOR_MAP
}) {
  return (
    <div data-testid="stat-card" className={`rounded-xl border p-4 ${COLOR_MAP[color]}`}>
      <p className="text-xs text-stone-400 mb-1">{label}</p>
      <p className="font-mono text-2xl font-bold text-stone-50">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-500 truncate">{sub}</p>}
    </div>
  )
}
