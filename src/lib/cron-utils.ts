export interface ReminderBooking {
  id: string
  timeSlot: string
  customerLineUserId: string
  queueNumber: string
  serviceName: string
  barberName: string
}

export function parseTimeToMinutes(timeSlot: string): number {
  const [h, m] = timeSlot.split(':').map(Number)
  return h * 60 + m
}

export function filterBookingsForHourReminder(
  bookings: ReminderBooking[],
  currentMinutes: number,
  windowMinutes: number = 60
): ReminderBooking[] {
  return bookings.filter((b) => {
    if (b.customerLineUserId.startsWith('walkin_')) return false
    const slotMinutes = parseTimeToMinutes(b.timeSlot)
    const diff = slotMinutes - currentMinutes
    return diff > 0 && diff <= windowMinutes
  })
}
