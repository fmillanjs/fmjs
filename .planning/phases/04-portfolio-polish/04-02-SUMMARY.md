---
phase: 04-portfolio-polish
plan: 02
subsystem: error-handling
tags: [error-pages, loading-states, ux, dark-mode]
dependency-graph:
  requires: [layout, routing]
  provides: [404-page, error-boundary, loading-states, skeleton-component, empty-state-component]
  affects: [all-routes]
tech-stack:
  added: []
  patterns: [error-boundary, loading-ui, skeleton-screens]
key-files:
  created:
    - apps/web/app/not-found.tsx
    - apps/web/app/error.tsx
    - apps/web/app/global-error.tsx
    - apps/web/components/ui/skeleton.tsx
    - apps/web/components/ui/empty-state.tsx
    - apps/web/app/(dashboard)/loading.tsx
    - apps/web/app/(dashboard)/teams/loading.tsx
    - apps/web/app/(dashboard)/teams/[teamId]/loading.tsx
    - apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/loading.tsx
  modified:
    - apps/web/lib/auth.ts
    - apps/web/lib/auth.edge.ts
    - apps/web/hooks/use-real-time-tasks.ts
    - apps/web/lib/email.ts
decisions: []
metrics:
  duration: 494s
  completed: 2026-02-15T17:01:41Z
---

# Phase 4 Plan 2: Error Pages & Loading States Summary

**One-liner:** Global error handling (404, 500, root crash) and skeleton loading states for all dashboard routes with dark mode support.

## Objective Met

Added professional error handling and loading state infrastructure across the application:
- Global 404 page with navigation recovery options
- Error boundaries for route-level and root-level crash recovery
- Reusable Skeleton and EmptyState components
- Loading states for all 4 dashboard route segments

## Tasks Completed

### Task 1: Global Error Pages (404, 500, Global Error)
**Commit:** 4580740

Created three error handling pages following Next.js App Router conventions:

1. **not-found.tsx** (global 404):
   - Server Component with styled 404 page
   - FileQuestion icon from lucide-react
   - Navigation options: "Go Home" (/) and "View Projects" (/projects)
   - Centered layout with dark mode support (blue primary color, NO purple)

2. **error.tsx** (route error boundary):
   - Client Component with error and reset props
   - Displays error.message with fallback
   - "Try Again" button calls reset()
   - Logs error to console in useEffect
   - AlertTriangle icon with red theming

