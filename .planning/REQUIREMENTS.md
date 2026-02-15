# Requirements: Fernando Millan Portfolio & TeamFlow

**Defined:** 2026-02-14
**Core Value:** Prove senior full-stack engineering skills through a deployed, production-ready SaaS application that recruiters can actually use and interact with.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across sessions
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: User can reset password via email link
- [ ] **AUTH-05**: User can view and edit their profile
- [ ] **AUTH-06**: User sessions are stored securely in Redis

### Authorization (RBAC)

- [ ] **RBAC-01**: System supports three roles: Admin, Manager, Member
- [ ] **RBAC-02**: Admin can manage team members and assign roles
- [ ] **RBAC-03**: Manager can create and manage projects
- [ ] **RBAC-04**: Member can view projects and update assigned tasks
- [ ] **RBAC-05**: Authorization is enforced at multiple layers (middleware, guards, service, database)
- [ ] **RBAC-06**: Unauthorized actions show clear permission denied errors

### Teams & Workspaces

- [ ] **TEAM-01**: User can create a team/workspace
- [ ] **TEAM-02**: User can invite members to their team (manual for v1)
- [ ] **TEAM-03**: User can view all team members and their roles
- [ ] **TEAM-04**: User can remove members from team (Admin only)
- [ ] **TEAM-05**: Demo workspace is seeded with sample data

### Projects

- [ ] **PROJ-01**: User can create projects within a team
- [ ] **PROJ-02**: User can view all projects in their team
- [ ] **PROJ-03**: User can edit project details (name, description)
- [ ] **PROJ-04**: User can archive completed projects
- [ ] **PROJ-05**: User can delete projects (Admin only)

### Tasks

- [ ] **TASK-01**: User can create tasks with title, description, due date
- [ ] **TASK-02**: User can edit any task field
- [ ] **TASK-03**: User can delete tasks
- [ ] **TASK-04**: User can assign tasks to team members
- [ ] **TASK-05**: User can set task priority (Low, Medium, High, Urgent)
- [ ] **TASK-06**: User can set task status (To Do, In Progress, Done, Blocked)
- [ ] **TASK-07**: User can add labels/tags to tasks
- [ ] **TASK-08**: User can add comments to tasks
- [ ] **TASK-09**: User can view task history and changes

### Views & Navigation

- [ ] **VIEW-01**: User can view tasks in list format
- [ ] **VIEW-02**: User can view tasks in Kanban board format
- [ ] **VIEW-03**: User can drag and drop tasks between status columns
- [ ] **VIEW-04**: User can filter tasks by status, priority, assignee, labels
- [ ] **VIEW-05**: User can search tasks by title and description
- [ ] **VIEW-06**: User can sort tasks by due date, priority, created date

### Real-Time Collaboration

- [ ] **REAL-01**: User sees live updates when tasks are created
- [ ] **REAL-02**: User sees live updates when tasks are moved between columns
- [ ] **REAL-03**: User sees live updates when task details change
- [ ] **REAL-04**: User sees live updates when comments are added
- [ ] **REAL-05**: User sees presence indicators showing who is viewing the project
- [ ] **REAL-06**: User sees optimistic UI updates with rollback on failure
- [ ] **REAL-07**: System handles concurrent edits with conflict detection

### Activity & Audit

- [ ] **AUDIT-01**: System logs all task mutations with user context
- [ ] **AUDIT-02**: System logs authentication events (login, logout, failures)
- [ ] **AUDIT-03**: System logs authorization failures
- [ ] **AUDIT-04**: System logs RBAC changes (role assignments)
- [ ] **AUDIT-05**: User can view activity feed for a project
- [ ] **AUDIT-06**: User can view searchable audit log (Admin only)
- [ ] **AUDIT-07**: Audit log shows: who, what, when, IP address, user agent

### UI/UX Polish

- [ ] **UI-01**: Application is responsive and works on mobile browsers
- [ ] **UI-02**: Application shows loading skeletons during data fetch
- [ ] **UI-03**: Application shows proper error messages with recovery actions
- [ ] **UI-04**: Application shows empty states when no data exists
- [ ] **UI-05**: Application has proper 404 and 500 error pages
- [ ] **UI-06**: Application implements dark mode (stretch goal)
- [ ] **UI-07**: Application has keyboard shortcuts for common actions (stretch goal)

