# Phase 36: Content Update - Research

**Researched:** 2026-02-25
**Domain:** Portfolio content accuracy, screenshot capture, tech stack badges
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | DevCollab case study copy is accurate and compelling — describes actual features, architecture decisions, and technical depth | Audit of devcollab/page.tsx reveals specific inaccuracies catalogued below; content edits are in-place TypeScript/JSX changes |
| CONT-02 | TeamFlow case study copy is accurate and compelling — describes actual features, real-time architecture, and RBAC | Audit of teamflow/page.tsx reveals outdated v1.1 framing that must be updated to reflect shipped real-time; specific inaccuracies catalogued below |
| CONT-03 | Tech stack badges and metrics on both case studies reflect the actual shipped stack and real numbers | Badge arrays in page.tsx, projects/page.tsx, and home page.tsx are hardcoded strings; real stack verified from package.json files |
| CONT-04 | Screenshots from live apps are captured and displayed in both case studies and project cards | Next.js Image component + static file in public/ is the standard pattern; Playwright can automate screenshot capture from live URLs |
</phase_requirements>

---

## Summary

Phase 36 is a content accuracy and screenshot phase — no new features, no new dependencies. The work is auditing current copy against the shipped code, correcting inaccuracies, and adding live screenshots.

The TeamFlow case study has a critical accuracy problem: it was written before real-time features shipped (Phase 34-35 shipped them), but the copy still says "real-time coming in v1.1" and frames the app as 88% complete. The actual shipped state is fully functional with WebSocket presence, task board real-time updates, and all recruiter flows passing QA. This framing must be corrected entirely.

The DevCollab case study is more accurate but the metrics card shows "v2.0 Production Ready" and "7 Feature Phases" and "3 Demo Roles" — these numbers need verification against what actually shipped. Screenshots (CONT-04) require capturing from live production URLs, placing them in `apps/web/public/screenshots/`, and embedding via Next.js `<Image>` in both case study pages and project cards.

**Primary recommendation:** Edit JSX in four files (devcollab/page.tsx, teamflow/page.tsx, projects/page.tsx, app/(portfolio)/page.tsx), capture screenshots from live URLs using Playwright against production, place in public/screenshots/, add `<Image>` components where missing.

---

## Current State Audit

### What the TeamFlow case study currently says (INACCURATE)

| Claim | Actual Status | Fix Required |
|-------|--------------|-------------|
| "Real-time collaboration coming in v1.1" | SHIPPED — real-time is live in production | Remove all v1.1 framing; update to present tense |
| "88% Features Complete" metric card | All recruiter flows QA-verified (QA-02 complete) | Replace with accurate metric (e.g., "100%" or specific number) |
| Challenge 1 says "blocked at auth layer" | Fixed in Phase 34 (AUTH_SECRET, AUTH_TRUST_HOST) | Remove this challenge or rewrite as solved |
| "→ Real-time updates (v1.1)" in feature list | Shipped | Change checkmarks, remove v1.1 bullets |
| "→ Live presence indicators (v1.1)" | Shipped | Same |
| "→ Optimistic UI with rollback (v1.1)" | Shipped | Same |
| Note box: "WebSocket features blocked by auth" | Fixed | Remove entirely |
| Demo credentials: `demo1@teamflow.dev / Password123` | Verified working in Phase 35 QA | Keep but verify still accurate |

### What the TeamFlow case study currently says (ACCURATE — keep)

- Architecture diagram (Next.js → NestJS → PostgreSQL + Redis) is correct
- CASL RBAC description is accurate
- Monorepo with Turborepo is accurate
- Key Technical Decisions table (6 of 7 rows) are accurate
- Challenge 2 (Multi-Layer RBAC) and Challenge 3 (TypeScript type safety) are accurate

### What the DevCollab case study currently says (INACCURATE)

| Claim | Actual Status | Fix Required |
|-------|--------------|-------------|
| "7 Feature Phases" | Verify actual phase count (project has 36 phases total but DevCollab-specific may differ) | Verify or replace with accurate count |
| "v2.0 Production Ready" | Verify version number | Check if v2.0 is the right label |
| Tiptap listed as "v3" | devcollab-web package.json doesn't list Tiptap at all — it uses react-markdown + react-syntax-highlighter | SIGNIFICANT: either Tiptap is in devcollab-api or this is wrong |

### DevCollab package.json actual dependencies

From `/home/doctor/fernandomillan/apps/devcollab-web/package.json`:
- `next ^15.0.0`
- `react ^19.0.0`
- `react-markdown ^10.1.0`
- `react-syntax-highlighter ^16.1.0`
- `remark-gfm ^4.0.1`
- `shiki ^3.22.0`

