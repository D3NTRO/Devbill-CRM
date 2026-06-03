import { test, expect } from '@playwright/test'

const DEMO_EMAIL = 'demo@devbill.app'
const DEMO_PASSWORD = 'demo1234'

test.describe('Sidebar navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', DEMO_EMAIL)
    await page.fill('input[type="password"]', DEMO_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  const pages = [
    { label: 'Clientes', url: '/clients', heading: 'Clientes' },
    { label: 'Proyectos', url: '/projects', heading: 'Proyectos' },
    { label: 'Pipeline', url: '/pipeline', heading: 'Pipeline de Proyectos' },
    { label: 'Tareas', url: '/tasks', heading: 'Tareas' },
    { label: 'Time Tracker', url: '/time-tracker', heading: 'Time Tracker' },
    { label: 'Propuestas', url: '/proposals', heading: 'Propuestas' },
    { label: 'Facturas', url: '/invoices', heading: 'Facturas' },
  ]

  for (const { label, url, heading } of pages) {
    test(`navigates to ${label}`, async ({ page }) => {
      await page.getByRole('link', { name: label }).first().click()
      await expect(page).toHaveURL(url)
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    })
  }

  test('toggles dark mode and persists preference', async ({ page }) => {
    await expect(page.locator('html')).not.toHaveClass('dark')
    await page.getByTitle('Activar modo oscuro').click()
    await expect(page.locator('html')).toHaveClass('dark')
    await page.getByTitle('Activar modo claro').click()
    await expect(page.locator('html')).not.toHaveClass('dark')
  })
})
