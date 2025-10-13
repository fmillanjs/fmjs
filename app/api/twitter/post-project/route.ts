import { NextRequest, NextResponse } from 'next/server';
import { postTweet, isTwitterConfigured } from '@/lib/twitter/client';
import { formatProjectTweet } from '@/lib/twitter/format';

/**
 * POST /api/twitter/post-project
 *
 * Posts a project launch announcement to Twitter
 *
 * Body:
 * {
 *   name: string;
 *   logo: string;
 *   description: string;
 *   link?: string;
 *   revenue?: string;
 *   status: string;
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
        { status: 200 } // Return 200 to not break the project creation flow
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, logo, description, link, revenue, status } = body;

    // Validate required fields
    if (!name || !logo || !description || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: name, logo, description, status' },
        { status: 400 }
      );
    }

    // Format the tweet
    const tweetText = formatProjectTweet({
      name,
      logo,
      description,
      link,
      revenue,
      status,
    });

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

    console.log('Project posted to Twitter successfully:', result.tweetId);

    return NextResponse.json({
      success: true,
      tweetId: result.tweetId,
      message: 'Project posted to Twitter',
    });
  } catch (error) {
    console.error('Error in post-project route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
