import { auth } from '@/lib/auth';
import { prisma } from '@repo/database';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/auth/profile-form';
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch full user profile from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  const memberSince = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(user.createdAt);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Member since {memberSince}</p>
      </div>

      <div className="space-y-8">
        {/* Profile Information Section */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <ProfileForm user={user} />
        </div>

        {/* Change Password Section */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
