export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function addMinutesToTime(time: string, minutes: number): string {
  const total = (timeToMinutes(time) + minutes) % (24 * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function isSlotAvailable(slot: string, takenSlots: string[]): boolean {
  return !takenSlots.includes(slot)
}

interface GenerateSlotsOptions {
  openTime: string
  closeTime: string
  durationMinutes: number
  bufferMinutes: number
  takenSlots: string[]
}

export function generateTimeSlots({
  openTime,
  closeTime,
  durationMinutes,
  bufferMinutes,
  takenSlots,
}: GenerateSlotsOptions): string[] {
  const slots: string[] = []
  const closeMinutes = timeToMinutes(closeTime)
  let currentMinutes = timeToMinutes(openTime)

  while (currentMinutes + durationMinutes <= closeMinutes) {
    const slot = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`
    if (isSlotAvailable(slot, takenSlots)) {
      slots.push(slot)
    }
    currentMinutes += durationMinutes + bufferMinutes
  }

  return slots
}
