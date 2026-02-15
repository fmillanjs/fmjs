'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const canRemove = currentUserRole === 'ADMIN';

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'MEMBER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      setShowConfirm(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to remove member');
      setRemovingId(null);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {members.map((member) => (
          <li key={member.id}>
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(member.user.name)}
                  </div>
                </div>

                {/* User Info */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user.name || 'Unknown User'}
                    </p>
                    {member.userId === currentUserId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{member.user.email}</p>
                </div>

                {/* Role Badge */}
                <div className="ml-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {member.role}
                  </span>
                </div>
              </div>

              {/* Remove Button */}
              {canRemove && member.userId !== currentUserId && (
                <div className="ml-4">
                  {showConfirm === member.userId ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemove(member.userId)}
                        disabled={removingId === member.userId}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {removingId === member.userId ? 'Removing...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setShowConfirm(null)}
                        disabled={removingId === member.userId}
                        className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(member.userId)}
                      className="text-sm text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
