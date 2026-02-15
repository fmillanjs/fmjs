import { test, expect } from '@playwright/test'

// Signup tests should not use stored auth state
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Signup Page', () => {
  test('signup page loads', async ({ page }) => {
    await page.goto('/signup')

    // Expect heading and form to be visible
    await expect(page.getByRole('heading', { name: /sign up|register|create account/i })).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel(/^Password$/)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up|register|create account/i })).toBeVisible()
  })

  test('signup with valid data creates account', async ({ page }) => {
    await page.goto('/signup')

    // Generate unique email using timestamp
    const uniqueEmail = `test-${Date.now()}@example.com`

    // Fill in form with valid data
    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Email').fill(uniqueEmail)
    await page.getByLabel(/^Password$/).fill('SecurePassword123')

    // Submit form
    await page.getByRole('button', { name: /sign up|register|create account/i }).click()

    // Verify redirect to login or dashboard
    await page.waitForURL(/\/(login|teams)/)

    // If redirected to login, expect success message
    if (page.url().includes('/login')) {
      await expect(page.getByText(/success|created|registered/i)).toBeVisible()
    }
  })

  test('signup with existing email shows error', async ({ page }) => {
    await page.goto('/signup')

    // Use existing demo email
    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Email').fill('demo1@teamflow.dev')
    await page.getByLabel(/^Password$/).fill('SecurePassword123')

    // Submit form
    await page.getByRole('button', { name: /sign up|register|create account/i }).click()

    // Expect error message about existing email
    await expect(page.getByText(/already|exists|taken|use/i)).toBeVisible()
  })

  test('signup validates password requirements', async ({ page }) => {
    await page.goto('/signup')

    // Fill in form with weak password
    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel(/^Password$/).fill('weak')

    // Submit form
    await page.getByRole('button', { name: /sign up|register|create account/i }).click()

    // Expect password validation error
    await expect(page.getByText(/password.*characters|password.*long|password.*strong/i)).toBeVisible()
  })
})
