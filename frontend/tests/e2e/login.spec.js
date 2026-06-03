import { test, expect } from '@playwright/test'

const DEMO_EMAIL = 'demo@devbill.app'
const DEMO_PASSWORD = 'demo1234'

test.describe('Login flow', () => {
  test('logs in with demo credentials and sees dashboard', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('DevBill')).toBeVisible()

    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('shows error with wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"]')

    await expect(page.getByRole('status')).toBeVisible({ timeout: 10000 })
  })

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/projects')
    await expect(page).toHaveURL('/login')
  })
})
