// Source: https://playwright.dev/docs/accessibility-testing
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Portfolio is public — no auth needed
test.use({ storageState: { cookies: [], origins: [] } })

const portfolioRoutes = ['/', '/about', '/projects', '/projects/teamflow', '/resume', '/contact']

test.describe('Portfolio Accessibility - WCAG AA', () => {
  for (const path of portfolioRoutes) {
    test(`${path} - light mode`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(results.violations).toEqual([])
    })

    test(`${path} - dark mode`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Same class injection pattern as visual regression tests
      await page.evaluate(() => document.documentElement.classList.add('dark'))
      await page.waitForTimeout(100)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(results.violations).toEqual([])
    })
  }
})
