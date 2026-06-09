const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

interface ValidationResult {
  valid: boolean
  error?: string
}

interface BarberStatus {
  isActive: boolean
}

interface SpecialDay {
  date: Date
  isClosed: boolean
}

interface BusinessHoursDay {
  dayOfWeek: string
  isClosed: boolean
}

export function isValidTimeFormat(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false
  const [hours, minutes] = time.split(':').map(Number)
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
}

export function validateBusinessHoursDay(
  openTime: string,
  closeTime: string,
  isClosed: boolean
): ValidationResult {
  if (isClosed) return { valid: true }

  if (!isValidTimeFormat(openTime)) {
    return { valid: false, error: 'เวลาเปิดไม่ถูกต้อง (ต้องเป็น HH:MM)' }
  }

  if (!isValidTimeFormat(closeTime)) {
    return { valid: false, error: 'เวลาปิดไม่ถูกต้อง (ต้องเป็น HH:MM)' }
  }

  if (openTime >= closeTime) {
    return { valid: false, error: 'เวลาเปิดต้องน้อยกว่าเวลาปิด' }
  }

  return { valid: true }
}

export function isBarberAvailable(barber: BarberStatus): boolean {
  return barber.isActive
}

export function isShopOpenOnDate(
  date: Date,
  specialDays: SpecialDay[],
  businessHours: BusinessHoursDay[]
): boolean {
  const dateStr = date.toISOString().slice(0, 10)

  const special = specialDays.find((s) => s.date.toISOString().slice(0, 10) === dateStr)
  if (special !== undefined) return !special.isClosed

  const dayName = DAY_NAMES[date.getDay()]
  const hours = businessHours.find((h) => h.dayOfWeek === dayName)
  if (!hours) return false

  return !hours.isClosed
}
