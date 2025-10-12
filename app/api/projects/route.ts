import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';

export async function GET() {
  try {
    const allProjects = await db.select().from(projects);
    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, logo, description, link, revenue, status, daysToComplete } = body;

    if (!name || !logo || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, logo, description' },
        { status: 400 }
      );
    }

    const newProject = await db
      .insert(projects)
      .values({
        name,
        logo,
        description,
        link: link || null,
        revenue: revenue || null,
        status: status || 'building',
        daysToComplete: daysToComplete || 2,
      })
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
