import { test, expect } from '@playwright/test'

// Login tests should not use stored auth state (testing the login flow itself)
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login Page', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')

    // Expect heading and form to be visible
    await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible()
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')

    // Fill in demo credentials
    await page.getByLabel('Email').fill('demo1@teamflow.dev')
    await page.getByLabel('Password').fill('Password123')

    // Submit form
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Verify redirect to dashboard
    await page.waitForURL(/\/teams/)

    // Verify dashboard content is visible
    await expect(page.getByText(/Dashboard|Projects|Tasks/i)).toBeVisible()
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login')

    // Fill in invalid credentials
    await page.getByLabel('Email').fill('demo1@teamflow.dev')
    await page.getByLabel('Password').fill('WrongPassword')

    // Submit form
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Expect error message to be visible
    await expect(page.getByText(/invalid|incorrect|failed|wrong/i)).toBeVisible()
  })

  test('empty form shows validation errors', async ({ page }) => {
    await page.goto('/login')

    // Submit form without filling
    await page.getByRole('button', { name: /sign in|login/i }).click()

    // Expect field errors to be visible
    const emailError = page.getByText(/email.*required|required.*email/i)
    const passwordError = page.getByText(/password.*required|required.*password/i)

    // At least one error should be visible
    const errorCount = await Promise.all([
      emailError.count(),
      passwordError.count()
    ])

    expect(errorCount.some(count => count > 0)).toBeTruthy()
  })
})