3. **global-error.tsx** (root layout error boundary):
   - Client Component with own `<html>` and `<body>` tags
   - Inline styles as fallback (can't rely on globals.css)
   - Minimal SVG alert triangle icon
   - "Something went wrong" message with retry

All pages support light/dark mode and use consistent styling.

### Task 2: Skeleton, Empty State Components, and Dashboard Loading States
**Commit:** 2b0572a

Created reusable UI components and loading states:

1. **Skeleton component** (apps/web/components/ui/skeleton.tsx):
   - Simple div with `animate-pulse` and rounded background
   - Accepts `className` prop for sizing
   - Uses `bg-gray-200 dark:bg-gray-700`
   - Named export for tree-shaking

2. **Empty state component** (apps/web/components/ui/empty-state.tsx):
   - Props: icon (LucideIcon), title, description, action (optional)
   - Centered layout with 48x48 icon
   - `text-muted-foreground` for description
   - Optional action slot for CTA buttons

3. **Dashboard loading states** (4 loading.tsx files):
   - `(dashboard)/loading.tsx`: Full page skeleton with sidebar and content area
   - `(dashboard)/teams/loading.tsx`: 3-card grid skeleton for team list
   - `(dashboard)/teams/[teamId]/loading.tsx`: Team header + 5 member row skeletons
   - `(dashboard)/teams/[teamId]/projects/[projectId]/loading.tsx`: Project header + 4 Kanban column skeletons (each with 3 card skeletons)

All loading states:
- Import and use Skeleton component
- Match approximate dimensions of real content
- Support light and dark mode
- Are Server Components (default)

## Deviations from Plan

### Auto-fixed Issues (Rule 3 - Blocking Issues)

**1. [Rule 3 - Bug] Fixed TypeScript setter type in use-real-time-tasks.ts**
- **Found during:** Task 1 build verification
- **Issue:** `setTasks` parameter type was `(tasks: TaskWithRelations[]) => void` which doesn't accept updater functions
- **Fix:** Changed to `(tasks: TaskWithRelations[] | ((prev: TaskWithRelations[]) => TaskWithRelations[])) => void`
- **Files modified:** apps/web/hooks/use-real-time-tasks.ts
- **Commit:** 4580740

**2. [Rule 3 - Bug] Fixed NextAuth export portability in auth.edge.ts**
- **Found during:** Task 1 build verification
- **Issue:** TypeScript error "The inferred type of 'auth' cannot be named without a reference to '../../../node_modules/next-auth/lib'"
- **Fix:** Split destructured export into intermediate variable with explicit types: `const nextAuth = NextAuth(...); export const auth: typeof nextAuth.auth = nextAuth.auth;`
- **Files modified:** apps/web/lib/auth.edge.ts
- **Commit:** 4580740

**3. [Rule 3 - Bug] Fixed NextAuth export portability in auth.ts**
- **Found during:** Task 1 build verification
- **Issue:** Same TypeScript portability error as auth.edge.ts
- **Fix:** Changed from `export const { auth, signIn, signOut } = NextAuth(...)` to intermediate variable pattern
- **Files modified:** apps/web/lib/auth.ts
- **Commit:** 4580740

**4. [Rule 3 - Bug] Fixed JWT options type in auth.ts**
- **Found during:** Task 1 build verification
- **Issue:** TypeScript couldn't infer correct overload for `jwt.sign()` with `process.env.JWT_EXPIRES_IN` (could be undefined)
- **Fix:** Simplified to hardcoded `expiresIn: '15m'` (env var was unused anyway)
- **Files modified:** apps/web/lib/auth.ts
- **Commit:** 4580740

**5. [Rule 3 - Bug] Fixed undefined NEXTAUTH_URL during build in email.ts**
- **Found during:** Task 1 build verification
- **Issue:** `process.env.NEXTAUTH_URL` was undefined during static prerendering, causing build error
- **Fix:** Moved `isDevelopment` check inside function and added fallback: `const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';`
- **Files modified:** apps/web/lib/email.ts
- **Commit:** 4580740

All fixes were necessary to unblock build compilation and were applied following Rule 3 (Auto-fix blocking issues). No architectural changes were required.

## Verification Results

- [x] Navigate to /any-nonexistent-path → shows styled 404 page with FileQuestion icon
- [x] Error boundary displays when component throws (error.tsx with retry button)
- [x] Global error boundary handles root layout crashes (global-error.tsx)
- [x] Dashboard routes show skeleton loading states during navigation
- [x] Skeleton component has animate-pulse animation
- [x] Empty state component renders with icon, title, description
- [x] All components work in both light and dark mode
- [x] `npm run build --filter=web` succeeds

## Files Changed

**Created (9 files):**
- apps/web/app/not-found.tsx
- apps/web/app/error.tsx
- apps/web/app/global-error.tsx
- apps/web/components/ui/skeleton.tsx
- apps/web/components/ui/empty-state.tsx
- apps/web/app/(dashboard)/loading.tsx
- apps/web/app/(dashboard)/teams/loading.tsx
- apps/web/app/(dashboard)/teams/[teamId]/loading.tsx
- apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/loading.tsx

**Modified (4 files - bug fixes):**
- apps/web/lib/auth.ts (NextAuth export types + JWT options)
- apps/web/lib/auth.edge.ts (NextAuth export types)
- apps/web/hooks/use-real-time-tasks.ts (setter function type)
- apps/web/lib/email.ts (NEXTAUTH_URL fallback)

## Implementation Notes

### Error Page Design
- Used lucide-react icons (FileQuestion for 404, AlertTriangle for errors)
- Blue primary color for 404, red for errors (NO purple per user requirement)
- Consistent centered layout pattern across all error pages
- Dark mode support via Tailwind dark: classes

### Loading State Strategy
- Content-shaped skeletons match real page layout
- Kanban view loading shows 4 columns × 3 cards for realistic preview
- Team/project loading states show realistic counts (3 teams, 5 members)
- All use shared Skeleton component for consistency

### TypeScript Fixes
- NextAuth v5 beta has portability issues with destructured exports in strict mode
- JWT library overloads don't handle `process.env` string | undefined well
- Solutions: intermediate variables with explicit types, simplified env handling

## Success Criteria Met

- [x] Global 404 and 500 error pages exist with professional styling
- [x] Every dashboard route has loading.tsx with appropriate skeletons
- [x] Reusable Skeleton and EmptyState components available for all future pages
- [x] All components support dark mode
- [x] Build succeeds without errors

## Self-Check: PASSED

**Created files verified:**
```
FOUND: apps/web/app/not-found.tsx
FOUND: apps/web/app/error.tsx
FOUND: apps/web/app/global-error.tsx
FOUND: apps/web/components/ui/skeleton.tsx
FOUND: apps/web/components/ui/empty-state.tsx
FOUND: apps/web/app/(dashboard)/loading.tsx
FOUND: apps/web/app/(dashboard)/teams/loading.tsx
FOUND: apps/web/app/(dashboard)/teams/[teamId]/loading.tsx
FOUND: apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/loading.tsx
```

**Commits verified:**
```
FOUND: 4580740 (Task 1: Global Error Pages + bug fixes)
FOUND: 2b0572a (Task 2: Skeleton, EmptyState, Loading States)
```

**Build verification:**
```
✓ Compiled successfully in 2.1s
```
