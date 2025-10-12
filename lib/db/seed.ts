import { db } from './index';
import { profile } from './schema';

// Run this script to initialize your profile data
// Usage: npx tsx lib/db/seed.ts

async function seed() {
  try {
    console.log('Seeding database...');

    // Insert default profile
    await db.insert(profile).values({
      name: process.env.NEXT_PUBLIC_NAME || 'Your Name',
      location: process.env.NEXT_PUBLIC_LOCATION || 'Your Location',
      tagline: 'Building one project every 2 days. Full transparency.',
      profileImage: '/profile.jpg',
      twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/yourusername',
      githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/yourusername',
      startDate: process.env.NEXT_PUBLIC_START_DATE || '2025-10-12',
    });

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
