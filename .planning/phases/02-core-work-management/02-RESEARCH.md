# Phase 2: Core Work Management - Research

**Researched:** 2026-02-14
**Domain:** Work management data modeling, task CRUD operations, Kanban boards, filtering/search, activity feeds
**Confidence:** HIGH

## Summary

Phase 2 builds upon Phase 1's authentication and audit infrastructure to deliver the core work management functionality: teams, projects, tasks, views, and activity tracking. This phase transforms TeamFlow from a foundation into a functional product that recruiters can immediately interact with.

The research confirms that established patterns exist for all major features in this phase: (1) multi-tenant organization models using Prisma with composite unique constraints on organizationId + resource fields, (2) drag-and-drop Kanban boards using @dnd-kit with built-in keyboard accessibility, (3) server-side filtering and sorting using URL search params with TanStack Table, (4) optimistic UI updates using React 19's useOptimistic hook for instant feedback, (5) activity feed implementation with infinite scroll pagination, and (6) comprehensive data seeding using @faker-js/faker with Prisma's seed script.

Critical architectural decisions: Team/Organization is the tenant boundary (not User), Projects belong to Teams (not Users directly), Tasks use implicit many-to-many for Labels (no extra metadata needed), and all queries must be scoped by organizationId to prevent cross-tenant data leakage. Database indexing is mandatory on all foreign keys (projectId, assigneeId, organizationId) and filtering columns (status, priority, createdAt) to avoid N+1 queries and sequential scans at scale.

**Primary recommendation:** Use proven libraries for complex UX patterns (dnd-kit for drag-drop, TanStack Table for data tables, React 19 useOptimistic for instant updates). Focus implementation effort on business logic, data modeling, and multi-tenant security rather than reinventing UI interaction patterns. Seed demo workspace with realistic data using Faker to enable immediate recruiter interaction.

## Standard Stack

### Core Data Management

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.x | ORM with multi-tenant patterns | Already established in Phase 1. Extensions for audit trails, strong typing, migration tooling, and support for composite indexes/unique constraints |
| @faker-js/faker | 9.x | Generate realistic seed data | Industry standard for creating demo data. Generates names, emails, dates, text with localization support |
| zod | 3.22+ | Validation schemas | Already established in Phase 1. Single source of truth for DTO validation on frontend and backend |
| nestjs-zod | Latest | NestJS + Zod integration | Already established in Phase 1. Creates type-safe DTOs with automatic OpenAPI generation |

### Drag-and-Drop (Kanban Board)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | 6.x | Core drag-and-drop primitives | Modern, performant, accessible drag-drop library with built-in keyboard navigation and ARIA attributes |
| @dnd-kit/sortable | 6.x | Sortable lists and grids | Official dnd-kit extension for sortable containers. Handles Kanban column + card sorting with minimal code |
| @dnd-kit/utilities | 6.x | Helper utilities for dnd-kit | CSS transforms, collision detection algorithms, coordinate manipulation |

### Data Tables & Filtering

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-table | 8.x | Headless table library | For list views with sorting, filtering, pagination. Fully typed, no UI opinions, integrates with shadcn/ui |
| nuqs | Latest | Type-safe URL search params | Manage filter state in URL for shareable links. Server-side rendering compatible with Next.js App Router |
| cmdk | Latest | Command palette / search | Optional: Keyboard-driven search interface for tasks. Used by Vercel, Linear |

### Optimistic UI Updates

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React 19 useOptimistic | Built-in | Optimistic state updates | Native React 19 hook for instant UI feedback. Use for task mutations (create, update, move) with server reconciliation |
| React 19 useTransition | Built-in | Mark non-urgent updates | Prevent blocking UI during filtering/sorting. Keep controls responsive while background updates process |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-infinite-scroll-component | 6.x | Infinite scroll pagination | For activity feed timeline. Loads more items as user scrolls. Intersection Observer based |
| date-fns | 3.x | Date manipulation | Formatting due dates, relative time ("2 days ago"), date range filtering. Lightweight alternative to Moment.js |

### Installation

```bash
# Drag-and-drop for Kanban
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities --workspace=apps/web

# Data table and filtering
npm install @tanstack/react-table nuqs --workspace=apps/web

# Activity feed
npm install react-infinite-scroll-component --workspace=apps/web

# Date utilities
npm install date-fns --workspace=apps/web

# Seed data generation
npm install -D @faker-js/faker --workspace=packages/database

# Backend validation (already installed in Phase 1)
# nestjs-zod, zod, @casl/ability, @casl/prisma
```

## Architecture Patterns

### Recommended Project Structure

```
apps/
  web/
    app/
      (dashboard)/              # Protected routes
        teams/
          [teamId]/
            page.tsx            # Team overview
            projects/
              page.tsx          # Project list
              [projectId]/
                page.tsx        # Project detail with Kanban
                settings/       # Project settings
            settings/           # Team settings
        activity/
          page.tsx              # Activity feed timeline
    components/
      teams/
        team-form.tsx           # Create/edit team
        team-member-list.tsx   # Member management
      projects/
        project-form.tsx        # Create/edit project
        project-list.tsx        # Project cards
      tasks/
        kanban-board.tsx        # Drag-drop Kanban
        task-list.tsx           # List view with TanStack Table
        task-form.tsx           # Create/edit task modal
        task-filters.tsx        # Filter controls
        task-card.tsx           # Card component
      activity/
        activity-feed.tsx       # Infinite scroll timeline
        activity-item.tsx       # Single activity entry

  api/
    src/
      modules/
        teams/
          entities/             # Team entity
          dto/                  # Zod-based DTOs
          teams.controller.ts   # REST endpoints
          teams.service.ts      # Business logic
        projects/
          entities/
          dto/
          projects.controller.ts
          projects.service.ts
        tasks/
          entities/
          dto/
          tasks.controller.ts
          tasks.service.ts
        labels/                 # Task labels/tags
          entities/
          dto/
          labels.controller.ts
          labels.service.ts

packages/
  database/
    prisma/
      schema.prisma             # Updated with Team, Project, Task models
      seed.ts                   # Faker-based demo data
    src/
      seed-helpers/             # Reusable seed utilities
```

