# Phase 12: Critical Route Migration - Research

**Researched:** 2026-02-17
**Domain:** Shadcn UI component migration — team/task management routes, accessible modals (COMP-04), old code removal
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-04 | Accessible modal/dialog components (focus trapping, ESC to close, proper ARIA roles) | Shadcn `Dialog` (already installed as `components/ui/dialog.tsx`) uses Radix UI primitives — focus trap, ESC, `role="dialog"`, `aria-labelledby`/`aria-describedby` all automatic. `AlertDialog` (not installed) handles destructive confirmations with `role="alertdialog"`. Both require `DialogTitle` present for screen readers. |
| MIG-02 | Critical routes (team/task features) migrated to Shadcn components | 12 component files in `components/teams/`, `components/tasks/`, `components/projects/` contain non-Shadcn UI (raw HTML elements, custom div-based modals, raw `<select>` in detail views). All need migration unit-by-unit. |
| MIG-03 | Old component code removed (not just deprecated) | The `TaskForm` currently renders as `fixed inset-0 bg-black/50` custom modal overlay — must be replaced by `Dialog` and the old overlay div deleted. `TaskDetailPanel` uses raw `<select>` + raw `<input>` + custom tabs — remove inline native elements after Shadcn equivalents land. Same for `TeamMemberList` confirm pattern and `ProjectActions` confirm pattern. |
</phase_requirements>

---

## Summary

Phase 12 migrates the TeamFlow dashboard's critical routes — team management and task management — from the old component system to Shadcn UI. The codebase is a Next.js 15 / React 19 monorepo (`apps/web`). Shadcn is already configured (`components.json`, `new-york` style, Tailwind v4, Radix Colors). Phase 11 migrated forms; those forms are already using Shadcn `Form`, `Input`, `Textarea`, `Button`, `Select`. Phase 12 concerns the structural UI around those forms: modals, cards, tabs, badges, list layouts, and confirmation flows.

The key gap is that `TaskForm` is a custom div-based modal (fixed overlay, manual focus management via `onClick` stop-propagation) and `TaskDetailPanel` uses raw `<select>` elements for status/priority/assignee inline editing, manual tab UI built from `<button>` elements with border-b logic, and raw `<input>` / `<textarea>` for inline editing. Neither has proper focus trapping or ARIA roles for the modal/dialog context. `TeamMemberList` and `ProjectActions` use inline confirmation UIs that are custom divs rather than `AlertDialog`.

The migration unit of work is: one component at a time, old code deleted (not wrapped or hidden), axe WCAG AA verification per component. The Shadcn `Dialog` (already installed) handles `TaskForm`. `AlertDialog` (needs install) handles destructive confirmations. `Tabs` (needs install) handles `TaskDetailPanel` tab sections. `Badge` (already installed) handles status/priority labels. `Card` (already installed) handles containers. `Popover` (needs install) handles filter dropdowns in `TaskFilters`.

**Primary recommendation:** Install `alert-dialog`, `tabs`, and `popover` via `npx shadcn@latest add`, then migrate components one by one in this order: TaskForm → TaskDetailPanel → TaskFilters → KanbanColumn/Card → TeamMemberList → ProjectCard/List → ProjectActions. Delete old code immediately after each migration; do not leave dead code.

---

## Codebase Audit

### Components That Need Migration

