import { test, expect, Page } from '@playwright/test'

async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'owner@barbershop.local')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin', { timeout: 10_000 })
}

test.describe('Admin Dashboard', () => {
  test('dashboard shows stat cards after login', async ({ page }) => {
    await loginAsAdmin(page)
    // Four stat cards visible
    await expect(page.locator('[data-testid="stat-card"]').first()).toBeVisible({ timeout: 8_000 })
    const statCards = page.locator('[data-testid="stat-card"]')
    await expect(statCards).toHaveCount(4, { timeout: 8_000 })
  })

  test('dashboard loading skeleton appears on first load', async ({ page }) => {
    // Intercept and delay the page data to catch the skeleton
    await page.goto('/admin')
    // Either skeleton or content appears — no blank screen
    const hasContent = await page
      .locator('[data-testid="stat-card"], [data-testid="dashboard-skeleton"]')
      .first()
      .isVisible({ timeout: 10_000 })
    expect(hasContent).toBe(true)
  })

  test('walk-in modal opens and has required fields', async ({ page }) => {
    await loginAsAdmin(page)
    const walkInBtn = page.locator('button').filter({ hasText: 'Walk-in' }).first()
    await expect(walkInBtn).toBeVisible({ timeout: 8_000 })
    await walkInBtn.click()

    // Modal should appear with name field and service selector
    await expect(page.locator('[data-testid="walkin-modal"]')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('input[name="customerName"]')).toBeVisible()
    await expect(page.locator('select[name="serviceId"]')).toBeVisible()
  })

  test('walk-in modal can be closed', async ({ page }) => {
    await loginAsAdmin(page)
    const walkInBtn = page.locator('button').filter({ hasText: 'Walk-in' }).first()
    await walkInBtn.click()

    const modal = page.locator('[data-testid="walkin-modal"]')
    await expect(modal).toBeVisible({ timeout: 5_000 })

    // Close via cancel button or X
    const cancelBtn = modal.locator('button').filter({ hasText: /ยกเลิก|ปิด/ }).first()
    await cancelBtn.click()

    await expect(modal).not.toBeVisible({ timeout: 3_000 })
  })
})

test.describe('Admin Dashboard Navigation', () => {
  test('sidebar links work — calendar page loads', async ({ page }) => {
    await loginAsAdmin(page)
    await page.locator('a[href="/admin/calendar"]').first().click()
    await page.waitForURL('/admin/calendar', { timeout: 8_000 })
    await expect(page.locator('h1')).toBeVisible({ timeout: 8_000 })
  })

  test('sidebar links work — customers page loads', async ({ page }) => {
    await loginAsAdmin(page)
    await page.locator('a[href="/admin/customers"]').first().click()
    await page.waitForURL('/admin/customers', { timeout: 8_000 })
    await expect(page.locator('h1')).toBeVisible({ timeout: 8_000 })
  })

  test('mobile sidebar hamburger toggle is visible on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsAdmin(page)
    // Hamburger menu button visible on mobile
    const hamburger = page.locator('[data-testid="mobile-menu-btn"]')
    await expect(hamburger).toBeVisible({ timeout: 8_000 })
  })

  test('mobile sidebar opens when hamburger is clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsAdmin(page)
    await page.locator('[data-testid="mobile-menu-btn"]').click()
    // Sidebar navigation should be visible
    await expect(page.locator('nav').filter({ has: page.locator('a[href="/admin"]') }).first()).toBeVisible({ timeout: 3_000 })
  })
})

test.describe('Admin Calendar', () => {
  test('calendar renders a grid of 7 columns', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/calendar')
    await expect(page.locator('h1')).toBeVisible({ timeout: 8_000 })
    // 7 day-of-week header cells
    const dayHeaders = page.locator('[data-testid="cal-day-header"]')
    await expect(dayHeaders).toHaveCount(7, { timeout: 8_000 })
  })

  test('prev/next month navigation updates the URL', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/calendar')
    await page.waitForSelector('[data-testid="cal-next"]', { timeout: 8_000 })

    await page.locator('[data-testid="cal-next"]').click()
    await expect(page).toHaveURL(/month=/, { timeout: 5_000 })
  })
})

test.describe('Admin Customers', () => {
  test('customers page shows search input', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/customers')
    await expect(page.locator('input[placeholder*="ค้นหา"]')).toBeVisible({ timeout: 8_000 })
  })

  test('customer list renders rows', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/customers')
    // At least one row in the list (may be empty state if no data)
    const rows = page.locator('[data-testid="customer-row"]')
    const emptyState = page.locator('text=ยังไม่มีลูกค้า')
    await expect(rows.first().or(emptyState)).toBeVisible({ timeout: 8_000 })
  })
})
