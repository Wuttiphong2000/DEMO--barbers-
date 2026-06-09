# ระบบจองคิวร้านตัดผม + LINE OA

Web app สำหรับร้านตัดผม 1 ร้าน ลูกค้าจองคิวผ่าน LINE (LIFF) เจ้าของร้านจัดการคิวผ่าน Admin Dashboard

**Production:** https://demo-barbers.vercel.app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| Database | Supabase (PostgreSQL) + Prisma 7 ORM |
| Auth | Supabase Auth (admin only) |
| LINE | LINE Messaging API + LIFF SDK |
| Deploy | Vercel + Supabase Cloud |
| Testing | Vitest (unit) + Playwright (E2E) |

---

## โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── (admin)/admin/      ← Dashboard เจ้าของร้าน (protected)
│   ├── (liff)/book/        ← LIFF booking UI (ลูกค้าใช้ใน LINE)
│   ├── booking/[id]/       ← หน้าดูสถานะการจอง
│   ├── login/              ← Admin login
│   └── api/
│       ├── bookings/       ← Booking CRUD
│       ├── admin/          ← Admin-only endpoints
│       ├── line/webhook    ← LINE events
│       └── cron/           ← Scheduled notifications
├── components/
│   ├── admin/dashboard/    ← QueueCard, StatsCards, WalkInModal
│   └── ui/                 ← shadcn/ui components
├── lib/
│   ├── booking.ts          ← createBooking, createWalkInBooking, getAvailableSlots
│   ├── booking-transitions.ts ← isValidAdminTransition (state machine)
│   ├── cron-utils.ts       ← filterBookingsForHourReminder
│   ├── line.ts             ← pushMessage, replyMessage, validateSignature
│   ├── slots.ts            ← generateTimeSlots
│   └── db/                 ← Prisma client + Supabase client
└── generated/prisma/       ← Generated Prisma client
```

---

## Getting Started

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment variables

```bash
cp .env.example .env.local
```

แก้ไข `.env.local` ตามค่าจริงของคุณ (ดูรายละเอียดใน `.env.example`)

### 3. Run database migration

```bash
npx prisma migrate dev
```

### 4. Seed ข้อมูลเริ่มต้น

```bash
npx prisma db seed
```

### 5. Run development server

```bash
npm run dev
```

เปิด http://localhost:3000

---

## Environment Variables

| Variable | ที่หา | หมายเหตุ |
|---|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database | port 6543 สำหรับ Vercel, port 5432 สำหรับ migrate |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | เก็บเป็น secret |
| `LINE_CHANNEL_ID` | LINE Developers Console → Messaging API | |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Developers Console → Messaging API | |
| `LINE_CHANNEL_SECRET` | LINE Developers Console → Messaging API | |
| `NEXT_PUBLIC_LIFF_ID` | LINE Developers Console → LIFF | |
| `LINE_OWNER_USER_ID` | LINE Developers Console → webhook test | รับ push เมื่อมีจองใหม่ |
| `CRON_SECRET` | สร้างเอง (random string) | ป้องกัน cron endpoints |
| `NEXT_PUBLIC_APP_URL` | URL ของ app | เช่น `https://demo-barbers.vercel.app` |

---

## คำสั่งที่ใช้บ่อย

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Type check
npx tsc --noEmit

# Production build
npm run build

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

---

## Key Design Decisions

- **Auto-confirm** การจอง — slot lock ป้องกัน double-book ด้วย DB unique constraint
- **Walk-in** ใช้ `walkin_${timestamp}_${random}` เป็น placeholder `lineUserId` (ไม่ต้อง schema change)
- **Late reporting** เก็บใน `notes = 'LATE_REPORTED'` (ไม่ต้อง migration)
- **Queue number** รูปแบบ `Q001` รีเซ็ตทุกวัน
- **Grace period** 15 นาที (ปรับได้ใน Admin Settings)
- **Hourly cron** ใช้ GitHub Actions แทน Vercel (Hobby plan รองรับเฉพาะ daily cron)

---

## Deployment

### Vercel

```bash
npx vercel --prod
```

ต้องตั้ง environment variables ใน Vercel Dashboard ก่อน

### GitHub Actions (Hourly Reminder)

ตั้ง secrets ใน GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `APP_URL` | `https://demo-barbers.vercel.app` |
| `CRON_SECRET` | ค่าเดียวกับใน Vercel |

### Supabase Realtime

เปิดใช้งานผ่าน SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
```

---

## LINE Setup

1. สร้าง LINE Official Account + Messaging API channel
2. ตั้ง Webhook URL: `https://your-app.vercel.app/api/line/webhook`
3. สร้าง LIFF App ชี้ไปที่ `https://your-app.vercel.app/book`
4. ติด QR Code ที่หน้าร้าน: เปิด `/admin/qr`
