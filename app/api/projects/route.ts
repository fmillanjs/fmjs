import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
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

    // Revalidate the main page to clear cache
    revalidatePath('/');

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, logo, description, link, revenue, status, daysToComplete } = body;

    if (!id || !name || !logo || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, logo, description' },
        { status: 400 }
      );
    }

    const updatedProject = await db
      .update(projects)
      .set({
        name,
        logo,
        description,
        link: link || null,
        revenue: revenue || null,
        status: status || 'building',
        daysToComplete: daysToComplete || 2,
      })
      .where(eq(projects.id, id))
      .returning();

    if (!updatedProject.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Revalidate the main page to clear cache
    revalidatePath('/');

    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const deletedProject = await db
      .delete(projects)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (!deletedProject.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Revalidate the main page to clear cache
    revalidatePath('/');

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
