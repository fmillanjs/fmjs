# Phase 46: Demo Seed + Portfolio Integration — Verification

## Phase Goal

The deployed app has varied pre-seeded leads ready for recruiters, SSE streaming works through Coolify Nginx, and the portfolio presents AI SDR as a third project with case study and live demo link.

## Success Criteria Verification

### DEMO-01: App pre-seeded with 6-8 fictional leads covering full ICP score spectrum (20-95)

```bash
# Verify in local Postgres (development)
DATABASE_URL=postgresql://aisdr:aisdr@localhost:5436/aisdr npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.lead.findMany({ include: { aiOutputs: true } }).then(leads => {
  console.log('Total leads:', leads.length);
  const scores = leads.map(l => l.icpScore).filter(Boolean).sort((a, b) => a - b);
  console.log('Scores:', scores);
  console.log('Min score:', Math.min(...scores), 'Max score:', Math.max(...scores));
  leads.forEach(l => console.log(l.companyName, 'industry:', l.industry, 'score:', l.icpScore, 'status:', l.status));
}).finally(() => p.\$disconnect());
"
# Expected:
# - Total leads: 8
# - Scores span 22 (min) to 92 (max) — full 20-95 spectrum satisfied
# - All leads have status: complete
```

Manual check in app:
- Login at /login → confirm 8 leads visible on /leads without submitting any new leads
- Score bars visible and color-coded (green 70+, amber 40-69, red below 40)

### DEMO-02: Seeded leads span different industries with realistic enrichment and personalized emails

```bash
# Verify industry diversity (all 8 must be distinct)
DATABASE_URL=postgresql://aisdr:aisdr@localhost:5436/aisdr npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.lead.findMany({ select: { companyName: true, industry: true } }).then(leads => {
  const industries = new Set(leads.map(l => l.industry));
  console.log('Unique industries:', industries.size, [...industries]);
}).finally(() => p.\$disconnect());
"
# Expected: 8 unique industry strings
```

Manual check:
- Open /leads/:id for any seeded lead
- Enrichment card shows company-specific tech stack badges (not generic)
- Email preview references company name and specific pain points (not "Dear [Company]")

### PORT-01: Portfolio home page includes AI SDR as a third project card

```bash
grep -c "AI SDR" /home/doctor/fernandomillan/apps/web/app/(portfolio)/page.tsx
# Expected: at least 1 (AI SDR card text)

grep "lg:grid-cols-3" /home/doctor/fernandomillan/apps/web/app/(portfolio)/page.tsx
# Expected: match found (3-column grid on desktop)
```

Manual: Visit / — confirm 3 project cards visible on desktop.

### PORT-02: Case study page at /projects/ai-sdr with tech stack, architecture decisions, and screenshots

```bash
ls /home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/ai-sdr/page.tsx
# Expected: file exists

ls /home/doctor/fernandomillan/apps/web/public/screenshots/ai-sdr-*.png
# Expected: 4 files (leads, pipeline, score, email)

grep "AI_SDR_WALKTHROUGH_SCREENSHOTS" /home/doctor/fernandomillan/apps/web/src/data/walkthrough-data.ts
# Expected: export const AI_SDR_WALKTHROUGH_SCREENSHOTS
```

Manual: Visit /projects/ai-sdr — confirm tech stack badges, Key Technical Decisions table (6 rows), Challenges section (3 entries), 4 walkthrough screenshots render.

### PORT-03: Portfolio project card links to the deployed live demo

```bash
grep "ai-sdr.fernandomillan.me" /home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/ai-sdr/page.tsx
# Expected: match found (live demo URL in View Live Demo button)
```

Manual: Click "View Live Demo" on /projects/ai-sdr — confirms navigation to https://ai-sdr.fernandomillan.me/login.

## Build Check

```bash
cd /home/doctor/fernandomillan/apps/web && npm run build
# Expected: Build successful, 0 TypeScript errors
```

## No Purple Check

```bash
grep -rn "purple" /home/doctor/fernandomillan/apps/web/app/(portfolio)/projects/ai-sdr/ 2>/dev/null
# Expected: 0 matches (no purple anywhere)
```

## SSE Production Verification

```bash
# After deployment to Coolify
curl -v https://ai-sdr-api.fernandomillan.me/leads/{leadId}/stream 2>&1 | grep -i "x-accel"
# Expected: < x-accel-buffering: no
```

## Phase Complete Checklist

- [ ] 46-01: Seed script created and runs idempotently — 8 leads in Postgres
- [ ] 46-02: Docker images built, Coolify deployment live, SSE streaming verified
- [ ] 46-03: Portfolio home page (3 cards), /projects/ai-sdr case study, PORT-03 live demo link
- [ ] All 5 requirements covered: DEMO-01, DEMO-02, PORT-01, PORT-02, PORT-03
- [ ] No purple colors anywhere (REQUIREMENTS.md global constraint)