### Pattern 1: Multi-Tenant Organization Model

**What:** Organization (Team) is the tenant boundary. All resources (Projects, Tasks) belong to Organization. Composite unique constraints prevent duplicate resource names within same Organization.

**When to use:** Multi-tenant SaaS where users can belong to multiple organizations. Required for data isolation and RBAC scoping.

**Why this pattern:** Prevents cross-tenant data leakage, enables organization-scoped queries with Row Level Security, supports future feature of users switching between organizations.

**Example:**

```prisma
// packages/database/prisma/schema.prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     Membership[]
  projects    Project[]
  labels      Label[]

  @@index([slug])
}

model Membership {
  id             String       @id @default(cuid())
  role           UserRole     // ADMIN, MANAGER, MEMBER
  userId         String
  organizationId String
  joinedAt       DateTime     @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // User can only be member of organization once
  @@unique([userId, organizationId])
  @@index([userId])
  @@index([organizationId])
}

model Project {
  id             String       @id @default(cuid())
  name           String
  description    String?      @db.Text
  status         ProjectStatus @default(ACTIVE) // ACTIVE, ARCHIVED
  organizationId String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  tasks        Task[]

  // Project names must be unique within organization
  @@unique([organizationId, name])
  @@index([organizationId])
  @@index([status])
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?      @db.Text
  status      TaskStatus   @default(TODO) // TODO, IN_PROGRESS, DONE, BLOCKED
  priority    TaskPriority @default(MEDIUM) // LOW, MEDIUM, HIGH, URGENT
  dueDate     DateTime?
  projectId   String
  assigneeId  String?
  createdById String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?      @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  createdBy   User       @relation("TaskCreator", fields: [createdById], references: [id])
  labels      Label[]    // Implicit many-to-many
  comments    Comment[]

  // CRITICAL: Index all foreign keys and filter columns
  @@index([projectId])
  @@index([assigneeId])
  @@index([createdById])
  @@index([status])
  @@index([priority])
  @@index([dueDate])
  @@index([createdAt])
}

model Label {
  id             String   @id @default(cuid())
  name           String
  color          String   @default("#64748b") // Hex color
  organizationId String

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  tasks        Task[]

  // Label names must be unique within organization
  @@unique([organizationId, name])
  @@index([organizationId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  taskId    String
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id])

  @@index([taskId])
  @@index([authorId])
  @@index([createdAt])
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  BLOCKED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

**Source:** [How to create a Multi-tenant application with Next.js and Prisma](https://www.mikealche.com/software-development/how-to-create-a-multi-tenant-application-with-next-js-and-prisma)

### Pattern 2: Kanban Board with dnd-kit

**What:** Accessible drag-and-drop Kanban board using @dnd-kit with keyboard navigation, ARIA attributes, and optimistic UI updates.

**When to use:** Visual task management where users move tasks between status columns. Required for VIEW-02, VIEW-03.

**Why this pattern:** dnd-kit provides built-in accessibility (keyboard nav, screen reader support), performance optimizations (CSS transforms), and flexible architecture (custom collision detection, sensors).

**Example:**

```typescript
// apps/web/components/tasks/kanban-board.tsx
'use client';

