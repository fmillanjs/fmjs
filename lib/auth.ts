import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function checkAuth() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin_auth');

  if (authCookie?.value !== 'true') {
    redirect('/login');
  }

  return true;
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin_auth');
  return authCookie?.value === 'true';
}
