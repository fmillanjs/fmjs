'use client';

import { useEffect } from 'react';
import { useWebSocket } from './use-websocket';
import { CommentWithAuthor } from '@repo/shared/types';

interface CommentEvent {
  type: 'comment:created' | 'comment:updated' | 'comment:deleted';
  comment?: CommentWithAuthor;
  commentId: string;
  taskId: string;
  userId: string;
  projectId: string;
  timestamp: number;
}

export function useRealTimeComments(
  taskId: string,
  projectId: string,
  currentUserId: string,
  comments: CommentWithAuthor[],
  setComments: React.Dispatch<React.SetStateAction<CommentWithAuthor[]>>,
) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket || !taskId || !currentUserId) return;

    // Listen for comment:created events
    const handleCommentCreated = (event: CommentEvent) => {
      // [DEBUG] Log event receipt
      console.log('[Real-time Comments] Received comment:created:', event.comment?.id, 'from user:', event.userId);

      // Only update if it's for this task and from another user
      if (event.taskId === taskId && event.userId !== currentUserId && event.comment) {
        setComments((current) => [...current, event.comment!]);
      }
    };

    // Listen for comment:updated events
    const handleCommentUpdated = (event: CommentEvent) => {
      // Only update if it's for this task and from another user
      if (event.taskId === taskId && event.userId !== currentUserId && event.comment) {
        setComments((current) =>
          current.map((c) => (c.id === event.commentId ? event.comment! : c))
        );
      }
    };

    // Listen for comment:deleted events
    const handleCommentDeleted = (event: CommentEvent) => {
      // Only update if it's for this task and from another user
      if (event.taskId === taskId && event.userId !== currentUserId) {
        setComments((current) => current.filter((c) => c.id !== event.commentId));
      }
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:updated', handleCommentUpdated);
    socket.on('comment:deleted', handleCommentDeleted);

    // Cleanup listeners on unmount
    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:updated', handleCommentUpdated);
      socket.off('comment:deleted', handleCommentDeleted);
    };
  }, [socket, taskId, currentUserId, setComments]);
}
