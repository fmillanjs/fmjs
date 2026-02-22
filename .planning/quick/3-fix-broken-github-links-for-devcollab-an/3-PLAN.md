---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/app/(portfolio)/projects/devcollab/page.tsx
  - apps/web/app/(portfolio)/projects/teamflow/page.tsx
autonomous: true
requirements: [QUICK-3]

must_haves:
  truths:
    - "DevCollab View Source button navigates to a live GitHub page (not 404)"
    - "TeamFlow View Source button navigates to a live GitHub page (not 404)"
  artifacts:
    - path: "apps/web/app/(portfolio)/projects/devcollab/page.tsx"
      provides: "DevCollab case study page with corrected GitHub link"
      contains: "github.com/fmillanjs/fmjs"
    - path: "apps/web/app/(portfolio)/projects/teamflow/page.tsx"
      provides: "TeamFlow case study page with corrected GitHub link"
      contains: "github.com/fmillanjs/fmjs"
  key_links:
    - from: "apps/web/app/(portfolio)/projects/devcollab/page.tsx"
      to: "https://github.com/fmillanjs/fmjs"
      via: "View Source anchor href"
      pattern: "github\\.com/fmillanjs/fmjs"
    - from: "apps/web/app/(portfolio)/projects/teamflow/page.tsx"
      to: "https://github.com/fmillanjs/fmjs"
      via: "View Source anchor href"
      pattern: "github\\.com/fmillanjs/fmjs"
---

<objective>
Fix the "View Source" GitHub links on the DevCollab and TeamFlow case study pages. Both currently link to branch-specific URLs (`/tree/devcollab` and `/tree/teamflow`) that return 404 because those branches do not exist in the shared `fmjs` monorepo.

Purpose: Recruiters clicking "View Source" on either project land on a working GitHub page instead of a 404.
Output: Both case study pages link to `https://github.com/fmillanjs/fmjs` (the root of the shared monorepo).
</objective>

<execution_context>
@/home/doctor/.claude/get-shit-done/workflows/execute-plan.md
@/home/doctor/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix broken GitHub View Source links on both project case study pages</name>
  <files>
    apps/web/app/(portfolio)/projects/devcollab/page.tsx
    apps/web/app/(portfolio)/projects/teamflow/page.tsx
  </files>
  <action>
    **Background:** DevCollab and TeamFlow share a single GitHub repo at `https://github.com/fmillanjs/fmjs`. Previous quick task 1 changed the links from `https://github.com/fmillanjs/devcollab` to `https://github.com/fmillanjs/fmjs/tree/devcollab` and `https://github.com/fmillanjs/fmjs/tree/teamflow` — but these branch-specific URLs also return 404 because those branches don't exist in the repo. Verified: `https://github.com/fmillanjs/fmjs` returns 200; branch URLs return 404.

    **In `apps/web/app/(portfolio)/projects/devcollab/page.tsx` (line 67):**
    Change:
    ```
    href="https://github.com/fmillanjs/fmjs/tree/devcollab"
    ```
    To:
    ```
    href="https://github.com/fmillanjs/fmjs"
    ```

    **In `apps/web/app/(portfolio)/projects/teamflow/page.tsx` (line 65):**
    Change:
    ```
    href="https://github.com/fmillanjs/fmjs/tree/teamflow"
    ```
    To:
    ```
    href="https://github.com/fmillanjs/fmjs"
    ```

    Do not change any other content in either file. Both files are large (400+ lines) — only edit the single `href` line in each.
  </action>
  <verify>
    Run:
    ```bash
    grep -n "github\.com" apps/web/app/\(portfolio\)/projects/devcollab/page.tsx apps/web/app/\(portfolio\)/projects/teamflow/page.tsx
    ```
    Both should show `https://github.com/fmillanjs/fmjs` with no `/tree/` suffix.

    Also confirm the URL resolves:
    ```bash
    curl -s -o /dev/null -w "%{http_code}" "https://github.com/fmillanjs/fmjs"
    ```
    Should print `200`.
  </verify>
  <done>
    Both case study pages have `href="https://github.com/fmillanjs/fmjs"` for their "View Source" buttons. No `/tree/devcollab` or `/tree/teamflow` branch URLs remain anywhere in the two files.
  </done>
</task>

</tasks>

<verification>
After task completes, verify no broken branch URLs remain:
```bash
grep -rn "fmjs/tree/devcollab\|fmjs/tree/teamflow" apps/web/app/\(portfolio\)/
```
Should return zero results.
</verification>

<success_criteria>
- DevCollab "View Source" href is `https://github.com/fmillanjs/fmjs`
- TeamFlow "View Source" href is `https://github.com/fmillanjs/fmjs`
- Both URLs return HTTP 200 when curled
- No remaining `/tree/devcollab` or `/tree/teamflow` branch references in portfolio pages
</success_criteria>

<output>
After completion, create `.planning/quick/3-fix-broken-github-links-for-devcollab-an/3-SUMMARY.md` following the summary template.
</output>