import { useState, useOptimistic } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { TaskCard } from './task-card';
import { updateTaskStatus } from '@/app/actions/tasks';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee?: { name: string; image: string };
}

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    initialTasks,
    (state, { taskId, newStatus }: { taskId: string; newStatus: string }) => {
      return state.map((task) =>
        task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
      );
    }
  );

  // Configure sensors for mouse, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Prevent accidental drags
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { currentCoordinates }) => {
        // Arrow key navigation
        const delta = 50;
        switch (event.code) {
          case 'ArrowRight':
            return { ...currentCoordinates, x: currentCoordinates.x + delta };
          case 'ArrowLeft':
            return { ...currentCoordinates, x: currentCoordinates.x - delta };
          default:
            return currentCoordinates;
        }
      },
    })
  );

  const columns = [
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'DONE', title: 'Done' },
    { id: 'BLOCKED', title: 'Blocked' },
  ];

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    // Optimistic update
    setOptimisticTasks({ taskId, newStatus });

    // Server update
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      // Revert on error (useOptimistic handles this)
      console.error('Failed to update task:', error);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = optimisticTasks.filter(
            (task) => task.status === column.id
          );

          return (
            <div key={column.id} className="flex flex-col gap-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                {column.title} ({columnTasks.length})
              </h3>
              <SortableContext
                items={columnTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
                id={column.id}
              >
                <div className="flex flex-col gap-2 min-h-[200px] rounded-lg border-2 border-dashed p-2">
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeId ? (
          <TaskCard
            task={optimisticTasks.find((t) => t.id === activeId)!}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

**Sources:**
- [How to create an awesome Kanban board using dnd-kit](https://www.chetanverma.com/blog/how-to-create-an-awesome-kanban-board-using-dnd-kit)
- [dnd-kit Accessibility Guide](https://docs.dndkit.com/guides/accessibility)

### Pattern 3: Server-Side Filtering with URL Search Params

**What:** Filter and sort state stored in URL query parameters using nuqs. Server Components fetch filtered data. Client components update URL with optimistic transitions.

**When to use:** List views with filtering (VIEW-04), sorting (VIEW-06), and search (VIEW-05). Enables shareable links to filtered views.

**Why this pattern:** URL as single source of truth enables deep linking, browser back/forward navigation, server-side rendering with filters applied, and no client-side state management complexity.

**Example:**

```typescript
// apps/web/app/(dashboard)/teams/[teamId]/projects/[projectId]/page.tsx
import { Suspense } from 'react';
import { parseSearchParams } from '@/lib/search-params';
import { TaskList } from '@/components/tasks/task-list';
import { TaskFilters } from '@/components/tasks/task-filters';

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: { teamId: string; projectId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const filters = parseSearchParams(searchParams);

  return (
    <div className="space-y-4">
      <TaskFilters />
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskList projectId={params.projectId} filters={filters} />
      </Suspense>
    </div>
  );
}

// apps/web/components/tasks/task-filters.tsx
'use client';

import { useQueryStates, parseAsString, parseAsArrayOf } from 'nuqs';
import { useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function TaskFilters() {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(''),
    status: parseAsArrayOf(parseAsString).withDefault([]),
    priority: parseAsArrayOf(parseAsString).withDefault([]),
    assignee: parseAsString.withDefault(''),
  });

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Search tasks..."
        value={filters.search}
        onChange={(e) => {
          startTransition(() => {
            setFilters({ search: e.target.value });
          });
        }}
      />
      <Select
        value={filters.status}
        onValueChange={(value) => {
          startTransition(() => {
            setFilters({ status: value ? [value] : [] });
          });
        }}
      >
        <option value="">All statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
      </Select>
      {/* Priority, Assignee filters... */}
    </div>
  );
}
```

**Source:** [Managing Advanced Search Param Filtering in the Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/)

### Pattern 4: Activity Feed with Infinite Scroll

**What:** Timeline of audit log events with infinite scroll pagination. Loads initial 20 items, fetches more as user scrolls.

**When to use:** Activity feed (AUDIT-05), audit log (AUDIT-06). Displays chronological user actions.

**Why this pattern:** Prevents loading thousands of audit entries at once. Improves perceived performance. Standard pattern for social feeds, notifications.

**Example:**

```typescript
// apps/web/components/activity/activity-feed.tsx
'use client';

import { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ActivityItem } from './activity-item';
import { fetchActivityFeed } from '@/app/actions/activity';

interface Activity {
  id: string;
  action: string;
  actorName: string;
  timestamp: Date;
  metadata: any;
}

export function ActivityFeed({ projectId, initialActivities }: {
  projectId: string;
  initialActivities: Activity[];
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [hasMore, setHasMore] = useState(initialActivities.length === 20);
  const [offset, setOffset] = useState(20);

  async function loadMore() {
    const newActivities = await fetchActivityFeed(projectId, { offset, limit: 20 });
    setActivities((prev) => [...prev, ...newActivities]);
    setOffset((prev) => prev + 20);
    setHasMore(newActivities.length === 20);
  }

  return (
    <InfiniteScroll
      dataLength={activities.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<div className="text-center py-4">Loading...</div>}
      endMessage={<div className="text-center py-4 text-muted-foreground">No more activities</div>}
      className="space-y-4"
    >
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </InfiniteScroll>
  );
}
```

**Sources:**
- [Complete guide to infinite scrolling in React](https://blog.openreplay.com/complete-guide-infinite-scrolling-react/)
- [react-infinite-scroll-component npm](https://www.npmjs.com/package/react-infinite-scroll-component)

### Pattern 5: Demo Data Seeding with Faker

**What:** Prisma seed script using @faker-js/faker to generate realistic demo workspace with teams, projects, tasks, comments, labels.

**When to use:** TEAM-05 requirement. Enables recruiters to immediately interact with populated workspace.

**Why this pattern:** Realistic data is more impressive than "Test Task 1". Faker generates consistent, localized data. Seed script is idempotent (can run multiple times).

**Example:**

```typescript
// packages/database/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo workspace...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
    },
  });

  // Create demo users
  const users = await Promise.all(
    Array.from({ length: 10 }, async (_, i) => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = `demo${i + 1}@teamflow.dev`;

      return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: `${firstName} ${lastName}`,
          password: await bcrypt.hash('password123', 10),
          role: i === 0 ? 'ADMIN' : i < 3 ? 'MANAGER' : 'MEMBER',
        },
      });
    })
  );

  // Create memberships
  await Promise.all(
    users.map((user) =>
      prisma.membership.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: org.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          organizationId: org.id,
          role: user.role,
        },
      })
    )
  );

  // Create labels
  const labels = await Promise.all(
    ['Bug', 'Feature', 'Documentation', 'Enhancement', 'Urgent'].map((name, i) =>
      prisma.label.upsert({
        where: {
          organizationId_name: {
            organizationId: org.id,
            name,
          },
        },
        update: {},
        create: {
          name,
          organizationId: org.id,
          color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'][i],
        },
      })
    )
  );

  // Create projects
  const projects = await Promise.all(
    ['Product Launch', 'Website Redesign', 'Marketing Campaign'].map((name) =>
      prisma.project.upsert({
        where: {
          organizationId_name: {
            organizationId: org.id,
            name,
          },
        },
        update: {},
        create: {
          name,
          description: faker.lorem.paragraph(),
          organizationId: org.id,
          status: 'ACTIVE',
        },
      })
    )
  );

  // Create tasks for each project
  for (const project of projects) {
    const tasks = await Promise.all(
      Array.from({ length: 15 }, async () => {
        const status = faker.helpers.arrayElement(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']);
        const priority = faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
        const assignee = faker.helpers.arrayElement(users);
        const creator = faker.helpers.arrayElement(users);

        const task = await prisma.task.create({
          data: {
            title: faker.hacker.phrase(),
            description: faker.lorem.paragraphs(2),
            status,
            priority,
            projectId: project.id,
            assigneeId: assignee.id,
            createdById: creator.id,
            dueDate: faker.date.future(),
          },
        });

        // Add random labels
        const taskLabels = faker.helpers.arrayElements(labels, { min: 1, max: 3 });
        await prisma.task.update({
          where: { id: task.id },
          data: {
            labels: {
              connect: taskLabels.map((l) => ({ id: l.id })),
            },
          },
        });

        // Add comments
        await Promise.all(
          Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () =>
            prisma.comment.create({
              data: {
                content: faker.lorem.paragraph(),
                taskId: task.id,
                authorId: faker.helpers.arrayElement(users).id,
                createdAt: faker.date.recent({ days: 7 }),
              },
            })
          )
        );

        return task;
      })
    );

    console.log(`Created ${tasks.length} tasks for project: ${project.name}`);
  }

  console.log('✅ Demo workspace seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Sources:**
- [Prisma Seeding: Quickly Populate Your Database for Development](https://blog.alexrusin.com/prisma-seeding-quickly-populate-your-database-for-development/)
- [Seeding NestJS with Prisma And Faker](https://100lvlmaster.medium.com/seeding-nestjs-with-prisma-and-faker-af6a36a3954d)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | Custom mouse event handlers with position calculations | @dnd-kit/core + @dnd-kit/sortable | Drag-drop has edge cases: touch devices, keyboard navigation, screen readers, collision detection, multi-axis constraints, scroll during drag. dnd-kit solves all of these |
| Kanban optimistic updates | Manual state rollback on API failure | React 19 useOptimistic hook | Built-in hook manages optimistic state + rollback. Avoids manual state cloning, error handling complexity |
| Task filtering UI | Custom filter components | TanStack Table + nuqs | Table library handles sorting, filtering, pagination logic. URL state management avoids prop drilling, enables sharing links |
| Infinite scroll pagination | Manual scroll listeners and offset calculation | react-infinite-scroll-component | Library handles: intersection observer, scroll position tracking, loading states, end detection. Custom implementation misses edge cases |
| Seed data generation | Hardcoded "Test Task 1", "Test Task 2" | @faker-js/faker | Realistic names, emails, dates, text make demo more impressive. Faker provides localization, consistency, edge cases (long names, special characters) |
| Multi-tenant query scoping | Manual WHERE organizationId on every query | Prisma Client Extension with middleware | Extension automatically injects organizationId. Prevents forgetting scoping (security vulnerability). Centralized, testable |
| Date formatting | Custom date string manipulation | date-fns | Handles timezones, locales, relative time, edge cases (leap years, DST). Lightweight, tree-shakeable |

**Key insight:** Phase 2 features (drag-drop, filtering, pagination, seeding) are "solved problems" with mature libraries. Custom implementations waste time on edge cases and accessibility issues that libraries already handle. Focus effort on business logic, data modeling, and security (multi-tenant scoping, RBAC enforcement).

## Common Pitfalls

### Pitfall 1: Missing organizationId Scoping (Cross-Tenant Data Leakage)

**What goes wrong:** Queries fetch tasks without filtering by organizationId. User from Organization A sees tasks from Organization B. Critical security vulnerability.

**Why it happens:** Developers forget to add WHERE organizationId clause. Easy to miss in complex queries with multiple joins. No compiler warning for missing filter.

**How to avoid:**
1. **Prisma Client Extension** that auto-injects organizationId into all queries
2. **CASL policies** scope to organization: `can('read', 'Task', { project: { organizationId: user.organizationId } })`
3. **Service method signature** requires organizationId: `findAll(organizationId: string, filters: TaskFilters)`
4. **Database Row Level Security** as defense-in-depth (Phase 4)
5. **E2E tests** verify cross-tenant isolation: create data in Org A, query as user from Org B, assert empty results
6. **Code review checklist** for every new query: "Does this scope to organizationId?"

**Warning signs:**
- Query returns more data than expected in development
- No organizationId in WHERE clause
- Service methods don't accept organization context
- Tests only use single organization

**Verification:**
```typescript
// BAD: Missing organizationId scoping
async getTasks(projectId: string) {
  return this.prisma.task.findMany({
    where: { projectId }, // SECURITY VULNERABILITY
  });
}

// GOOD: Explicit organization scoping
async getTasks(projectId: string, organizationId: string) {
  return this.prisma.task.findMany({
    where: {
      projectId,
      project: { organizationId }, // Ensures project belongs to org
    },
  });
}
```

**Source:** [Multi-Tenancy with Prisma: A New Approach to Making 'where' Required](https://medium.com/@kz-d/multi-tenancy-with-prisma-a-new-approach-to-making-where-required-1e93a3783d9d)

### Pitfall 2: N+1 Queries from Missing Includes

**What goes wrong:** Fetching 100 tasks executes 101 queries: 1 for tasks, 100 individual queries for assignee. Response time grows linearly with result count. Database connection pool exhausts.

**Why it happens:** Developers fetch tasks without `include: { assignee: true }`. Accessing `task.assignee` in component triggers lazy load per task. ORM hides the problem during development with small datasets.

**How to avoid:**
1. **Always use include** for relations accessed in UI: `include: { assignee: true, labels: true, project: true }`
2. **Prisma logging** in development: `log: ['query']` shows exact SQL executed
3. **Database query monitoring** in production: track query count per request
4. **Load testing** with realistic data volumes (1000+ tasks) to catch issues before production
5. **Consider relationLoadStrategy: 'join'** for single SQL query (Prisma 5+)

**Warning signs:**
- Slow response times that scale with result count
- Database logs show hundreds of queries for single request
- Connection pool timeouts under load
- Prisma query log shows repeated similar queries

**Verification:**
```typescript
// BAD: N+1 query problem
const tasks = await prisma.task.findMany({ where: { projectId } });
// Later in code: tasks.map(t => t.assignee.name) triggers 100 queries

// GOOD: Include relations upfront
const tasks = await prisma.task.findMany({
  where: { projectId },
  include: {
    assignee: true,
    labels: true,
    project: { select: { name: true } },
  },
});
```

**Sources:**
- [N+1 Query Problem: Fixing It with SQL and Prisma ORM](https://www.furkanbaytekin.dev/blogs/software/n1-query-problem-fixing-it-with-sql-and-prisma-orm)
- [Query optimization using Prisma Optimize](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)

### Pitfall 3: Race Conditions in Concurrent Task Updates

**What goes wrong:** Two users simultaneously update same task. Second update overwrites first without merging changes. Data loss. No conflict detection or user notification.

**Why it happens:** API uses simple UPDATE without checking current state. No version field or timestamp check. Last write wins, regardless of what changed in between.

**How to avoid:**
1. **Optimistic locking** with version field: increment on every update, check before write
2. **Last-modified timestamp check**: reject update if `updatedAt` changed since client fetched
3. **Explicit conflict detection**: return 409 Conflict with current state, let client resolve
4. **Field-level merging** for non-conflicting updates (different fields changed)
5. **Real-time updates** (Phase 3) show other users' changes immediately
6. **Audit log** captures both conflicting updates for forensics

**Warning signs:**
- User reports "my changes disappeared"
- Audit log shows rapid updates to same field
- No version field in schema
- Update mutations don't check current state

**Verification:**
```typescript
// BAD: Last write wins (data loss)
async updateTask(taskId: string, data: UpdateTaskDto) {
  return this.prisma.task.update({
    where: { id: taskId },
    data, // Overwrites all fields, no conflict check
  });
}

// GOOD: Optimistic locking with version
async updateTask(taskId: string, data: UpdateTaskDto, expectedVersion: number) {
  const task = await this.prisma.task.findUnique({ where: { id: taskId } });

  if (task.version !== expectedVersion) {
    throw new ConflictException('Task was modified by another user');
  }

  return this.prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      version: { increment: 1 },
      updatedAt: new Date(),
    },
  });
}
```

**Sources:**
- [Database Race Conditions](https://medium.com/@C0l0red/database-race-conditions-f459d94ee2d0)
- [Managing Advanced Search Param Filtering in the Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) (discusses optimistic update conflicts)

### Pitfall 4: Missing Database Indexes on Filter Columns

**What goes wrong:** Filtering tasks by status or priority executes sequential scan of entire table. Query time grows linearly with total task count. Database CPU spikes. Slow response times.

**Why it happens:** Developers add WHERE clauses without corresponding indexes. Prisma doesn't create indexes automatically except on relations. Filter columns overlooked during schema design.

**How to avoid:**
1. **Index all WHERE clause columns**: status, priority, dueDate, createdAt
2. **Index all ORDER BY columns**: sortable fields in list view
3. **Composite indexes** for multi-column filters: `@@index([status, priority])`
4. **Test with realistic data**: 10k+ tasks to catch missing indexes
5. **Monitor slow queries** in production: PostgreSQL pg_stat_statements
6. **EXPLAIN ANALYZE** queries during development: verify index usage

**Warning signs:**
- Query time increases linearly with table size
- Database logs show "Seq Scan" instead of "Index Scan"
- High CPU usage during list queries
- Adding 1000 rows doubles query time

**Verification:**
```prisma
// BAD: No indexes on filter columns
model Task {
  id          String       @id @default(cuid())
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  createdAt   DateTime     @default(now())

  // Missing indexes - sequential scans!
}

// GOOD: Index all filter and sort columns
model Task {
  id          String       @id @default(cuid())
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  createdAt   DateTime     @default(now())

  @@index([status])
  @@index([priority])
  @@index([dueDate])
  @@index([createdAt])
  @@index([status, priority]) // Composite for combined filters
}
```

**Sources:**
- [Boosting Query Performance in Prisma ORM: The Impact of Indexing on Large Datasets](https://medium.com/@manojbicte/boosting-query-performance-in-prisma-orm-the-impact-of-indexing-on-large-datasets-a55b1972ca72)
- [Improving query performance with database indexes using Prisma](https://www.prisma.io/blog/improving-query-performance-using-indexes-1-zuLNZwBkuL)

### Pitfall 5: Drag-and-Drop Without Keyboard Accessibility

**What goes wrong:** Kanban board only works with mouse/touch. Keyboard users cannot reorder tasks. Screen reader users have no context about draggable items. Fails WCAG accessibility standards.

**Why it happens:** Developers implement drag-drop with mouse events only. Forget keyboard navigation and ARIA attributes. Testing only uses mouse during development.

**How to avoid:**
1. **Use @dnd-kit** which provides keyboard support by default
2. **Semantic button elements** for draggable items: `<button>` or `role="button"`
3. **ARIA attributes** provided by dnd-kit: `aria-roledescription`, `aria-describedby`
4. **Keyboard sensor configuration** for arrow key navigation
5. **Visual focus indicators** when keyboard-navigating
6. **Test with keyboard only**: Tab, Enter, Arrow keys, Escape
7. **Screen reader testing**: verify announcements for drag start, move, drop

**Warning signs:**
- No tabindex on draggable elements
- Arrow keys don't work during drag
- Missing ARIA labels
- No keyboard testing in QA
- Focus not visible when tabbing

**Verification:**
```typescript
// BAD: Mouse-only drag-drop
<div
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
>
  Drag me
</div>

// GOOD: Accessible with dnd-kit
import { useDraggable } from '@dnd-kit/core';

function DraggableTask({ task }) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: task.id,
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      // dnd-kit provides:
      // - role="button"
      // - aria-roledescription="draggable"
      // - aria-describedby with instructions
      // - keyboard support via KeyboardSensor
    >
      {task.title}
    </button>
  );
}
```

**Source:** [dnd-kit Accessibility Guide](https://docs.dndkit.com/guides/accessibility)

### Pitfall 6: Forgetting to Audit CRUD Operations

**What goes wrong:** Tasks created, updated, deleted without audit log entries. Activity feed shows incomplete history. No record of who changed what. Cannot answer "who deleted this task?"

**Why it happens:** Audit logging added as afterthought. Scattered logger calls easy to forget. Bulk operations log one entry instead of individual changes. WebSocket updates bypass audit middleware.

**How to avoid:**
1. **Event-driven audit logging** established in Phase 1: emit domain events for all mutations
2. **Service layer events**: `this.eventEmitter.emit('task.created', new TaskCreatedEvent(...))`
3. **Audit listener** captures all events: `@OnEvent('task.*')`
4. **Include full context**: actorId, changes (old/new values), metadata (IP, user agent)
5. **Audit failures too**: authorization denials, validation errors
6. **Test audit coverage**: verify every CRUD operation creates log entry
7. **Bulk operation handling**: emit individual events, not single bulk event

**Warning signs:**
- Activity feed missing recent actions
- Audit log has gaps in timeline
- Cannot trace who made specific change
- No audit entries for deletions
- Bulk updates create single log entry

**Verification:**
```typescript
// BAD: Direct database update, no audit
async updateTask(taskId: string, data: UpdateTaskDto) {
  return this.prisma.task.update({
    where: { id: taskId },
    data,
  });
}

// GOOD: Emit event for audit trail
async updateTask(taskId: string, data: UpdateTaskDto, user: User) {
  const previousTask = await this.prisma.task.findUnique({ where: { id: taskId } });

  const updatedTask = await this.prisma.task.update({
    where: { id: taskId },
    data,
  });

  // Emit event for audit listener
  this.eventEmitter.emit(
    'task.updated',
    new TaskUpdatedEvent(
      taskId,
      user.id,
      { previous: previousTask, current: updatedTask },
      new Date()
    )
  );

  return updatedTask;
}
```

**Source:** [Prisma Audit Trail Guide for Postgres](https://medium.com/@arjunlall/prisma-audit-trail-guide-for-postgres-5b09aaa9f75a)

## Code Examples

Verified patterns from official sources and production implementations.

### NestJS Task CRUD with DTO Validation

```typescript
// apps/api/src/modules/tasks/dto/create-task.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().cuid().optional(),
  labelIds: z.array(z.string().cuid()).default([]),
  projectId: z.string().cuid(),
});

