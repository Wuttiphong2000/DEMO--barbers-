import type { BookingStatus } from '@/generated/prisma/client'

const ADMIN_ALLOWED: Partial<Record<BookingStatus, BookingStatus[]>> = {
  pending_arrival: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['done', 'cancelled'],
}

export function isValidAdminTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ADMIN_ALLOWED[from]?.includes(to) ?? false
}
