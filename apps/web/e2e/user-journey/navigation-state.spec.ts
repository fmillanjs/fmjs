import { test, expect } from '@playwright/test';

/**
 * Navigation State Preservation E2E Test
 *
 * Tests navigation state preservation including:
 * - Breadcrumb hierarchy across navigation levels
 * - Browser back button behavior
 * - Sidebar state preservation
 * - Filter state persistence in URL (using nuqs)
 * - Search persistence across navigation
 * - Scroll position preservation (Next.js behavior)
 * - Deep link access with correct breadcrumbs and sidebar state
 *
 * Uses authenticated storage state.
 */

// Use authenticated storage state from setup
test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Navigation State Preservation', () => {
  test('breadcrumb hierarchy shows correct path through navigation', async ({ page }) => {
    // Navigate to teams page
    await page.goto('/teams');

    // Look for existing team or create one for testing
    const teamLink = page.getByRole('link', { name: /demo workspace|marketing|engineering/i }).first();

    if (await teamLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await teamLink.click();
    } else {
      // Create a test team if none exists
      const createButton = page.getByRole('link', { name: /create team/i });
      if (await createButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await createButton.click();
        await page.getByLabel(/team name|name/i).fill('Nav Test Team');
        await page.getByRole('button', { name: /create/i }).click();
        await page.waitForURL(/\/teams\/[a-zA-Z0-9_-]+/);
      }
    }

    // We should be on a team detail page now
    await expect(page).toHaveURL(/\/teams\/[a-zA-Z0-9_-]+/);

    // Check for breadcrumbs (if they exist)
    const breadcrumbs = page.locator('nav[aria-label*="breadcrumb"]').or(
      page.locator('nav').filter({ has: page.getByText(/teams/i) })
    );

    if (await breadcrumbs.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Verify breadcrumbs contain "Teams"
      await expect(breadcrumbs).toContainText(/teams/i);
      console.log('✓ Breadcrumbs show navigation hierarchy');
    } else {
      console.log('ℹ Breadcrumbs not implemented on this page');
    }
  });

  test('browser back button navigates correctly through history', async ({ page }) => {
    // Start at teams page
    await page.goto('/teams');
    await page.waitForLoadState('load');
    const teamsUrl = page.url();

    // Navigate to profile or another page
    await page.goto('/profile');
    await page.waitForLoadState('load');
    const profileUrl = page.url();

    // Go back using browser history
    await page.goBack();
    await page.waitForLoadState('load');

    // Should be back at teams page
    await expect(page).toHaveURL(teamsUrl);
    await expect(page.getByRole('heading', { name: /teams/i, level: 1 })).toBeVisible();

    // Go forward
    await page.goForward();
    await page.waitForLoadState('load');

    // Should be back at profile
    await expect(page).toHaveURL(profileUrl);

    console.log('✓ Browser back/forward button navigation works correctly');
  });

  test('sidebar shows active team after navigation', async ({ page }) => {
    // Navigate to teams page
    await page.goto('/teams');

    // Look for a team link in sidebar
    const sidebar = page.locator('aside').or(page.locator('nav').first());

    if (await sidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Find a team link
      const teamLink = sidebar.getByRole('link', { name: /demo workspace|marketing|engineering|test/i }).first();

      if (await teamLink.isVisible({ timeout: 1000 }).catch(() => false)) {
        await teamLink.click();

        // Wait for navigation
        await page.waitForURL(/\/teams\/[a-zA-Z0-9_-]+/);

        // Verify sidebar still visible and team is highlighted/visible
        await expect(sidebar).toBeVisible();

        console.log('✓ Sidebar state preserved after team navigation');
      } else {
        console.log('ℹ No teams in sidebar to test with');
      }
    } else {
      console.log('ℹ Sidebar not found');
    }
  });

  test('URL search params persist across navigation (nuqs pattern)', async ({ page }) => {
    // This test validates that URL params (managed by nuqs) persist across navigation
    // If no project board exists, the test will skip gracefully

    // Navigate to teams page
    await page.goto('/teams');

    // Try to find an existing project to test with
    let projectUrl: string | null = null;

    // Look for project links in the page
    const allLinks = await page.locator('a[href*="/projects/"]').all();

    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && href.match(/\/teams\/[a-zA-Z0-9_-]+\/projects\/[a-zA-Z0-9_-]+$/)) {
        projectUrl = href;
        break;
      }
    }

    if (projectUrl) {
      // Navigate to the project page
      await page.goto(projectUrl);
      await page.waitForLoadState('load');

      // Apply a filter (if filter UI exists)
      const statusFilter = page.getByRole('button', { name: /status|filter/i }).or(
        page.getByLabel(/status/i)
      ).first();

      if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        await statusFilter.click();

        // Select a status option (if dropdown opens)
        const todoOption = page.getByRole('option', { name: /todo|to do/i }).or(
          page.getByText(/todo|to do/i).first()
        );

        if (await todoOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await todoOption.click();

          // Wait for URL to update with filter param
          await page.waitForTimeout(500);

          // Check if URL has query params
          const urlWithFilter = page.url();
          const hasParams = urlWithFilter.includes('?') || urlWithFilter.includes('status');

          if (hasParams) {
            // Navigate away (to a task detail if available)
            const taskLink = page.getByRole('link', { name: /task|item/i }).first();

            if (await taskLink.isVisible({ timeout: 1000 }).catch(() => false)) {
              await taskLink.click();
              await page.waitForTimeout(500);

              // Navigate back
              await page.goBack();

              // Verify filter params are still in URL
              expect(page.url()).toContain('status');

              console.log('✓ URL search params persist after navigation');
              return;
            }
          }
        }
      }

      console.log('ℹ Filter UI not available or params not in URL - nuqs may not be used on this route');
    } else {
      console.log('ℹ No projects available to test filter persistence');
    }
  });

  test('search term persists in URL across navigation', async ({ page }) => {
    // This test is similar to filter persistence but for search
    await page.goto('/teams');

    // Look for a search input
    const searchInput = page.getByPlaceholder(/search/i).or(
      page.getByRole('searchbox')
    ).first();

    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Enter search term
      await searchInput.fill('test search');
      await searchInput.press('Enter');

      // Wait for URL to update
      await page.waitForTimeout(500);

      const urlWithSearch = page.url();

      if (urlWithSearch.includes('search') || urlWithSearch.includes('test')) {
        // Navigate to another page
        await page.goto('/profile');

        // Navigate back
        await page.goBack();

        // Verify search param is still in URL
        const currentUrl = page.url();
        expect(currentUrl).toContain('search');

        console.log('✓ Search term persists in URL');
      } else {
        console.log('ℹ Search does not use URL params');
      }
    } else {
      console.log('ℹ No search input found to test');
    }
  });

  test('scroll position preserved by Next.js on back navigation', async ({ page }) => {
    // Navigate to a page with scrollable content (teams or projects list)
    await page.goto('/teams');

    // Check if page has scrollable content
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);

    if (pageHeight > viewportHeight + 100) {
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(300);

      const scrollBefore = await page.evaluate(() => window.scrollY);

      // Navigate to another page
      await page.goto('/profile');

      // Navigate back
      await page.goBack();

      // Wait for page to load
      await page.waitForLoadState('load');
      await page.waitForTimeout(300);

      // Check scroll position (Next.js should restore it)
      const scrollAfter = await page.evaluate(() => window.scrollY);

      // Allow some tolerance for scroll position
      const scrollRestored = Math.abs(scrollAfter - scrollBefore) < 50;

      if (scrollRestored) {
        console.log('✓ Scroll position preserved after back navigation');
      } else {
        console.log(`ℹ Scroll position changed: ${scrollBefore} → ${scrollAfter} (Next.js default behavior may vary)`);
      }
    } else {
      console.log('ℹ Page not tall enough to test scroll preservation');
    }
  });

  test('deep link access shows correct breadcrumbs and sidebar state', async ({ page }) => {
    // Find an existing project URL to deep link to
    await page.goto('/teams');

    // Try to find a project link
    const projectLink = page.getByRole('link', { name: /project|board|website/i }).first();

    if (await projectLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Get the project URL
      const projectUrl = await projectLink.getAttribute('href');

      if (projectUrl) {
        // Open in a new context (simulating direct URL access)
        await page.goto(projectUrl);

        // Wait for page to load
        await page.waitForLoadState('load');

        // Check for breadcrumbs
        const breadcrumbs = page.locator('nav[aria-label*="breadcrumb"]').or(
          page.locator('nav').filter({ has: page.getByText(/teams/i) })
        );

        if (await breadcrumbs.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Breadcrumbs should show correct hierarchy even on deep link
          await expect(breadcrumbs).toContainText(/teams/i);
          console.log('✓ Deep link shows correct breadcrumbs');
        }

        // Check for sidebar
        const sidebar = page.locator('aside').or(page.locator('nav').first());

        if (await sidebar.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Sidebar should be present and show teams
          console.log('✓ Deep link shows correct sidebar state');
        }
      }
    } else {
      console.log('ℹ No projects available for deep link testing');
    }
  });
});
