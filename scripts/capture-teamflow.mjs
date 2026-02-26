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
console.log('After login:', tf.url());

// Navigate to team page
await tf.goto('https://teamflow.fernandomillan.me/teams/cmm2tvn2y0003m086aqzrs3bl', { waitUntil: 'networkidle', timeout: 15000 });
await tf.waitForTimeout(2000);
console.log('Team page URL:', tf.url());

// List all anchor links to understand project structure
const allLinks = await tf.locator('a').all();
for (const link of allLinks) {
  const href = await link.getAttribute('href').catch(() => null);
  const text = await link.textContent().catch(() => '');
  if (href && (href.includes('project') || href.includes('task') || href.includes('kanban'))) {
    console.log('Link:', href, '|', text.trim().substring(0, 40));
  }
}

// Also print page title/heading
const h1 = await tf.locator('h1').first().textContent().catch(() => 'no h1');
console.log('Page H1:', h1);

// Take screenshot of team page
await tf.screenshot({ path: path.join(outDir, 'teamflow-team-debug.png'), fullPage: false });

await browser.close();