Note: No Tiptap in devcollab-web. The case study claims "Tiptap v3 with immediatelyRender: false" — this must be verified in devcollab-api or may be a historical inaccuracy.

### DevCollab actual API modules

From `/home/doctor/fernandomillan/apps/devcollab-api/src/`:
- activity, auth, comments, common, core, guards, health, main, notifications, posts, reactions, search, snippets, workspaces

This confirms: snippets, posts, reactions, comments, notifications, search — all present and matching the case study copy.

### Tech Stack Badges — Current vs Actual

**TeamFlow home page card** (apps/web/app/(portfolio)/page.tsx line 64-79):
```
Current: ['Next.js', 'NestJS', 'TypeScript', 'WebSocket', 'PostgreSQL', 'Prisma', 'Redis', 'Docker', 'Tailwind']
Actual stack: Next.js 15, NestJS 11, TypeScript, Socket.io (not "WebSocket"), PostgreSQL, Prisma, Redis, Docker, Tailwind CSS, CASL, Turborepo
```

**TeamFlow projects page card** (apps/web/app/(portfolio)/projects/page.tsx line 22):
```
Current: ['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Redis', 'WebSocket']
Missing: Prisma, Docker, Socket.io, CASL
```

**DevCollab home page card** (apps/web/app/(portfolio)/page.tsx line 113-122):
```
Current: ['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Tiptap', 'Shiki', 'Docker', 'Tailwind']
Issue: Tiptap not confirmed in devcollab-web; Prisma missing; CASL missing; react-markdown present
```

**DevCollab projects page card** (apps/web/app/(portfolio)/projects/page.tsx line 31):
```
Current: ['Next.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Prisma', 'Tiptap', 'Shiki']
Issue: Tiptap not confirmed; missing Docker, CASL
```

---

## Architecture Patterns

### How Content Edits Work in This Project

All case study content is **hardcoded JSX** in page.tsx files — no CMS, no external data source. Edits are direct file changes.

Files to edit:
```
apps/web/app/(portfolio)/projects/devcollab/page.tsx  — DevCollab case study
apps/web/app/(portfolio)/projects/teamflow/page.tsx   — TeamFlow case study
apps/web/app/(portfolio)/projects/page.tsx            — Projects listing (badge arrays)
apps/web/app/(portfolio)/page.tsx                     — Home page (featured cards + badges)
```

### How Screenshots Work in Next.js

**Pattern:** Static files in `public/` directory, accessed via Next.js `<Image>` component.

```typescript
// Standard Next.js Image usage for static screenshots
import Image from 'next/image';

<Image
  src="/screenshots/teamflow-kanban.png"
  alt="TeamFlow Kanban board showing tasks organized in columns"
  width={1200}
  height={675}
  className="rounded-lg border border-border"
  priority={false}
/>
```

**File placement:**
```
apps/web/public/
└── screenshots/
    ├── teamflow-kanban.png       # Kanban board view
    ├── teamflow-login.png        # Login page
    ├── devcollab-workspace.png   # Workspace/dashboard
    └── devcollab-search.png      # Cmd+K search modal
```

**Next.js Image configuration:** The current `next.config.ts` has no `images.remotePatterns` configured — screenshots will be local static files only (no remote image fetching needed).

**Lighthouse impact:** Adding images must not drop Lighthouse scores below 0.90. Use proper `width`/`height` props, `alt` text, and avoid `priority` on below-fold images to preserve CLS scores. (QA-04 satisfied; Phase 35 Lighthouse CI gate must remain green.)

### How to Capture Screenshots

**Option A: Playwright from production URLs** (recommended — shows real live app)
```bash
# Run from project root — capture from live production URLs
npx playwright screenshot --browser chromium \
  "https://teamflow.fernandomillan.me" \
  "apps/web/public/screenshots/teamflow-kanban.png" \
  --full-page --viewport-size="1280,800"
```

Or write a dedicated Playwright script:
```typescript
// scripts/capture-screenshots.ts
import { chromium } from 'playwright';

const shots = [
  { url: 'https://teamflow.fernandomillan.me', file: 'teamflow-login.png' },
  { url: 'https://devcollab.fernandomillan.me', file: 'devcollab-workspace.png' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

for (const shot of shots) {
  await page.goto(shot.url, { waitUntil: 'networkidle' });
  await page.screenshot({
    path: `apps/web/public/screenshots/${shot.file}`,
    fullPage: false,  // viewport screenshot, not full-page
  });
}
await browser.close();
```

**Option B: Manual screenshots from browser** — Navigate to live app, take screenshot, save to public/screenshots/. This is perfectly acceptable for a portfolio; no automation is strictly required.

**Note on authenticated screenshots:** Screenshots of authenticated views (Kanban board, workspace) require logging in first. For Playwright automation, use `page.fill()` to log in before navigating to the protected route.

