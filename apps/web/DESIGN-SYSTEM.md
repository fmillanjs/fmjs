# Design System

**Stack:** Shadcn UI (new-york style) + Radix Colors + Tailwind v4

---

## Available Components

All components live in `@/components/ui/`. Import by name:

| Component | Import | Use For |
|-----------|--------|---------|
| Button | `@/components/ui/button` | Primary actions, form submissions |
| Card | `@/components/ui/card` | Content containers, project cards |
| Input | `@/components/ui/input` | Text entry fields |
| Label | `@/components/ui/label` | Form field labels |
| Dialog | `@/components/ui/dialog` | Modal overlays, confirmations |
| Badge | `@/components/ui/badge` | Status tags, tech stack chips |
| Separator | `@/components/ui/separator` | Layout dividers |
| Sonner | `@/components/ui/sonner` | Toast notifications |

---

## Usage Examples

### Button

```tsx
import { Button } from "@/components/ui/button"

// Variants: default | destructive | outline | secondary | ghost | link
<Button variant="default">Save changes</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
```

### Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Project Name</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
</Card>
```

### Input + Label

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="flex flex-col gap-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

### Dialog

```tsx
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
    </DialogHeader>
    <p>This action cannot be undone.</p>
  </DialogContent>
</Dialog>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge"

// Variants: default | secondary | destructive | outline
<Badge variant="secondary">TypeScript</Badge>
<Badge variant="destructive">Urgent</Badge>
```

### Sonner (Toast)

```tsx
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

// Add <Toaster /> once to layout.tsx
// Then call toast() anywhere:
toast.success("Task created")
toast.error("Failed to save")
```

---

## Color Tokens

Use semantic Tailwind classes — do NOT hardcode gray/blue/red values:

| Purpose | Class | Do Not Use |
|---------|-------|------------|
| Page background | `bg-background` | `bg-white`, `bg-gray-50` |
| Primary text | `text-foreground` | `text-gray-900`, `text-black` |
| Secondary text | `text-muted-foreground` | `text-gray-500`, `text-gray-600` |
| Primary action | `bg-primary text-primary-foreground` | `bg-blue-600 text-white` |
| Danger/error | `bg-destructive text-destructive-foreground` | `bg-red-500 text-white` |
| Borders | `border-border` | `border-gray-200` |
| Card surface | `bg-card text-card-foreground` | `bg-white` |

Dark mode is automatic — Radix Colors retune under `.dark` class.

---

## Governance

**ESLint rules (hard errors in new files):**
- Importing `empty-state.tsx` → error (use Card pattern instead)
- Importing `conflict-warning.tsx` → error (use Dialog/Alert instead)
- Importing `skeleton.tsx` directly → error (use Shadcn Skeleton)

**Exempt files (migrated in Phases 10-12):**
All files in `components/tasks/`, `components/teams/`, `components/projects/`, `components/portfolio/`, `components/auth/`, `components/layout/`, `components/activity/`

**className restrictions (code review gate — not ESLint):**
New files must use semantic tokens (`bg-primary`, `text-muted-foreground`) not hardcoded Tailwind color values (`bg-blue-600`, `text-gray-500`). ESLint cannot inspect className strings — enforced via PR review.

---

## Adding New Components

```bash
# From repo root:
npx shadcn@latest add [component-name] -c ./apps/web
```

See [Shadcn UI components](https://ui.shadcn.com/docs/components) for available components.
