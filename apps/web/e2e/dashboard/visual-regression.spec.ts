// Source: pattern from apps/web/e2e/portfolio/visual-regression.spec.ts
import { test, expect } from '@playwright/test'

// Dashboard routes require authentication — use stored auth state
test.use({ storageState: 'playwright/.auth/user.json' })

test.describe('Dashboard Visual Regression - Light Mode', () => {
  test('teams-list', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('teams-list-light.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      mask: [page.locator('main h1, main h2')],
    })
  })

  test('profile', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('profile-light.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      mask: [page.locator('main h1, main h2')],
    })
  })

  test('team-detail', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    const teamLink = page.locator('a[href^="/teams/"]').first()
    await teamLink.click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('team-detail-light.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      mask: [
        page.locator('main h1, main h2'),
        page.locator('.text-muted-foreground'),
      ],
    })
  })

  test('project-board', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    const teamLink = page.locator('a[href^="/teams/"]').first()
    await teamLink.click()
    await page.waitForLoadState('networkidle')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.count() > 0) {
      await projectLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('project-board-light.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        mask: [
          page.locator('main h1, main h2'),
          page.locator('.text-muted-foreground'),
        ],
      })
    } else {
      test.skip(true, 'No projects available')
    }
  })
})

test.describe('Dashboard Visual Regression - Dark Mode', () => {
  test('teams-list', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('teams-list-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      mask: [page.locator('main h1, main h2')],
    })
  })

  test('profile', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('profile-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      mask: [page.locator('main h1, main h2')],
    })
  })

  test('team-detail', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    const teamLink = page.locator('a[href^="/teams/"]').first()
    await teamLink.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(200)
    await expect(page).toHaveScreenshot('team-detail-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      mask: [
        page.locator('main h1, main h2'),
        page.locator('.text-muted-foreground'),
      ],
    })
  })

  test('project-board', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    const teamLink = page.locator('a[href^="/teams/"]').first()
    await teamLink.click()
    await page.waitForLoadState('networkidle')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.count() > 0) {
      await projectLink.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot('project-board-dark.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        mask: [
          page.locator('main h1, main h2'),
          page.locator('.text-muted-foreground'),
        ],
      })
    } else {
      test.skip(true, 'No projects available')
    }
  })
})
