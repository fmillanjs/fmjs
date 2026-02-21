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
      // Allow time for next-themes to apply dark class (defaultTheme="dark" means .dark
      // is added on hydration — without this wait, axe may capture pre-hydration state
      // where dark palette + light text colors cause false contrast violations)
      await page.waitForTimeout(500)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(results.violations).toEqual([])
    })

    test(`${path} - dark mode`, async ({ page }) => {
      // Set dark mode in localStorage BEFORE navigation so next-themes initializes
      // in dark mode — ensures CSS custom properties resolve correctly on first render.
      // Post-load class injection causes axe-core to compute incorrect backgrounds
      // because CSS variable transitions aren't observable by axe's getComputedStyle.
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark')
      })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Allow time for next-themes to apply dark class from localStorage
      await page.waitForTimeout(500)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(results.violations).toEqual([])
    })
  }
})
