# Phase 40: Integration & QA - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the completed `WalkthroughSection` component (Phase 39) into both case study pages (`/projects/teamflow` and `/projects/devcollab`), supplying real screenshot data with callout step definitions, and pass all QA gates: Lighthouse performance ≥ 0.90, accessibility score = 1.0 (hard gate), and reduced-motion compliance. The component itself is not modified — this phase is integration and QA only.

</domain>

<decisions>
## Implementation Decisions

### Page placement
- WalkthroughSection appears **after the main project description** on both case study pages
- Both TeamFlow and DevCollab pages receive the same section structure — no asymmetry
- Section title prop: `"App Walkthrough"`

### Walkthrough data
- New file: `src/data/walkthrough-data.ts` — separate from `screenshots-manifest.ts`
- Exports `TEAMFLOW_WALKTHROUGH_SCREENSHOTS` and `DEVCOLLAB_WALKTHROUGH_SCREENSHOTS` as `WalkthroughScreenshot[]`
- Reuse existing alt text strings from `screenshots-manifest.ts` verbatim
- Callout step content (x/y coordinates, labels, explanations) is Claude's discretion — derive from visual inspection of the screenshots and what makes sense to highlight for each feature

### Image rendering
- Use `next/image` for all walkthrough screenshots — required to maintain Lighthouse performance ≥ 0.90 after adding new assets

### Accessibility
- Verify callout circle elements in `walkthrough-section.tsx` have `aria-label` attributes; add them if missing
- Callout `aria-label` should describe the step (e.g., `"Step 1: Kanban Board"`)

### Lighthouse CI gates
- Upgrade accessibility assertion from `"warn"` to `"error"` in `lighthouserc.json`
- Performance gate stays at `"error"` with `minScore: 0.9`

### Reduced-motion QA
- Manual check only — set `prefers-reduced-motion: reduce` in browser DevTools, confirm no entrance animation renders
- No automated test required; component handles it via `useReducedMotion()` from Phase 39

### Claude's Discretion
- Callout step coordinates (x, y pixel positions) and explanatory text for each screenshot — derive from visual context of what each screenshot shows
- Exact placement of `WalkthroughSection` within the existing JSX structure of each page (before/after which specific existing component)

</decisions>

<specifics>
## Specific Ideas

- The component already handles reduced-motion via `useReducedMotion()` — this was verified in Phase 39
- Existing screenshot alt text in `screenshots-manifest.ts` is well-written and descriptive; reuse it to avoid duplication

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 40-integration-qa*
*Context gathered: 2026-02-26*
