# CLAUDE.md - Project Memory & Context

> This file helps Claude understand the project structure, deployment process, and key decisions.

## Project Overview

**What**: Transparency website for building in public (inspired by Marc Lou)
**Stack**: Next.js 15 + PostgreSQL + Drizzle ORM + Tailwind CSS
**Deployment**: Coolify (auto-deploy from GitHub)
**Domain**: https://fernandomillan.me
**Repo**: https://github.com/fmillanjs/fmjs

## Design Philosophy

- **Marc Lou's structure**: Clean card-based layout, good hierarchy, startup vibe
- **Brutal truth aesthetic**: Bold, honest, direct, no-BS design language
- **Font**: Rubik (clean, modern)
- **Colors**: Black & white primary, minimal colors for status/revenue
- **Updates**: 4 times daily (6am, 11am, 2pm, 6pm) - raw, unfiltered progress

## Architecture

### Tech Stack
- Next.js 15.5.4 (App Router)
- TypeScript
- Tailwind CSS v3.4.18 (downgraded from v4 due to PostCSS issues)
- PostgreSQL (via Coolify)
- Drizzle ORM v0.44.6
- Docker deployment

### Key Files
```
app/
  page.tsx              # Main page (Server Component)
  layout.tsx            # Root layout with Rubik font
  globals.css           # Tailwind + custom scrollbar
  admin/                # Admin panel (password protected)
    login/page.tsx      # Admin login
    page.tsx            # Admin dashboard
    updates/page.tsx    # Manage updates
    projects/page.tsx   # Manage projects
    subscribers/page.tsx # Manage newsletter subscribers
  unsubscribe/page.tsx  # Newsletter unsubscribe page
  api/
    auth/               # Admin authentication
      login/route.ts    # Login endpoint
      logout/route.ts   # Logout endpoint
      check/route.ts    # Auth check endpoint
    updates/route.ts    # CRUD for daily updates
    projects/route.ts   # CRUD for projects
    newsletter/route.ts # Newsletter CRUD (subscribe/unsubscribe)
    twitter/
      post-update/route.ts  # Post updates to Twitter
      post-project/route.ts # Post project launches to Twitter
    webhooks/
      new-update/route.ts # Legacy webhook (not used)
    cron/
      weekly-digest/route.ts # Weekly newsletter cron job

components/
  Hero.tsx             # Profile header
  Stats.tsx            # 3-column stats
  Projects.tsx         # Project cards grid
  Updates.tsx          # Daily update timeline
  Newsletter.tsx       # Email signup (client component)
  Footer.tsx           # Footer
  AdminNav.tsx         # Admin panel navigation

lib/
  db/
    schema.ts          # Database schema (updates, projects, profile, subscribers)
    index.ts           # DB connection
    seed.ts            # Seed initial profile
  twitter/
    client.ts          # Twitter API v2 client (using twitter-api-v2)
    format.ts          # Tweet formatting utilities
  auth.ts              # Admin authentication helpers
  resend.ts            # Resend email client
  email-templates/
    weekly-digest.tsx  # Weekly newsletter email template

scripts/
  add-update.ts        # CLI to add updates
  add-project.ts       # CLI to add projects

Dockerfile            # Multi-stage build
entrypoint.sh         # Auto-runs migrations on startup
vercel.json           # Vercel cron configuration
N8N_SETUP.md          # Complete n8n + Twitter setup guide
```

## Database Schema

### `profile` table
- id, name, location, tagline, profileImage
- twitterUrl, githubUrl, startDate
- Single row with user's profile info

### `updates` table
- id, time (e.g., "6:00 AM"), content, date
- createdAt (timestamp)
- Daily transparency updates

### `projects` table
- id, name, logo (emoji), description, link
- revenue (e.g., "$100/mo"), status (building/live/paused)
- daysToComplete, createdAt, completedAt

### `subscribers` table
- id, email (unique), subscribedAt, isActive
- Newsletter subscribers (soft delete via isActive flag)

## Deployment Process

