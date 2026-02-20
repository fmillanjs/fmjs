import { test, expect } from '@playwright/test';

/**
 * Authentication Boundary E2E Test
 *
 * Tests authentication state at boundaries between public (portfolio) and protected (dashboard) routes:
 * - Proper redirects for unauthenticated users
 * - Session persistence across navigation
 * - Logout flow
 * - Direct URL access with/without auth
 * - Portfolio accessibility without auth
 * - Session persistence after browser refresh
 *
 * Uses Playwright's authentication patterns and validates NextAuth + middleware behavior.
 */

test.describe('Authentication Boundaries', () => {
  test('unauthenticated user redirected to login from protected route', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();

    // Try to access protected /teams route without authentication
    await page.goto('/teams');

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);

    // Verify login form is visible
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    console.log('✓ Unauthenticated user redirected to /login');
  });

  test('authenticated user can access protected routes', async ({ page }) => {
    // Use authenticated storage state
    await page.route('**/api/auth/session', async (route) => {
      // Let the request proceed normally
      await route.continue();
    });

    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo1@teamflow.dev');
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: /log in/i }).click();

    // Wait for redirect
    await page.waitForURL(/\/teams/);

    // Navigate to protected route
    await page.goto('/teams');

    // Should NOT be redirected to login
    await expect(page).toHaveURL(/\/teams/);

    // Verify teams page content is visible
    await expect(page.getByRole('heading', { name: /teams/i, level: 1 })).toBeVisible();

    console.log('✓ Authenticated user can access /teams');
  });

  test('session persists across navigation between public and protected routes', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo1@teamflow.dev');
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/\/teams/);

    // Navigate to protected route
    await page.goto('/teams');
    await expect(page).toHaveURL(/\/teams/);

    // Navigate to portfolio (public route)
    await page.goto('/');
    await expect(page).toHaveURL(/^http.*:\/\/[^\/]+\/$/);

    // Navigate back to protected route - session should still be valid
    await page.goto('/teams');
    await expect(page).toHaveURL(/\/teams/);
    await expect(page.getByRole('heading', { name: /teams/i, level: 1 })).toBeVisible();

    console.log('✓ Session persists across public ↔ protected navigation');
  });

  test('logout flow clears session and redirects to home', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo1@teamflow.dev');
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/\/teams/);

    // Navigate to dashboard
    await page.goto('/teams');
    await expect(page).toHaveURL(/\/teams/);

    // Open user dropdown menu (click on user avatar/name area)
    const userMenuButton = page.locator('header button').filter({ has: page.getByText('ADMIN') }).or(
      page.locator('header button').filter({ has: page.getByText('MANAGER') })
    ).or(
      page.locator('header button').filter({ has: page.getByText('MEMBER') })
    ).first();

    await userMenuButton.click();

    // Wait for dropdown to appear
    await page.waitForTimeout(300);

    // Click logout button in dropdown
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await logoutButton.click();

    // Should be redirected to login page
    await page.waitForURL(/\/login/);

    // Verify we're on login page
    await expect(page.getByLabel('Email')).toBeVisible();

    // Try to access protected route - should still redirect to login
    await page.goto('/teams');
    await expect(page).toHaveURL(/\/login/);

    console.log('✓ Logout clears session and prevents access to protected routes');
  });

  test('direct URL access to protected route requires auth', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();

    // Try to access a deep link like /teams/{id}/projects/{id}
    // Use a known project URL pattern
    const protectedUrl = '/teams/cml01234567890/projects/cml98765432100';

    await page.goto(protectedUrl);

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);

    console.log('✓ Direct protected URL access redirects to /login');
  });

  test('all portfolio routes accessible without auth', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();

    const portfolioPages = [
      { path: '/', name: 'Home' },
      { path: '/about', name: 'About' },
      { path: '/projects', name: 'Projects' },
      { path: '/projects/teamflow', name: 'TeamFlow Case Study' },
      { path: '/resume', name: 'Resume' },
      { path: '/contact', name: 'Contact' },
    ];

    for (const { path, name } of portfolioPages) {
      await page.goto(path);

      // Verify NOT redirected to login
      expect(page.url()).not.toContain('/login');

      // Verify page loaded with content
      await expect(page.getByRole('heading').first()).toBeVisible();

      console.log(`✓ ${name} accessible without auth`);
    }
  });

  test('session persists after browser refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo1@teamflow.dev');
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/\/teams/);

    // Navigate to protected route
    await page.goto('/teams');
    await expect(page).toHaveURL(/\/teams/);

    // Reload the page (simulates browser refresh)
    await page.reload();

    // Session should persist - should still be on /teams
    await expect(page).toHaveURL(/\/teams/);
    await expect(page.getByRole('heading', { name: /teams/i, level: 1 })).toBeVisible();

    console.log('✓ Session persists after browser refresh');
  });
});
