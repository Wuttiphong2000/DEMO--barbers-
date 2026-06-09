-- Partial unique index: prevent double-booking for active bookings.
-- Prisma schema language doesn't support partial indexes, so this is managed manually.
-- Cancelled bookings don't hold a slot (NULL != NULL is fine since barberId is NOT NULL).
CREATE UNIQUE INDEX "bookings_no_double_booking"
  ON "bookings" ("barber_id", "date", "time_slot")
  WHERE (status != 'cancelled');