### Automatic Deployment (Current Setup)
1. Push to GitHub `main` branch
2. Coolify auto-detects changes
3. Builds Docker image
4. **Entrypoint script automatically**:
   - Waits for database
   - Runs `drizzle-kit push` (migrations)
   - Runs seed script (if needed)
   - Starts Next.js app
5. Site live at fernandomillan.me

### Manual Database Operations

**Add an update:**
```bash
# Via Coolify terminal
npx tsx scripts/add-update.ts "6:00 AM" "Your update content here"

# Via API
curl -X POST https://fernandomillan.me/api/updates \
  -H "Content-Type: application/json" \
  -d '{"time":"6:00 AM","content":"Update text","date":"Oct 12, 2025"}'
```

**Add a project:**
```bash
# Via Coolify terminal
npx tsx scripts/add-project.ts "Project Name" "🚀" "Description" "https://url.com" "$100/mo" "live"

# Via API
curl -X POST https://fernandomillan.me/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"My App","logo":"🚀","description":"Cool app","link":"https://myapp.com","revenue":"$100/mo","status":"live"}'
```

**Database migrations:**
```bash
# Migrations run automatically on deployment via entrypoint.sh
# Manual if needed:
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio
```

## Important Environment Variables

**Required in Coolify:**
```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/transparency_db

# Public Profile Info
NEXT_PUBLIC_NAME=Fernando Millan
NEXT_PUBLIC_LOCATION=San Diego
NEXT_PUBLIC_TWITTER_URL=https://x.com/fmillanjs
NEXT_PUBLIC_GITHUB_URL=https://github.com/fmillanjs
NEXT_PUBLIC_START_DATE=2025-10-12
NEXT_PUBLIC_SITE_URL=https://fernandomillan.me

# Admin Panel Authentication
ADMIN_PASSWORD=your-secure-password-here

# Resend (Newsletter)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=updates@fernandomillan.me

# Twitter API v2 (Auto-posting)
TWITTER_API_KEY=xxxxxxxxxxxxx
TWITTER_API_SECRET=xxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN=xxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN_SECRET=xxxxxxxxxxxxx

# Cron Security (optional)
CRON_SECRET=your-random-secret-here
```

## Known Issues & Solutions

### Issue: Tailwind CSS v4 breaks build
**Solution**: Use Tailwind v3.4.18 (already set in package.json)
```bash
npm install -D tailwindcss@^3.4.18
```

### Issue: Next.js standalone missing dependencies
**Solution**: Copy full node_modules in Dockerfile (already done)
```dockerfile
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
```

### Issue: npx not working in production
**Solution**: Use direct node paths in entrypoint.sh (already done)
```bash
node /app/node_modules/drizzle-kit/bin.cjs push
node /app/node_modules/tsx/dist/cli.mjs /app/lib/db/seed.ts
```

### Issue: "relation does not exist" errors
**Solution**: Run migrations before starting app (handled by entrypoint.sh)

### Issue: Empty public directory breaks Docker build
**Solution**: Added `.gitkeep` file in public directory

## Development Workflow

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Set up local database
docker-compose up -d db

# 3. Push schema and seed
npm run db:push
npx tsx lib/db/seed.ts

# 4. Run dev server
npm run dev
```

### Making Changes

**Update schema:**
1. Edit `lib/db/schema.ts`
2. Push to GitHub (migrations run automatically)
3. Or run `npm run db:push` locally first

**Update design:**
1. Edit components in `components/`
2. Edit globals.css for global styles
3. Push to GitHub (auto-deploys)

**Add new API route:**
1. Create `app/api/[route]/route.ts`
2. Export GET/POST/etc handlers
3. Push to GitHub

## Design Tokens

### Colors
- **Primary**: Black (#000000)
- **Background**: White (#FFFFFF)
- **Text**: Gray-600 (#6B7280)
- **Success**: Green-600 (#10B981)
- **Warning**: Yellow-600 (#FBBF24)
- **Error**: Red-600 (#DC2626)

### Typography
- **Font**: Rubik (400, 500, 600, 700)
- **Headings**: Bold, tight spacing
- **Body**: Regular, relaxed leading

### Spacing
- Compact header (py-12)
- Section spacing (py-12)
- Card padding (p-4 to p-5)
- Smaller gaps (gap-3, gap-4)

## Common Tasks

### Add Your Daily 4 Updates

**Via Admin Panel (Recommended):**
1. Go to https://fernandomillan.me/admin
2. Login with your admin password
3. Navigate to "Updates"
4. Fill out the form and submit
5. **Automatically posts to Twitter** (if Twitter API is configured)

**Via CLI:**
```bash
# 6am update
npx tsx scripts/add-update.ts "6:00 AM" "Morning update"

