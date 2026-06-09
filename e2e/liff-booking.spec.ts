import { test, expect } from '@playwright/test'

test('LIFF book page loads and shows service list', async ({ page }) => {
  await page.goto('/book')
  await expect(page.locator('h2')).toHaveText('เลือกบริการ', { timeout: 10_000 })
  // At least one service card should be visible
  const serviceCards = page.locator('button').filter({ hasText: /฿/ })
  await expect(serviceCards.first()).toBeVisible({ timeout: 8_000 })
})

test('complete booking flow through all 5 steps', async ({ page }) => {
  await page.goto('/book')

  // Step 1: Select first available service
  await page.waitForSelector('h2:text("เลือกบริการ")', { timeout: 10_000 })
  const firstService = page.locator('button').filter({ hasText: /฿/ }).first()
  await firstService.click()

  // Step 2: Select "any barber"
  await page.waitForSelector('h2:text("เลือกช่าง")', { timeout: 5_000 })
  await page.locator('button').filter({ hasText: 'ไม่ระบุช่าง' }).click()

  // Step 3: Select first available date
  await page.waitForSelector('h2:text("เลือกวันที่")', { timeout: 5_000 })
  const firstDate = page.locator('[data-testid="date-open"]').first()
  await firstDate.click()

  // Step 4: Select first available time slot
  await page.waitForSelector('h2:text("เลือกเวลา")', { timeout: 8_000 })
  const firstSlot = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()
  await firstSlot.click()

  // Step 5: Confirm page should show
  await expect(page.locator('h2')).toHaveText('ยืนยันการจอง', { timeout: 5_000 })
  await expect(page.locator('text=ยืนยันการจอง').last()).toBeVisible()
})

test('confirm creates booking and redirects to status page', async ({ page }) => {
  await page.goto('/book')

  // Quick flow through all steps
  await page.waitForSelector('h2:text("เลือกบริการ")', { timeout: 10_000 })
  await page.locator('button').filter({ hasText: /฿/ }).first().click()

  await page.waitForSelector('h2:text("เลือกช่าง")')
  await page.locator('button').filter({ hasText: 'ไม่ระบุช่าง' }).click()

  await page.waitForSelector('h2:text("เลือกวันที่")')
  await page.locator('[data-testid="date-open"]').first().click()

  await page.waitForSelector('h2:text("เลือกเวลา")', { timeout: 8_000 })
  await page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first().click()

  // Step 5: click confirm button
  await page.waitForSelector('h2:text("ยืนยันการจอง")')
  const confirmBtn = page.locator('button').filter({ hasText: 'ยืนยันการจอง' }).last()
  await confirmBtn.click()

  // Should redirect to /booking/[id]
  await page.waitForURL(/\/booking\/[a-z0-9]+/, { timeout: 10_000 })
  await expect(page.locator('text=หมายเลขคิว')).toBeVisible()
  await expect(page.locator('text=/Q\\d{3}/')).toBeVisible()
})

test('/booking/[id] shows not-found for invalid id', async ({ page }) => {
  await page.goto('/booking/invalid_id_xyz')
  await expect(page.locator('text=ไม่พบการจองนี้')).toBeVisible({ timeout: 8_000 })
})
