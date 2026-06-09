import { prisma } from '@/lib/db/prisma'
import { ok } from '@/lib/api-response'

export async function GET() {
  const [services, barbers, businessHours, specialDays] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true } }),
    prisma.barber.findMany({ where: { isActive: true } }),
    prisma.businessHour.findMany(),
    prisma.specialDay.findMany(),
  ])

  return ok({ services, barbers, businessHours, specialDays })
}
