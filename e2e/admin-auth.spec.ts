import { test, expect } from '@playwright/test'

test('admin login flow reaches protected page', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('input[type="email"]')).toBeVisible()

  await page.fill('input[type="email"]', 'owner@barbershop.local')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')

  await page.waitForURL('/admin', { timeout: 10_000 })
  expect(page.url()).toContain('/admin')
})

test('unauthenticated access to /admin redirects to /login', async ({ page }) => {
  await page.goto('/admin/services')
  await page.waitForURL('/login', { timeout: 10_000 })
  expect(page.url()).toContain('/login')
})

test('/admin/services shows services list after login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'owner@barbershop.local')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin', { timeout: 10_000 })

  await page.goto('/admin/services')
  await expect(page.locator('h1')).toHaveText('บริการ')
  await expect(page.locator('table')).toBeVisible({ timeout: 8_000 })
})
