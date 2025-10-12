# Deployment Guide

Complete guide for deploying your transparency website with all new features.

## What's New

You now have:
1. **Admin Panel** - Manage everything via web UI
2. **Newsletter System** - Weekly digests via Resend
3. **Twitter Automation** - Auto-post via n8n

---

## Step 1: Update Dependencies

```bash
npm install
```

This installs the new `resend` package.

---

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Add admin panel, newsletter, and Twitter automation"
git push origin main
```

Coolify will automatically detect changes and deploy.

---

## Step 3: Set Environment Variables in Coolify

1. Go to **Coolify** → Your Application → **Environment Variables**
2. Add these new variables:

```env
# Admin Panel (REQUIRED)
ADMIN_PASSWORD=choose-a-secure-password-here

# Newsletter (REQUIRED for newsletter feature)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=updates@fernandomillan.me

# Site URL (REQUIRED)
NEXT_PUBLIC_SITE_URL=https://fernandomillan.me

# Cron Security (OPTIONAL - for manual cron triggers)
CRON_SECRET=random-secret-string-here
```

### How to Get Resend API Key:

1. Go to [resend.com](https://resend.com)
2. Sign up (free tier: 3,000 emails/month)
3. Verify your domain (or use their sandbox for testing)
4. Go to **API Keys** → **Create API Key**
5. Copy the key (starts with `re_`)

3. Click **Save**
4. Redeploy the application

---

## Step 4: Database Migration

The database will automatically migrate when you deploy (via `entrypoint.sh`).

New table added:
- `subscribers` - Stores newsletter subscribers

---

## Step 5: Access Your Admin Panel

1. Go to: `https://fernandomillan.me/admin/login`
2. Enter your `ADMIN_PASSWORD`
3. You're in!

### Admin Panel Features:

- **Dashboard**: View stats (updates, projects, subscribers)
- **Updates**: Add/delete updates (auto-posts to Twitter if n8n is set up)
- **Projects**: Add/delete projects with emoji logos
- **Subscribers**: View and export newsletter subscribers

---

## Step 6: Set Up n8n for Twitter (Optional)

If you want automatic Twitter posting, follow the complete guide:

**See: `N8N_SETUP.md`**

Quick overview:
1. Deploy n8n in Coolify
2. Get Twitter API credentials
3. Create webhook workflow in n8n
4. Add `N8N_WEBHOOK_URL` to environment variables

---

## Step 7: Configure Weekly Newsletter (Optional)

### Option A: Vercel Cron (Recommended)

If you're using Vercel instead of Coolify:

1. The `vercel.json` file is already configured
2. Deploy to Vercel
3. Cron runs automatically every Monday at 9 AM UTC

### Option B: External Cron Service

Use any cron service (cron-job.org, EasyCron, etc.):

**URL to hit:**
```
GET https://fernandomillan.me/api/cron/weekly-digest
Authorization: Bearer YOUR_CRON_SECRET
```

**Schedule:** `0 9 * * 1` (Every Monday at 9 AM)

### Option C: n8n Cron

1. Create a new workflow in n8n
2. Add **Schedule Trigger** node (every Monday 9 AM)
3. Add **HTTP Request** node to hit the cron endpoint
4. Save and activate

---

## Step 8: Test Everything

### Test Admin Panel
1. Go to `/admin/login`
2. Login
3. Add a test update
4. Add a test project
5. Check if they appear on the homepage

### Test Newsletter Signup
1. Go to homepage
2. Enter an email in newsletter form
3. Submit
4. Check `/admin/subscribers` - email should be there

### Test Weekly Digest (Manual Trigger)
```bash
curl -X GET https://fernandomillan.me/api/cron/weekly-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check your email - you should receive the weekly digest.

### Test Twitter Integration (if configured)
1. Add an update via admin panel
2. Check n8n executions
3. Check your Twitter profile - tweet should be posted

---

## Troubleshooting

### Admin Login Not Working
- Check `ADMIN_PASSWORD` is set in Coolify
- Clear browser cookies
- Try incognito mode

### Newsletter Emails Not Sending
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for errors
- Verify your domain is verified in Resend
- Check Coolify logs for errors

### Database Errors
- Check if migrations ran successfully
- Look at Coolify deployment logs
- Manually run: `npm run db:push` in Coolify terminal

### n8n Webhook Not Triggering
- Ensure n8n workflow is **Active**
- Check `N8N_WEBHOOK_URL` in environment variables
- Test webhook manually in n8n

---

## File Structure Changes

```
NEW FILES:
app/admin/*                        # Admin panel pages
app/api/auth/*                     # Authentication endpoints
app/api/webhooks/new-update/       # n8n webhook
app/api/cron/weekly-digest/        # Newsletter cron
app/unsubscribe/                   # Unsubscribe page
components/AdminNav.tsx            # Admin navigation
lib/auth.ts                        # Auth helpers
lib/resend.ts                      # Email client
lib/email-templates/weekly-digest.tsx  # Email template
vercel.json                        # Cron configuration
N8N_SETUP.md                       # n8n setup guide
DEPLOYMENT.md                      # This file

UPDATED FILES:
package.json                       # Added resend package
lib/db/schema.ts                   # Added subscribers table
app/api/newsletter/route.ts        # Now saves to database
CLAUDE.md                          # Updated documentation
```

---

## Quick Commands

```bash
# Check deployment logs
# In Coolify: Application → Logs

# Access database
npm run db:studio

# Manual weekly digest
curl -X GET https://fernandomillan.me/api/cron/weekly-digest

# Export subscribers
# Via admin panel: /admin/subscribers → Export Emails button
```

---

## What's Next?

You're all set! Here's your new workflow:

1. **Post updates** via `/admin/updates` (auto-tweets if n8n configured)
2. **Launch projects** via `/admin/projects`
3. **Newsletter goes out** automatically every Monday
4. **Subscribers manage themselves** (subscribe/unsubscribe)

No more CLI commands needed! 🎉

---

## Support

If you run into issues:
1. Check Coolify deployment logs
2. Check n8n execution logs (if using)
3. Check Resend dashboard (if using)
4. Review `CLAUDE.md` for detailed documentation
5. Review `N8N_SETUP.md` for Twitter automation help

Happy building in public! 🚀
