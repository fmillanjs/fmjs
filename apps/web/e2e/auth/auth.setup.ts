import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login')

  // Fill in demo credentials
  await page.getByLabel('Email').fill('demo1@teamflow.dev')
  await page.getByLabel('Password').fill('Password123')

  // Submit form
  await page.getByRole('button', { name: 'Log In' }).click()

  // Wait for redirect to home page (login form redirects to /)
  await page.waitForURL('/')

  // Navigate to dashboard to verify authentication worked
  await page.goto('/teams')

  // Verify we're logged in by checking for teams page content
  await expect(page.getByRole('heading', { name: /teams/i, level: 1 })).toBeVisible()

  // Save signed-in state to reuse in tests
  await page.context().storageState({ path: authFile })
})
