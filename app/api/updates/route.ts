import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updates } from '@/lib/db/schema';

export async function GET() {
  try {
    const allUpdates = await db.select().from(updates);
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

    return NextResponse.json(newUpdate[0], { status: 201 });
  } catch (error) {
    console.error('Error creating update:', error);
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 });
  }
}
