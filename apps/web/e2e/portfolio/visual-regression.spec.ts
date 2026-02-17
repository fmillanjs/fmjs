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
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Inject dark class — app uses next-themes with attribute="class" on <html>
      // DO NOT use colorScheme: 'dark' — that sets prefers-color-scheme media query,
      // NOT the class="dark" attribute that Radix Colors dark mode requires.
      await page.evaluate(() => document.documentElement.classList.add('dark'))
      await page.waitForTimeout(100) // allow CSS transitions
      await expect(page).toHaveScreenshot(`${name}-dark.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      })
    })
  }
})
