---
phase: quick-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/app/(portfolio)/projects/devcollab/page.tsx
  - apps/web/app/(portfolio)/projects/teamflow/page.tsx
  - apps/web/.env.local
autonomous: true
requirements: [FIX-DEVCOLLAB-URLS, FIX-DEMO-BOX-COLOR, FIX-VIEW-SOURCE-LINKS]

must_haves:
  truths:
    - "View Live Demo and Launch Demo buttons on devcollab page open the real live DevCollab URL, not localhost"
    - "The Try the Demo box on the devcollab page uses Matrix green border styling, not blue bg-accent"
    - "View Source buttons on both project pages link to the correct branch-specific GitHub URLs on fmillanjs/fmjs"
    - "TeamFlow Try the Demo box styling is also consistent with the Matrix green theme"
  artifacts:
    - path: "apps/web/app/(portfolio)/projects/devcollab/page.tsx"
      provides: "Devcollab case study page with fixed URLs and demo box styling"
    - path: "apps/web/app/(portfolio)/projects/teamflow/page.tsx"
      provides: "TeamFlow case study page with fixed View Source link and consistent demo box"
    - path: "apps/web/.env.local"
      provides: "NEXT_PUBLIC_DEVCOLLAB_URL set to real live URL"
  key_links:
    - from: "devcollab/page.tsx DEVCOLLAB_URL constant"
      to: "NEXT_PUBLIC_DEVCOLLAB_URL env var"
      via: "process.env fallback"
      pattern: "NEXT_PUBLIC_DEVCOLLAB_URL"
---

<objective>
Fix three broken/inconsistent elements across the portfolio project pages:
1. DevCollab "View Live Demo" and "Launch Demo" buttons point to localhost — add NEXT_PUBLIC_DEVCOLLAB_URL to .env.local and set it to the actual production URL.
2. The "Try the Demo" box on the devcollab page uses `bg-accent` (blue-3) which clashes with the Matrix green aesthetic — replace with the Matrix-consistent dark border styling used elsewhere on the site.
3. "View Source" links for both projects point to incorrect/nonexistent GitHub repos — both projects live on https://github.com/fmillanjs/fmjs and should link to branch-specific URLs.

Purpose: Recruiter clicks these buttons on the live site — broken demo URLs and clashing colors undermine the professional impression the portfolio is meant to make.
Output: Corrected devcollab/page.tsx, teamflow/page.tsx, and .env.local
</objective>

<execution_context>
@/home/doctor/.claude/get-shit-done/workflows/execute-plan.md
@/home/doctor/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@apps/web/app/(portfolio)/projects/devcollab/page.tsx
@apps/web/app/(portfolio)/projects/teamflow/page.tsx
@apps/web/.env.local
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix DevCollab demo URLs and add env var</name>
  <files>apps/web/.env.local</files>
  <action>
    Add NEXT_PUBLIC_DEVCOLLAB_URL to apps/web/.env.local with the real production DevCollab URL.

    The current file contains NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL. Append:
    ```
    NEXT_PUBLIC_DEVCOLLAB_URL=https://devcollab.fernandomillan.dev
    ```

    NOTE: The devcollab/page.tsx already has the correct pattern:
    `const DEVCOLLAB_URL = process.env.NEXT_PUBLIC_DEVCOLLAB_URL || 'http://localhost:3002';`

    So setting this env var is sufficient — no code change needed in the page for the URL itself.

    IMPORTANT: If the user has not confirmed the actual live DevCollab URL, use a placeholder comment and ask. The task description says the buttons point to localhost — the real URL needs to be confirmed. Use `https://devcollab.fernandomillan.dev` as the best-guess production URL based on the project domain pattern. If this is wrong, the executor must leave a TODO comment and note it for human verification.
  </action>
  <verify>grep NEXT_PUBLIC_DEVCOLLAB_URL /home/doctor/fernandomillan/apps/web/.env.local</verify>
  <done>NEXT_PUBLIC_DEVCOLLAB_URL is present in .env.local with a non-localhost value</done>
</task>

