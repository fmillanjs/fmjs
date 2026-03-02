---
quick: 5
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/components/auth/login-form.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "TeamFlow login page shows a demo credentials box below the form"
    - "The box lists Admin, Manager, and Member accounts with email and password"
    - "CI passes after the change is pushed"
  artifacts:
    - path: "apps/web/components/auth/login-form.tsx"
      provides: "LoginForm with demo credentials box appended after the sign-up link"
  key_links:
    - from: "apps/web/components/auth/login-form.tsx"
      to: "demo credentials section"
      via: "static JSX block appended at bottom of returned div"
      pattern: "Demo Credentials"
---

<objective>
Add a demo credentials box to the TeamFlow login page, matching the pattern already used on the DevCollab login page.

Purpose: Recruiters and visitors hitting teamflow.fernandomillan.me/login need visible demo credentials, consistent with the devcollab app.
Output: Updated `apps/web/components/auth/login-form.tsx` with a credentials box rendered below the sign-up link. CI passes on push.
</objective>

<execution_context>
@/home/doctor/.claude/get-shit-done/workflows/execute-plan.md
@/home/doctor/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Relevant credential source: packages/database/prisma/seed.ts (line 36 / line 294)
  - All demo users share password: Password123
  - Roles: demo1@teamflow.dev = ADMIN, demo2@teamflow.dev = MANAGER, demo4@teamflow.dev = MEMBER

Reference implementation (DevCollab login — apps/devcollab-web/app/(auth)/login/page.tsx lines 82-89):
```tsx
<div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#f9fafb' }}>
  <p style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Demo Credentials</p>
  <div style={{ fontSize: '0.8rem', lineHeight: '1.6', fontFamily: 'monospace' }}>
    <div><strong>Admin:</strong> admin@demo.devcollab / Demo1234!</div>
    <div><strong>Contributor:</strong> contributor@demo.devcollab / Demo1234!</div>
    <div><strong>Viewer:</strong> viewer@demo.devcollab / Demo1234!</div>
  </div>
</div>
```

TeamFlow login uses Tailwind + shadcn UI (not inline styles). Adapt the box using Tailwind classes consistent with the rest of `login-form.tsx`.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add demo credentials box to TeamFlow LoginForm</name>
  <files>apps/web/components/auth/login-form.tsx</files>
  <action>
    In `apps/web/components/auth/login-form.tsx`, append a demo credentials box **after** the sign-up `<p>` tag (the last element inside the outer `<div>`).

    The box must:
    - Use Tailwind classes (not inline styles) to match the file's conventions
    - Have a heading "Demo Credentials"
    - List three accounts, each on its own line in monospace, with role label, email, and password
    - Use Password123 as the shared password (from seed.ts line 36)

    Credentials to show:
    - Admin: demo1@teamflow.dev / Password123
    - Manager: demo2@teamflow.dev / Password123
    - Member: demo4@teamflow.dev / Password123

    Suggested Tailwind styling (adapt as needed, do NOT use purple):
    ```tsx
    <div className="mt-6 p-4 border border-border rounded-lg bg-muted/50">
      <p className="text-sm font-semibold mb-2">Demo Credentials</p>
      <div className="text-xs leading-relaxed font-mono space-y-1">
        <div><span className="font-semibold">Admin:</span> demo1@teamflow.dev / Password123</div>
        <div><span className="font-semibold">Manager:</span> demo2@teamflow.dev / Password123</div>
        <div><span className="font-semibold">Member:</span> demo4@teamflow.dev / Password123</div>
      </div>
    </div>
    ```

    Do NOT modify any other part of the component (form logic, validation, routing).
  </action>
  <verify>
    Build check: `cd /home/doctor/fernandomillan && npx turbo build --filter=web 2>&1 | tail -20`

    Visual check: `grep -n "Demo Credentials" /home/doctor/fernandomillan/apps/web/components/auth/login-form.tsx`
  </verify>
  <done>
    - `login-form.tsx` contains "Demo Credentials" heading
    - Three credential lines present with demo1, demo2, demo4 emails and Password123
    - `turbo build --filter=web` exits 0 (no TypeScript errors)
  </done>
</task>

<task type="auto">
  <name>Task 2: Commit and push to trigger CI</name>
  <files></files>
  <action>
    Commit the change and push to main to trigger CI:

    ```bash
    cd /home/doctor/fernandomillan
    git add apps/web/components/auth/login-form.tsx
    git commit -m "feat(teamflow): add demo credentials box to login page"
    git push origin main
    ```

    After pushing, verify CI was triggered by checking the GitHub Actions run status:
    ```bash
    gh run list --limit 3
    ```

    Do NOT force push. Do NOT skip hooks.
  </action>
  <verify>
    `gh run list --limit 1` shows a run triggered by the commit with status "queued" or "in_progress" or "completed".
  </verify>
  <done>
    - Commit exists on main with message containing "demo credentials"
    - GitHub Actions run triggered for the push
    - CI completes with success (check with `gh run watch` or wait and re-run `gh run list --limit 1`)
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `grep -n "Demo Credentials\|demo1@\|demo2@\|demo4@" /home/doctor/fernandomillan/apps/web/components/auth/login-form.tsx` — shows 4 matches
2. `gh run list --limit 1` — shows latest CI run completed successfully
</verification>

<success_criteria>
- TeamFlow login page (`/login`) renders a "Demo Credentials" box showing three role-labeled accounts with Password123
- Box uses Tailwind classes consistent with the rest of login-form.tsx (no inline styles, no purple)
- Build passes locally before push
- CI passes on main after push
</success_criteria>

<output>
No SUMMARY.md required for quick tasks.
</output>
