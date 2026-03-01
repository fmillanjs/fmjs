'use server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { redirect } from 'next/navigation';
import { sessionOptions, SessionData, DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/session';

export async function login(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    return { error: 'Invalid email or password' };
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.isLoggedIn = true;
  session.email = email;
  await session.save();
  redirect('/leads');
}

export async function logout(): Promise<void> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.destroy();
  redirect('/login');
}
