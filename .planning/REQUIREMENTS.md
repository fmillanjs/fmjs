# Requirements: Fernando Millan Portfolio & DevCollab

**Defined:** 2026-02-25
**Milestone:** v4.0 Live QA & Content Polish
**Core Value:** Prove senior full-stack engineering skills through deployed, production-ready SaaS applications that recruiters can actually use and interact with.

## v4.0 Requirements

### Authentication & Live Fixes

- [x] **LIVE-01**: User can log into DevCollab at `devcollab.fernandomillan.me` using seeded demo credentials
- [x] **LIVE-02**: User can log into TeamFlow at `teamflow.fernandomillan.me` using seeded demo credentials
- [ ] **LIVE-03**: DevCollab demo workspace loads with all seeded content (snippets, posts, members) after login
- [ ] **LIVE-04**: TeamFlow demo project loads with tasks, columns, and real-time features functional after login

### QA Audit

- [ ] **QA-01**: All critical DevCollab recruiter flows complete without errors (login → workspace → view/search content → notifications)
- [ ] **QA-02**: All critical TeamFlow recruiter flows complete without errors (login → project → task management → real-time presence)
- [x] **QA-03**: All portfolio links on `fernandomillan.me` resolve correctly (nav, project cards, case study CTAs, footer)
- [ ] **QA-04**: Portfolio Lighthouse scores remain ≥ 0.90 on all 5 public URLs after any fixes applied

### Portfolio Content

- [ ] **CONT-01**: DevCollab case study copy is accurate and compelling — describes actual features, architecture decisions, and technical depth
- [ ] **CONT-02**: TeamFlow case study copy is accurate and compelling — describes actual features, real-time architecture, and RBAC
- [ ] **CONT-03**: Tech stack badges and metrics on both case studies reflect the actual shipped stack and real numbers
- [ ] **CONT-04**: Screenshots from live apps are captured and displayed in both case studies and project cards

## Future Requirements

### Performance & Monitoring

- **PERF-01**: Error monitoring (Sentry or equivalent) on live apps
- **PERF-02**: Uptime monitoring with alerts

### Portfolio Enhancements

- **PORT-01**: Blog / writing section
- **PORT-02**: Hire me / availability status indicator

## Out of Scope

| Feature | Reason |
|---------|--------|
| New application features | v4.0 is QA + polish only; new features belong in v5.0 |
| OAuth login for live demos | Email/password + seeded credentials sufficient for portfolio |
| Video walkthroughs | Screenshot-based case studies are sufficient |
| Mobile app | Web-first throughout all milestones |
| Email notifications | Out of scope for all milestones |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LIVE-01 | Phase 34 | Complete |
| LIVE-02 | Phase 34 | Complete |
| LIVE-03 | Phase 34 | Pending |
| LIVE-04 | Phase 34 | Pending |
| QA-01 | Phase 35 | Pending |
| QA-02 | Phase 35 | Pending |
| QA-03 | Phase 35 | Complete |
| QA-04 | Phase 35 | Pending |
| CONT-01 | Phase 36 | Pending |
| CONT-02 | Phase 36 | Pending |
| CONT-03 | Phase 36 | Pending |
| CONT-04 | Phase 36 | Pending |

**Coverage:**
- v4.0 requirements: 12 total
- Mapped to phases: 12 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 — traceability mapped after v4.0 roadmap creation (phases 34-36)*
