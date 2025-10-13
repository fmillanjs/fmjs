import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch all subscribers (for admin)
export async function GET() {
  try {
    const allSubscribers = await db.select().from(subscribers).orderBy(subscribers.subscribedAt);
    return NextResponse.json(allSubscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);

    if (existing.length > 0) {
      // If exists and inactive, reactivate
      if (existing[0].isActive === 'false') {
        await db.update(subscribers)
          .set({ isActive: 'true' })
          .where(eq(subscribers.email, email));

        return NextResponse.json(
          { message: 'Welcome back! You have been resubscribed.', email },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { message: 'You are already subscribed!', email },
        { status: 200 }
      );
    }

    // Insert new subscriber
    const [newSubscriber] = await db.insert(subscribers).values({
      email,
    }).returning();

    return NextResponse.json(
      { message: 'Successfully subscribed!', email: newSubscriber.email },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete subscriber
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Hard delete - permanently remove from database
    await db.delete(subscribers)
      .where(eq(subscribers.email, email));

    return NextResponse.json(
      { message: 'Successfully deleted subscriber' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete subscriber error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscriber' },
      { status: 500 }
    );
  }
}