export class CreateTaskDto extends createZodDto(createTaskSchema) {}

// apps/api/src/modules/tasks/tasks.controller.ts
import { Controller, Post, Body, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RbacGuard } from '@/core/rbac/rbac.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: User) {
    return this.tasksService.create(dto, user);
  }

  @Get('project/:projectId')
  async findAll(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
    @CurrentUser() user: User
  ) {
    return this.tasksService.findAll(projectId, {
      status,
      priority,
      assigneeId,
      search,
      organizationId: user.organizationId,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: User
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasksService.remove(id, user);
  }
}

// apps/api/src/modules/tasks/tasks.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/core/database/prisma.service';
import { AbilityFactory } from '@/core/rbac/ability.factory';
import { accessibleBy } from '@casl/prisma';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private abilityFactory: AbilityFactory,
    private eventEmitter: EventEmitter2
  ) {}

  async create(dto: CreateTaskDto, user: User) {
    // Verify project belongs to user's organization
    const project = await this.prisma.project.findFirst({
      where: {
        id: dto.projectId,
        organizationId: user.organizationId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Create task
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate,
        projectId: dto.projectId,
        assigneeId: dto.assigneeId,
        createdById: user.id,
        labels: {
          connect: dto.labelIds.map((id) => ({ id })),
        },
      },
      include: {
        assignee: true,
        createdBy: true,
        labels: true,
        project: true,
      },
    });

    // Emit event for audit trail
    this.eventEmitter.emit('task.created', {
      taskId: task.id,
      actorId: user.id,
      organizationId: user.organizationId,
      timestamp: new Date(),
    });

    return task;
  }

  async findAll(projectId: string, filters: TaskFilters) {
    const ability = this.abilityFactory.createForUser(user);

    return this.prisma.task.findMany({
      where: {
        AND: [
          { projectId },
          { project: { organizationId: filters.organizationId } },
          accessibleBy(ability, 'read').Task,
          filters.status ? { status: filters.status } : {},
          filters.priority ? { priority: filters.priority } : {},
          filters.assigneeId ? { assigneeId: filters.assigneeId } : {},
          filters.search
            ? {
                OR: [
                  { title: { contains: filters.search, mode: 'insensitive' } },
                  { description: { contains: filters.search, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        labels: true,
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateTaskDto, user: User) {
    const ability = this.abilityFactory.createForUser(user);

    // Check permission
    const task = await this.prisma.task.findFirst({
      where: {
        AND: [{ id }, accessibleBy(ability, 'update').Task],
      },
    });

    if (!task) {
      throw new ForbiddenException('Cannot update this task');
    }

    const previousTask = { ...task };

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: dto,
      include: {
        assignee: true,
        labels: true,
        project: true,
      },
    });

    // Emit event for audit trail
    this.eventEmitter.emit('task.updated', {
      taskId: id,
      actorId: user.id,
      changes: { previous: previousTask, current: updatedTask },
      timestamp: new Date(),
    });

    return updatedTask;
  }
}
```

**Sources:**
- [Using DTOs and Validation Pipes in NestJS](https://www.devcentrehouse.eu/blogs/nestjs-dtos-pipes-scalable-backend-apps/)
- [Mastering Complex RBAC in NestJS: Integrating CASL with Prisma ORM](https://blog.devgenius.io/mastering-complex-rbac-in-nestjs-integrating-casl-with-prisma-orm-for-granular-authorization-767941a05ef1)

### Task List with TanStack Table

```typescript
// apps/web/components/tasks/task-list.tsx
'use client';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
}

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className="font-medium">{row.original.title}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} />
    ),
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => (
      <PriorityBadge priority={row.original.priority} />
    ),
  },
  {
    accessorKey: 'assignee',
    header: 'Assignee',
    cell: ({ row }) => (
      row.original.assignee ? (
        <UserAvatar user={row.original.assignee} />
      ) : (
        <span className="text-muted-foreground">Unassigned</span>
      )
    ),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => (
      row.original.dueDate ? (
        <span>{format(new Date(row.original.dueDate), 'MMM d, yyyy')}</span>
      ) : null
    ),
  },
];

