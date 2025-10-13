/**
 * Tweet formatting utilities
 *
 * Formats different types of content into tweet-ready text
 */

interface UpdateData {
  time: string;
  content: string;
  date: string;
}

interface ProjectData {
  name: string;
  logo: string;
  description: string;
  link?: string | null;
  revenue?: string | null;
  status: string;
}

interface MilestoneData {
  milestone: string;
  breakdown: string;
  daysSinceStart: number;
}

/**
 * Format a daily update as a tweet
 *
 * Example:
 * "6:00 AM - Working on admin panel. Adding edit/delete for easier content management.
 *
 * #BuildInPublic #IndieHackers"
 */
export function formatUpdateTweet(update: UpdateData): string {
  const tweet = `${update.time} - ${update.content}\n\n#BuildInPublic #IndieHackers`;

  // Twitter has a 280 character limit
  if (tweet.length > 280) {
    // Truncate content to fit within limit
    const maxContentLength = 280 - update.time.length - ' - '.length - '\n\n#BuildInPublic #IndieHackers'.length - 3; // 3 for "..."
    const truncatedContent = update.content.substring(0, maxContentLength) + '...';
    return `${update.time} - ${truncatedContent}\n\n#BuildInPublic #IndieHackers`;
  }

  return tweet;
}

/**
 * Format a project launch as a tweet
 *
 * Example:
 * "🚀 Just shipped: MyApp
 *
 * A cool app that does amazing things
 *
 * Status: Live
 * Revenue: $0/mo
 *
 * https://myapp.com
 *
 * #BuildInPublic #IndieDev"
 */
export function formatProjectTweet(project: ProjectData): string {
  const parts: string[] = [];

  // Header with emoji and name
  parts.push(`🚀 Just shipped: ${project.name}`);
  parts.push('');

  // Description
  parts.push(project.description);
  parts.push('');

  // Status and revenue
  const status = project.status.charAt(0).toUpperCase() + project.status.slice(1);
  parts.push(`Status: ${status}`);
  if (project.revenue) {
    parts.push(`Revenue: ${project.revenue}`);
  }

  // Link
  if (project.link) {
    parts.push('');
    parts.push(project.link);
  }

  // Hashtags
  parts.push('');
  parts.push('#BuildInPublic #IndieDev');

  const tweet = parts.join('\n');

  // Check length and truncate if needed
  if (tweet.length > 280) {
    // Shorten description to fit
    const baseLength = tweet.length - project.description.length;
    const maxDescLength = 280 - baseLength - 3; // 3 for "..."
    const truncatedDesc = project.description.substring(0, maxDescLength) + '...';

    const truncatedParts = [...parts];
    truncatedParts[2] = truncatedDesc; // Replace description
    return truncatedParts.join('\n');
  }

  return tweet;
}

/**
 * Format a revenue milestone as a tweet
 *
 * Example:
 * "💰 Milestone: First $100 MRR!
 *
 * Breakdown:
 * • Project A: $60/mo
 * • Project B: $40/mo
 *
 * Days since start: 47
 *
 * Keep building. 🚀
 *
 * #BuildInPublic"
 */
export function formatMilestoneTweet(milestone: MilestoneData): string {
  const parts: string[] = [];

  parts.push(`💰 Milestone: ${milestone.milestone}`);
  parts.push('');
  parts.push(milestone.breakdown);
  parts.push('');
  parts.push(`Days since start: ${milestone.daysSinceStart}`);
  parts.push('');
  parts.push('Keep building. 🚀');
  parts.push('');
  parts.push('#BuildInPublic');

  return parts.join('\n');
}

/**
 * Validate tweet length (max 280 characters)
 */
export function validateTweetLength(text: string): boolean {
  return text.length <= 280;
}

/**
 * Get tweet character count
 */
export function getTweetLength(text: string): number {
  return text.length;
}
