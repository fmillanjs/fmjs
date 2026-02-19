# Requirements: Fernando Millan Portfolio & DevCollab

**Defined:** 2026-02-19
**Core Value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

## v3.0 Requirements

Requirements for the v3.0 Deployment & Tech Debt Closure milestone. Each maps to roadmap phases.

### Deployment

- [ ] **DEPLOY-01**: DevCollab web and API are accessible at HTTPS custom domains with valid TLS certificates
- [ ] **DEPLOY-02**: TeamFlow web and API are accessible at HTTPS custom domains with valid TLS certificates
- [ ] **DEPLOY-03**: `NEXT_PUBLIC_API_URL` is baked into devcollab-web Docker image at build time via GitHub Actions `--build-arg`
- [ ] **DEPLOY-04**: NestJS CORS is configured with production domain so browser API calls succeed in production
- [ ] **DEPLOY-05**: GitHub Actions CI/CD auto-deploys to Coolify on push to main (separate webhooks for TeamFlow and DevCollab stacks)
- [ ] **DEPLOY-06**: Coolify server can pull private GHCR images (docker login configured as root on VPS)

### Fixes

- [ ] **FIX-01**: Prisma import in `reactions.service.ts` uses the correct devcollab client path (not TeamFlow's `@prisma/client`)
- [ ] **FIX-02**: Real resume PDF is served at `/resume.pdf` on the portfolio site

### DevCollab UI

- [ ] **UI-01**: Unauthenticated users visiting `/dashboard` are redirected server-side to `/login`
- [ ] **UI-02**: Workspace members page at `/w/[slug]/members` shows a list of all workspace members with their roles
- [ ] **UI-03**: Admin can change a member's role (promote/demote) via an inline role selector on the members page
- [ ] **UI-04**: Admin can remove a member from the workspace via a Remove button on the members page
- [ ] **UI-05**: Admin can generate an invite link via a button on the members page and see the full shareable URL
- [ ] **UI-06**: Workspace navigation includes a Members link so the members page is discoverable without URL-guessing

## Future Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### DevCollab Enhancements

- **NOTIF-01**: Copy-to-clipboard button on invite link URL
- **NOTIF-02**: Invite link expiry timestamp displayed next to URL
- **UI-07**: Real-time member list updates (WebSocket — requires devcollab-api WebSocket channel)
- **UI-08**: Multi-use invite links (requires API + schema changes)
- **UI-09**: Email invite delivery (requires Resend/SendGrid integration)

### Performance

- **PERF-01**: Server-side fetches use Docker internal hostname (`DEVCOLLAB_API_INTERNAL_URL`) to skip Traefik round-trip

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Shadcn UI in devcollab-web | No Shadcn/Tailwind/Radix in devcollab-web — separate redesign milestone; admin-only flows not recruiter-visible |
| Email invite delivery | SMTP + deliverability overhead not worth it for portfolio demo |
| Multi-use invite links | Requires API + schema changes; single-use is sufficient for demo |
| Real-time member list | WebSocket channel adds complexity; polling sufficient for admin-only view |
| Phase 3 server-fetch optimization | Skip unless page load performance measurably slow after Phase 2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPLOY-01 | Phase 27 | Pending |
| DEPLOY-02 | Phase 27 | Pending |
| DEPLOY-03 | Phase 27 | Pending |
| DEPLOY-04 | Phase 27 | Pending |
| DEPLOY-05 | Phase 27 | Pending |
| DEPLOY-06 | Phase 27 | Pending |
| FIX-01 | Phase 27 | Pending |
| FIX-02 | Phase 28 | Pending |
| UI-01 | Phase 28 | Pending |
| UI-02 | Phase 28 | Pending |
| UI-03 | Phase 28 | Pending |
| UI-04 | Phase 28 | Pending |
| UI-05 | Phase 28 | Pending |
| UI-06 | Phase 28 | Pending |

**Coverage:**
- v3.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after initial definition*
