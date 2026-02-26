import { chromium } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const SCREENSHOTS_DIR = path.resolve(__dirname, '../../../public/screenshots')
const BASE_URL = 'https://devcollab.fernandomillan.me'
const WORKSPACE_SLUG = 'devcollab-demo'

async function capture() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // Ensure output directory exists
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

  console.log('Starting DevCollab screenshot capture...')
  console.log(`Output directory: ${SCREENSHOTS_DIR}`)

  // ---- Login ----
  console.log('\n[Auth] Navigating to login page...')
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Email').fill('admin@demo.devcollab')
  await page.getByLabel('Password').fill('Demo1234!')
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(`${BASE_URL}/w/${WORKSPACE_SLUG}`, { timeout: 15000 })
  console.log(`[Auth] Login successful, on /w/${WORKSPACE_SLUG}`)

  // ---- Helper: get first snippet ID ----
  async function getFirstSnippetId(): Promise<string | null> {
    try {
      await page.goto(`${BASE_URL}/w/${WORKSPACE_SLUG}/snippets`)
      await page.waitForLoadState('networkidle')
      const snippetLink = page.locator(`a[href*="/w/${WORKSPACE_SLUG}/snippets/"]`).first()
      const href = await snippetLink.getAttribute('href').catch(() => null)
      if (!href) return null
      const match = href.match(/\/snippets\/([^/?#]+)/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  // ---- Helper: get first post ID ----
  async function getFirstPostId(): Promise<string | null> {
    try {
      await page.goto(`${BASE_URL}/w/${WORKSPACE_SLUG}/posts`)
      await page.waitForLoadState('networkidle')
      const postLink = page.locator(`a[href*="/w/${WORKSPACE_SLUG}/posts/"]`).first()
      const href = await postLink.getAttribute('href').catch(() => null)
      if (!href) return null
      const match = href.match(/\/posts\/([^/?#]+)/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  const snippetId = await getFirstSnippetId()
  console.log(`[Info] First snippet ID: ${snippetId}`)

  const postId = await getFirstPostId()
  console.log(`[Info] First post ID: ${postId}`)

  // ---- Screenshot 1: devcollab-workspace.png ----
  // Main workspace — posts feed (the richest overview page)
  console.log('\n[1/5] Capturing workspace/posts feed...')
  try {
    await page.goto(`${BASE_URL}/w/${WORKSPACE_SLUG}/posts`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-workspace.png'),
      fullPage: false,
    })
    console.log('[1/5] devcollab-workspace.png saved')
  } catch (err) {
    console.error('[1/5] Error capturing workspace, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-workspace.png'),
      fullPage: false,
    })
  }

  // ---- Screenshot 2: devcollab-code-snippet.png ----
  // Snippet detail page with Shiki syntax highlighting
  console.log('\n[2/5] Capturing code snippet with Shiki highlight...')
  try {
    if (snippetId) {
      await page.goto(`${BASE_URL}/w/${WORKSPACE_SLUG}/snippets/${snippetId}`)
      await page.waitForLoadState('networkidle')
      // Wait for code block to render (Shiki server-side highlight)
      await page
        .locator('pre, code, [class*="shiki"]')
        .first()
        .waitFor({ timeout: 5000 })
        .catch(async () => {
          await page.waitForTimeout(1000)
        })
    } else {
      // Fallback: snippets list page
      await page.goto(`${BASE_URL}/w/${WORKSPACE_SLUG}/snippets`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
    }
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-code-snippet.png'),
      fullPage: false,
    })
    console.log('[2/5] devcollab-code-snippet.png saved')
  } catch (err) {
    console.error('[2/5] Error capturing code snippet, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-code-snippet.png'),
      fullPage: false,
    })
  }

  // ---- Screenshot 3: devcollab-thread.png ----
  // Post detail with threaded comments and @mention
  console.log('\n[3/5] Capturing threaded discussion with @mention...')
  try {
    if (postId) {
      await page.goto(`${BASE_URL}/w/${WORKSPACE_SLUG}/posts/${postId}`)
      await page.waitForLoadState('networkidle')
      // Wait for comment section to load
      await page
        .locator('[data-testid*="comment"], .comment, [class*="comment"]')
        .first()
        .waitFor({ timeout: 5000 })
        .catch(async () => {
          // Comments may not have specific testids — wait for page settle
          await page.waitForTimeout(1200)
        })
    } else {
      // Fallback: posts list page
      await page.goto(`${BASE_URL}/w/${WORKSPACE_SLUG}/posts`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)
    }
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-thread.png'),
      fullPage: false,
    })
    console.log('[3/5] devcollab-thread.png saved')
  } catch (err) {
    console.error('[3/5] Error capturing thread, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-thread.png'),
      fullPage: false,
    })
  }

  // ---- Screenshot 4: devcollab-search.png ----
  // Cmd+K search modal open with results
  console.log('\n[4/5] Capturing Cmd+K search modal...')
  try {
    // Navigate to workspace posts to ensure SearchModal is mounted in the nav
    await page.goto(`${BASE_URL}/w/${WORKSPACE_SLUG}/posts`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Open search modal with Ctrl+K (works on Linux; Meta+K for Mac)
    await page.keyboard.press('Control+k')
    // Wait for the modal input to appear
    await page
      .locator('input[placeholder*="Search"]')
      .first()
      .waitFor({ state: 'visible', timeout: 5000 })

    // Type a search query to show results
    await page.keyboard.type('auth')
    await page.waitForTimeout(600) // wait for 300ms debounce + response

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-search.png'),
      fullPage: false,
    })
    console.log('[4/5] devcollab-search.png saved')
  } catch (err) {
    console.error('[4/5] Error capturing search modal, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-search.png'),
      fullPage: false,
    })
  }

  // ---- Screenshot 5: devcollab-activity.png ----
  // Activity feed / notification bell
  console.log('\n[5/5] Capturing activity feed...')
  try {
    await page.goto(`${BASE_URL}/w/${WORKSPACE_SLUG}/activity`)
    await page.waitForLoadState('networkidle')
    // Wait for activity events to render
    await page
      .locator('[data-testid*="activity"], [class*="activity"], li')
      .first()
      .waitFor({ timeout: 5000 })
      .catch(async () => {
        await page.waitForTimeout(1000)
      })
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-activity.png'),
      fullPage: false,
    })
    console.log('[5/5] devcollab-activity.png saved')
  } catch (err) {
    console.error('[5/5] Error capturing activity feed, saving fallback:', err)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'devcollab-activity.png'),
      fullPage: false,
    })
  }

  await browser.close()

  // ---- Final report ----
  console.log('\n=== Screenshot capture complete ===')
  const files = [
    'devcollab-workspace.png',
    'devcollab-code-snippet.png',
    'devcollab-thread.png',
    'devcollab-search.png',
    'devcollab-activity.png',
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