| File | Problem | Missing Shadcn Component |
|------|---------|--------------------------|
| `components/tasks/task-form.tsx` | Custom `fixed inset-0 bg-black/50` modal div, no focus trap, no `role="dialog"` | Replace with `Dialog` (already installed) |
| `components/tasks/task-detail-panel.tsx` | Raw `<select>` for status/priority/assignee, manual tab buttons, raw `<input>` for date, raw `<textarea>` for description inline edit | `Select` (installed), `Tabs` (needs install), `Input` (installed), `Textarea` (installed) |
| `components/tasks/task-filters.tsx` | Custom dropdown divs with manual `openDropdown` state, no keyboard nav | `Popover` (needs install) + `Button` (installed) |
| `components/tasks/task-card.tsx` | Inline badge spans with manual color classes | `Badge` (installed) — replace inline spans |
| `components/tasks/kanban-column.tsx` | Plain `bg-muted` div column | `Card` (installed) — use for column container |
| `components/tasks/task-list-view.tsx` | Raw `<table>` + opens `TaskForm` (custom modal) | Keep TanStack Table structure, ensure `TaskForm` is Dialog |
| `components/tasks/task-views.tsx` | `<button>` "New Task" opens custom modal | Ensure uses Dialog-backed `TaskForm` |
| `components/tasks/view-toggle.tsx` | Custom inline div toggle | Could keep or use `Tabs` — LOW impact, keep as-is unless scoped in phase |
| `components/teams/team-member-list.tsx` | Inline confirm divs (`showConfirm` state) for remove-member | `AlertDialog` (needs install) |
| `components/teams/team-form.tsx` | Already using Shadcn Form/Input/Button — DONE from Phase 11 | None needed |
| `components/teams/invite-member-form.tsx` | Already using Shadcn Form/Input/Select/Button — DONE from Phase 11 | None needed |
| `components/projects/project-card.tsx` | Raw `<div>` container with manual hover classes | `Card` (installed) |
| `components/projects/project-list.tsx` | Manual tab buttons with border-b for ACTIVE/ARCHIVED/ALL filter | `Tabs` (needs install) |
| `components/projects/project-form.tsx` | Already using Shadcn Form/Input/Textarea/Button — DONE from Phase 11 | None needed |
| `components/projects/project-actions.tsx` | Inline confirm divs for archive/delete, inline `<input>` for delete confirmation | `AlertDialog` (needs install) |
| `app/(dashboard)/teams/[teamId]/page.tsx` | Inline SVG icons, raw `<Link>` buttons, no Shadcn Button | `Button` (installed), `Card` (installed) |
| `app/(dashboard)/teams/[teamId]/settings/page.tsx` | Same as team page | `Button` (installed), `Card` (installed) |
| `app/(dashboard)/teams/[teamId]/projects/[projectId]/client-page.tsx` | Inline stat boxes, `<Link>` buttons | `Card` (installed), `Button` (installed) |

### Components Already Fully Migrated (Phase 11)

- `components/tasks/task-form.tsx` — Form internals use Shadcn, but MODAL WRAPPER is still custom div
- `components/tasks/comment-form.tsx` — Fully Shadcn
- `components/teams/team-form.tsx` — Fully Shadcn
- `components/teams/invite-member-form.tsx` — Fully Shadcn
- `components/projects/project-form.tsx` — Fully Shadcn

### Shadcn Components Already Installed

| Component | File | Status |
|-----------|------|--------|
| `Badge` | `components/ui/badge.tsx` | Installed, `new-york` style, CVA variants |
| `Button` | `components/ui/button.tsx` | Installed |
| `Card` | `components/ui/card.tsx` | Installed, with CardHeader/Content/Footer/Title/Description |
| `Dialog` | `components/ui/dialog.tsx` | Installed, Radix-backed, focus trap + ESC built in |
| `Form` | `components/ui/form.tsx` | Installed |
| `Input` | `components/ui/input.tsx` | Installed |
| `Label` | `components/ui/label.tsx` | Installed |
| `Select` | `components/ui/select.tsx` | Installed |
| `Separator` | `components/ui/separator.tsx` | Installed |
| `Skeleton` | `components/ui/skeleton.tsx` | Installed (custom, not Radix) |
| `Sonner` | `components/ui/sonner.tsx` | Installed |
| `Textarea` | `components/ui/textarea.tsx` | Installed |

### Shadcn Components Needed (NOT yet installed)

| Component | Install Command | Purpose |
|-----------|----------------|---------|
| `AlertDialog` | `npx shadcn@latest add alert-dialog` | Destructive confirmations (remove member, delete/archive project) |
| `Tabs` | `npx shadcn@latest add tabs` | TaskDetailPanel comments/history tabs, ProjectList filter tabs |
| `Popover` | `npx shadcn@latest add popover` | TaskFilters custom dropdown panels |

---

## Standard Stack

### Core (all already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Shadcn UI | new-york style, Tailwind v4 | Component primitives | Installed in Phase 9, config in `components.json` |
| `@radix-ui/react-dialog` | 1.1.15 (installed) | Powers `Dialog` + `AlertDialog` | Radix primitives, auto focus trap + ARIA |
| `@radix-ui/react-select` | 2.2.6 (installed) | Powers `Select` | Proper ARIA, keyboard nav |
| `@dnd-kit/core` + `@dnd-kit/sortable` | 6.3.1 / 10.0.0 | Kanban drag-and-drop | Already working; do NOT replace |
| `@tanstack/react-table` | 8.21.3 | Task list table | Already working; do NOT replace |
| `nuqs` | 2.8.8 | URL-based filter state | Already working in TaskFilters/TaskSearch |
| `class-variance-authority` | 0.7.1 | Badge/Button variant API | Installed, used by Shadcn |
| `tailwind-merge` + `clsx` | 3.4.1 / 2.1.1 | `cn()` utility | Installed |

