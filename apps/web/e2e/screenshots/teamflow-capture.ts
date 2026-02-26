import { chromium } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../public/screenshots')
const BASE_URL = 'https://teamflow.fernandomillan.me'

async function capture() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // Ensure output directory exists
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

  console.log('Starting TeamFlow screenshot capture...')
  console.log(`Output directory: ${SCREENSHOTS_DIR}`)

  // ---- Login ----
  console.log('\n[Auth] Navigating to login page...')
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Email').fill('demo1@teamflow.dev')
  await page.getByLabel('Password').fill('Password123')
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL(`${BASE_URL}/teams`)
  console.log('[Auth] Login successful, on /teams')

  // ---- Helper: get first team URL ----
  async function getFirstTeamId(): Promise<string | null> {
    await page.goto(`${BASE_URL}/teams`)
    await page.waitForLoadState('networkidle')
    const teamLink = page.locator('a[href*="/teams/"]').first()
    const href = await teamLink.getAttribute('href').catch(() => null)
    if (!href) return null
    const match = href.match(/\/teams\/([^/?#]+)/)
    return match ? match[1] : null
  }

  // ---- Helper: get first project URL for a team ----
  async function getFirstProjectId(teamId: string): Promise<string | null> {
    await page.goto(`${BASE_URL}/teams/${teamId}`)
    await page.waitForLoadState('networkidle')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    const href = await projectLink.getAttribute('href').catch(() => null)
    if (!href) return null
    const match = href.match(/\/projects\/([^/?#]+)/)
    return match ? match[1] : null
  }

  const teamId = await getFirstTeamId()
  console.log(`[Info] First team ID: ${teamId}`)

  let projectId: string | null = null
  if (teamId) {
    projectId = await getFirstProjectId(teamId)
    console.log(`[Info] First project ID: ${projectId}`)
  }

  // ---- Screenshot 1: teamflow-kanban.png ----
  console.log('\n[1/5] Capturing kanban board...')
  try {
    if (teamId && projectId) {
      await page.goto(`${BASE_URL}/teams/${teamId}/projects/${projectId}`)
      await page.waitForLoadState('networkidle')
      // Wait for board columns or kanban elements
      await page
        .locator('[data-testid*="column"], .kanban, [data-testid*="board"], [data-testid*="kanban"]')
        .first()
        .waitFor({ timeout: 5000 })
        .catch(async () => {
          // fallback: wait a bit for board to settle
          await page.waitForTimeout(1500)
        })
    } else {
      // Fallback: screenshot teams page
      await page.goto(`${BASE_URL}/teams`)
      await page.waitForLoadState('networkidle')
    }
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-kanban.png'),
      fullPage: false,
    })
    console.log('[1/5] teamflow-kanban.png saved')
  } catch (err) {
    console.error('[1/5] Error capturing kanban, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-kanban.png'),
      fullPage: false,
    })
  }

  // ---- Screenshot 2: teamflow-presence.png ----
  console.log('\n[2/5] Capturing presence indicators...')
  try {
    // Presence is typically shown on the team detail page with online members
    if (teamId) {
      await page.goto(`${BASE_URL}/teams/${teamId}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000) // allow WebSocket presence to connect
    } else {
      await page.goto(`${BASE_URL}/teams`)
      await page.waitForLoadState('networkidle')
    }
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-presence.png'),
      fullPage: false,
    })
    console.log('[2/5] teamflow-presence.png saved')
  } catch (err) {
    console.error('[2/5] Error capturing presence, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-presence.png'),
      fullPage: false,
    })
  }

  // ---- Screenshot 3: teamflow-task-modal.png ----
  console.log('\n[3/5] Capturing task creation modal...')
  try {
    if (teamId && projectId) {
      await page.goto(`${BASE_URL}/teams/${teamId}/projects/${projectId}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
    } else if (teamId) {
      await page.goto(`${BASE_URL}/teams/${teamId}`)
      await page.waitForLoadState('networkidle')
    }

    // Try to open the create task / new task modal
    const createTaskBtn = page
      .getByRole('button', { name: /new task|create task|add task|\+ task/i })
      .first()

    if (await createTaskBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createTaskBtn.click()
      // Wait for modal/dialog to appear
      await page
        .locator('[role="dialog"], [data-testid*="modal"]')
        .first()
        .waitFor({ state: 'visible', timeout: 5000 })
        .catch(() => {
          console.log('[3/5] Modal not found via role="dialog", taking screenshot of current state')
        })
      await page.waitForTimeout(300) // let animation settle
    } else {
      console.log('[3/5] Create task button not found — using board state as fallback')
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-task-modal.png'),
      fullPage: false,
    })
    console.log('[3/5] teamflow-task-modal.png saved')
  } catch (err) {
    console.error('[3/5] Error capturing task modal, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-task-modal.png'),
      fullPage: false,
    })
  }

  // ---- Screenshot 4: teamflow-rbac.png ----
  console.log('\n[4/5] Capturing RBAC / team management...')
  try {
    if (teamId) {
      // Try settings or members page
      const settingsUrl = `${BASE_URL}/teams/${teamId}/settings`
      const membersUrl = `${BASE_URL}/teams/${teamId}/members`

      await page.goto(settingsUrl)
      await page.waitForLoadState('networkidle')

      // Check if we got a 404 or redirected away — if so, try members URL
      const currentUrl = page.url()
      if (!currentUrl.includes('/settings') && !currentUrl.includes(teamId)) {
        await page.goto(membersUrl)
        await page.waitForLoadState('networkidle')
      }

      // If still not on a useful page, try the team detail which shows members
      const finalUrl = page.url()
      if (
        !finalUrl.includes('/settings') &&
        !finalUrl.includes('/members') &&
        !finalUrl.includes(teamId)
      ) {
        await page.goto(`${BASE_URL}/teams/${teamId}`)
        await page.waitForLoadState('networkidle')
      }
    } else {
      await page.goto(`${BASE_URL}/teams`)
      await page.waitForLoadState('networkidle')
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-rbac.png'),
      fullPage: false,
    })
    console.log('[4/5] teamflow-rbac.png saved')
  } catch (err) {
    console.error('[4/5] Error capturing RBAC, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-rbac.png'),
      fullPage: false,
    })
  }

  // ---- Screenshot 5: teamflow-audit-log.png ----
  console.log('\n[5/5] Capturing audit log / activity...')
  try {
    if (teamId) {
      // Try common audit/activity routes
      const activityUrl = `${BASE_URL}/teams/${teamId}/activity`
      const auditUrl = `${BASE_URL}/teams/${teamId}/audit`

      await page.goto(activityUrl)
      await page.waitForLoadState('networkidle')

      const currentUrl = page.url()
      if (!currentUrl.includes('/activity') && !currentUrl.includes('/audit')) {
        await page.goto(auditUrl)
        await page.waitForLoadState('networkidle')
      }

      // If still not on activity page, try finding activity link on team detail
      const finalUrl = page.url()
      if (!finalUrl.includes('/activity') && !finalUrl.includes('/audit')) {
        await page.goto(`${BASE_URL}/teams/${teamId}`)
        await page.waitForLoadState('networkidle')

        // Look for an "Activity" or "Audit" tab/link on the page
        const activityLink = page
          .getByRole('link', { name: /activity|audit log/i })
          .first()

        if (await activityLink.isVisible({ timeout: 2000 }).catch(() => false)) {
          await activityLink.click()
          await page.waitForLoadState('networkidle')
        } else {
          // Try tab button
          const activityTab = page
            .getByRole('tab', { name: /activity|audit/i })
            .first()
          if (await activityTab.isVisible({ timeout: 2000 }).catch(() => false)) {
            await activityTab.click()
            await page.waitForTimeout(500)
          }
        }
      }
    } else {
      await page.goto(`${BASE_URL}/teams`)
      await page.waitForLoadState('networkidle')
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-audit-log.png'),
      fullPage: false,
    })
    console.log('[5/5] teamflow-audit-log.png saved')
  } catch (err) {
    console.error('[5/5] Error capturing audit log, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'teamflow-audit-log.png'),
      fullPage: false,
    })
  }

  await browser.close()

  // ---- Final report ----
  console.log('\n=== Screenshot capture complete ===')
  const files = [
    'teamflow-kanban.png',
    'teamflow-presence.png',
    'teamflow-task-modal.png',
    'teamflow-rbac.png',
    'teamflow-audit-log.png',
  ]
  for (const file of files) {
    const filePath = path.join(SCREENSHOTS_DIR, file)
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath)
      console.log(`  ${file}: ${Math.round(stat.size / 1024)}KB`)
    } else {
      console.error(`  MISSING: ${file}`)
    }
  }
}

capture().catch(console.error)
