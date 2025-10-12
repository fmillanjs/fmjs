import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updates, subscribers } from '@/lib/db/schema';
import { eq, gte } from 'drizzle-orm';
import { getResend } from '@/lib/resend';
import { generateWeeklyDigestHTML } from '@/lib/email-templates/weekly-digest';

/**
 * Weekly Digest Cron Job
 *
 * This endpoint should be called once per week via:
 * - Vercel Cron (recommended)
 * - GitHub Actions
 * - External cron service (cron-job.org, EasyCron, etc.)
 *
 * Add this to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/weekly-digest",
 *     "schedule": "0 9 * * 1"
 *   }]
 * }
 *
 * Schedule: Every Monday at 9:00 AM UTC
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job (using Vercel's cron secret or custom header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active subscribers
    const activeSubscribers = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.isActive, 'true'));

    if (activeSubscribers.length === 0) {
      return NextResponse.json({ message: 'No active subscribers' });
    }

    // Get updates from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUpdates = await db
      .select()
      .from(updates)
      .where(gte(updates.createdAt, sevenDaysAgo))
      .orderBy(updates.createdAt);

    if (recentUpdates.length === 0) {
      return NextResponse.json({ message: 'No updates this week' });
    }

    // Format dates for email
    const weekStart = sevenDaysAgo.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const weekEnd = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Send emails to all subscribers
    const emailPromises = activeSubscribers.map(async (subscriber) => {
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fernandomillan.me'}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

      const emailHTML = generateWeeklyDigestHTML({
        updates: recentUpdates,
        weekStart,
        weekEnd,
        unsubscribeUrl,
      });

      return getResend().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'updates@fernandomillan.me',
        to: subscriber.email,
        subject: `Weekly Build Update: ${weekStart} - ${weekEnd}`,
        html: emailHTML,
      });
    });

    const results = await Promise.allSettled(emailPromises);

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      totalSubscribers: activeSubscribers.length,
      updatesCount: recentUpdates.length,
    });
  } catch (error) {
    console.error('Weekly digest cron error:', error);
    return NextResponse.json(
      { error: 'Failed to send weekly digest' },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggering from admin panel
export async function POST(request: NextRequest) {
  return GET(request);
}