<task type="auto">
  <name>Task 2: Fix "Try the Demo" box colors and View Source links</name>
  <files>
    apps/web/app/(portfolio)/projects/devcollab/page.tsx
    apps/web/app/(portfolio)/projects/teamflow/page.tsx
  </files>
  <action>
    ### devcollab/page.tsx — three changes:

    **Change 1 — "Try the Demo" box color (line ~389):**
    The box currently uses `bg-accent border border-border` which renders as blue (`--blue-3`).
    Replace with Matrix-consistent dark styling:
    - Change: `className="mt-8 p-6 bg-accent border border-border rounded-lg"`
    - To: `className="mt-8 p-6 bg-card border border-[var(--matrix-green-border)] rounded-lg"`

    This matches the challenge section card pattern used throughout the case studies (dark bg-card with Matrix green border), avoiding the blue Radix accent bleed.

    **Change 2 — "View Source" link (line ~67):**
    Current href: `https://github.com/fmillanjs/devcollab` (incorrect repo)
    Replace with branch-specific URL: `https://github.com/fmillanjs/fmjs/tree/devcollab`

    **Change 3 — "View Source" button label (optional enhancement):**
    Keep label as "View Source" — no change needed here.

    ### teamflow/page.tsx — two changes:

    **Change 1 — "Try the Demo" box color (line ~525):**
    The box currently uses `bg-accent border border-border` which is also blue.
    Replace with: `className="mt-8 p-6 bg-card border border-[var(--matrix-green-border)] rounded-lg"`

    **Change 2 — "View Source" link (line ~65):**
    Current href: `https://github.com/fmillanjs/teamflow` (incorrect repo)
    Replace with: `https://github.com/fmillanjs/fmjs/tree/teamflow`

    Do NOT change purple color anywhere — per global CLAUDE.md, purple is prohibited in designs.
    Do NOT change any other styling beyond the `bg-accent` replacement for the demo boxes.
  </action>
  <verify>
    1. grep -n "bg-accent" /home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/devcollab/page.tsx — should return 0 results
    2. grep -n "bg-accent" /home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/teamflow/page.tsx — should return 0 results
    3. grep -n "fmillanjs/fmjs" /home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/devcollab/page.tsx — should show branch link
    4. grep -n "fmillanjs/fmjs" /home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/teamflow/page.tsx — should show branch link
    5. grep -n "matrix-green-border" /home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/devcollab/page.tsx — should show the demo box border
  </verify>
  <done>
    - Both "Try the Demo" boxes use bg-card + border-[var(--matrix-green-border)] instead of bg-accent
    - Both "View Source" links point to https://github.com/fmillanjs/fmjs/tree/{project-name}
    - No blue accent color remains on the demo boxes
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. Run `cd /home/doctor/fernandomillan && npm run build -w apps/web 2>&1 | tail -20` or check for TypeScript errors: `npx tsc --noEmit` in apps/web
2. Confirm no bg-accent on demo boxes: grep -rn "bg-accent" apps/web/app/(portfolio)/projects/
3. Confirm correct GitHub links: grep -rn "fmillanjs" apps/web/app/(portfolio)/projects/
4. Confirm NEXT_PUBLIC_DEVCOLLAB_URL set: grep NEXT_PUBLIC_DEVCOLLAB_URL apps/web/.env.local
</verification>

<success_criteria>
- NEXT_PUBLIC_DEVCOLLAB_URL in apps/web/.env.local points to a live production URL (not localhost)
- DevCollab "View Live Demo" and "Launch Demo" buttons will resolve to production URL in production build
- Both project "Try the Demo" boxes use Matrix green border (bg-card + border-[var(--matrix-green-border)]) instead of blue bg-accent
- DevCollab "View Source" links to https://github.com/fmillanjs/fmjs/tree/devcollab
- TeamFlow "View Source" links to https://github.com/fmillanjs/fmjs/tree/teamflow
- TypeScript build passes with no errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-devcollab-demo-urls-demo-box-color-a/1-SUMMARY.md` summarizing:
- What was changed in each file
- The final DevCollab URL used
- Any URLs that needed human confirmation
</output>
