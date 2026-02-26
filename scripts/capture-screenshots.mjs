import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../apps/web/public/screenshots');

const browser = await chromium.launch({ headless: true });

// ─────────────────────────────────────────────────
// TeamFlow: Login and capture Kanban board
// ─────────────────────────────────────────────────
console.log('=== Capturing TeamFlow ===');
const tf = await browser.newPage();
await tf.setViewportSize({ width: 1280, height: 800 });

await tf.goto('https://teamflow.fernandomillan.me/login', { waitUntil: 'networkidle', timeout: 30000 });
const tfEmail = tf.locator('input[type="email"], input[name="email"]').first();
await tfEmail.fill('demo1@teamflow.dev');
await tf.locator('input[type="password"]').first().fill('Password123');
await tf.locator('button[type="submit"]').first().click();
await tf.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
await tf.waitForTimeout(3000);
console.log('TeamFlow after login URL:', tf.url());

// Click into "Demo Workspace" team
const demoTeamLink = tf.locator('text=Demo Workspace').first();
const demoTeamVisible = await demoTeamLink.isVisible({ timeout: 5000 }).catch(() => false);
if (demoTeamVisible) {
  console.log('Clicking Demo Workspace team...');
  await demoTeamLink.click();
  await tf.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await tf.waitForTimeout(2000);
  console.log('After team click:', tf.url());
}

// Look for a project link
const projectLinks = await tf.locator('a[href*="/projects/"]').all();
if (projectLinks.length > 0) {
  console.log(`Found ${projectLinks.length} project links, clicking first one...`);
  await projectLinks[0].click();
  await tf.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await tf.waitForTimeout(2000);
  console.log('After project click:', tf.url());

  // Look for Kanban tab/button
  const kanbanBtn = tf.locator('button:has-text("Kanban"), a:has-text("Kanban"), [data-view="kanban"]').first();
  const kanbanVisible = await kanbanBtn.isVisible({ timeout: 3000 }).catch(() => false);
  if (kanbanVisible) {
    await kanbanBtn.click();
    await tf.waitForTimeout(2000);
    console.log('Clicked Kanban view');
  }
} else {
  console.log('No project links found, using teams page');
}

await tf.screenshot({ path: path.join(outDir, 'teamflow-kanban.png'), fullPage: false });
console.log('teamflow-kanban.png captured from:', tf.url());

// TeamFlow presence: navigate to dashboard to show presence indicators
await tf.goto('https://teamflow.fernandomillan.me/teams', { waitUntil: 'networkidle', timeout: 15000 });
await tf.waitForTimeout(2000);
await tf.screenshot({ path: path.join(outDir, 'teamflow-presence.png'), fullPage: false });
console.log('teamflow-presence.png captured from:', tf.url());

// ─────────────────────────────────────────────────
// DevCollab: Login and capture snippets, then search
// ─────────────────────────────────────────────────
console.log('=== Capturing DevCollab ===');
const dc = await browser.newPage();
await dc.setViewportSize({ width: 1280, height: 800 });
await dc.goto('https://devcollab.fernandomillan.me/login', { waitUntil: 'networkidle', timeout: 30000 });

const dcEmail = dc.locator('input[type="email"], input[name="email"]').first();
await dcEmail.fill('admin@demo.devcollab');
await dc.locator('input[type="password"]').first().fill('Demo1234!');
await dc.locator('button[type="submit"]').first().click();
await dc.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
await dc.waitForTimeout(3000);
console.log('DevCollab after login URL:', dc.url());

// Navigate to snippets list
await dc.goto('https://devcollab.fernandomillan.me/w/devcollab-demo/snippets', { waitUntil: 'networkidle', timeout: 15000 });
await dc.waitForTimeout(2000);
console.log('Snippets URL:', dc.url());

await dc.screenshot({ path: path.join(outDir, 'devcollab-workspace.png'), fullPage: false });
console.log('devcollab-workspace.png captured from:', dc.url());

// DevCollab: Click the Search button (it's in the navbar as a button element)
const searchInput = dc.locator('button:has-text("Search"), input[placeholder*="Search"]').first();
const searchVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
console.log('Search element visible:', searchVisible);

if (searchVisible) {
  await searchInput.click();
  await dc.waitForTimeout(1500);
  console.log('Clicked search button');
} else {
  // Try clicking the search ⌘K button in nav
  const cmdkBtn = dc.locator('[aria-label*="search" i], button:has-text("⌘K"), button[class*="search"]').first();
  const cmdkVisible = await cmdkBtn.isVisible({ timeout: 2000 }).catch(() => false);
  if (cmdkVisible) {
    await cmdkBtn.click();
    await dc.waitForTimeout(1500);
    console.log('Clicked Cmd+K search button');
  } else {
    // Try keyboard
    await dc.keyboard.press('Control+k');
    await dc.waitForTimeout(1500);
    console.log('Used keyboard Control+k');
  }
}

// Check if any modal/dialog is visible now
const dialogVisible = await dc.locator('[role="dialog"], [cmdk-root], .cmdk').isVisible({ timeout: 2000 }).catch(() => false);
console.log('Dialog/modal visible:', dialogVisible);

await dc.screenshot({ path: path.join(outDir, 'devcollab-search.png'), fullPage: false });
console.log('devcollab-search.png captured from:', dc.url());

await browser.close();
console.log('=== All screenshots captured ===');
