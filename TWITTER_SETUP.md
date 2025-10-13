# Twitter API Setup Guide

Complete guide to setting up Twitter auto-posting for your transparency website.

## Overview

**What gets posted:**
- ✅ **Daily updates** (6am, 11am, 2pm, 6pm) - Automatically when added via admin panel
- ✅ **Project launches** - When a project is added with status "live"

**Format:**
```
Daily Update:
6:00 AM - Working on admin panel. Adding edit/delete for easier content management.

#BuildInPublic #IndieHackers

Project Launch:
🚀 Just shipped: MyApp

A cool app that does amazing things

Status: Live
Revenue: $0/mo

https://myapp.com

#BuildInPublic #IndieDev
```

---

## Part 1: Create Twitter Developer Account

### 1. Apply for Developer Access

1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Sign in with your Twitter account
3. Click **Sign up** for developer account
4. Select **Hobbyist** → **Making a bot**
5. Fill out the application form:
   - **What will you use the Twitter API for?**
     > "Building a personal transparency website that auto-posts daily updates about my indie hacking journey. Posts 4 updates per day (6am, 11am, 2pm, 6pm) and project launch announcements. All posts are from my own account, no spam."
6. Accept terms and submit
7. Verify your email

**Note:** Basic/Free tier is sufficient (100 tweets per day limit - plenty for our use case)

---

## Part 2: Create Twitter App

### 1. Create a New Project