---

## Standard Stack

No new libraries needed. Phase 36 uses what is already installed:

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js Image | built-in | Optimized image rendering | Automatic lazy loading, WebP, sizing |
| Playwright | ^1.58.2 | Screenshot capture from live URLs | Already in devDependencies |
| TypeScript/JSX | ~5.6.0 | Content edits are code changes | Already the project language |

### No New Installations Required
All tooling is already present. No `npm install` needed for this phase.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Custom `<img>` tags | Next.js `<Image>` | Automatic WebP, lazy loading, CLS prevention |
| Screenshot automation | Custom browser scripts | Playwright (already installed) | Handles auth flows, waitForLoadState, viewport control |
| Remote image hosting | Uploading to CDN | Local `public/screenshots/` | Zero complexity, no external dependency, Lighthouse-friendly |

**Key insight:** This phase is content editing and asset placement, not engineering. The risk is spending time on tooling instead of content accuracy.

---

## Common Pitfalls

### Pitfall 1: Lighthouse Score Regression from Images
**What goes wrong:** Adding `<Image>` components without proper `width`/`height` causes Layout Shift (CLS) that drops Lighthouse performance score below 0.90.
**Why it happens:** Next.js Image needs explicit dimensions or `fill` prop to reserve space.
**How to avoid:** Always provide `width={1200}` `height={675}` (or actual screenshot dimensions). Run Lighthouse after adding images.
**Warning signs:** CLS metric jumps above 0.1 in Lighthouse report.

### Pitfall 2: Updating Copy Without Verifying the Live App
**What goes wrong:** Writing "TeamFlow now has real-time presence" without confirming the specific behavior visible in production — then a recruiter sees something different.
**Why it happens:** Relying on code rather than actual UX observation.
**How to avoid:** Navigate to live apps before editing copy. Confirm exactly what a recruiter sees. Phase 35 QA verified recruiter flows — use those findings as ground truth.
**Warning signs:** Copy describes features at a code level rather than UX level.

### Pitfall 3: Tiptap Claim in DevCollab
**What goes wrong:** The case study claims Tiptap v3 is used, but devcollab-web's package.json shows react-markdown + react-syntax-highlighter instead.
**Why it happens:** Case study may have been written referencing TeamFlow's stack (which uses Tiptap) or a plan that changed during implementation.
**How to avoid:** Verify by checking the actual devcollab-web and devcollab-api package.json files before finalizing the tech stack section. If Tiptap is not actually used, remove it and add react-markdown.
**Warning signs:** Listing a library that doesn't appear in package.json.

### Pitfall 4: TeamFlow "v1.0 / v1.1" Framing After Real-Time Ships
**What goes wrong:** Keeping the "v1.0" label after real-time is in production makes it look unfinished.
**Why it happens:** Copy written early was never updated.
**How to avoid:** Replace all v1.0/v1.1 versioning language. The app is now a single shipped product.
**Warning signs:** Any "coming in v1.1" bullet points remaining in the final copy.

### Pitfall 5: Screenshot Viewport Inconsistency
**What goes wrong:** Screenshots captured at inconsistent viewport sizes look mismatched when displayed side by side.
**How to avoid:** Standardize all screenshots at `1280x800` viewport. Capture at the same zoom level.

---

## Code Examples

### Adding a Screenshot Section to a Case Study Page

```typescript
// apps/web/app/(portfolio)/projects/teamflow/page.tsx
import Image from 'next/image';

// Inside a CaseStudySection:
<CaseStudySection title="Screenshots">
  <div className="grid md:grid-cols-2 gap-4 mt-4">
    <div>
      <Image
        src="/screenshots/teamflow-kanban.png"
        alt="TeamFlow Kanban board with tasks in Todo, In Progress, and Done columns"
        width={1280}
        height={800}
        className="rounded-lg border border-border w-full h-auto"
      />
      <p className="text-sm text-muted-foreground mt-2">Kanban board with drag-and-drop</p>
    </div>
    <div>
      <Image
        src="/screenshots/teamflow-presence.png"
        alt="TeamFlow showing live presence indicators for online team members"
        width={1280}
        height={800}
        className="rounded-lg border border-border w-full h-auto"
      />
      <p className="text-sm text-muted-foreground mt-2">Real-time presence indicators</p>
    </div>
  </div>
</CaseStudySection>
```

### Updating a Project Card Badge Array

```typescript
// apps/web/app/(portfolio)/projects/page.tsx
<ProjectCard
  title="TeamFlow"
  description="A production-ready work management SaaS with real-time collaboration, Kanban boards, and role-based access control"
  techStack={['Next.js 15', 'NestJS', 'TypeScript', 'Socket.io', 'PostgreSQL', 'Redis', 'Prisma', 'Docker']}
  href="/projects/teamflow"
  featured
/>
```

