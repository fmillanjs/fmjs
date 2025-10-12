// Helper script to add a project via CLI
// Usage: npx tsx scripts/add-project.ts

import { db } from '../lib/db';
import { projects } from '../lib/db/schema';

async function addProject() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('Usage: npx tsx scripts/add-project.ts "<name>" "<logo>" "<description>" [link] [revenue] [status]');
    console.error('Example: npx tsx scripts/add-project.ts "My App" "🚀" "A cool app" "https://myapp.com" "$100/mo" "live"');
    process.exit(1);
  }

  const [name, logo, description, link, revenue, status] = args;

  try {
    const newProject = await db
      .insert(projects)
      .values({
        name,
        logo,
        description,
        link: link || null,
        revenue: revenue || null,
        status: status || 'building',
        daysToComplete: 2,
      })
      .returning();

    console.log('✅ Project added successfully!');
    console.log(JSON.stringify(newProject[0], null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error adding project:', error);
    process.exit(1);
  }
}

addProject();
