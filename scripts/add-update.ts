// Helper script to add a daily update via CLI
// Usage: npx tsx scripts/add-update.ts "6:00 AM" "Your update content here"

import { db } from '../lib/db';
import { updates } from '../lib/db/schema';

async function addUpdate() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/add-update.ts "<time>" "<content>"');
    console.error('Example: npx tsx scripts/add-update.ts "6:00 AM" "Starting the day with coffee!"');
    process.exit(1);
  }

  const [time, content] = args;

  const now = new Date();
  const date = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  try {
    const newUpdate = await db
      .insert(updates)
      .values({
        time,
        content,
        date,
      })
      .returning();

    console.log('✅ Update added successfully!');
    console.log(JSON.stringify(newUpdate[0], null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error adding update:', error);
    process.exit(1);
  }
}

addUpdate();
