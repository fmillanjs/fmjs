import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export async function GET(_req: NextRequest): Promise<NextResponse> {
  // Call devcollab-api logout to clear the httpOnly cookie on the API side
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Even if API call fails, clear local cookie and redirect
  }

  // Redirect to login page after logout
  // Use forwarded headers to build the public URL — _req.url resolves to the
  // internal container address (0.0.0.0:80) behind a reverse proxy
  const proto = _req.headers.get('x-forwarded-proto') || 'https';
  const host = _req.headers.get('x-forwarded-host') || _req.headers.get('host') || 'devcollab.fernandomillan.me';
  const response = NextResponse.redirect(new URL('/login', `${proto}://${host}`));

  // Also clear the cookie from the Next.js side as a safety measure
  // (the API response already cleared it via Set-Cookie: devcollab_token=; Max-Age=0)
  response.cookies.delete('devcollab_token');

  return response;
}
