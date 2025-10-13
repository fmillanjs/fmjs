import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { updates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allUpdates = await db.select().from(updates).orderBy(desc(updates.createdAt));
    return NextResponse.json(allUpdates);
  } catch (error) {
    console.error('Error fetching updates:', error);
    return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { time, content, date } = body;

    if (!time || !content || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: time, content, date' },
        { status: 400 }
      );
    }

    const newUpdate = await db
      .insert(updates)
      .values({
        time,
        content,
        date,
      })
      .returning();

    // Revalidate the main page to clear cache
    revalidatePath('/');

    return NextResponse.json(newUpdate[0], { status: 201 });
  } catch (error) {
    console.error('Error creating update:', error);
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, time, content, date } = body;

    if (!id || !time || !content || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: id, time, content, date' },
        { status: 400 }
      );
    }

    const updatedUpdate = await db
      .update(updates)
      .set({
        time,
        content,
        date,
      })
      .where(eq(updates.id, id))
      .returning();

    if (!updatedUpdate.length) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // Revalidate the main page to clear cache
    revalidatePath('/');

    return NextResponse.json(updatedUpdate[0]);
  } catch (error) {
    console.error('Error updating update:', error);
    return NextResponse.json({ error: 'Failed to update update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const deletedUpdate = await db
      .delete(updates)
      .where(eq(updates.id, parseInt(id)))
      .returning();

    if (!deletedUpdate.length) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    // Revalidate the main page to clear cache
    revalidatePath('/');

    return NextResponse.json({ message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Error deleting update:', error);
    return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 });
  }
}
