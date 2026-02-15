# TeamFlow v1.0 - Professional Portfolio & Work Management SaaS

A production-ready work management platform built to demonstrate senior full-stack engineering capabilities. TeamFlow combines secure authentication, role-based access control, comprehensive task management, and a polished portfolio website.

**🚀 Live Demo:** [teamflow.fernandomillan.dev](https://teamflow.fernandomillan.dev) (coming soon)
**👤 Demo Login:** `demo1@teamflow.dev` / `Password123`
**📊 Status:** v1.0 Production Ready (88% complete) | v1.1 In Development

---

## What's in v1.0

### ✅ Authentication & Authorization
- **JWT Authentication** with NextAuth v5
- **Session Management** with Redis storage (30-day expiry)
- **Password Reset** via email verification tokens
- **Profile Management** with password change
- **Role-Based Access Control** (RBAC)
  - Admin: Manage all teams, members, projects
  - Manager: Create and manage projects, assign tasks
  - Member: View projects, update assigned tasks
- **Multi-Layer Authorization** enforced at controller, service, and database layers

### ✅ Team & Project Management
- **Team/Organization CRUD** with membership management
- **Project Management** with active/archived status
- **Member Invitations** with role assignment
- **Team Settings** and member list views
- **Demo Workspace** pre-seeded with 10 users, 3 projects, 50+ tasks

### ✅ Task Management
- **Kanban Board** with drag-and-drop task organization
- **List View** with sortable columns (TanStack Table)
- **Advanced Filtering** by status, priority, assignee, labels
- **Search** across task titles and descriptions
- **Comment Threads** on tasks with edit/delete
- **Task History** timeline showing all changes
- **Labels/Tags** for task categorization
- **Due Dates** and priority levels (Low, Medium, High, Urgent)

### ✅ Activity & Audit
- **Activity Feed** with infinite scroll pagination
- **Audit Log** (Admin-only) with search and filters
- **Event Tracking:** Auth events, task mutations, RBAC changes, authorization failures
- **Detailed Logging:** User context, IP address, user agent, timestamps

### ✅ User Experience
- **Responsive Design** mobile-first, works on all screen sizes
- **Dark Mode** with system preference detection
- **Loading States** with skeleton components
- **Error Boundaries** with retry/reset actions
- **Empty States** with helpful prompts
- **404/500 Pages** with navigation options
- **Command Palette** (Ctrl+K) for quick navigation
- **Keyboard Shortcuts** for common actions

### ✅ Portfolio Website
- **Professional Home Page** with hero section and featured project
- **About Page** with bio and tech stack
- **TeamFlow Case Study** with architecture, decisions, and challenges
- **Resume Page** with inline content and download link
- **Contact Form** with validation

### ✅ Technical Infrastructure
- **Monorepo Architecture** (Turborepo) with shared packages
- **Shared Types** between frontend and backend (type-safe)
- **Zod Validation** on both client and server
- **Docker Containerization** for development (Postgres, Redis)
- **CI/CD Pipeline** (GitHub Actions) with Docker image builds
- **API Documentation** (Swagger/OpenAPI) at `/api/docs`
- **Health Checks** for Prisma and Redis
- **Database Indexes** on foreign keys and query columns
- **Unit Tests** for RBAC, validation, and UI components

---

## What's Coming in v1.1

### → Real-Time Collaboration (In Development)
All real-time features are **fully implemented in the codebase** but currently blocked by authentication integration issues between Next.js 15 and NestJS. v1.1 will resolve these architectural compatibility challenges.

- **WebSocket Updates:** Live task creation, updates, moves, and deletions
- **Live Presence:** See who's viewing each project in real-time
- **Optimistic UI:** Instant feedback with automatic rollback on errors
- **Conflict Detection:** Version-based concurrency control for simultaneous edits
- **Real-Time Comments:** Live comment updates without page refresh
- **Redis Pub/Sub:** Horizontal scaling for WebSocket broadcasts

**Technical Status:**
- ✅ Backend event emission (EventEmitter2 → TaskListener → WebSocket broadcast)
- ✅ Frontend hooks (useRealTimeTasks, useRealTimeComments, useProjectPresence)
- ✅ WebSocket gateway with project rooms
- ✅ Conflict detection with version field
- ❌ WebSocket authentication (JWT token format mismatch)
- ❌ SSR session access (Next.js 15 + NextAuth v5 compatibility)

See `.planning/phases/03-real-time-collaboration/.continue-here.md` for detailed status.

---

## Tech Stack

### Frontend
- **Next.js 15** - App Router, Server Components, Server Actions
- **React 19** - Modern hooks including useOptimistic
- **NextAuth v5** - Authentication and session management
- **TanStack Query** - Server state caching
- **React Hook Form** - Type-safe form handling
- **Zod** - Schema validation
- **Tailwind CSS v4** - Utility-first styling
- **@dnd-kit** - Drag-and-drop functionality
- **Socket.io Client** - WebSocket connections (v1.1)

### Backend
- **NestJS 11** - Modular backend architecture
- **Passport JWT** - Authentication strategy
- **CASL** - Declarative, type-safe RBAC
- **Socket.io** - WebSocket server (v1.1)
- **EventEmitter2** - Domain events
- **Swagger/OpenAPI** - API documentation

### Database & Cache
- **PostgreSQL** - Primary database
- **Prisma ORM** - Type-safe database client
- **Redis** - Session storage and pub/sub (v1.1)

### DevOps
- **Turborepo** - Monorepo build system
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **Coolify** - Self-hosted deployment (in setup)

---

## Project Structure

```
fernandomillan/
├── apps/
│   ├── web/              # Next.js frontend (port 3000)
│   │   ├── app/
│   │   │   ├── (auth)/   # Login, signup, password reset
│   │   │   ├── (dashboard)/  # Protected routes
│   │   │   └── (portfolio)/  # Public portfolio pages
│   │   ├── components/
│   │   ├── lib/          # API client, auth config
│   │   └── hooks/        # Custom React hooks
│   └── api/              # NestJS backend (port 3001)
│       ├── src/
│       │   ├── modules/  # Auth, Teams, Projects, Tasks, Events
│       │   ├── core/     # RBAC, Audit
│       │   └── common/   # Guards, Decorators
│       └── test/         # Unit and integration tests
├── packages/
│   ├── database/         # Prisma schema and migrations
│   └── shared/           # Shared TypeScript types and Zod schemas
└── .planning/            # Project documentation and roadmap
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/fernandomillan/teamflow.git
   cd fernandomillan
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Docker containers**
   ```bash
   docker-compose up -d
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   ```

   Update the following in all .env files:
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5434/teamflow`
   - `REDIS_URL=redis://localhost:6380`
   - `JWT_SECRET=dev-secret-change-in-production-min-32-chars-required-for-jwt`
   - `NEXTAUTH_SECRET=dev-secret-change-in-production-min-32-chars-required-for-jwt`

5. **Run database migrations**
   ```bash
   cd packages/database
   npx prisma migrate dev
   ```

6. **Seed demo data**
   ```bash
   npm run db:seed
   ```

7. **Start development servers**
   ```bash
   # Terminal 1: API server
   cd apps/api
   npm run start:dev

   # Terminal 2: Web server
   cd apps/web
   npm run dev
   ```

8. **Open the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs
   - Login: `demo1@teamflow.dev` / `Password123`

---

## Testing

### Run Unit Tests
```bash
# Web (Vitest)
cd apps/web
npm run test

# API (Jest)
cd apps/api
npm run test
```

### Run E2E Tests (Playwright)
```bash
cd apps/web
npx playwright test
```

---

## Deployment

### Build Docker Images
```bash
# Build web image
docker build -f apps/web/Dockerfile -t teamflow-web .

# Build API image
docker build -f apps/api/Dockerfile -t teamflow-api .
```

### Deploy to Coolify
See deployment documentation in `.planning/DEPLOYMENT.md` (coming soon).

---

## API Documentation

Interactive API documentation available at http://localhost:3001/api/docs when running the API server.

Key endpoints:
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/signup` - Create new account
- `GET /api/teams` - List user's teams
- `POST /api/teams` - Create team (Admin only)
- `GET /api/projects/:id/tasks` - List project tasks
- `POST /api/projects/:id/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `GET /api/teams/:id/audit-log` - View audit log (Admin only)

---

## Architecture Decisions

### Monorepo with Shared Types
- **Why:** Prevents API contract drift between frontend and backend
- **How:** `@repo/shared` package with TypeScript types and Zod schemas
- **Benefit:** Compiler catches breaking changes across entire monorepo

### Separate Next.js + NestJS
- **Why:** Demonstrates backend architecture skills beyond Next.js API routes
- **How:** NestJS provides dependency injection, modular structure, enterprise patterns
- **Benefit:** Showcases deeper backend expertise for senior-level roles

### Multi-Layer RBAC with CASL
- **Why:** Centralized, auditable permissions prevent security bugs
- **How:** CASL AbilityFactory defines all rules, guards enforce at controller layer
- **Benefit:** Type-safe, declarative authorization that integrates with Prisma

### Event-Driven Audit Logging
- **Why:** Decouples audit logic from business logic
- **How:** EventEmitter2 emits domain events, AuditListener persists to database
- **Benefit:** Non-blocking audit logging with automatic failure isolation

---

## Known Limitations (v1.0)

1. **Real-Time Features Unavailable**
   - WebSocket connections blocked by authentication compatibility issues
   - All real-time code is implemented but not functional
   - v1.1 will resolve Next.js 15 + NestJS authentication integration

2. **E2E Test Coverage Incomplete**
   - Unit tests exist for RBAC, validation, and components
   - Playwright tests for portfolio navigation exist
   - Authentication flow E2E tests not yet implemented
   - Integration tests for task management missing

3. **Deployment Manual Setup**
   - CI/CD pipeline builds and pushes Docker images
   - Coolify webhook URL requires manual configuration
   - Custom domain setup not automated

4. **Email Features Stubbed**
   - Password reset emails log to console
   - Contact form submissions log to console
   - Production SMTP integration deferred

5. **Single-Instance WebSocket**
   - Redis pub/sub adapter disabled (commented out)
   - WebSocket broadcasts work only on single server instance
   - Horizontal scaling requires re-enabling Redis adapter

---

## Development Roadmap

### v1.0 (Current - Production Ready)
- ✅ Authentication and authorization
- ✅ Team and project management
- ✅ Complete task management with Kanban and list views
- ✅ Activity feed and audit logging
- ✅ Portfolio website
- ✅ CI/CD pipeline
- ⚠️ Real-time features (code complete, blocked by auth)

### v1.1 (In Development)
- 🔄 Fix WebSocket authentication (Next.js 15 + NestJS compatibility)
- 🔄 Fix SSR session access for dashboard
- 🔄 Activate real-time collaboration features
- 🔄 Implement authentication E2E tests
- 🔄 Add E2E tests to CI/CD pipeline
- 🔄 Complete Coolify deployment configuration

### v2.0 (Future)
- Email notifications (task assignments, mentions, daily digest)
- File attachments on tasks
- Advanced analytics (velocity charts, burndown, reports)
- Custom task fields and templates
- Automation rules
- External integrations (Slack, GitHub)

---

## Contributing

This is a portfolio project built for job hunting. While it's not actively seeking contributions, feedback and suggestions are welcome via GitHub issues.

---

## License

MIT License - see LICENSE file for details.

---

## Contact

**Fernando Millan**
Portfolio: [fernandomillan.dev](https://fernandomillan.dev) (coming soon)
GitHub: [@fernandomillan](https://github.com/fernandomillan)
Email: contact@fernandomillan.dev

---

## Acknowledgments

Built with modern tools and frameworks:
- Next.js team for App Router and Server Components
- NestJS team for enterprise backend patterns
- Prisma team for type-safe ORM
- Vercel team for exceptional DX
- Socket.io team for real-time communication
- CASL team for declarative authorization

**Built to showcase senior full-stack engineering skills for job opportunities.**
