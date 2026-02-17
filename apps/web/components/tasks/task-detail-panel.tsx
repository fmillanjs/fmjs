'use client';

import { useState, useCallback, useEffect } from 'react';
import { TaskDetail, LabelBase } from '@repo/shared/types';
import { TaskStatus, TaskPriority } from '@repo/shared/types/enums';
import { formatDistanceToNow } from 'date-fns';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { CommentThread } from './comment-thread';
import { CommentForm } from './comment-form';
import { TaskHistory } from './task-history';
import { useRouter } from 'next/navigation';
import { useRealTimeComments } from '@/hooks/use-real-time-comments';
import { useWebSocket } from '@/hooks/use-websocket';
import { ConflictWarning } from '../ui/conflict-warning';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Phase 07.1-03 Fix: Added email field to teamMembers for proper user identification
interface TaskDetailPanelProps {
  task: TaskDetail;
  teamMembers: Array<{ id: string; name: string | null; email: string; image: string | null }>;
  labels: LabelBase[];
  teamId: string;
  projectId: string;
}

const statusColors: Record<TaskStatus, { bg: string; text: string }> = {
  TODO: { bg: 'bg-[var(--blue-3)]', text: 'text-[var(--blue-11)]' },
  IN_PROGRESS: { bg: 'bg-[var(--amber-3)]', text: 'text-[var(--amber-11)]' },
  DONE: { bg: 'bg-[var(--green-3)]', text: 'text-[var(--green-11)]' },
  BLOCKED: { bg: 'bg-[var(--red-3)]', text: 'text-[var(--red-11)]' },
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

const priorityColors: Record<TaskPriority, { bg: string; text: string }> = {
  URGENT: { bg: 'bg-[var(--red-3)]', text: 'text-[var(--red-11)]' },
  HIGH: { bg: 'bg-[var(--amber-3)]', text: 'text-[var(--amber-11)]' },
  MEDIUM: { bg: 'bg-[var(--amber-3)]', text: 'text-[var(--amber-11)]' },
  LOW: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

const priorityLabels: Record<TaskPriority, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export function TaskDetailPanel({ task, teamMembers, labels, teamId, projectId }: TaskDetailPanelProps) {
  const { data: session } = useSession();
  const { socket } = useWebSocket();
  const router = useRouter();
  const [currentTask, setCurrentTask] = useState(task);
  const [comments, setComments] = useState(task.comments);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  const token = (session as any)?.accessToken;
  const currentUserId = session?.user?.id || '';

  // Real-time comment updates from other users
  useRealTimeComments(currentTask.id, projectId, currentUserId, comments, setComments);

  // Listen for task updates from other users
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleTaskUpdated = (event: any) => {
      // Only update if it's this task and from another user
      if (event.task?.id === currentTask.id && event.userId !== currentUserId) {
        // Update local state with the new version to prevent conflicts
        setCurrentTask(event.task);
        setEditedTitle(event.task.title);
        setEditedDescription(event.task.description || '');
      }
    };

    socket.on('task:updated', handleTaskUpdated);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
    };
  }, [socket, currentTask.id, currentUserId]);

  const updateField = useCallback(async (field: string, value: any, useVersionCheck = false) => {
    if (!token) return;

    setIsSaving(true);
    try {
      // Only use version checking for deliberate text edits (title, description)
      // Dropdown changes (status, priority, assignee, labels) don't need OCC
      const payload = useVersionCheck
        ? { [field]: value, version: currentTask.version }
        : { [field]: value };

      const updated = await api.patch<TaskDetail>(
        `/api/tasks/${currentTask.id}`,
        payload,
        token
      );
      setCurrentTask(updated);
    } catch (error: any) {
      console.error('Failed to update task:', error);

      // Check if it's a 409 conflict error
      if (error?.response?.status === 409) {
        setConflictMessage('This task was modified by another user.');
        setShowConflict(true);
      } else {
        alert('Failed to update task');
      }
    } finally {
      setIsSaving(false);
    }
  }, [currentTask.id, currentTask.version, token]);

  const handleTitleSave = async () => {
    if (editedTitle.trim() && editedTitle !== currentTask.title) {
      await updateField('title', editedTitle.trim(), true); // Use version check for text edits
    } else {
      setEditedTitle(currentTask.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(currentTask.title);
      setIsEditingTitle(false);
    }
  };

  const handleDescriptionSave = async () => {
    if (editedDescription !== (currentTask.description || '')) {
      await updateField('description', editedDescription || null, true); // Use version check for text edits
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setEditedDescription(currentTask.description || '');
    setIsEditingDescription(false);
  };

  const handleDelete = async () => {
    if (!token) return;

    try {
      await api.delete(`/api/tasks/${currentTask.id}`, token);
      router.push(`/teams/${teamId}/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  };

  const handleCommentsUpdate = async () => {
    // Refetch comments from API to get latest data
    try {
      const updatedTask = await api.get<TaskDetail>(`/api/tasks/${currentTask.id}`, token);
      setComments(updatedTask.comments);
    } catch (error) {
      console.error('Failed to fetch updated comments:', error);
    }
  };

  const handleRefreshTask = async () => {
    // Refetch the entire task to get the latest version
    try {
      const updatedTask = await api.get<TaskDetail>(`/api/tasks/${currentTask.id}`, token);
      setCurrentTask(updatedTask);
      setEditedTitle(updatedTask.title);
      setEditedDescription(updatedTask.description || '');
      setComments(updatedTask.comments);
      setShowConflict(false);
    } catch (error) {
      console.error('Failed to refresh task:', error);
      alert('Failed to refresh task');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Title */}
        <div className="bg-card shadow rounded-lg p-6">
          {isEditingTitle ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="w-full text-2xl font-bold"
              autoFocus
            />
          ) : (
            <h1
              className="text-2xl font-bold text-foreground cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
              onClick={() => setIsEditingTitle(true)}
            >
              {currentTask.title}
            </h1>
          )}

          {/* Description */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            {isEditingDescription ? (
              <div>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="min-h-[120px]"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleDescriptionSave}>Save</Button>
                  <Button size="sm" variant="outline" onClick={handleDescriptionCancel}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div
                className="text-muted-foreground cursor-pointer hover:bg-muted/50 rounded px-3 py-2 min-h-[60px]"
                onClick={() => setIsEditingDescription(true)}
              >
                {currentTask.description || <span className="text-muted-foreground italic">Click to add a description...</span>}
              </div>
            )}
          </div>
        </div>

        {/* Comments and History Tabs */}
        <div className="bg-card shadow rounded-lg overflow-hidden">
          <Tabs defaultValue="comments">
            <div className="border-b border-border">
              <TabsList className="w-full justify-start rounded-none h-auto bg-transparent px-6 gap-0">
                <TabsTrigger
                  value="comments"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-4"
                >
                  Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent py-4"
                >
                  History
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="comments" className="p-6 mt-0">
              <div className="space-y-6">
                <CommentThread comments={comments} taskId={currentTask.id} onUpdate={handleCommentsUpdate} />
                <CommentForm taskId={currentTask.id} onCommentAdded={handleCommentsUpdate} />
              </div>
            </TabsContent>
            <TabsContent value="history" className="p-6 mt-0">
              <TaskHistory taskId={currentTask.id} projectId={projectId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Metadata Sidebar - Right Column */}
      <div className="lg:col-span-1">
        <div className="bg-card shadow rounded-lg p-6 space-y-4">
          {isSaving && (
            <div className="text-xs text-primary font-medium">Saving...</div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
            <Select value={currentTask.status} onValueChange={(v) => updateField('status', v)}>
              <SelectTrigger className={`w-full font-medium ${statusColors[currentTask.status].bg} ${statusColors[currentTask.status].text}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Priority</label>
            <Select value={currentTask.priority} onValueChange={(v) => updateField('priority', v)}>
              <SelectTrigger className={`w-full font-medium ${priorityColors[currentTask.priority].bg} ${priorityColors[currentTask.priority].text}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Assignee</label>
            <Select value={currentTask.assigneeId || '__none__'} onValueChange={(v) => updateField('assigneeId', v === '__none__' ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Labels</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {labels.map((label) => {
                const isSelected = currentTask.labels.some((l) => l.id === label.id);
                return (
                  <label key={label.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newLabelIds = e.target.checked
                          ? [...currentTask.labels.map((l) => l.id), label.id]
                          : currentTask.labels.filter((l) => l.id !== label.id).map((l) => l.id);
                        updateField('labelIds', newLabelIds);
                      }}
                      className="rounded"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm">{label.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Due Date</label>
            <input
              type="date"
              value={currentTask.dueDate ? format(new Date(currentTask.dueDate), 'yyyy-MM-dd') : ''}
              onChange={(e) => updateField('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="w-full px-3 py-2 border border-border rounded"
            />
          </div>

          {/* Created By */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Created By</label>
            <div className="flex items-center gap-2">
              {currentTask.createdBy.image ? (
                <img src={currentTask.createdBy.image} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {currentTask.createdBy.name?.[0] || '?'}
                </div>
              )}
              <span className="text-sm text-muted-foreground">{currentTask.createdBy.name}</span>
            </div>
          </div>

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Created</label>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(currentTask.createdAt), { addSuffix: true })}
            </div>
          </div>

          {/* Updated At */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Last Updated</label>
            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(currentTask.updatedAt), { addSuffix: true })}
            </div>
          </div>

          {/* Delete Button */}
          <div className="pt-4 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">Delete Task</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All comments and history for this task will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleDelete}
                  >
                    Delete Task
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {showConflict && (
        <ConflictWarning
          taskId={task.id}
          message={conflictMessage}
          onReload={handleRefreshTask}
          onDismiss={() => setShowConflict(false)}
        />
      )}
    </div>
  );
}
