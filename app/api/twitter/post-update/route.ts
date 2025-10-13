import { NextRequest, NextResponse } from 'next/server';
import { postTweet, isTwitterConfigured } from '@/lib/twitter/client';
import { formatUpdateTweet } from '@/lib/twitter/format';

/**
 * POST /api/twitter/post-update
 *
 * Posts a daily update to Twitter
 *
 * Body:
 * {
 *   time: string;      // e.g., "6:00 AM"
 *   content: string;   // Update content
 *   date: string;      // e.g., "Oct 12, 2025"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Twitter is configured
    if (!isTwitterConfigured()) {
      console.warn('Twitter not configured, skipping tweet');
      return NextResponse.json(
        {
          success: false,
          message: 'Twitter API not configured',
          skipped: true,
        },
        { status: 200 } // Return 200 to not break the update flow
      );
    }

    // Parse request body
    const body = await request.json();
    const { time, content, date } = body;

    // Validate required fields
    if (!time || !content || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: time, content, date' },
        { status: 400 }
      );
    }

    // Format the tweet
    const tweetText = formatUpdateTweet({ time, content, date });

    // Post to Twitter
    const result = await postTweet(tweetText);

    if (!result.success) {
      console.error('Failed to post tweet:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    console.log('Update posted to Twitter successfully:', result.tweetId);

    return NextResponse.json({
      success: true,
      tweetId: result.tweetId,
      message: 'Update posted to Twitter',
    });
  } catch (error) {
    console.error('Error in post-update route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
