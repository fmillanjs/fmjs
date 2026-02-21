---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/app/(portfolio)/projects/devcollab/page.tsx
  - apps/web/.env.local
autonomous: true
requirements: [FIX-DEVCOLLAB-LIVE-URL]

must_haves:
  truths:
    - "View Live Demo and Launch Demo buttons on the devcollab page open https://devcollab.fernandomillan.me, not localhost or .dev URL"
    - "The fix is durable — production builds without the env var still resolve to the correct URL"
  artifacts:
    - path: "apps/web/app/(portfolio)/projects/devcollab/page.tsx"
      provides: "Hardcoded correct fallback URL for DEVCOLLAB_URL constant"
      contains: "https://devcollab.fernandomillan.me"
    - path: "apps/web/.env.local"
      provides: "NEXT_PUBLIC_DEVCOLLAB_URL set to correct .me domain"
      contains: "devcollab.fernandomillan.me"
  key_links:
    - from: "apps/web/app/(portfolio)/projects/devcollab/page.tsx DEVCOLLAB_URL"
      to: "https://devcollab.fernandomillan.me"
      via: "hardcoded fallback in || default"
      pattern: "devcollab.fernandomillan.me"
---

<objective>
Fix the DevCollab project page so the "View Live Demo" and "Launch Demo" buttons point to https://devcollab.fernandomillan.me instead of localhost.

The previous quick task (1) set NEXT_PUBLIC_DEVCOLLAB_URL in .env.local but used the wrong domain suffix (.dev instead of .me). Additionally, .env.local is gitignored and may not be present in production — so the page's hardcoded fallback `http://localhost:3002` fires on any deployment that lacks the env var.

Purpose: Recruiters clicking the live demo button hit a broken localhost URL. This is a credibility-destroying bug on a portfolio site.
Output: devcollab/page.tsx with correct production URL as fallback, .env.local updated to .me domain.
</objective>

<execution_context>
@/home/doctor/.claude/get-shit-done/workflows/execute-plan.md
@/home/doctor/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@apps/web/app/(portfolio)/projects/devcollab/page.tsx
@apps/web/.env.local
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix DevCollab URL in page fallback and .env.local</name>
  <files>
    apps/web/app/(portfolio)/projects/devcollab/page.tsx
    apps/web/.env.local
  </files>
  <action>
    Two changes needed:

    **Change 1 — devcollab/page.tsx (line 8):**
    The DEVCOLLAB_URL constant uses localhost as the fallback. Since .env.local is gitignored and not deployed, the fallback fires in production.

    Current:
    ```
    const DEVCOLLAB_URL = process.env.NEXT_PUBLIC_DEVCOLLAB_URL || 'http://localhost:3002';
    ```

    Replace with:
    ```
    const DEVCOLLAB_URL = process.env.NEXT_PUBLIC_DEVCOLLAB_URL || 'https://devcollab.fernandomillan.me';
    ```

    This makes the production URL the actual default — env var can still override for local dev.

    **Change 2 — apps/web/.env.local:**
    The file currently has `NEXT_PUBLIC_DEVCOLLAB_URL=https://devcollab.fernandomillan.dev` (wrong .dev suffix).

    Replace that line with:
    ```
    NEXT_PUBLIC_DEVCOLLAB_URL=https://devcollab.fernandomillan.me
    ```

    Do not touch any other lines in .env.local.
  </action>
  <verify>
    1. grep -n "devcollab.fernandomillan.me" /home/doctor/fernandomillan/apps/web/app/\(portfolio\)/projects/devcollab/page.tsx
    2. grep "NEXT_PUBLIC_DEVCOLLAB_URL" /home/doctor/fernandomillan/apps/web/.env.local
    3. grep -n "localhost:3002" /home/doctor/fernandomillan/apps/web/app/\(portfolio\)/projects/devcollab/page.tsx — must return 0 results
    4. grep -n "fernandomillan.dev" /home/doctor/fernandomillan/apps/web/.env.local — must return 0 results
  </verify>
  <done>
    - devcollab/page.tsx DEVCOLLAB_URL constant fallback is https://devcollab.fernandomillan.me (not localhost, not .dev)
    - .env.local NEXT_PUBLIC_DEVCOLLAB_URL is https://devcollab.fernandomillan.me
    - No localhost:3002 reference remains in the DEVCOLLAB_URL constant
  </done>
</task>

</tasks>

<verification>
After the task:
1. grep -n "devcollab.fernandomillan.me" /home/doctor/fernandomillan/apps/web/app/\(portfolio\)/projects/devcollab/page.tsx — must show line 8
2. grep -n "localhost:3002" /home/doctor/fernandomillan/apps/web/app/\(portfolio\)/projects/devcollab/page.tsx — must return 0 results
3. grep "NEXT_PUBLIC_DEVCOLLAB_URL" /home/doctor/fernandomillan/apps/web/.env.local — must show .me URL
</verification>

<success_criteria>
- The DEVCOLLAB_URL constant in devcollab/page.tsx defaults to https://devcollab.fernandomillan.me
- "View Live Demo" and "Launch Demo" buttons resolve to the correct URL in production (with or without the env var)
- .env.local also reflects the correct .me URL for local development
- Change committed to git so the page.tsx fix is deployed
</success_criteria>

<output>
After completion, create `.planning/quick/2-the-link-in-projects-dev-collab-is-point/2-SUMMARY.md` summarizing:
- What was changed in each file
- Confirmation that localhost:3002 fallback is gone from page.tsx
- Git commit hash for the page.tsx change

Also update `.planning/STATE.md`:
- Add entry to Quick Tasks Completed table: `| 2 | Fix DevCollab live demo URL from localhost to https://devcollab.fernandomillan.me | 2026-02-21 | {commit} | [2-the-link-in-projects-dev-collab-is-point](./quick/2-the-link-in-projects-dev-collab-is-point/) |`
- Update Last activity line
</output>