1. In the [Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click **+ Create Project**
3. Fill out:
   - **Name:** "Transparency Website"
   - **Use case:** Other
   - **Description:** "Personal website for building in public"

### 2. Create an App

1. Under your project, click **+ Add App**
2. Choose **Production** environment
3. Name your app: "fernandomillan-site" (or your preferred name)
4. Save the **API Key** and **API Secret** immediately (you won't see them again!)

### 3. Set Up User Authentication

1. In your app settings, go to **User authentication settings**
2. Click **Set up**
3. Configure:
   - **App permissions:** Read and Write
   - **Type of App:** Web App
   - **Callback URL:** `https://fernandomillan.me` (your domain)
   - **Website URL:** `https://fernandomillan.me`
4. Click **Save**

### 4. Generate Access Token

1. Go to **Keys and tokens** tab
2. Under **Access Token and Secret**, click **Generate**
3. Save both:
   - **Access Token**
   - **Access Token Secret**

**IMPORTANT:** Store all 4 credentials securely:
- API Key (Consumer Key)
- API Secret (Consumer Secret)
- Access Token
- Access Token Secret

---

## Part 3: Configure Your Website

### 1. Add Environment Variables in Coolify

1. Go to your Coolify dashboard
2. Navigate to your application
3. Go to **Environment Variables**
4. Add the following variables:

```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

Replace the values with your actual credentials from Part 2.

### 2. Redeploy

1. Save the environment variables
2. Trigger a redeploy (or just push to GitHub)
3. Wait for deployment to complete

---

## Part 4: Test the Integration

### 1. Test Update Posting

1. Go to `https://fernandomillan.me/admin`
2. Login with your admin password
3. Navigate to **Updates**
4. Add a test update:
   - **Time:** 6:00 AM
   - **Content:** "Testing Twitter integration! 🚀"
   - **Date:** (today's date)
5. Click **Add Update**
6. Check your Twitter profile - the tweet should appear immediately!

### 2. Test Project Posting

1. In admin panel, navigate to **Projects**
2. Add a test project:
   - **Name:** "Test Project"
   - **Logo:** 🚀
   - **Description:** "Testing project launch automation"
   - **Link:** https://example.com
   - **Revenue:** $0/mo
   - **Status:** **live** (important!)
3. Click **Add Project**
4. Check your Twitter profile - the project launch tweet should appear!

### 3. Check Logs

If tweets aren't appearing:

1. In Coolify, go to **Logs**
2. Look for messages like:
   - ✅ `Tweet posted successfully: 1234567890`
   - ⚠️ `Twitter not configured, skipping tweet`
   - ❌ `Error posting tweet: [error message]`

---

## Troubleshooting

### Issue: "Twitter not configured" message

**Cause:** Environment variables not set correctly

**Fix:**
1. Double-check env vars in Coolify
2. Make sure there are no extra spaces
3. Redeploy the application
4. Check logs again

### Issue: "Invalid or expired token"

**Cause:** Access tokens are incorrect or revoked

**Fix:**
1. Go to Twitter Developer Portal
2. Regenerate Access Token and Secret
3. Update environment variables in Coolify
4. Redeploy

### Issue: "403 Forbidden" error

**Cause:** App doesn't have write permissions

**Fix:**
1. In Developer Portal, go to your app settings
2. Click **User authentication settings**
3. Set **App permissions** to **Read and Write**
4. Regenerate Access Token (important!)
5. Update tokens in Coolify
6. Redeploy

### Issue: "429 Rate limit exceeded"

**Cause:** Too many tweets posted (>100/day on free tier)

**Fix:**
- Wait 24 hours for limit to reset
- Consider upgrading to Basic tier ($100/mo) if needed (allows 10K tweets/day)

### Issue: Tweets not posting for edited updates

**Expected behavior:** Twitter auto-posting only works for **new** updates, not edited ones. This prevents duplicate tweets.

---

## Tweet Format Customization

Want to change how your tweets look?

### Update Format

Edit `lib/twitter/format.ts` → `formatUpdateTweet()`:

```typescript
export function formatUpdateTweet(update: UpdateData): string {
  return `${update.time} - ${update.content}\n\n#BuildInPublic #IndieHackers`;
}
```

### Project Format

Edit `lib/twitter/format.ts` → `formatProjectTweet()`:

```typescript
export function formatProjectTweet(project: ProjectData): string {
  // Customize the format here
}
```

After making changes:
1. Commit and push to GitHub
2. Coolify auto-deploys
3. New format takes effect immediately

---

## Optional: Disable Twitter Posting

If you want to temporarily stop posting to Twitter without removing credentials:

### Option 1: Remove Environment Variables
1. In Coolify, delete the Twitter env vars
2. Redeploy
3. Updates/projects will save but not tweet

### Option 2: Comment Out Code
Edit `app/admin/updates/page.tsx` and `app/admin/projects/page.tsx`:

```typescript
// Temporarily disable Twitter posting
// const twitterResponse = await fetch('/api/twitter/post-update', {
//   ...
// });
```

---

## Rate Limits & Best Practices

### Free Tier Limits (Basic Access)
- **100 tweets per day**
- **1 tweet per second**
- Sufficient for 4 daily updates + occasional project launches

### Best Practices
1. **Don't spam** - Stick to 4 updates/day schedule
2. **Quality over quantity** - Make each update valuable
3. **Be authentic** - Your real progress, not just promotional
4. **Engage with replies** - Build relationships with followers
5. **Monitor metrics** - See what resonates with your audience

### If You Need More
**Basic tier ($100/mo):**
- 10,000 tweets per day
- 3,000,000 tweets per month
- Advanced features (polls, media uploads, etc.)

---

## FAQ

**Q: Do updates get tweeted when added via CLI scripts?**
A: No, only updates added via the admin panel trigger Twitter posting.

**Q: What happens if Twitter API goes down?**
A: Updates/projects still save to your database. Twitter posting fails gracefully without breaking the admin panel.

**Q: Can I edit tweets after posting?**
A: Not through this integration. You'll need to manually edit/delete on Twitter. Consider this before posting!

**Q: Can I schedule tweets for later?**
A: Not currently. Tweets post immediately when you add updates. You can manually add updates later at scheduled times.

**Q: How do I test without posting to my real account?**
A: Create a separate test Twitter account, get API credentials for it, and use those in a local/staging environment.

---

## Next Steps

✅ **You're all set!** Your workflow:

1. **4x Daily** → Add updates via admin panel → Auto-tweets
2. **Ship Projects** → Add project with status "live" → Auto-announces on Twitter
3. **Build audience** → Consistent, authentic updates = followers who care

**Happy building in public!** 🚀

---

## Support

Having issues? Check:
1. [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
2. [Project GitHub Issues](https://github.com/fmillanjs/fmjs/issues)
3. Your Coolify logs for specific error messages

---

**Last Updated**: Oct 13, 2025
**Status**: ✅ Twitter API v2 Direct Integration
