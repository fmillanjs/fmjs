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
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="w-full text-2xl font-bold border-2 border-blue-500 rounded px-2 py-1 focus:outline-none"
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
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="w-full border-2 border-blue-500 rounded px-3 py-2 focus:outline-none min-h-[120px]"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleDescriptionSave}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleDescriptionCancel}
                    className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded hover:bg-accent"
                  >
                    Cancel
                  </button>
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
        <div className="bg-card shadow rounded-lg">
          {/* Tab Headers */}
          <div className="border-b border-border">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                History
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'comments' ? (
              <div className="space-y-6">
                <CommentThread comments={comments} taskId={currentTask.id} onUpdate={handleCommentsUpdate} />
                <CommentForm taskId={currentTask.id} onCommentAdded={handleCommentsUpdate} />
              </div>
            ) : (
              <TaskHistory taskId={currentTask.id} projectId={projectId} />
            )}
          </div>
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
            <select
              value={currentTask.status}
              onChange={(e) => updateField('status', e.target.value)}
              className={`w-full px-3 py-2 rounded font-medium ${statusColors[currentTask.status].bg} ${statusColors[currentTask.status].text}`}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Priority</label>
            <select
              value={currentTask.priority}
              onChange={(e) => updateField('priority', e.target.value)}
              className={`w-full px-3 py-2 rounded font-medium ${priorityColors[currentTask.priority].bg} ${priorityColors[currentTask.priority].text}`}
            >
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Assignee</label>
            <select
              value={currentTask.assigneeId || ''}
              onChange={(e) => updateField('assigneeId', e.target.value || null)}
              className="w-full px-3 py-2 border border-border rounded"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
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
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 text-sm bg-muted text-muted-foreground rounded hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Task
              </button>
            )}
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
