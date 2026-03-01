import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function proxy(request: NextRequest) {
  // CRITICAL: In Edge Runtime, cookies() from next/headers is NOT available.
  // Must use request.cookies (NextRequest cookie store) directly.
  const session = await getIronSession<SessionData>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.cookies as any,
    sessionOptions,
  );

  const { pathname } = request.nextUrl;

  // Protect /leads/* routes — redirect to /login if not authenticated
  if (pathname.startsWith('/leads') && !session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from /login to /leads
  if (pathname.startsWith('/login') && session.isLoggedIn) {
    return NextResponse.redirect(new URL('/leads', request.url));
  }

  // Redirect root to /leads (proxy will redirect to /login if not authenticated)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/leads', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