### Needs Install
| Library | Install Command | Purpose |
|---------|----------------|---------|
| `@radix-ui/react-tabs` | Added via `npx shadcn@latest add tabs` | Powers `Tabs` component |
| `@radix-ui/react-alert-dialog` | Added via `npx shadcn@latest add alert-dialog` | Powers `AlertDialog` |
| `@radix-ui/react-popover` | Added via `npx shadcn@latest add popover` | Powers `Popover` |

**Installation (all at once):**
```bash
npx shadcn@latest add alert-dialog tabs popover
```

---

## Architecture Patterns

### Recommended Project Structure (no changes needed)
```
apps/web/
├── components/
│   ├── tasks/        # Migrate: task-form, task-detail-panel, task-filters, task-card, kanban-column
│   ├── teams/        # Migrate: team-member-list
│   ├── projects/     # Migrate: project-card, project-list, project-actions
│   └── ui/           # Add: alert-dialog.tsx, tabs.tsx, popover.tsx
└── app/(dashboard)/
    └── teams/        # Migrate inline HTML in team page, settings page, project client page
```

### Pattern 1: TaskForm — Custom Modal to Dialog

**What:** Replace the custom `fixed inset-0 bg-black/50` overlay div with Shadcn `Dialog`. The form internals stay exactly as they are (already Shadcn Form). The change is purely the wrapper.

**When to use:** Any component that currently renders a `<div className="fixed inset-0 ...">` overlay.

**Before (current):**
```tsx
// task-form.tsx — CURRENT (to be deleted)
return (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div
      className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with manual X button */}
      {/* Form content */}
    </div>
  </div>
);
```

**After (Shadcn Dialog, controlled):**
```tsx
// Source: https://ui.shadcn.com/docs/components/dialog
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';

// In KanbanBoard/TaskListView — opens form:
<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{mode === 'create' ? 'Create Task' : 'Edit Task'}</DialogTitle>
      <DialogDescription>
        {mode === 'create' ? 'Add a new task to this project.' : 'Update task details.'}
      </DialogDescription>
    </DialogHeader>
    {/* Form internals unchanged */}
  </DialogContent>
</Dialog>
```

**Key points:**
- `DialogTitle` is REQUIRED — Radix throws a console warning if missing and screen readers won't announce the dialog correctly
- `DialogDescription` is REQUIRED for screen reader context (or add `aria-describedby` manually)
- `open` / `onOpenChange` controls the modal from parent state
- `DialogContent` already has the close button (X) built in via Shadcn's `dialog.tsx`
- Remove the manual `onClick` stop-propagation pattern — Dialog handles backdrop click natively
- The existing `onClose` prop becomes `onOpenChange` callback

### Pattern 2: AlertDialog for Destructive Confirmations

**What:** Replace inline "Are you sure?" confirmation divs with `AlertDialog`.

**Current pattern (in TeamMemberList and ProjectActions):**
```tsx
// CURRENT — to be deleted
{showConfirm === member.userId ? (
  <div className="flex items-center gap-2">
    <button onClick={() => handleRemove(member.userId)}>Confirm</button>
    <button onClick={() => setShowConfirm(null)}>Cancel</button>
  </div>
) : (
  <button onClick={() => setShowConfirm(member.userId)}>Remove</button>
)}
```

**After (AlertDialog):**
```tsx
// Source: https://ui.shadcn.com/docs/components/alert-dialog
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">Remove</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove team member?</AlertDialogTitle>
      <AlertDialogDescription>
        This will remove {member.user.name} from the team. They will lose access immediately.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={() => handleRemove(member.userId)}
      >
        Remove
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Key points:**
- `role="alertdialog"` is automatic — screen readers interrupt to announce it
- `AlertDialogAction` does NOT close the dialog automatically after onClick — the `AlertDialog` state handles that
- Use `asChild` on `AlertDialogTrigger` when wrapping a Shadcn `Button`
- ProjectActions delete confirmation with typed name input: use controlled `Dialog` (not AlertDialog) since you need a text input inside — AlertDialog is for simple yes/no

### Pattern 3: Tabs Component

**What:** Replace manual tab buttons (border-b active state logic) with Shadcn `Tabs`.

**Current pattern (TaskDetailPanel):**
```tsx
// CURRENT — to be deleted
<div className="border-b border-border">
  <div className="flex gap-4 px-6">
    <button
      onClick={() => setActiveTab('comments')}
      className={`py-4 px-2 border-b-2 font-medium text-sm ${
        activeTab === 'comments' ? 'border-primary text-primary' : 'border-transparent...'
      }`}
    >
      Comments ({comments.length})
    </button>
    {/* ... */}
  </div>
