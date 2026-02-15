import { SignUpForm } from '@/components/auth/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | TeamFlow',
  description: 'Create a new TeamFlow account',
};

export default function SignUpPage() {
  return <SignUpForm />;
}
