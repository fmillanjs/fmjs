import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pageViews } from '@/lib/db/schema';
import { desc, sql, and, gte } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all page views
    const allViews = await db.select().from(pageViews).orderBy(desc(pageViews.visitedAt));

    // Total views
    const totalViews = allViews.length;

    // Get views from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentViews = allViews.filter(
      (view) => new Date(view.visitedAt) >= sevenDaysAgo
    );

    // Get views from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthViews = allViews.filter(
      (view) => new Date(view.visitedAt) >= thirtyDaysAgo
    );

    // Group by page
    const pageStats = allViews.reduce((acc: any, view) => {
      acc[view.page] = (acc[view.page] || 0) + 1;
      return acc;
    }, {});

    // Group by country
    const countryStats = allViews.reduce((acc: any, view) => {
      if (view.country) {
        acc[view.country] = (acc[view.country] || 0) + 1;
      }
      return acc;
    }, {});

    // Group by referrer
    const referrerStats = allViews.reduce((acc: any, view) => {
      const ref = view.referrer || 'Direct';
      acc[ref] = (acc[ref] || 0) + 1;
      return acc;
    }, {});

    // Sort and format stats
    const topPages = Object.entries(pageStats)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    const topCountries = Object.entries(countryStats)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    const topReferrers = Object.entries(referrerStats)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([referrer, count]) => ({ referrer, count }));

    // Get daily views for last 30 days
    const dailyViews = monthViews.reduce((acc: any, view) => {
      const date = new Date(view.visitedAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const dailyViewsArray = Object.entries(dailyViews)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalViews,
      recentViews: recentViews.length,
      monthViews: monthViews.length,
      topPages,
      topCountries,
      topReferrers,
      dailyViews: dailyViewsArray,
      latestViews: allViews.slice(0, 100), // Last 100 views
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
