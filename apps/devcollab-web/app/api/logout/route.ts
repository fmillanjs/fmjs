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
  const response = NextResponse.redirect(new URL('/login', _req.url));

  // Also clear the cookie from the Next.js side as a safety measure
  // (the API response already cleared it via Set-Cookie: devcollab_token=; Max-Age=0)
  response.cookies.delete('devcollab_token');

  return response;
}
