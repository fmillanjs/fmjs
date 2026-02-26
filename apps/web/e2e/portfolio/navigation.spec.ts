import { test, expect } from '@playwright/test'

// Portfolio tests do NOT require auth (portfolio is public)
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Portfolio Navigation', () => {
  test('home page loads with hero section', async ({ page }) => {
    await page.goto('/')

    // Expect hero content to be visible — use first() to avoid strict mode with multiple matching headings
    await expect(page.getByRole('heading', { name: /Fernando Millan|Full-Stack|Software Engineer/i }).first()).toBeVisible()
  })

  test('about page loads with bio', async ({ page }) => {
    await page.goto('/about')

    // Expect heading and tech stack section
    await expect(page.getByRole('heading', { name: /about/i })).toBeVisible()
    await expect(page.getByText(/Tech Stack|Skills|Technologies/i).first()).toBeVisible()
  })

  test('projects page loads with TeamFlow', async ({ page }) => {
    await page.goto('/projects')

    // Expect TeamFlow project card to be visible
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible()
    await expect(page.getByText(/TeamFlow/i)).toBeVisible()
  })

  test('case study page loads with all sections', async ({ page }) => {
    await page.goto('/projects/teamflow')

    // Expect key section headings — use role:heading to avoid strict mode with body text
    await expect(page.getByRole('heading', { name: /TeamFlow/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Problem|Challenge/i }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /Solution/i }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: /Architecture/i }).first()).toBeVisible()
  })

  test('resume page loads with download link', async ({ page }) => {
    await page.goto('/resume')

    // Expect heading and download button/link
    await expect(page.getByRole('heading', { name: /resume|cv/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /download/i })).toBeVisible()
  })

  test('contact page loads with form', async ({ page }) => {
    await page.goto('/contact')

    // Expect form fields and submit button
    await expect(page.getByRole('heading', { name: /contact/i })).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Message')).toBeVisible()
    await expect(page.getByRole('button', { name: /send|submit/i })).toBeVisible()
  })

  test('navigation links work', async ({ page }) => {
    await page.goto('/')

    // Click About link
    await page.getByRole('link', { name: /about/i }).first().click()
    await expect(page).toHaveURL(/\/about/)

    // Click Projects link
    await page.getByRole('link', { name: /projects/i }).first().click()
    await expect(page).toHaveURL(/\/projects/)

    // Click Resume link
    await page.getByRole('link', { name: /resume/i }).first().click()
    await expect(page).toHaveURL(/\/resume/)

    // Click Contact link
    await page.getByRole('link', { name: /contact/i }).first().click()
    await expect(page).toHaveURL(/\/contact/)

    // Click Home/Logo to go back
    await page.getByRole('link', { name: /home|Fernando Millan/i }).first().click()
    // toHaveURL with string resolves relative to baseURL; avoids regex-against-full-URL mismatch
    await expect(page).toHaveURL('/')
  })

  test('404 page shows for invalid routes', async ({ page }) => {
    await page.goto('/nonexistent-page-12345')

    // Expect 404 content — use heading role to avoid strict mode with multiple matching elements
    await expect(page.getByRole('heading', { name: /404|not found/i }).first()).toBeVisible()
  })

  test('case study live demo CTAs point to production URLs', async ({ page }) => {
    // TeamFlow case study CTA
    await page.goto('/projects/teamflow')
    const teamflowDemo = page.getByRole('link', { name: /view live demo/i }).first()
    const teamflowHref = await teamflowDemo.getAttribute('href')
    expect(teamflowHref).toContain('teamflow.fernandomillan.me')

    // DevCollab case study CTA
    await page.goto('/projects/devcollab')
    const devCollabDemo = page.getByRole('link', { name: /view live demo/i }).first()
    const devCollabHref = await devCollabDemo.getAttribute('href')
    expect(devCollabHref).toContain('devcollab.fernandomillan.me')
  })

  test('mobile navigation works', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Look for hamburger menu button (mobile navigation toggle)
    const menuButton = page.getByRole('button', { name: /menu|navigation/i })

    // If menu button exists, verify it opens the navigation
    if (await menuButton.count() > 0) {
      await menuButton.click()

      // Verify navigation links are visible after opening menu — use first() to avoid strict mode
      await expect(page.getByRole('link', { name: /about/i }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: /projects/i }).first()).toBeVisible()
    } else {
      // If no hamburger menu, navigation might always be visible or use a different pattern
      // Verify at least one navigation link is visible
      await expect(page.getByRole('link', { name: /about|projects/i }).first()).toBeVisible()
    }
  })
})
