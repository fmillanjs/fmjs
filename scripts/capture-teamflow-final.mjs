import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../apps/web/public/screenshots');

const browser = await chromium.launch({ headless: true });
const tf = await browser.newPage();
await tf.setViewportSize({ width: 1280, height: 800 });

await tf.goto('https://teamflow.fernandomillan.me/login', { waitUntil: 'networkidle', timeout: 30000 });
await tf.locator('input[type="email"]').first().fill('demo1@teamflow.dev');
await tf.locator('input[type="password"]').first().fill('Password123');
await tf.locator('button[type="submit"]').first().click();
await tf.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
await tf.waitForTimeout(3000);

// Navigate directly to Product Launch project (has real-time collaboration tasks)
const productLaunchUrl = 'https://teamflow.fernandomillan.me/teams/cmm2tvn2y0003m086aqzrs3bl/projects/cmm2tvn3w000gm086ips94yz6';
await tf.goto(productLaunchUrl, { waitUntil: 'networkidle', timeout: 15000 });
await tf.waitForTimeout(2000);
console.log('Product Launch URL:', tf.url());

// Log all h1/h2 to understand layout
const headings = await tf.locator('h1, h2').all();
for (const h of headings) {
  const text = await h.textContent().catch(() => '');
  console.log('Heading:', text.trim());
}

// Click Kanban view if available
const kanbanBtn = tf.locator('button:has-text("Kanban"), a:has-text("Kanban")').first();
const kanbanVis = await kanbanBtn.isVisible({ timeout: 3000 }).catch(() => false);
if (kanbanVis) {
  await kanbanBtn.click();
  await tf.waitForTimeout(2000);
  console.log('Switched to Kanban view');
}

await tf.screenshot({ path: path.join(outDir, 'teamflow-kanban.png'), fullPage: false });
console.log('teamflow-kanban.png captured from:', tf.url());

// For presence screenshot: use the team page which shows full content with user info in header
await tf.goto('https://teamflow.fernandomillan.me/teams/cmm2tvn2y0003m086aqzrs3bl', { waitUntil: 'networkidle', timeout: 15000 });
await tf.waitForTimeout(2000);
await tf.screenshot({ path: path.join(outDir, 'teamflow-presence.png'), fullPage: false });
console.log('teamflow-presence.png captured from:', tf.url());

await browser.close();
console.log('Done');