</div>
<div className="p-6">
  {activeTab === 'comments' ? <CommentThread /> : <TaskHistory />}
</div>
```

**After (Shadcn Tabs):**
```tsx
// Source: https://ui.shadcn.com/docs/components/tabs
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="comments">
  <TabsList className="w-full justify-start rounded-none border-b px-6 bg-transparent">
    <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="comments" className="p-6">
    <div className="space-y-6">
      <CommentThread comments={comments} taskId={currentTask.id} onUpdate={handleCommentsUpdate} />
      <CommentForm taskId={currentTask.id} onCommentAdded={handleCommentsUpdate} />
    </div>
  </TabsContent>
  <TabsContent value="history" className="p-6">
    <TaskHistory taskId={currentTask.id} projectId={projectId} />
  </TabsContent>
</Tabs>
```

**Key points:**
- Radix Tabs uses `aria-selected`, `role="tablist"`, `role="tab"`, `role="tabpanel"` automatically
- Remove `useState<'comments' | 'history'>` — Tabs manages active state internally
- `TabsList` className can be customized with `cn()` to match border-b design pattern

### Pattern 4: Popover for Filter Dropdowns

**What:** Replace custom dropdown `<div>` panels (manually positioned with `absolute z-10`) in `TaskFilters` with Shadcn `Popover`.

**Current pattern:**
```tsx
// CURRENT — to be deleted
<div className="relative">
  <button onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}>
    Status
  </button>
  {openDropdown === 'status' && (
    <div className="absolute z-10 mt-2 w-56 bg-card border border-border rounded-md shadow-lg">
      {/* checkbox list */}
    </div>
  )}
