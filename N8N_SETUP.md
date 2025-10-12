# n8n Twitter Automation Setup

This guide walks you through setting up n8n in Coolify to automatically post your daily updates to Twitter/X.

## Overview

**Flow:**
1. You post an update via the admin panel (`/admin/updates`)
2. Admin panel triggers webhook to `/api/webhooks/new-update`
3. n8n receives the webhook
4. n8n formats and posts to Twitter using Twitter API v2

---

## Part 1: Deploy n8n in Coolify

### 1. Add n8n Service

1. In Coolify, go to **Projects** → **Your Project**
2. Click **Add Resource** → **Services**
3. Search for **"n8n"**
4. Select **n8n** (the one with PostgreSQL included)
5. Click **Add Service**

### 2. Configure n8n

1. Go to **Configuration** → **General**
2. Under **Services**, click **Settings**
3. Add your domain (e.g., `n8n.yourdomain.com`)
4. Click **Deploy**

### 3. Access n8n

1. Wait for deployment to complete
2. Open your n8n URL (e.g., `https://n8n.yourdomain.com`)
3. Create an owner account (first user becomes the admin)

---

## Part 2: Get Twitter API Credentials

### 1. Create Twitter Developer Account

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Sign in with your Twitter account
3. Apply for Developer Access (Basic tier is free)
4. Create a new **Project** and **App**

### 2. Get API Keys

1. In your Twitter App, go to **Keys and Tokens**
2. Generate/copy these credentials:
   - **API Key** (Consumer Key)
   - **API Secret** (Consumer Secret)
   - **Access Token**
   - **Access Token Secret**
3. Keep these safe - you'll need them in n8n

### 3. Set App Permissions

1. In your Twitter App settings
2. Go to **User authentication settings**
3. Set permissions to **Read and Write**
4. Save changes

---

## Part 3: Create n8n Workflow

### 1. Create New Workflow

1. In n8n, click **+ Workflow**
2. Name it "Twitter Auto-Post from Updates"

### 2. Add Webhook Trigger

1. Click **+** to add a node
2. Search for **"Webhook"**
3. Select **Webhook** node
4. Configure:
   - **HTTP Method:** POST
   - **Path:** `new-update` (or any custom path)
   - **Response Mode:** Respond Immediately
5. Copy the **Production URL** (e.g., `https://n8n.yourdomain.com/webhook/new-update`)

### 3. Add Twitter Node

1. Click **+** to add another node
2. Search for **"Twitter"** or **"X (formerly Twitter)"**
3. Select **Twitter** → **Create a Tweet**
4. Configure:
   - **Credential for Twitter API:** Click **Create New**
   - Enter your Twitter API credentials from Part 2
   - **Text:** Use expression `{{ $json.tweet.text }}`

### 4. Connect Nodes

1. Connect **Webhook** output to **Twitter** input
2. Your flow: `Webhook → Twitter`

### 5. Save & Activate

1. Click **Save** (top right)
2. Toggle **Active** to ON (top right)

---

## Part 4: Configure Your Website

### 1. Update Environment Variables in Coolify

Add these to your website's environment variables:

```env
# n8n Webhook URL (from Part 3, Step 2)
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/new-update
```

### 2. Webhook Already Configured

The webhook is already built into the admin panel:
- File: `app/admin/updates/page.tsx`
- Triggers automatically when you add an update
- Sends formatted tweet text to n8n

---

## Part 5: Test the Integration

### 1. Test from Admin Panel

1. Go to your admin panel: `https://yourdomain.com/admin`
2. Navigate to **Updates**
3. Add a test update:
   - **Time:** 6:00 AM
   - **Content:** "Testing Twitter automation! 🚀"
4. Click **Add Update**

### 2. Check n8n Execution

1. Go to n8n → **Executions** tab
2. You should see a new execution
3. Click it to view details
4. Check if it succeeded

### 3. Check Twitter

1. Go to your Twitter profile
2. You should see the new tweet posted automatically

---

## Troubleshooting

### Webhook Not Triggering

**Check:**
- n8n workflow is **Active** (toggle in top right)
- Webhook URL in environment variables is correct
- n8n is accessible (try opening the webhook URL in browser)

**Fix:**
- Redeploy your website in Coolify after adding env vars
- Check n8n logs in Coolify

### Twitter Node Failing

**Check:**
- API credentials are correct
- Twitter App has **Read and Write** permissions
- You haven't exceeded Twitter API rate limits

**Fix:**
- Regenerate Twitter API tokens
- Wait 15 minutes and try again (rate limit reset)

### Tweet Format Issues

**Current Format:**
```
6:00 AM - Your update content here

#BuildInPublic #IndieDev
```

**To Customize:**
Edit the webhook response in:
- File: `app/api/webhooks/new-update/route.ts`
- Modify the `tweetText` variable

---

## Advanced: Add Error Handling in n8n

### 1. Add Error Handling

1. In n8n workflow, click on Twitter node
2. Go to **Settings** tab
3. Enable **Continue on Fail**
4. Add **On Error** workflow

### 2. Add Notification

1. After Twitter node, add **IF** node
2. Check if Twitter node succeeded
3. If failed, send yourself an email/Slack message

---

## Weekly Digest Automation (Optional)

Instead of manually triggering, you can automate the weekly digest:

### Option 1: Use Vercel Cron (Recommended)

Already configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/weekly-digest",
    "schedule": "0 9 * * 1"
  }]
}
```

Runs every Monday at 9 AM UTC.

### Option 2: Use n8n Cron

1. In n8n, create a new workflow
2. Add **Schedule Trigger** node
   - Set to run every Monday at 9 AM
3. Add **HTTP Request** node
   - Method: GET
   - URL: `https://yourdomain.com/api/cron/weekly-digest`
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
4. Save and activate

---

## Environment Variables Summary

Add these to your website in Coolify:

```env
# Admin Panel
ADMIN_PASSWORD=your-secure-password-here

# Resend (for newsletter)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=updates@yourdomain.com

# n8n Integration
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/new-update

# Cron Security
CRON_SECRET=your-random-secret-here

# Site URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## Next Steps

✅ **You're done!** Here's your workflow:

1. Post update in admin panel → Auto-tweets to Twitter
2. Every Monday → Weekly digest emails sent automatically
3. Users can subscribe/unsubscribe freely

**Happy building in public!** 🚀
