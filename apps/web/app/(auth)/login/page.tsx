import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In | TeamFlow',
  description: 'Log in to your TeamFlow account',
};

export default function LoginPage() {
  return <LoginForm />;
}