### Portfolio Website

- [ ] **PORT-01**: Portfolio has professional home page with hero section
- [ ] **PORT-02**: Portfolio showcases TeamFlow as featured project
- [ ] **PORT-03**: Portfolio has TeamFlow case study page (problem, solution, architecture, tech decisions)
- [ ] **PORT-04**: Portfolio has About page with bio and stack
- [ ] **PORT-05**: Portfolio has Resume page with download link
- [ ] **PORT-06**: Portfolio has Contact form
- [ ] **PORT-07**: Portfolio is responsive and mobile-friendly
- [ ] **PORT-08**: Portfolio has dark mode matching TeamFlow

### Technical Infrastructure

- [ ] **TECH-01**: Application uses monorepo structure (Turborepo)
- [ ] **TECH-02**: Application shares types between frontend and backend
- [ ] **TECH-03**: Application uses Zod validation on both frontend and backend
- [ ] **TECH-04**: Backend has Swagger API documentation
- [ ] **TECH-05**: Application has health check endpoints
- [ ] **TECH-06**: Database has proper indexes on foreign keys and query columns
- [ ] **TECH-07**: Database uses Row Level Security for multi-tenancy
- [ ] **TECH-08**: WebSocket connections authenticate via JWT
- [ ] **TECH-09**: WebSocket events use Redis pub/sub for horizontal scaling

### Testing & Quality

- [ ] **TEST-01**: Critical paths have integration tests (Vitest)
- [ ] **TEST-02**: Authentication flows have E2E tests (Playwright)
- [ ] **TEST-03**: RBAC enforcement has unit tests
- [ ] **TEST-04**: API endpoints have validation tests
- [ ] **TEST-05**: Database queries are monitored for N+1 issues

### Deployment

- [ ] **DEPLOY-01**: Application runs in Docker containers
- [ ] **DEPLOY-02**: Application deploys to Coolify
- [ ] **DEPLOY-03**: Application uses environment variables for configuration
- [ ] **DEPLOY-04**: Application has CI/CD pipeline
- [ ] **DEPLOY-05**: Portfolio and TeamFlow are deployed with custom domains

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Email Notifications

- **NOTIF-01**: User receives email when assigned to task
- **NOTIF-02**: User receives email when mentioned in comment
- **NOTIF-03**: User receives daily digest of activity
- **NOTIF-04**: User can configure notification preferences

### File Management

- **FILE-01**: User can attach files to tasks
- **FILE-02**: User can upload images to comments
- **FILE-03**: User can preview attachments inline
- **FILE-04**: System stores files in S3-compatible storage

### Advanced Analytics

- **ANALYTICS-01**: User can view team velocity charts
- **ANALYTICS-02**: User can view burndown charts
- **ANALYTICS-03**: User can export reports
- **ANALYTICS-04**: User can view time tracking data

### Advanced Features

