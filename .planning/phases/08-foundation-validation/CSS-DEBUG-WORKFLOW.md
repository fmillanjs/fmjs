# CSS Debugging Workflow

**Purpose:** Prevent CSS caching issues that cause "I modified CSS but see no changes" frustration during development.

**Context:** This workflow was created after Phase 07.1-03 failed due to caching issues. Developers modified CSS expecting immediate feedback but encountered stale cached styles, leading to wasted debugging time.

**Last Updated:** 2026-02-17

---

## Table of Contents

1. [Standard CSS Change Workflow](#standard-css-change-workflow)
2. [Troubleshooting Checklist](#troubleshooting-checklist)
3. [Prevention Strategies](#prevention-strategies)
4. [Validation Checklist](#validation-checklist)
5. [Common Pitfalls](#common-pitfalls)

---

## Standard CSS Change Workflow

**Expected behavior:** CSS changes appear in browser automatically within 1-2 seconds.

### Steps

1. **Modify globals.css @theme token**
   - Open `apps/web/app/globals.css`
   - Edit any token (e.g., change `--color-primary: oklch(55% 0.2 250)` to `oklch(75% 0.25 30)`)

2. **Save file**
   - Keyboard shortcut: `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)
   - Wait for file system to persist changes

3. **Wait for Vite HMR (Hot Module Replacement)**
   - Duration: **1-2 seconds**
   - Next.js dev server detects file change
   - Compiles CSS automatically
   - Watch terminal for: `✓ Compiled in XXXms`

4. **Browser auto-refreshes**
   - **No manual action needed**
   - Fast Refresh updates page automatically
   - Changes visible immediately

5. **Expected outcome**
   - CSS changes visible in browser
   - No console errors
   - No manual refresh required

### Visual Diagram

```
[Edit globals.css] → [Save (Ctrl+S)] → [HMR compiles (1-2s)] → [Browser auto-updates]
                                                  ↓
                                         Terminal shows:
                                         ✓ Compiled in 263ms
```

---

## Troubleshooting Checklist

**Use this when CSS changes don't appear after following the standard workflow.**

### Step 1: Hard Reload Browser

**Why:** Clears browser's CSS cache, which may serve stale stylesheets.

**How to hard reload:**

| Browser | Windows/Linux | Mac |
|---------|---------------|-----|
| **Chrome / Edge** | `Ctrl + Shift + R` | `Cmd + Shift + R` |
| **Firefox** | `Ctrl + F5` | `Cmd + Shift + R` |
| **Safari** | — | `Cmd + Option + R` |

**Expected result:** Browser bypasses cache and fetches fresh CSS from server.

**If this works:** Problem was browser cache. Enable "Disable cache" in DevTools (see Prevention Strategies).

**If this doesn't work:** Proceed to Step 2.

---

### Step 2: Clear Next.js Build Cache

**Why:** `.next/` directory contains compiled server-side code. Stale cache can serve old CSS even after source file changes.

**How to clear:**

```bash
cd apps/web
rm -rf .next
npm run dev
```

**Expected result:**
- Terminal shows: `Starting...`
- Fresh rebuild takes 1-3 seconds
- `Ready in XXXXms`

**What this does:**
- Deletes all compiled Next.js files
- Forces complete rebuild from source
- Clears server-side CSS compilation cache

**If this works:** Problem was .next cache. Consider clearing cache before major CSS refactors.

**If this doesn't work:** Proceed to Step 3.

---

### Step 3: Verify File Name and Location

**Why:** Common mistake is editing the wrong file or having multiple files with similar names.

**Critical checks:**

1. **File name MUST be exactly:** `globals.css` (NOT `global.css`, NOT `styles.css`)

2. **File location MUST be:** `apps/web/app/globals.css`
   ```
   fernandomillan/
   └── apps/
       └── web/
           └── app/
               └── globals.css  ← CORRECT LOCATION
   ```

3. **File MUST be imported in root layout:**
   - Open: `apps/web/app/layout.tsx`
   - Verify line exists: `import './globals.css'`

**How to verify:**

```bash
# Check file exists at correct location
test -f apps/web/app/globals.css && echo "✅ File found" || echo "❌ File missing"

# Check import in root layout
grep -q "import './globals.css'" apps/web/app/layout.tsx && echo "✅ Imported" || echo "❌ Not imported"
```

**If file is wrong:** You've been editing a file that Next.js doesn't load. Move changes to correct file.

**If file is correct:** Proceed to Step 4.

---

### Step 4: Check Browser DevTools

**Why:** Errors in CSS syntax or build process are logged in browser console and network panel.

**How to investigate:**

1. **Open DevTools:** Press `F12` in any browser

2. **Enable "Disable cache":**
   - Go to **Network** tab
   - Check **"Disable cache"** checkbox
   - Keep DevTools open while developing

3. **Check Console for errors:**
   - Go to **Console** tab
   - Look for red error messages
   - Common errors:
     - `Failed to load resource: net::ERR_CONNECTION_REFUSED` → Dev server not running
     - `SyntaxError: Unexpected token` → CSS syntax error
     - `Module not found` → Import path wrong

4. **Inspect element styles:**
   - Go to **Elements** tab (Chrome) or **Inspector** tab (Firefox)
   - Click element on page
   - Look at **Styles** panel → Shows which CSS rules apply
   - Look at **Computed** panel → Shows final computed values
   - Check if `--color-primary` has expected value

5. **Check Network tab:**
   - Look for CSS file requests
   - Status should be `200 OK` (not `304 Not Modified` if cache disabled)
   - Click CSS file → Preview tab shows file content
   - Verify your changes are in the served file

**If DevTools shows errors:** Fix the errors (syntax, imports, etc.)

**If no errors but styles wrong:** Proceed to Step 5.

---

### Step 5: Verify Tailwind Configuration

**Why:** Tailwind v4 requires specific setup. Missing configuration breaks CSS processing.

**Critical configuration checks:**

#### 5a. Check @import directive

**File:** `apps/web/app/globals.css`

**Line 1 MUST be:**
```css
@import "tailwindcss";
```

**NOT v3 syntax:**
```css
/* ❌ WRONG (v3 syntax) */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**How to verify:**
```bash
head -1 apps/web/app/globals.css
# Expected output: @import "tailwindcss";
```

---

#### 5b. Check package.json dependency

**File:** `apps/web/package.json`

**Must have:**
```json
{
  "dependencies": {
    "@tailwindcss/postcss": "^4.x.x"
  }
}
```

**How to verify:**
```bash
grep '@tailwindcss/postcss' apps/web/package.json
# Expected output: "@tailwindcss/postcss": "^4.1.18",
```

**If missing:** Install it:
```bash
cd apps/web
npm install @tailwindcss/postcss
```

---

#### 5c. Check PostCSS configuration

**File:** `apps/web/postcss.config.mjs`

**Must contain:**
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

**How to verify:**
```bash
cat apps/web/postcss.config.mjs
```

**If missing or wrong:** Create/update the file with correct config.

---

### Step 6: Restart Dev Server

**Why:** Sometimes HMR connection breaks or server gets into bad state.

**How to restart:**

```bash
# Stop server (Ctrl+C in terminal where npm run dev is running)
# Or kill process:
pkill -f "next dev"

# Restart
cd apps/web
npm run dev
```

**Expected result:** Server starts fresh with new WebSocket connection for HMR.

**If this works:** Server was in bad state. If HMR fails 2+ times in row, restart immediately.

---

## Prevention Strategies

**Apply these practices to avoid CSS caching issues before they happen.**

### 1. Enable "Disable cache" during CSS work

**Where:** Browser DevTools → Network tab → "Disable cache" checkbox

**Why:** Prevents browser from serving stale cached CSS files.

**When:** Enable whenever working on CSS/styling. Disable for regular feature development (caching is helpful for performance).

**Cost:** Slightly slower page loads (negligible on localhost).

---

### 2. Hard reload as first troubleshooting step

**Default reaction when CSS doesn't update:**

❌ **Don't do this first:**
- Re-edit the CSS file
- Restart dev server
- Check syntax
- Ask "why isn't this working?"

✅ **Do this first:**
- Press `Ctrl + Shift + R` (hard reload)
- Check if changes now visible

**Why:** 80% of CSS issues are browser cache. Hard reload takes 1 second and solves most problems.

---

### 3. Test with simple utility class first

**Before complex token changes:**

1. Add test element:
   ```tsx
   <div className="bg-red-500 text-white p-4">
     Tailwind Test
   </div>
   ```

2. Save and verify red background appears

3. If test works → Tailwind is functional, your complex change has a different issue

4. If test doesn't work → Fundamental Tailwind setup problem

**Why:** Isolates problem. "bg-red-500" is simpler than "@theme token consumption with CSS variables."

---

### 4. Check browser console immediately after save

**Habit:** Press `F12` → Console tab before making CSS changes. Keep it visible while editing.

**Watch for:**
- `✓ Compiled successfully` (green) → Good
- `Failed to compile` (red) → Syntax error, read message
- `Warning: ...` (yellow) → Non-breaking issue, but investigate

**Why:** Immediate feedback loop. Don't wait 5 minutes to discover syntax error.

---

### 5. Restart dev server after 2+ HMR failures

**Pattern to watch:**
1. Edit CSS → No change in browser
2. Edit CSS again → No change in browser
3. Edit CSS third time → Still no change

**Action:** Don't keep trying. Restart server:
```bash
pkill -f "next dev"
cd apps/web
npm run dev
```

**Why:** HMR WebSocket connection may be broken. Server restart takes 2 seconds, faster than debugging HMR issues.

---

## Validation Checklist

**Run this checklist after any @theme token change to confirm success.**

### After making CSS change:

- [ ] **Browser shows updated styles**
  - Visual confirmation: color/spacing/etc. changed as expected
  - No visual glitches or partially applied styles

- [ ] **Console has no CSS errors**
  - Open DevTools → Console tab
  - No red error messages
  - No "Failed to compile" warnings

- [ ] **Hard reload doesn't change appearance**
  - Press `Ctrl + Shift + R`
  - Page looks identical before and after hard reload
  - Confirms styles are persisted (not just in browser cache)

- [ ] **Computed styles match expected values**
  - DevTools → Elements → Select element → Computed tab
  - Find CSS property (e.g., `background-color`)
  - Value matches your @theme token (e.g., `oklch(55% 0.2 250)`)

### If all 4 checks pass:

✅ **CSS change successful.** Proceed with confidence.

### If any check fails:

❌ **Follow Troubleshooting Checklist** (Step 1 → Step 6 until resolved).

---

## Common Pitfalls

**Lessons learned from Phase 07.1-03 and other debugging sessions.**

### 1. Modifying wrong file

**Symptom:** Edit CSS, save, see no changes. File path looks correct.

**Root cause:** Multiple files with similar names:
- `global.css` vs `globals.css` (missing 's')
- `styles/globals.css` vs `app/globals.css` (wrong directory)
- Old deleted file still open in editor tab

**Solution:**
- Check file path in editor tab/title bar
- Verify: `apps/web/app/globals.css` (exact path)
- Close duplicate tabs
- Use VSCode's "Reveal in File Explorer" to confirm location

**Prevention:** Bookmark correct file in editor. Use file search (`Ctrl+P`) instead of clicking through directories.

---

### 2. Browser cache not cleared

**Symptom:** CSS compiles successfully in terminal, but browser shows old styles.

**Root cause:** Browser serves cached stylesheet even though server has new one.

**Evidence:**
- Terminal shows: `✓ Compiled in 263ms`
- Network tab shows: `304 Not Modified` (cached response)
- Hard reload fixes it immediately

**Solution:** `Ctrl + Shift + R` (hard reload)

**Prevention:** Enable "Disable cache" in DevTools during CSS work.

---

### 3. .next cache not cleared after major changes

**Symptom:** Small CSS changes work (HMR), but major refactors don't (e.g., adding new @theme tokens, changing @import).

**Root cause:** `.next/` directory caches server-side compiled code. Some changes require full rebuild.

**When to clear .next:**
- Changing Tailwind configuration
- Adding new PostCSS plugins
- Migrating from v3 to v4
- After pulling major CSS changes from git

**Solution:**
```bash
rm -rf apps/web/.next
npm run dev
```

**Prevention:** Make .next clearing part of workflow after git pulls or major config changes.

---

### 4. Testing in production build instead of dev server

**Symptom:** CSS changes don't appear. No HMR compilation logs in terminal.

**Root cause:** Running `npm run build && npm run start` instead of `npm run dev`.

**Evidence:**
- Terminal shows: `Starting production server...` (not `Ready in XXXXms`)
- No compilation logs after file saves
- Browser doesn't auto-refresh

**Solution:** Stop production server. Run `npm run dev` instead.

**Prevention:** Use `npm run dev` for development. Only use production build for deployment testing.

---

### 5. Forgetting to save file

**Symptom:** Edit CSS, wait for changes, nothing happens.

**Root cause:** File not saved. Editor shows unsaved indicator (dot/asterisk in tab title).

**Evidence:**
- VSCode shows white dot on tab
- Terminal shows no compilation activity
- File watcher doesn't trigger

**Solution:** Press `Ctrl+S` / `Cmd+S`

**Prevention:**
- Enable VSCode auto-save: File → Preferences → Settings → "Files: Auto Save" → "afterDelay"
- Habitually press Ctrl+S after every edit
- Watch terminal for compilation logs as confirmation

---

### 6. CSS syntax errors

**Symptom:** Page loads with no styles or partial styles. Console shows errors.

**Root cause:** Typo in CSS breaks compilation.

**Common syntax errors:**
```css
/* ❌ Missing semicolon */
--color-primary: oklch(55% 0.2 250)

/* ❌ Wrong function name */
--color-primary: oklab(55% 0.2 250); /* should be oklch */

/* ❌ Missing closing brace */
@theme {
  --color-primary: oklch(55% 0.2 250);
/* missing } */

/* ❌ Wrong directive */
@import 'tailwindcss'; /* should use double quotes */
```

**Solution:**
- Read error message in console
- Check line number indicated
- Fix syntax error
- Save file

**Prevention:**
- Use CSS linter (stylelint)
- Enable editor syntax highlighting
- Test changes incrementally (don't change 50 lines at once)

---

### 7. Webpack/PostCSS configuration issues

**Symptom:** Server fails to start. Compilation errors about missing plugins.

**Root cause:** Missing or misconfigured PostCSS setup.

**Evidence:**
```
Error: Cannot find module '@tailwindcss/postcss'
```

**Solution:**
```bash
cd apps/web
npm install @tailwindcss/postcss
# Check postcss.config.mjs exists and has correct content
```

**Prevention:** Follow Tailwind v4 migration guide exactly. Don't mix v3 and v4 configurations.

---

## Quick Reference Card

**Copy this to sticky note for easy access:**

```
CSS NOT UPDATING?

1. Hard reload: Ctrl+Shift+R (⌘+Shift+R on Mac)
2. Check console: F12 → Console tab
3. Clear .next: rm -rf .next && npm run dev
4. Verify file: apps/web/app/globals.css
5. Check @import: Line 1 must be @import "tailwindcss";
6. Restart server: Ctrl+C → npm run dev

90% of issues = browser cache → Step 1 fixes it.
```

---

## Additional Resources

- **Tailwind v4 Docs:** https://tailwindcss.com/docs/v4-beta
- **Next.js Fast Refresh:** https://nextjs.org/docs/architecture/fast-refresh
- **Browser DevTools Guide:** https://developer.chrome.com/docs/devtools/

---

**Last Validated:** 2026-02-17 (Phase 08-01, Task 2)

**Feedback:** If you encounter CSS issues not covered here, document them and update this workflow.
