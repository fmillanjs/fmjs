/**
 * Twitter API v2 Client
 *
 * Handles authentication and posting tweets using Twitter API v2
 * Uses twitter-api-v2 package for OAuth handling
 */

import { TwitterApi } from 'twitter-api-v2';

interface TweetResponse {
  success: boolean;
  tweetId?: string;
  error?: string;
}

/**
 * Get Twitter API client instance
 */
function getTwitterClient(): TwitterApi | null {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.warn('Twitter credentials not fully configured');
    return null;
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret: accessTokenSecret,
  });
}

/**
 * Posts a tweet using Twitter API v2
 */
export async function postTweet(text: string): Promise<TweetResponse> {
  try {
    const client = getTwitterClient();

    if (!client) {
      return {
        success: false,
        error: 'Twitter API credentials not configured',
      };
    }

    // Post the tweet
    const tweet = await client.v2.tweet(text);

    console.log('Tweet posted successfully:', tweet.data.id);

    return {
      success: true,
      tweetId: tweet.data.id,
    };
  } catch (error) {
    console.error('Error posting tweet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if Twitter is configured
 */
export function isTwitterConfigured(): boolean {
  return getTwitterClient() !== null;
}