- **ADV-01**: User can create custom task fields
- **ADV-02**: User can create task templates
- **ADV-03**: User can set up automation rules
- **ADV-04**: User can integrate with external tools (Slack, GitHub)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile native app | Wrong tech stack for timeline, web-first approach |
| Email invites with tokens | Adds complexity, manual team setup sufficient for demo |
| Real billing/payments | PCI compliance adds no technical demonstration value |
| Gantt charts | Over-engineering for portfolio demo |
| Time tracking | Complex feature, not core to work management demo |
| Calendar integration | External dependency, limited demonstration value |
| Advanced permissions (resource-level) | RBAC role-based is sufficient, avoid over-engineering |
| Multi-workspace switching | Single workspace demo sufficient |
| File uploads | Requires storage infrastructure, security scanning |
| Video calls | Out of scope for work management core features |
| Slack/GitHub integrations | External dependencies, defer to v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| RBAC-01 | Phase 1 | Pending |
| RBAC-02 | Phase 1 | Pending |
| RBAC-03 | Phase 1 | Pending |
| RBAC-04 | Phase 1 | Pending |
| RBAC-05 | Phase 1 | Pending |
| RBAC-06 | Phase 1 | Pending |
| AUDIT-01 | Phase 1 | Pending |
| AUDIT-02 | Phase 1 | Pending |
| AUDIT-03 | Phase 1 | Pending |
| AUDIT-04 | Phase 1 | Pending |
| AUDIT-07 | Phase 1 | Pending |
| TECH-01 | Phase 1 | Pending |
| TECH-02 | Phase 1 | Pending |
| TECH-03 | Phase 1 | Pending |
| TECH-04 | Phase 1 | Pending |
| TECH-05 | Phase 1 | Pending |
| TECH-06 | Phase 1 | Pending |
| TECH-08 | Phase 1 | Pending |
| DEPLOY-01 | Phase 1 | Pending |
| DEPLOY-03 | Phase 1 | Pending |
| TEAM-01 | Phase 2 | Pending |
| TEAM-02 | Phase 2 | Pending |
| TEAM-03 | Phase 2 | Pending |
| TEAM-04 | Phase 2 | Pending |
| TEAM-05 | Phase 2 | Pending |
| PROJ-01 | Phase 2 | Pending |
| PROJ-02 | Phase 2 | Pending |
| PROJ-03 | Phase 2 | Pending |
| PROJ-04 | Phase 2 | Pending |
| PROJ-05 | Phase 2 | Pending |
| TASK-01 | Phase 2 | Pending |
| TASK-02 | Phase 2 | Pending |
| TASK-03 | Phase 2 | Pending |
| TASK-04 | Phase 2 | Pending |
| TASK-05 | Phase 2 | Pending |
| TASK-06 | Phase 2 | Pending |
| TASK-07 | Phase 2 | Pending |
| TASK-08 | Phase 2 | Pending |
| TASK-09 | Phase 2 | Pending |
| VIEW-01 | Phase 2 | Pending |
| VIEW-02 | Phase 2 | Pending |
| VIEW-03 | Phase 2 | Pending |
| VIEW-04 | Phase 2 | Pending |
| VIEW-05 | Phase 2 | Pending |
| VIEW-06 | Phase 2 | Pending |
| AUDIT-05 | Phase 2 | Pending |
| AUDIT-06 | Phase 2 | Pending |
| REAL-01 | Phase 3 | Pending |
| REAL-02 | Phase 3 | Pending |
| REAL-03 | Phase 3 | Pending |
| REAL-04 | Phase 3 | Pending |
| REAL-05 | Phase 3 | Pending |
| REAL-06 | Phase 3 | Pending |
| REAL-07 | Phase 3 | Pending |
| TECH-09 | Phase 3 | Pending |
| PORT-01 | Phase 4 | Pending |
| PORT-02 | Phase 4 | Pending |
| PORT-03 | Phase 4 | Pending |
| PORT-04 | Phase 4 | Pending |
| PORT-05 | Phase 4 | Pending |
| PORT-06 | Phase 4 | Pending |
| PORT-07 | Phase 4 | Pending |
| PORT-08 | Phase 4 | Pending |
| UI-01 | Phase 4 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| UI-05 | Phase 4 | Pending |
| UI-06 | Phase 4 | Pending |
| UI-07 | Phase 4 | Pending |
| TECH-07 | Phase 4 | Pending |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |
| TEST-03 | Phase 4 | Pending |
| TEST-04 | Phase 4 | Pending |
| TEST-05 | Phase 4 | Pending |
| DEPLOY-02 | Phase 4 | Pending |
| DEPLOY-04 | Phase 4 | Pending |
| DEPLOY-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 67 total
- Mapped to phases: 67/67 (100%)
- Unmapped: 0

**Phase Distribution:**
- Phase 1 (Foundation & Authentication): 26 requirements
- Phase 2 (Core Work Management): 27 requirements
- Phase 3 (Real-Time Collaboration): 8 requirements
- Phase 4 (Portfolio & Polish): 23 requirements

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after roadmap creation*
