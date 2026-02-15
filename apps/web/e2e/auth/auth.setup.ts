import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login')

  // Fill in demo credentials
  await page.getByLabel('Email').fill('demo1@teamflow.dev')
  await page.getByLabel('Password').fill('Password123')

  // Submit form
  await page.getByRole('button', { name: 'Sign In' }).click()

  // Wait for redirect to dashboard
  await page.waitForURL(/\/teams/)

  // Verify we're logged in by checking for dashboard content
  await expect(page.getByText(/Dashboard|Projects|Tasks/i)).toBeVisible()

  // Save signed-in state to reuse in tests
  await page.context().storageState({ path: authFile })
})
