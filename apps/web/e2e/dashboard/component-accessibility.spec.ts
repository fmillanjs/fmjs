// Source: based on apps/web/e2e/auth/form-accessibility.spec.ts pattern
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Dashboard routes require authentication — use stored auth state from Phase 11
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Dashboard Component Accessibility - WCAG AA', () => {
  test('teams list page - light mode', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('teams list page - dark mode', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('theme', 'dark'); });
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('team detail page - light mode', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    const teamLink = page.locator('a[href^="/teams/"]').first();
    await teamLink.click();
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('team detail page - dark mode', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('theme', 'dark'); });
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    const teamLink = page.locator('a[href^="/teams/"]').first();
    await teamLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('project board page - light mode', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    const teamLink = page.locator('a[href^="/teams/"]').first();
    await teamLink.click();
    await page.waitForLoadState('networkidle');
    const projectLink = page.locator('a[href*="/projects/"]').first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    } else {
      test.skip(true, 'No projects available to test');
    }
  });

  test('project board page - dark mode', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('theme', 'dark'); });
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    const teamLink = page.locator('a[href^="/teams/"]').first();
    await teamLink.click();
    await page.waitForLoadState('networkidle');
    const projectLink = page.locator('a[href*="/projects/"]').first();
    if (await projectLink.count() > 0) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(200);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    } else {
      test.skip(true, 'No projects available to test');
    }
  });
});
