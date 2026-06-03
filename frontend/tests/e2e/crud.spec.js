import { test, expect } from '@playwright/test'

const DEMO_EMAIL = 'demo@devbill.app'
const DEMO_PASSWORD = 'demo1234'

test.describe('CRUD flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('creates a client and verifies it appears in the list', async ({ page }) => {
    await page.getByRole('link', { name: /clientes/i }).first().click()
    await expect(page).toHaveURL('/clients')

    await page.getByRole('button', { name: /nuevo cliente/i }).click()
    await page.waitForTimeout(500)

    await page.fill('input[required]', 'E2E Test Client')
    const emailInputs = page.locator('input[type="email"]')
    await emailInputs.last().fill('e2e@test.com')

    await page.getByRole('button', { name: /crear cliente/i }).click()
    await expect(page.getByText('E2E Test Client').first()).toBeVisible({ timeout: 10000 })
  })

  test('creates a task and marks it complete', async ({ page }) => {
    await page.getByRole('link', { name: /tareas/i }).first().click()
    await expect(page).toHaveURL('/tasks')

    await page.getByRole('button', { name: /nueva tarea/i }).click()
    await page.waitForTimeout(500)

    await page.getByPlaceholder('¿Qué hay que hacer?').fill('E2E Test Task')

    await page.getByRole('button', { name: /crear tarea/i }).click()
    await expect(page.getByText('E2E Test Task').first()).toBeVisible({ timeout: 10000 })

    const checkbox = page.locator('.rounded-full.border-2').first()
    await checkbox.click()
  })

  test('creates a manual time entry', async ({ page }) => {
    await page.getByRole('link', { name: /time tracker/i }).first().click()
    await expect(page).toHaveURL('/time-tracker')

    await page.getByRole('button', { name: /manual/i }).click()
    await page.waitForTimeout(500)

    const projectSelect = page.locator('select[required]').first()
    const options = await projectSelect.locator('option').all()
    if (options.length > 1) {
      await projectSelect.selectOption({ index: 1 })
    }

    await page.getByRole('button', { name: /crear entrada/i }).click()
    await expect(page.getByRole('status')).toBeVisible({ timeout: 10000 })
  })
})