</div>
```

**After (Popover):**
```tsx
// Source: https://ui.shadcn.com/docs/components/popover
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      Status {filters.status?.length > 0 && <Badge>{filters.status.length}</Badge>}
      <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-56 p-2">
    {statusOptions.map((option) => (
      <label key={option.value} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer">
        <input type="checkbox" checked={filters.status?.includes(option.value) || false}
          onChange={() => toggleStatus(option.value)} />
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${option.color}`}>{option.label}</span>
      </label>
    ))}
  </PopoverContent>
</Popover>
```

**Key points:**
- Popover handles positioning automatically (no `absolute z-10 mt-2` needed)
- Popover handles click-outside dismissal — remove `openDropdown` state entirely
- Each filter gets its own Popover (not shared `openDropdown` state)
- Keep nuqs filter logic unchanged — only the UI trigger/panel changes

### Pattern 5: Badge Component for Status/Priority

**What:** Replace inline `<span className="px-2 py-1 rounded text-xs ...">` with Shadcn `Badge`.

**Current pattern (in task-card.tsx, task-list-view.tsx, project-card.tsx):**
```tsx
// CURRENT — to be deleted
<span className={`text-xs font-medium px-2 py-0.5 rounded ${priorityColor.bg} ${priorityColor.text}`}>
  {task.priority}
</span>
```

**After (Badge with className override for Radix Colors):**
```tsx
// Source: Badge component in components/ui/badge.tsx (already installed)
import { Badge } from '@/components/ui/badge';

// For Radix Colors semantic variants (not CVA default palette):
<Badge
  variant="outline"
  className={cn(priorityColor.bg, priorityColor.text, 'border-0')}
>
  {task.priority}
</Badge>
```

**Key points:**
- The existing `Badge` uses CVA variants (`default`, `secondary`, `destructive`, `outline`)
- For Radix Colors tokens (e.g., `bg-[var(--red-3)]`), use `variant="outline"` and override with `className`
- `cn()` from `@/lib/utils` handles class merging correctly

### Pattern 6: Card Component for Containers

**What:** Replace `<div className="bg-card shadow rounded-lg p-6">` with Shadcn `Card`.

**Current pattern (multiple route pages):**
```tsx
// CURRENT
<div className="bg-card shadow rounded-lg p-6">
  <h3 className="text-lg font-medium">Team Members</h3>
  <TeamMemberList ... />
</div>
```

**After:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Team Members</CardTitle>
  </CardHeader>
  <CardContent>
    <TeamMemberList ... />
  </CardContent>
</Card>
```

**Key points:**
- `Card` renders `rounded-xl border bg-card text-card-foreground shadow` — note `rounded-xl` vs old `rounded-lg`; verify visual consistency
- For flat sections without titles, just use `Card` + `CardContent`
- Route pages (team page, project page) have MANY raw card divs — migrate systematically

### Anti-Patterns to Avoid

- **Leaving both old and new code:** MIG-03 requires deletion, not deprecation. After Dialog replaces custom modal, delete the old div entirely.
- **Forgetting DialogTitle/DialogDescription:** Radix will throw a console warning and axe will flag missing accessible name. Always include both.
- **Using AlertDialog for forms:** AlertDialog is for simple confirmation. If the confirmation requires a text input (like project delete), use `Dialog` controlled.
- **Sharing openDropdown state across multiple Popover:** Each Popover manages its own open state independently — no shared state needed.
- **Changing dnd-kit logic while migrating UI:** The DragContext, sensors, collision detection, and SortableContext in `KanbanBoard` work correctly. Only swap the visual container divs, not the DnD logic.
- **Forgetting `asChild` on trigger wrappers:** When `DialogTrigger` or `AlertDialogTrigger` wraps a Shadcn `Button`, must use `asChild` to avoid nested button elements (invalid HTML).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trapping in modals | Custom focus trap with `tabIndex` and `keydown` listeners | Shadcn `Dialog` (Radix) | Radix handles focus trap, initial focus, return focus on close, ESC — edge cases around portals, iframes, and async content |
| Confirmation dialogs | Inline conditional divs with confirm/cancel buttons | Shadcn `AlertDialog` | `role="alertdialog"` interrupts screen readers correctly; focus is trapped; ESC handled |
| Positioned dropdowns | `position: absolute` + click-outside listeners + z-index management | Shadcn `Popover` (Radix) | Radix handles collision detection, scroll containers, viewport overflow, pointer events |
| Tab state management | `useState` + conditional render + active class logic | Shadcn `Tabs` (Radix) | `role="tablist"`, `role="tab"`, `role="tabpanel"`, arrow key navigation all automatic |
| Badge/pill UI | Custom inline `<span>` with repeated color classes | Shadcn `Badge` | Consistent CVA-based variant API, single source for style updates |

**Key insight:** The current custom implementations handle the happy path but miss accessibility edge cases (no ESC trap, no focus return after close, no ARIA roles). Radix-backed Shadcn components handle all edge cases by default.

---

## Common Pitfalls

### Pitfall 1: Missing DialogTitle Causes axe Violation
**What goes wrong:** Dialog renders visually but `aria-labelledby` points to a missing `DialogTitle`, causing "Dialog has no accessible name" violation.
**Why it happens:** The existing `dialog.tsx` wraps `DialogPrimitive.Content` with `aria-labelledby` wired via `DialogPrimitive.Title`. If `<DialogTitle>` isn't rendered inside `<DialogContent>`, the label ID dangles.
**How to avoid:** Always include `<DialogTitle>` inside every `<DialogContent>`, even if visually hidden with `<span className="sr-only">`.
**Warning signs:** axe reports `dialog-name` violation; Radix logs "DialogContent requires a DialogTitle for the component to be accessible for screen reader users."

### Pitfall 2: TaskDetailPanel Inline Editing After Dialog Migration
**What goes wrong:** `TaskDetailPanel` has two different interaction modes: clicking on title/description to edit inline (not a dialog) AND status/priority/assignee as dropdowns. The title/description inline editing is NOT a dialog — it's inline text replacement. Mistake: wrapping inline edit in a Dialog.
**Why it happens:** The component is in the context of a full page (task detail route), not a modal. Title/description use click-to-edit pattern, not modal.
**How to avoid:** Keep inline title/description editing as-is (just replace `<input>` with Shadcn `Input`, `<textarea>` with Shadcn `Textarea`). Replace `<select>` with Shadcn `Select`. Do NOT put inline edits in a Dialog.
**Warning signs:** Adding an unnecessary Dialog wrapper breaks the click-to-edit UX.

### Pitfall 3: DnD-kit Drag Overlay with Card Wrapping
**What goes wrong:** Wrapping `TaskCard` in Shadcn `Card` adds a `rounded-xl border shadow` wrapper. If `DragOverlay` renders the dragged task with `Card`, the shadow stacks and the card looks wrong during drag.
**Why it happens:** `Card` adds visual chrome that differs from the `isDragging ? 'opacity-50' : ''` pattern.
**How to avoid:** The `DragOverlay` renders `<TaskCard task={activeTask} isDragging />`. After migration, ensure `isDragging` prop triggers `opacity-50` class on the Card. Test drag visually.
**Warning signs:** Dragged card looks different from dropped card.

### Pitfall 4: AlertDialog vs Dialog for Project Delete Confirmation
**What goes wrong:** Using `AlertDialog` for the delete-with-name-confirmation in `ProjectActions` breaks because `AlertDialogContent` does not support `<input>` fields (it auto-focuses the first Action button, not an input).
**Why it happens:** `AlertDialog` is designed for simple yes/no interruptions, not forms.
**How to avoid:** Use `Dialog` (controlled with `open`/`onOpenChange`) for the delete confirmation that requires typing the project name. Use `AlertDialog` only for the simple "archive this project?" confirmation.
**Warning signs:** Typing in the confirmation input is broken because focus jumps to the action button.

### Pitfall 5: Popover vs Select for Assignee Filter
**What goes wrong:** The assignee filter shows a list with avatar images — cannot use Shadcn `Select` (which only renders text items). Using native `<select>` is inaccessible.
**Why it happens:** Shadcn `Select` (`@radix-ui/react-select`) renders each item as text-only in the portal. Complex items with images require `Popover`.
**How to avoid:** Keep assignee filter as `Popover` + custom list (with avatar images). The status, priority, and labels filters can also be `Popover` for consistency.
**Warning signs:** Avatar images don't render inside `SelectItem`.

### Pitfall 6: Radix AlertDialog Needs Package in package.json
**What goes wrong:** `npx shadcn@latest add alert-dialog` installs the Shadcn component file but also adds `@radix-ui/react-alert-dialog` to `package.json`. If running in Docker, the container needs to be rebuilt.
**Why it happens:** `shadcn add` modifies `package.json` and requires `npm install` to run inside the container.
**How to avoid:** After `shadcn add`, run `npm install` inside the Docker container (or rebuild). Check `docker-compose.dev.yml` for the web service; exec into it to run install.
**Warning signs:** TypeScript error `Cannot find module '@radix-ui/react-alert-dialog'` after adding the component file.

---

## Code Examples

Verified patterns from official sources:

### Controlled Dialog (TaskForm pattern)
```tsx
// Source: https://ui.shadcn.com/docs/components/dialog + project pattern
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  // ... other props
}

export function TaskFormDialog({ open, onOpenChange, mode }: TaskFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Task' : 'Edit Task'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new task to this project.'
              : 'Update the task details below.'}
          </DialogDescription>
        </DialogHeader>
        {/* Form content here — no changes to Form internals */}
      </DialogContent>
    </Dialog>
  );
}
```

### AlertDialog for Simple Destructive Confirmation
```tsx
// Source: https://ui.shadcn.com/docs/components/alert-dialog
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

