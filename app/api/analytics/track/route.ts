import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageViews } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, referrer, userAgent } = body;

    if (!page) {
      return NextResponse.json(
        { error: 'Missing required field: page' },
        { status: 400 }
      );
    }

    // Get IP address from headers
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown';

    // Get geolocation from IP (dynamically import to avoid build issues)
    let country = null;
    let city = null;

    if (ip && ip !== 'unknown') {
      try {
        const geoip = (await import('geoip-lite')).default;
        const geo = geoip.lookup(ip);
        if (geo) {
          country = geo.country;
          city = geo.city;
        }
      } catch (error) {
        console.error('Geolocation lookup failed:', error);
        // Continue without geolocation data
      }
    }

    // Store page view
    await db.insert(pageViews).values({
      page,
      referrer: referrer || null,
      country,
      city,
      userAgent: userAgent || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error tracking page view:', error);
    return NextResponse.json({ error: 'Failed to track page view' }, { status: 500 });
  }
}
