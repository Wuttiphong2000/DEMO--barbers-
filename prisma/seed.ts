import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.setting.createMany({
    data: [
      { key: 'shop_name', value: 'Classic Cut Barbershop' },
      { key: 'grace_period_minutes', value: '15' },
      { key: 'buffer_minutes', value: '10' },
      { key: 'advance_booking_days', value: '7' },
    ],
    skipDuplicates: true,
  })

  const haircut = await prisma.service.upsert({
    where: { id: 'service-haircut' },
    update: {},
    create: { id: 'service-haircut', name: 'ตัดผม', durationMinutes: 45, price: 150 },
  })

  const haircutAndWash = await prisma.service.upsert({
    where: { id: 'service-haircut-wash' },
    update: {},
    create: { id: 'service-haircut-wash', name: 'ตัดผม + สระ', durationMinutes: 60, price: 200 },
  })

  await prisma.service.upsert({
    where: { id: 'service-beard' },
    update: {},
    create: { id: 'service-beard', name: 'แต่งหนวด', durationMinutes: 30, price: 100 },
  })

  await prisma.barber.upsert({
    where: { id: 'barber-somchai' },
    update: {},
    create: { id: 'barber-somchai', name: 'สมชาย' },
  })

  await prisma.barber.upsert({
    where: { id: 'barber-kittipong' },
    update: {},
    create: { id: 'barber-kittipong', name: 'กิตติพงษ์' },
  })

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
  for (const day of days) {
    await prisma.businessHour.upsert({
      where: { dayOfWeek: day },
      update: {},
      create: {
        dayOfWeek: day,
        openTime: '09:00',
        closeTime: '18:00',
        isClosed: day === 'sunday',
      },
    })
  }

  console.log('Seed complete')
  console.log('Services:', haircut.name, haircutAndWash.name)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