// Remove team member — replaces showConfirm state pattern
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
      Remove
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Remove team member?</AlertDialogTitle>
      <AlertDialogDescription>
        {member.user.name || member.user.email} will lose access to this team immediately.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={() => handleRemove(member.userId)}
        disabled={removingId === member.userId}
      >
        {removingId === member.userId ? 'Removing...' : 'Remove'}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Tabs for TaskDetailPanel
```tsx
// Source: https://ui.shadcn.com/docs/components/tabs
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Replaces useState<'comments' | 'history'> + manual button logic
<div className="bg-card shadow rounded-lg overflow-hidden">
  <Tabs defaultValue="comments">
    <div className="border-b border-border">
      <TabsList className="w-full justify-start rounded-none h-auto bg-transparent px-6 gap-0">
        <TabsTrigger
          value="comments"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-4"
        >
          Comments ({comments.length})
        </TabsTrigger>
        <TabsTrigger
          value="history"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-4"
        >
          History
        </TabsTrigger>
      </TabsList>
    </div>
    <TabsContent value="comments" className="p-6 mt-0">
      <div className="space-y-6">
        <CommentThread comments={comments} taskId={currentTask.id} onUpdate={handleCommentsUpdate} />
        <CommentForm taskId={currentTask.id} onCommentAdded={handleCommentsUpdate} />
      </div>
    </TabsContent>
    <TabsContent value="history" className="p-6 mt-0">
      <TaskHistory taskId={currentTask.id} projectId={projectId} />
    </TabsContent>
  </Tabs>
</div>
```

### Popover for Filter Dropdown
```tsx
// Source: https://ui.shadcn.com/docs/components/popover
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

// Replaces relative div + openDropdown state
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm" className="gap-1.5">
      Status
      {filters.status?.length > 0 && (
        <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
          {filters.status.length}
        </Badge>
      )}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-56 p-2" align="start">
    <div className="space-y-1">
      {statusOptions.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer"
        >
          <input
            type="checkbox"
            checked={filters.status?.includes(option.value) || false}
            onChange={() => toggleStatus(option.value)}
            className="rounded border-border"
          />
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${option.color}`}>
            {option.label}
          </span>
        </label>
      ))}
    </div>
  </PopoverContent>
