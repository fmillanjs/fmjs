'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        // Get full URL including query params from window.location
        const page = pathname + window.location.search;
        const referrer = document.referrer || undefined;
        const userAgent = navigator.userAgent;

        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page,
            referrer,
            userAgent,
          }),
        });
      } catch (error) {
        // Silently fail - don't block page load for analytics
        console.error('Analytics tracking failed:', error);
      }
    };

    trackPageView();
  }, [pathname]);

  return null; // This component doesn't render anything
}
