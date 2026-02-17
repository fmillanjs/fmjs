'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface TeamMemberListProps {
  teamId: string;
  members: TeamMember[];
  currentUserRole: string;
  currentUserId: string;
}

export function TeamMemberList({
  teamId,
  members,
  currentUserRole,
  currentUserId,
}: TeamMemberListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const canRemove = currentUserRole === 'ADMIN';

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-[var(--red-3)] text-[var(--red-11)]';
      case 'MANAGER':
        return 'bg-[var(--blue-3)] text-[var(--blue-11)]';
      case 'MEMBER':
        return 'bg-[var(--green-3)] text-[var(--green-11)]';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);

    try {
      const token = (session as any)?.accessToken;
      if (!token) {
        throw new Error('Not authenticated');
      }

      await api.delete(`/api/teams/${teamId}/members/${userId}`, token);

      // Refresh the page to show updated member list
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove member');
      setRemovingId(null);
    }
  };

  return (
    <div className="bg-card shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-border">
        {members.map((member) => (
          <li key={member.id}>
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {getInitials(member.user.name)}
                  </div>
                </div>

                {/* User Info */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.user.name || 'Unknown User'}
                    </p>
                    {member.userId === currentUserId && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
                </div>

                {/* Role Badge */}
                <div className="ml-4">
                  <Badge
                    variant="outline"
                    className={cn('border-0 rounded-full text-xs', getRoleBadgeColor(member.role))}
                  >
                    {member.role}
                  </Badge>
                </div>
              </div>

              {/* Remove Button */}
              {canRemove && member.userId !== currentUserId && (
                <div className="ml-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--red-11)] hover:text-[var(--red-12)] hover:bg-[var(--red-3)]"
                        disabled={removingId === member.userId}
                      >
                        {removingId === member.userId ? 'Removing...' : 'Remove'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove team member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {member.user.name || member.user.email} will lose access to this team immediately. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleRemove(member.userId)}
                          disabled={removingId === member.userId}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