</Popover>
```

### Dialog for Delete With Name Confirmation (ProjectActions)
```tsx
// Custom controlled Dialog — NOT AlertDialog — because we need an input inside
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const [deleteOpen, setDeleteOpen] = useState(false);
const [confirmName, setConfirmName] = useState('');

<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="text-destructive">Delete Project</DialogTitle>
      <DialogDescription>
        This action cannot be undone. Type <strong>{projectName}</strong> to confirm deletion.
      </DialogDescription>
    </DialogHeader>
    <Input
      value={confirmName}
      onChange={(e) => setConfirmName(e.target.value)}
      placeholder="Type project name to confirm"
    />
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
      <Button
        variant="destructive"
        disabled={confirmName !== projectName || isDeleting}
        onClick={handleDelete}
      >
        {isDeleting ? 'Deleting...' : 'Delete Forever'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Migration Order and Task Breakdown

Based on dependency analysis, migrate in this order to avoid breaking imports:

### Task 12-01: Install Missing Shadcn Components
- `npx shadcn@latest add alert-dialog tabs popover`
- Verify packages install inside Docker container
- No code changes in this task

### Task 12-02: TaskForm — Custom Modal to Dialog (COMP-04)
- Replace `fixed inset-0 bg-black/50` wrapper with `Dialog`
- `TaskForm` becomes a controlled component; `KanbanBoard`, `TaskListView`, `TaskViews` pass `open`/`onOpenChange`
- Delete old overlay div, `onClick={onClose}` stop-propagation pattern
- Verify: axe test on `/teams/[teamId]/projects/[projectId]` (authenticated route) OR manual keyboard test

### Task 12-03: TaskDetailPanel — Select, Tabs, Input
- Replace `<select>` for status/priority/assignee with Shadcn `Select`
- Replace manual tab buttons with Shadcn `Tabs`
- Replace `<input type="text">` for title edit with Shadcn `Input`
- Replace `<textarea>` for description edit with Shadcn `Textarea`
- Delete old raw elements
- Note: Inline editing pattern (click-to-edit) stays; only the HTML elements change

### Task 12-04: TaskFilters — Popover Dropdowns
- Replace each relative-div dropdown with `Popover`
- Remove `openDropdown` state entirely (each Popover is independent)
- Keep nuqs filter logic unchanged
- Delete old dropdown divs

### Task 12-05: TaskCard — Badge + Card
- Replace inline `<span>` priority/status labels with `Badge`
- Keep `@dnd-kit` wiring untouched (`SortableTaskCard` wrapping, `data` attributes)

### Task 12-06: KanbanColumn — Card
- Replace `<div className="flex flex-col bg-muted rounded-lg">` with Shadcn `Card`
- Verify droppable area still works with `useDroppable` ref on inner div

### Task 12-07: TeamMemberList — AlertDialog
- Replace inline confirm div with `AlertDialog`
- Remove `showConfirm` state
- Delete old confirm div JSX

### Task 12-08: ProjectCard + ProjectList — Card + Tabs
- `ProjectCard`: replace raw div with `Card`
- `ProjectList`: replace manual tab buttons with `Tabs` (`defaultValue="ACTIVE"`)
- Delete old border-b tab button logic

### Task 12-09: ProjectActions — AlertDialog + Dialog
- Archive: replace inline confirm div with `AlertDialog`
- Delete: replace inline confirm div with controlled `Dialog` + `Input` (name confirmation)
- Delete old `showArchiveConfirm` / `showDeleteConfirm` state

### Task 12-10: Route Page Cleanup
- `app/(dashboard)/teams/[teamId]/page.tsx`: replace inline SVG icon buttons with `Button` + lucide icons, replace raw card divs with `Card`
- `app/(dashboard)/teams/[teamId]/settings/page.tsx`: same pattern
- `app/(dashboard)/teams/[teamId]/projects/[projectId]/client-page.tsx`: replace stat boxes with `Card`, `<Link>` action buttons with `Button asChild`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom `fixed inset-0` modal div | Shadcn `Dialog` (Radix) | Phase 12 | Automatic focus trap, ESC, ARIA |
| Inline `showConfirm` confirmation | Shadcn `AlertDialog` | Phase 12 | `role="alertdialog"`, keyboard accessible |
| `useState` tab buttons | Shadcn `Tabs` (Radix) | Phase 12 | Arrow key navigation, ARIA roles |
| Custom positioned dropdowns | Shadcn `Popover` (Radix) | Phase 12 | Collision detection, viewport-aware positioning |
| Inline `<span>` pill labels | Shadcn `Badge` | Phase 12 | CVA variants, consistent styling |
| Raw `bg-card shadow rounded-lg` divs | Shadcn `Card` | Phase 12 | Design token consistency |

**Deprecated/outdated:**
- `openDropdown` shared state in TaskFilters: replaced by independent Popover state
- `showConfirm` / `showDeleteConfirm` / `showArchiveConfirm` inline state: replaced by AlertDialog/Dialog
- `isFormOpen` + custom div overlay: replaced by Dialog `open`/`onOpenChange`
- `activeTab` useState in TaskDetailPanel: replaced by Tabs `defaultValue`

---

## Open Questions

1. **TaskSearch input — migrate to Shadcn Input?**
   - What we know: `task-search.tsx` uses a raw `<input>` with manual search/clear icons, debounce via `useEffect`, nuqs state
   - What's unclear: Is this in scope for Phase 12 (it's a task management component) or was it migrated in Phase 11?
   - Recommendation: Include in Phase 12 — replace raw `<input>` with Shadcn `Input`, keep debounce + nuqs logic unchanged

