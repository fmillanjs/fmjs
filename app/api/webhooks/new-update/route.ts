import { NextRequest, NextResponse } from 'next/server';

/**
 * This webhook endpoint is called when a new update is posted.
 * It formats the update and returns it for n8n to post to Twitter.
 *
 * n8n workflow will:
 * 1. Listen to this webhook
 * 2. Receive the update data
 * 3. Format it as a tweet
 * 4. Post to Twitter via Twitter API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { time, content, date } = body;

    if (!time || !content || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format the tweet text
    const tweetText = `${time} - ${content}\n\n#BuildInPublic #IndieDev`;

    // Return formatted data for n8n to use
    return NextResponse.json({
      success: true,
      tweet: {
        text: tweetText,
        time,
        content,
        date,
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
