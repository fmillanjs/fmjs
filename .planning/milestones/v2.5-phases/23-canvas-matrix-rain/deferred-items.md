# Deferred Items — Phase 23 Canvas Matrix Rain

## From Plan 23-03

### Pre-existing visual regression failures (non-homepage routes)

**Discovered during:** Task 1 verification (running `--grep-invert "homepage"`)

**Routes failing:** about, projects, contact, resume, teamflow-case-study (light + dark = 10 tests)

**Root cause:** Page height differences between stored snapshots and current renders:
- contact: expected 1065px, received 1019px
- projects: expected 897px, received 881px
- teamflow-case-study: expected 5668px, received 5207px
- about, resume: similar height mismatches

**Pre-existing:** Snapshots were last captured on Feb 16-18 before content changes. Not caused by canvas matrix rain (canvas only affects homepage).

**Recommendation:** Regenerate all portfolio snapshots in a dedicated plan (update all 12 snapshots at once).

---

### Pre-existing axe-core accessibility violations (homepage)

**Discovered during:** Task 2 (checkpoint:human-verify)

**Violations — NOT related to canvas element:**

1. **button-name** (critical impact) — Theme toggle button has no accessible text:
   - Element: `<button class="p-2 rounded-lg hover:bg-accent transition-colors" disabled=""><div class="w-5 h-5"></div></button>`
   - Fix: Add `aria-label="Toggle theme"` to the theme toggle button

2. **color-contrast** (serious impact) — Nav links in light mode:
   - Element: `<a class="text-sm font-medium ... text-muted-foreground" href="/projects">Projects</a>`
   - Color: `#9e9eff` on `#ffffff` = 2.38:1 contrast ratio (required 4.5:1)
   - Affects: About, Projects, Resume, Contact nav links
   - Fix: Increase contrast of `text-muted-foreground` in light mode nav links

**Canvas element:** aria-hidden="true" canvas does NOT trigger any axe-core violations. Confirmed.

**Recommendation:** Fix in a dedicated accessibility plan before v2.5 release.
