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
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!socket || !projectId) return;

    // Request current presence on mount
    socket.emit('presence:request', { projectId }, (response: { activeUsers: ActiveUser[]; count: number }) => {
      setActiveUsers(response.activeUsers);
      setCount(response.count);
    });

    // Listen for presence:join events
    const handlePresenceJoin = (event: PresenceJoinEvent) => {
      if (event.projectId === projectId) {
        setActiveUsers((current) => {
          // Avoid duplicates - check if user already in list
          if (current.some((u) => u.userId === event.userId)) {
            return current;
          }
          const newUsers = [...current, { userId: event.userId, email: event.email, name: event.name }];
          setCount(newUsers.length);
          return newUsers;
        });
      }
    };

    // Listen for presence:leave events
    const handlePresenceLeave = (event: PresenceLeaveEvent) => {
      if (event.projectId === projectId) {
        setActiveUsers((current) => {
          const newUsers = current.filter((u) => u.userId !== event.userId);
          setCount(newUsers.length);
          return newUsers;
        });
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

  return { activeUsers, count };
}