export function TaskList({ tasks }: TaskListProps) {
  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-2 text-left">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t hover:bg-muted/50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Source:** [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table)

## State of the Art

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|-------------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2021-2022 | react-beautiful-dnd no longer maintained. dnd-kit is lighter, more flexible, built-in accessibility |
| class-validator DTOs | Zod schemas with nestjs-zod | 2023-2026 | TypeScript-first validation. Shared schemas between frontend/backend. Better DX |
| Manual optimistic updates | React 19 useOptimistic hook | React 19 (2024) | Built-in hook eliminates boilerplate. Automatic rollback on error |
| Client-side pagination only | Server-side pagination with URL state | Ongoing adoption | Better performance for large datasets. Shareable filtered views via URL |
| Moment.js for dates | date-fns | 2019-2026 | Lightweight (2KB vs 67KB), tree-shakeable, immutable, better TypeScript support |
| Single database per app | Multi-tenant single database with RLS | Ongoing adoption | Lower infrastructure cost, simpler deployment, stronger data isolation with PostgreSQL RLS |
| Hardcoded seed data | Faker.js generated data | Always available, now standard | More impressive demos, realistic edge cases, localization support |

**Deprecated/outdated:**
- **react-beautiful-dnd:** No longer maintained. Use @dnd-kit instead
- **class-validator for DTOs:** Use Zod for shared frontend/backend validation
- **Moment.js:** Deprecated. Use date-fns or native Intl API
- **Manual WHERE organizationId:** Use Prisma Client Extension to auto-inject tenant scoping
- **Separate databases per tenant:** Use single database with RLS for cost efficiency

## Open Questions

1. **Task version field for optimistic locking**
   - What we know: Prevents race conditions during concurrent updates. Adds complexity to every update mutation.
   - What's unclear: Is this necessary for Phase 2, or defer to Phase 3 when real-time updates increase collision risk?
   - Recommendation: Defer to Phase 3. Real-time updates (Phase 3) will make conflicts visible immediately. Phase 2 conflict risk is low with manual refresh. Add version field in Phase 3 with useOptimistic rollback pattern.

2. **Activity feed: separate table vs audit log query**
   - What we know: Audit log captures all events. Activity feed shows subset (task mutations). Could query audit log directly or maintain separate activity_feed table.
   - What's unclear: Performance implications at scale (10k+ audit entries). Query complexity for filtering.
   - Recommendation: Query audit log directly in Phase 2. Add activity_feed materialized view in Phase 4 if performance becomes issue. Simpler architecture initially.

3. **Label color picker: predefined palette vs custom colors**
   - What we know: Custom color picker adds UI complexity. Predefined palette is faster UX.
   - What's unclear: Do recruiters expect custom colors for demo?
   - Recommendation: Predefined palette of 10 colors in Phase 2. Add custom picker in Phase 4 polish if time allows. Not critical for MVP.

4. **Task search: full-text search vs simple LIKE**
   - What we know: PostgreSQL full-text search requires GIN index, adds migration complexity. Simple ILIKE on title/description works for small datasets.
   - What's unclear: Performance threshold where full-text search becomes necessary.
   - Recommendation: Simple ILIKE in Phase 2 (sufficient for demo workspace with ~50 tasks). Add PostgreSQL full-text search in Phase 4 if needed. Monitor query performance.

## Sources

### Primary (HIGH confidence)

**Multi-Tenancy & Data Modeling:**
- [How to create a Multi-tenant application with Next.js and Prisma](https://www.mikealche.com/software-development/how-to-create-a-multi-tenant-application-with-next-js-and-prisma) - Multi-tenant patterns
- [Multi-Tenancy with Prisma: A New Approach to Making 'where' Required](https://medium.com/@kz-d/multi-tenancy-with-prisma-a-new-approach-to-making-where-required-1e93a3783d9d) - Query scoping patterns
- [Working with compound IDs and unique constraints](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints) - Official Prisma docs
- [Many-to-many relations | Prisma Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/many-to-many-relations) - Official Prisma docs

**Drag-and-Drop:**
- [How to create an awesome Kanban board using dnd-kit](https://www.chetanverma.com/blog/how-to-create-an-awesome-kanban-board-using-dnd-kit) - Practical implementation
- [dnd-kit Accessibility Guide](https://docs.dndkit.com/guides/accessibility) - Official accessibility docs
- [GitHub - mehrdadrafiee/recursive-dnd-kanban-board](https://github.com/mehrdadrafiee/recursive-dnd-kanban-board) - Next.js + dnd-kit example

**Optimistic Updates:**
- [useOptimistic – React](https://react.dev/reference/react/useOptimistic) - Official React 19 docs
- [Building an Optimistic UI Task Management App with React 19 and Next.js](https://www.syncfusion.com/blogs/post/task-management-app-react19-nextjs) - 2026 practical guide
- [Managing Advanced Search Param Filtering in the Next.js App Router](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/) - URL state patterns

**Database Performance:**
- [Boosting Query Performance in Prisma ORM: The Impact of Indexing on Large Datasets](https://medium.com/@manojbicte/boosting-query-performance-in-prisma-orm-the-impact-of-indexing-on-large-datasets-a55b1972ca72) - Performance analysis
- [Query optimization using Prisma Optimize](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance) - Official Prisma docs
- [N+1 Query Problem: Fixing It with SQL and Prisma ORM](https://www.furkanbaytekin.dev/blogs/software/n1-query-problem-fixing-it-with-sql-and-prisma-orm) - Practical solutions

**Seed Data:**
- [Prisma Seeding: Quickly Populate Your Database for Development](https://blog.alexrusin.com/prisma-seeding-quickly-populate-your-database-for-development/) - Comprehensive guide
- [Seeding NestJS with Prisma And Faker](https://100lvlmaster.medium.com/seeding-nestjs-with-prisma-and-faker-af6a36a3954d) - NestJS integration

### Secondary (MEDIUM confidence)

**Data Tables & Filtering:**
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) - Official component docs
- [GitHub - sadmann7/tablecn](https://github.com/sadmann7/tablecn) - Server-side sorting example

**Activity Feed:**
- [Complete guide to infinite scrolling in React](https://blog.openreplay.com/complete-guide-infinite-scrolling-react/) - Infinite scroll patterns
- [react-infinite-scroll-component npm](https://www.npmjs.com/package/react-infinite-scroll-component) - Library docs

**CRUD Best Practices:**
- [Using DTOs and Validation Pipes in NestJS](https://www.devcentrehouse.eu/blogs/nestjs-dtos-pipes-scalable-backend-apps/) - DTO patterns
- [What Is NestJS? A Practical 2026 Guide](https://thelinuxcode.com/what-is-nestjs-a-practical-2026-guide-to-building-scalable-nodejs-backends/) - Modern NestJS patterns

**Race Conditions:**
- [Database Race Conditions](https://medium.com/@C0l0red/database-race-conditions-f459d94ee2d0) - Concurrency patterns
- [Managing concurrency issues when multiple users are updating the same record](https://www.zigpoll.com/content/can-you-explain-how-you-ensure-data-consistency-and-handle-concurrency-issues-when-multiple-users-are-updating-the-same-record-in-a-hightraffic-system) - High-traffic strategies

### Tertiary (Context & Background)

- [Ultimate guide to multi-tenant SaaS data modeling](https://www.flightcontrol.dev/blog/ultimate-guide-to-multi-tenant-saas-data-modeling) - Architecture overview
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - Library comparison
- [The React + AI Stack for 2026](https://www.builder.io/blog/react-ai-stack-2026) - Stack trends

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified with official docs and 2026 sources
- Data modeling patterns: HIGH - Official Prisma docs and production implementations
- Drag-and-drop: HIGH - Official dnd-kit docs and multiple tutorials
- Optimistic updates: HIGH - Official React 19 docs
- Common pitfalls: HIGH - Based on documented issues and security best practices

**Research date:** 2026-02-14
**Valid until:** ~45 days (March 2026) for fast-moving libraries (React 19, dnd-kit); data modeling patterns stable

**Key takeaway:** Phase 2 is where TeamFlow becomes a functional product. Focus on correct multi-tenant data modeling (organizationId scoping), proven UI libraries (dnd-kit, TanStack Table), and comprehensive seeding for impressive demo. Avoid custom implementations of solved problems (drag-drop, infinite scroll, date formatting). Security is critical: every query must scope to organizationId to prevent cross-tenant data leakage.