# 11am update
npx tsx scripts/add-update.ts "11:00 AM" "Mid-morning progress"

# 2pm update
npx tsx scripts/add-update.ts "2:00 PM" "Afternoon check-in"

# 6pm update
npx tsx scripts/add-update.ts "6:00 PM" "End of day wrap-up"
```

### Ship a New Project

**Via Admin Panel (Recommended):**
1. Go to https://fernandomillan.me/admin
2. Navigate to "Projects"
3. Fill out the project form and submit
4. **Automatically posts to Twitter** (if status is "live" and Twitter API is configured)

**Via CLI:**
```bash
npx tsx scripts/add-project.ts \
  "Project Name" \
  "🚀" \
  "What it does in one sentence" \
  "https://project-url.com" \
  "$0/mo" \
  "live"
```

### Manage Newsletter Subscribers
1. Go to https://fernandomillan.me/admin
2. Navigate to "Subscribers"
3. View all subscribers, export emails, track stats

### Send Weekly Newsletter
**Automatic (Recommended):**
- Configured in `vercel.json` to run every Monday at 9 AM UTC
- No action needed

**Manual Trigger:**
```bash
curl -X GET https://fernandomillan.me/api/cron/weekly-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Update Your Profile
1. Go to Coolify → Application → Environment Variables
2. Update `NEXT_PUBLIC_NAME`, `NEXT_PUBLIC_LOCATION`, etc.
3. Redeploy

## Useful Commands

```bash
# Check deployment logs
# In Coolify: Application → Logs

# Access container terminal
# In Coolify: Application → Terminal

# Rebuild and redeploy
git push origin main

# Check database in Drizzle Studio
npm run db:studio
```

## Contact & Social

- **Twitter/X**: https://x.com/fmillanjs
- **GitHub**: https://github.com/fmillanjs
- **Website**: https://fernandomillan.me

## New Features

### ✅ Admin Panel
- Password-protected admin interface at `/admin`
- Manage updates, projects, and subscribers
- Dashboard with quick stats
- No need for CLI or Coolify terminal anymore

### ✅ Newsletter System
- Email collection via homepage
- Weekly digest sent automatically (every Monday)
- Powered by Resend
- Unsubscribe functionality included

### ✅ Twitter Automation (Direct API)
- Auto-post daily updates to Twitter (4x/day: 6am, 11am, 2pm, 6pm)
- Auto-post project launches when status is "live"
- Direct Twitter API v2 integration (no external services needed)
- Graceful fallback if Twitter not configured
- Format: `6:00 AM - [content] #BuildInPublic #IndieHackers`

## Future Improvements

- [✅] ~~Add authentication for admin panel~~ **DONE**
- [✅] ~~Add Twitter auto-posting~~ **DONE**
- [✅] ~~Add newsletter functionality~~ **DONE**
- [ ] Add image upload for projects
- [ ] Add analytics tracking
- [ ] Add RSS feed for updates
- [ ] Add revenue chart/graph
- [ ] Optimize Docker image size
- [ ] Add caching layer (Redis)
- [ ] Add email notifications for new subscribers

---

**Last Updated**: Oct 12, 2025
**Status**: ✅ Deployed and running on Coolify
**New**: Admin Panel + Newsletter + Twitter Automation
