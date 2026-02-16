'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from './use-websocket';

interface ActiveUser {
  userId: string;
  email: string;
  name: string | null;
}

interface PresenceJoinEvent {
  userId: string;
  email: string;
  name: string | null;
  projectId: string;
}

interface PresenceLeaveEvent {
  userId: string;
  projectId: string;
}

export function useProjectPresence(projectId: string) {
  const { socket } = useWebSocket();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    if (!socket || !projectId) return;

    // Request current presence on mount
    socket.emit('presence:request', { projectId }, (response: { activeUsers: ActiveUser[]; count: number }) => {
      // [DEBUG] Log presence update
      console.log('[Presence] Active users count:', response.count);
      setActiveUsers(response.activeUsers);
    });

    // Listen for presence:join events
    const handlePresenceJoin = (event: PresenceJoinEvent) => {
      // [DEBUG] Log event receipt
      console.log('[Presence] User joined:', event.name || event.email);

      if (event.projectId === projectId) {
        setActiveUsers((current) => {
          // Avoid duplicates - check if user already in list
          if (current.some((u) => u.userId === event.userId)) {
            return current;
          }
          return [...current, { userId: event.userId, email: event.email, name: event.name }];
        });
      }
    };

    // Listen for presence:leave events
    const handlePresenceLeave = (event: PresenceLeaveEvent) => {
      if (event.projectId === projectId) {
        setActiveUsers((current) => current.filter((u) => u.userId !== event.userId));
      }
    };

    socket.on('presence:join', handlePresenceJoin);
    socket.on('presence:leave', handlePresenceLeave);

    // Cleanup listeners on unmount
    return () => {
      socket.off('presence:join', handlePresenceJoin);
      socket.off('presence:leave', handlePresenceLeave);
    };
  }, [socket, projectId]);

  // Derive count from activeUsers length (single source of truth)
  return { activeUsers, count: activeUsers.length };
}
