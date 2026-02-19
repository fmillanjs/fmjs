# Deferred Items — Phase 22: Token Foundation

## Pre-existing Build Failure (Out of Scope)

**Discovered during:** Plan 02, Task 1 (build verification step)
**Error:** `ENOENT: no such file or directory, rename .next/export/500.html -> .next/server/pages/500.html`
**Classification:** Pre-existing issue — not caused by Plan 02 changes
**Evidence:** Error occurs at static export finalization step after all 16 pages generate successfully. Compilation step passes (`Compiled successfully in 10.1s`). The error is in Next.js internals renaming the 500.html file during export, unrelated to animation library installation.
**Impact:** Build fails, but animation packages are correctly installed and importable.
**Recommended fix:** Investigate Next.js 15.5.12 export configuration — likely a missing `output: 'export'` config issue or a conflicting route that prevents the 500.html rename. Check `next.config.js` output mode.
