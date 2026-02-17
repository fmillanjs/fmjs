// ================================================================
// Design System Governance: Hard errors on deprecated component
// imports in NEW files. Build fails if a new file imports old
// hand-rolled components instead of Shadcn UI components.
//
// Scope: components/**/*.tsx, app/**/*.tsx (new files in these dirs)
// Exempt: Only the deprecated component files themselves remain exempt
//         (they ARE the restricted targets), plus all Shadcn-installed
//         ui/ components which are valid targets for import.
//
// Phase 13: All Phase 10-12 migration targets (tasks/projects/teams/portfolio/auth/layout)
// have been removed from ignores. ESLint now enforces governance on all feature components.
// Only the deprecated component files themselves remain exempt (they ARE the restricted targets).
//
// Note: Skeleton is NOT restricted — components/ui/skeleton.tsx is the active
// Skeleton component used by loading.tsx files. Only EmptyState and ConflictWarning
// are restricted as they have Shadcn-native replacements (Card pattern, Dialog/Alert).
//
// Note: Next.js 15 core-web-vitals + typescript rules are handled
// separately via `next lint` (next.config.ts). This file adds the
// no-restricted-imports governance layer on top.
// ================================================================
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['components/**/*.tsx', 'app/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    ignores: [
      // Deprecated component files themselves — exempt because they ARE the restricted targets
      'components/ui/skeleton.tsx',
      'components/ui/theme-toggle.tsx',
      'components/ui/command-palette.tsx',
      'components/ui/empty-state.tsx',
      'components/ui/conflict-warning.tsx',

      // Providers — not importing deprecated components
      'components/providers/**',

      // All Shadcn-installed ui/ components (valid import targets, not restricted)
      'components/ui/alert-dialog.tsx',
      'components/ui/alert.tsx',
      'components/ui/avatar.tsx',
      'components/ui/badge.tsx',
      'components/ui/button.tsx',
      'components/ui/card.tsx',
      'components/ui/checkbox.tsx',
      'components/ui/dialog.tsx',
      'components/ui/dropdown-menu.tsx',
      'components/ui/form.tsx',
      'components/ui/input.tsx',
      'components/ui/label.tsx',
      'components/ui/popover.tsx',
      'components/ui/select.tsx',
      'components/ui/separator.tsx',
      'components/ui/sheet.tsx',
      'components/ui/sonner.tsx',
      'components/ui/switch.tsx',
      'components/ui/table.tsx',
      'components/ui/tabs.tsx',
      'components/ui/textarea.tsx',
      'components/ui/tooltip.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Restrict importing old empty-state (use Shadcn Card/description patterns instead)
              group: [
                '**/components/ui/empty-state',
                '../ui/empty-state',
                './empty-state',
                '@/components/ui/empty-state',
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
                '@/components/ui/conflict-warning',
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
