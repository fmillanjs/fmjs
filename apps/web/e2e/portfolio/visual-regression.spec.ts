// Source: https://playwright.dev/docs/test-snapshots
import { test, expect } from '@playwright/test'

// Portfolio is public — no auth needed
test.use({ storageState: { cookies: [], origins: [] } })

const portfolioRoutes = [
  { name: 'homepage', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'projects', path: '/projects' },
  { name: 'teamflow-case-study', path: '/projects/teamflow' },
  { name: 'resume', path: '/resume' },
  { name: 'contact', path: '/contact' },
]

test.describe('Portfolio Visual Regression - Light Mode', () => {
  for (const { name, path } of portfolioRoutes) {
    test(name, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot(`${name}-light.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      })
    })
  }
})

test.describe('Portfolio Visual Regression - Dark Mode', () => {
  for (const { name, path } of portfolioRoutes) {
    test(name, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      // Set dark mode in localStorage BEFORE navigation so next-themes initializes
      // in dark mode — ensures CSS variables resolve correctly on first render.
      // Consistent with accessibility tests dark mode approach.
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark')
      })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Allow time for next-themes to apply dark class
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot(`${name}-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      })
    })
  }
})
