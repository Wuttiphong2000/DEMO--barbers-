export type BookingStatus = 'pending_arrival' | 'in_progress' | 'done' | 'cancelled' | 'no_show'
export type BookingSource = 'line' | 'walk_in' | 'qr'

export interface DashboardBooking {
  id: string
  queueNumber: string
  timeSlot: string
  date: string
  status: BookingStatus
  source: BookingSource
  customerName: string
  customerLineUserId: string | null
  serviceName: string
  servicePrice: number
  serviceDuration: number
  barberName: string
  notes: string | null
  createdAt: string
  isLate: boolean
  lateMinutes: number
}

export interface DashboardStats {
  total: number
  inProgressCount: number
  pendingCount: number
  doneCount: number
  walkInCount: number
  todayRevenue: number
  popularService: string | null
  newCustomers: number
}

export interface ServiceOption {
  id: string
  name: string
  price: number
  durationMinutes: number
}

export interface BarberOption {
  id: string
  name: string
}