2. **ViewToggle — migrate to Tabs or keep custom?**
   - What we know: `view-toggle.tsx` is a board/list toggle — two buttons in a rounded-lg border
   - What's unclear: Using `Tabs` here would work but changes semantics (tabs vs toggle group)
   - Recommendation: Keep `view-toggle.tsx` as-is for Phase 12. A ToggleGroup Shadcn component would be more semantically correct but is not installed and adds scope. Mark as LOW PRIORITY.

3. **Axe tests for authenticated routes**
   - What we know: Phase 11 added axe tests for auth routes (public). Dashboard routes require authentication setup in Playwright.
   - What's unclear: Does the Phase 11 Playwright auth setup (`playwright/.auth`) cover dashboard routes automatically?
   - Recommendation: Verify Playwright auth state exists. If `playwright/.auth/user.json` is present from Phase 11, dashboard axe tests can use it with `storageState: 'playwright/.auth/user.json'`. Plan should include WCAG AA axe tests for at least one task route and one team route.

4. **Docker Container for npm install**
   - What we know: The project uses docker-compose (`docker-compose.dev.yml`). When `shadcn add` modifies `package.json`, `npm install` must run inside the container.
   - What's unclear: Is the node_modules volume-mounted or baked into the image?
   - Recommendation: Check `docker-compose.dev.yml` before starting. If `node_modules` is a named volume, exec into the running container to run `npm install` after `shadcn add`.

---

## Sources

### Primary (HIGH confidence)
- `apps/web/components/tasks/` — direct code inspection of all 9 task components
- `apps/web/components/teams/` — direct code inspection of all 3 team components
- `apps/web/components/projects/` — direct code inspection of all 4 project components
- `apps/web/components/ui/` — confirmed installed Shadcn components (badge, button, card, dialog, form, input, label, select, separator, skeleton, sonner, textarea)
- `apps/web/components.json` — Shadcn config: new-york style, Tailwind v4, cssVariables
- `apps/web/package.json` — confirmed versions: Next.js 15, React 19, dnd-kit 6.3.1+10.0.0, @tanstack/react-table 8.21.3, nuqs 2.8.8, @radix-ui/react-dialog 1.1.15, @radix-ui/react-select 2.2.6

### Secondary (MEDIUM confidence)
- https://ui.shadcn.com/docs/components/dialog — Dialog install, DialogTitle requirement, controlled open/onOpenChange
- https://ui.shadcn.com/docs/components/alert-dialog — AlertDialog exports, destructive pattern, `role="alertdialog"`
- https://ui.shadcn.com/docs/components/tabs — Tabs install command, exports (Tabs/TabsList/TabsTrigger/TabsContent), usage
- https://ui.shadcn.com/docs/components/popover — Popover install, PopoverContent positioning

### Tertiary (LOW confidence, for awareness)
- https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html — dnd-kit + shadcn kanban pattern (verified with Georgegriff reference implementation)
- https://github.com/shadcn-ui/ui/issues/386 — controlled Dialog open state discussion (confirms `open`/`onOpenChange` pattern)

---

## Metadata

**Confidence breakdown:**
- Standard stack (existing installs): HIGH — direct file inspection
- Missing components (alert-dialog, tabs, popover): HIGH — official Shadcn docs confirmed install commands and APIs
- Architecture (migration patterns): HIGH — based on actual code in the project + official Shadcn docs
- COMP-04 Dialog accessibility: HIGH — Radix UI provides automatic focus trap, ESC, ARIA roles, confirmed by docs
- Pitfalls: MEDIUM — based on code analysis and known Radix/Shadcn behaviors

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (Shadcn is actively developed; Dialog/Tabs/AlertDialog APIs are stable)
