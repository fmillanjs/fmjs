# Coolify Deployment Guide

Step-by-step guide to deploy this Next.js transparency website on Coolify from your GitHub repository.

## Prerequisites

- Coolify instance set up and running
- GitHub account with repository access
- Domain name (optional but recommended)

## Step 1: Prepare Your Repository

1. **Initialize Git and commit all files**

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Next.js transparency website"
   ```

2. **Push to GitHub**

   ```bash
   git remote add origin https://github.com/fmillanjs/fmjs.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Create PostgreSQL Database in Coolify

1. Log into your Coolify dashboard
2. Click **"New Resource"** → **"Database"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `transparency-db`
   - **PostgreSQL Version**: `16` (or latest)
   - **Database Name**: `transparency_db`
   - **Username**: Create a username (e.g., `transparency_user`)
   - **Password**: Generate a secure password
4. Click **"Deploy"**
5. Wait for the database to be ready
6. **Save the connection string** - you'll need it in the next step

   Format: `postgresql://username:password@postgres-service:5432/transparency_db`

## Step 3: Deploy the Application

1. In Coolify dashboard, click **"New Resource"** → **"Public Repository"**

2. **Repository Settings**:
   - **Repository URL**: `https://github.com/fmillanjs/fmjs`
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile` (auto-detected)

3. **Port Configuration**:
   - **Port**: `3000`

4. Click **"Continue"**

## Step 4: Configure Environment Variables

In the application settings, add these environment variables:

### Required Variables

```
DATABASE_URL=postgresql://user:password@postgres-service:5432/transparency_db
```

Replace with your actual database connection string from Step 2.

### Public Variables

```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_NAME=Your Name
NEXT_PUBLIC_LOCATION=Your Location
NEXT_PUBLIC_TWITTER_URL=https://twitter.com/yourusername
NEXT_PUBLIC_GITHUB_URL=https://github.com/yourusername
NEXT_PUBLIC_START_DATE=2025-10-12
```

Update these with your actual information.

## Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (5-10 minutes)
3. Check the logs for any errors

## Step 6: Initialize Database

After the first successful deployment:

1. Go to your application in Coolify
2. Click **"Terminal"** or **"Execute Command"**
3. Run these commands:

   ```bash
   # Push database schema
   npm run db:push

   # Seed initial profile
   npx tsx lib/db/seed.ts
   ```

4. You should see success messages

## Step 7: Configure Domain (Optional)

1. In application settings, go to **"Domains"**
2. Add your domain: `transparency.yourdomain.com`
3. Update DNS records as instructed by Coolify
4. Enable **"Force HTTPS"**
5. Wait for SSL certificate to be issued (automatic)

## Step 8: Test Your Site

1. Visit your domain or the Coolify-provided URL
2. You should see your profile with stats showing 0 projects, 0 updates
3. Test adding an update:

   ```bash
   # SSH into your Coolify app or use the Terminal
   npx tsx scripts/add-update.ts "6:00 AM" "First update! Site is live!"
   ```

4. Refresh the page - your update should appear!

## Ongoing: Adding Content

### Daily Updates (4 times a day)

You can add updates in two ways:

**Option 1: Via Terminal in Coolify**

```bash
npx tsx scripts/add-update.ts "6:00 AM" "Your update content here"
npx tsx scripts/add-update.ts "11:00 AM" "Made progress on feature X"
npx tsx scripts/add-update.ts "2:00 PM" "Hit a bug but figured it out"
npx tsx scripts/add-update.ts "6:00 PM" "Day complete! Shipped feature X"
```

**Option 2: Via API (use Postman, curl, or build an admin panel)**

```bash
curl -X POST https://yourdomain.com/api/updates \
  -H "Content-Type: application/json" \
  -d '{"time":"6:00 AM","content":"Your update","date":"Oct 12, 2025"}'
```

### Adding Projects (Every 2 days)

**Via Terminal:**

```bash
npx tsx scripts/add-project.ts "Project Name" "🚀" "Description" "https://project.com" "$100/mo" "live"
```

**Via API:**

```bash
curl -X POST https://yourdomain.com/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name":"My App",
    "logo":"🚀",
    "description":"A cool app",
    "link":"https://myapp.com",
    "revenue":"$100/mo",
    "status":"live"
  }'
```

## Continuous Deployment

Every time you push to the `main` branch, Coolify will automatically:

1. Pull the latest code
2. Build a new Docker image
3. Deploy the new version
4. Zero-downtime deployment

## Troubleshooting

### Build Fails

1. Check the build logs in Coolify
2. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Node version mismatch

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Make sure the database service is running
3. Check that the app can reach the database (same network in Coolify)

### App Won't Start

1. Check application logs
2. Verify port 3000 is configured
3. Ensure `output: 'standalone'` is in `next.config.ts`

### Environment Variables Not Working

1. After updating env vars, you must **redeploy** the application
2. Check that `NEXT_PUBLIC_*` variables are correctly prefixed
3. Clear browser cache if changes don't appear

## Monitoring

1. **Logs**: View real-time logs in Coolify dashboard
2. **Metrics**: Monitor CPU, memory, and network usage
3. **Uptime**: Set up uptime monitoring with Coolify or external service

## Backup

1. **Database Backups**: Enable automatic backups in Coolify database settings
2. **Code**: Always pushed to GitHub (automatic backup)
3. **Manual DB Backup**:

   ```bash
   # In Coolify terminal
   pg_dump $DATABASE_URL > backup.sql
   ```

## Updates and Maintenance

To update your site:

```bash
git add .
git commit -m "Update: your changes"
git push origin main
```

Coolify will automatically deploy the changes.

## Need Help?

- Check Coolify docs: https://coolify.io/docs
- GitHub Issues: https://github.com/fmillanjs/fmjs/issues
- Coolify Discord: https://coolify.io/discord

---

Happy building in public!