### Adding Screenshot to a Project Card

The current `ProjectCard` component does not accept an image prop. Two options:

**Option A (simpler):** Add an optional `screenshot` prop to the existing `ProjectCard` component:
```typescript
// apps/web/components/portfolio/project-card.tsx
interface ProjectCardProps {
  title: string;
  description: string;
  techStack: string[];
  href: string;
  featured?: boolean;
  screenshot?: { src: string; alt: string };  // NEW
}

// In CardHeader, before CardTitle:
{screenshot && (
  <div className="mb-4 overflow-hidden rounded-md">
    <Image
      src={screenshot.src}
      alt={screenshot.alt}
      width={600}
      height={338}
      className="w-full h-auto object-cover"
    />
  </div>
)}
```

**Option B (simpler):** Add screenshot inline in the home page EvervaultCard sections without touching ProjectCard component — add `<Image>` above the description text in page.tsx.

Option A is preferable because it updates both places (home page uses different card markup; projects/page.tsx uses `ProjectCard`) and keeps image display logic centralized.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| TeamFlow framed as "v1.0 with v1.1 coming" | Real-time fully shipped — present as complete product | Removes doubt in recruiter's mind |
| No screenshots on case studies | Static PNG in public/ + Next.js Image | Concrete evidence of working app |
| "WebSocket" badge | "Socket.io" — the actual library used | Accurate attribution |

**Content that was placeholder and must become real:**
- Any metric showing "88%" — needs real number or remove
- "7 Feature Phases" — needs verification
- v1.0/v1.1 split framing — must be unified

---

## Open Questions

1. **Is Tiptap actually used in DevCollab?**
   - What we know: devcollab-web package.json has react-markdown + shiki, not Tiptap. The case study claims Tiptap v3.
   - What's unclear: Tiptap may have been in an earlier version that was replaced, or it could be in devcollab-api (unlikely for an editor).
   - Recommendation: Run `grep -r "tiptap" apps/devcollab-web/ apps/devcollab-api/` before editing. If not found, remove Tiptap from all case study references and replace with react-markdown.

2. **What exact screenshots should be captured?**
   - What we know: CONT-04 says "screenshots from live apps are captured and displayed in both case studies and project cards"
   - What's unclear: How many screenshots, which views, what resolution
   - Recommendation: 2 per app (4 total). TeamFlow: Kanban board + real-time presence view. DevCollab: workspace snippet list + Cmd+K search modal. These show the most impressive features.

3. **What metric replaces "88% Features Complete" on TeamFlow?**
   - What we know: Phase 35 QA verified all recruiter flows pass; real-time is live
   - What's unclear: What number is accurate and doesn't look arbitrary
   - Recommendation: Replace the metric card with something factual: "3 RBAC Roles", "11+ Features", or a concrete tech count rather than a percentage.

4. **Which TeamFlow demo credentials are correct?**
   - Case study shows `demo1@teamflow.dev / Password123`
   - Phase 35 STATE.md references seeded demo credentials
   - Recommendation: Verify by attempting login at teamflow.fernandomillan.me before publishing updated copy.

---

## Sources

### Primary (HIGH confidence)
- `/home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/devcollab/page.tsx` — actual current case study content audited
- `/home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/teamflow/page.tsx` — actual current case study content audited
- `/home/doctor/fernandomillan/apps/web/app/(portfolio)/page.tsx` — home page badge arrays audited
- `/home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/page.tsx` — projects page badge arrays audited
- `/home/doctor/fernandomillan/apps/devcollab-web/package.json` — actual devcollab-web dependencies
- `/home/doctor/fernandomillan/apps/devcollab-api/package.json` — actual devcollab-api dependencies
- `/home/doctor/fernandomillan/apps/api/package.json` — actual TeamFlow API dependencies
- `.planning/REQUIREMENTS.md` — CONT-01 through CONT-04 definitions
- `.planning/STATE.md` — Phase 34-35 completion context, deployed URLs confirmed

### Secondary (MEDIUM confidence)
- Next.js Image component pattern — standard Next.js docs pattern, project already uses `next ^15.1.0`
- Playwright screenshot capability — `@playwright/test ^1.58.2` in devDependencies, already used in project

---

## Metadata

**Confidence breakdown:**
- Current copy accuracy: HIGH — audited actual files, found specific inaccuracies
- Screenshot approach: HIGH — Next.js Image is the only correct pattern for this codebase
- Badge corrections: HIGH for TeamFlow stack (verified from api/package.json); MEDIUM for DevCollab (Tiptap question needs verification)
- Tiptap claim: LOW — needs grep verification before editing

**Research date:** 2026-02-25
**Valid until:** 2026-03-25 (stable content domain, no fast-moving libraries)
