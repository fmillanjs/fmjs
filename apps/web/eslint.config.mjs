// ================================================================
// Design System Governance: Hard errors on deprecated component
// imports in NEW files. Build fails if a new file imports old
// hand-rolled components instead of Shadcn UI components.
//
// Scope: components/**/*.tsx, app/**/*.tsx (new files in these dirs)
// Exempt: All existing files listed in ignores below
//
// Note: Next.js 15 core-web-vitals + typescript rules are handled
// separately via `next lint` (next.config.ts). This file adds the
// no-restricted-imports governance layer on top.
// ================================================================
export default [
  {
    files: ['components/**/*.tsx', 'app/**/*.tsx'],
    ignores: [
      // Existing UI components — exempt until Phase 10 migration
      'components/ui/skeleton.tsx',
      'components/ui/theme-toggle.tsx',
      'components/ui/command-palette.tsx',
      'components/ui/empty-state.tsx',
      'components/ui/conflict-warning.tsx',

      // Existing feature components — exempt until Phases 11-12 migration
      'components/tasks/**',
      'components/projects/**',
      'components/project/**',
      'components/portfolio/**',
      'components/activity/**',
      'components/auth/**',
      'components/layout/**',
      'components/teams/**',
      'components/providers/**',

      // Shadcn-installed components themselves (not restricted)
      'components/ui/button.tsx',
      'components/ui/card.tsx',
      'components/ui/input.tsx',
      'components/ui/label.tsx',
      'components/ui/dialog.tsx',
      'components/ui/badge.tsx',
      'components/ui/separator.tsx',
      'components/ui/sonner.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Restrict importing old hand-rolled skeleton (use Shadcn skeleton instead)
              group: [
                '**/components/ui/skeleton',
                '../ui/skeleton',
                './skeleton',
              ],
              message:
                'DESIGN SYSTEM: Import Skeleton from @/components/ui/skeleton (Shadcn). Old hand-rolled skeleton is deprecated. See apps/web/DESIGN-SYSTEM.md.',
            },
            {
              // Restrict importing old empty-state (use Shadcn Card/description patterns instead)
              group: [
                '**/components/ui/empty-state',
                '../ui/empty-state',
                './empty-state',
              ],
              message:
                'DESIGN SYSTEM: EmptyState is deprecated. Use Card + description text pattern with Shadcn components. See apps/web/DESIGN-SYSTEM.md.',
            },
            {
              // Restrict importing old conflict-warning (use Shadcn Alert/Dialog instead)
              group: [
                '**/components/ui/conflict-warning',
                '../ui/conflict-warning',
                './conflict-warning',
              ],
              message:
                'DESIGN SYSTEM: ConflictWarning is deprecated. Use Shadcn Dialog or Alert pattern instead. See apps/web/DESIGN-SYSTEM.md.',
            },
          ],
        },
      ],
    },
  },
];
