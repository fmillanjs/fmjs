'use client';

import { useEffect } from 'react';
import { TaskWithRelations } from '@repo/shared/types';
import { useWebSocket } from './use-websocket';
import { api } from '@/lib/api';

interface TaskEventPayload {
  userId: string;
  task: TaskWithRelations;
}

interface TaskDeletedPayload {
  userId: string;
  taskId: string;
}

export function useRealTimeTasks(
  projectId: string,
  currentUserId: string,
  tasks: TaskWithRelations[],
  setTasks: (tasks: TaskWithRelations[] | ((prev: TaskWithRelations[]) => TaskWithRelations[])) => void
) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket || !projectId) return;

    // Join the project room
    socket.emit('join:project', { projectId });

    // Handle task created
    const handleTaskCreated = (payload: TaskEventPayload) => {
      // Add task to list (including from current user to update UI immediately)
      // Prevent duplicates by checking if task already exists
      setTasks((current) => {
        if (current.some((t) => t.id === payload.task.id)) {
          return current; // Task already exists, skip
        }
        return [...current, payload.task];
      });
    };

    // Handle task updated
    const handleTaskUpdated = (payload: TaskEventPayload) => {
      // Prevent infinite loops - ignore events from current user
      if (payload.userId === currentUserId) return;

      setTasks(tasks.map((t) => (t.id === payload.task.id ? payload.task : t)));
    };

    // Handle task status changed
    const handleTaskStatusChanged = (payload: TaskEventPayload) => {
      // Prevent infinite loops - ignore events from current user
      if (payload.userId === currentUserId) return;

      setTasks(tasks.map((t) => (t.id === payload.task.id ? payload.task : t)));
    };

    // Handle task deleted
    const handleTaskDeleted = (payload: TaskDeletedPayload) => {
      // Prevent infinite loops - ignore events from current user
      if (payload.userId === currentUserId) return;

      setTasks(tasks.filter((t) => t.id !== payload.taskId));
    };

    // Handle reconnection - refetch all tasks to reconcile missed events
    const handleReconnect = async () => {
      try {
        const session = await fetch('/api/auth/session').then((r) => r.json());
        const token = session?.accessToken;

        if (!token) {
          console.error('No access token - cannot refetch tasks');
          return;
        }

        const updatedTasks = await api.get<TaskWithRelations[]>(
          `/api/projects/${projectId}/tasks`,
          token
        );
        setTasks(updatedTasks);
        console.log('Tasks refetched after reconnection');
      } catch (error) {
        console.error('Failed to refetch tasks after reconnection:', error);
      }
    };

    // Register event listeners
    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:status_changed', handleTaskStatusChanged);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('connect', handleReconnect);

    // Cleanup on unmount
    return () => {
      socket.emit('leave:project', { projectId });
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:status_changed', handleTaskStatusChanged);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('connect', handleReconnect);
    };
  }, [socket, projectId, currentUserId, tasks, setTasks]);
}
