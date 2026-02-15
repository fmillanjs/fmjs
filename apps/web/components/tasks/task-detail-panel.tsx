'use client';

import { useState, useCallback } from 'react';
import { TaskDetail, LabelBase } from '@repo/shared/types';
import { TaskStatus, TaskPriority } from '@repo/shared/types/enums';
import { formatDistanceToNow } from 'date-fns';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { CommentThread } from './comment-thread';
import { CommentForm } from './comment-form';
import { useRouter } from 'next/navigation';

interface TaskDetailPanelProps {
  task: TaskDetail;
  teamMembers: Array<{ id: string; name: string | null; image: string | null }>;
  labels: LabelBase[];
  teamId: string;
  projectId: string;
}

const statusColors: Record<TaskStatus, { bg: string; text: string }> = {
  TODO: { bg: 'bg-blue-100', text: 'text-blue-800' },
  IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  DONE: { bg: 'bg-green-100', text: 'text-green-800' },
  BLOCKED: { bg: 'bg-red-100', text: 'text-red-800' },
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

const priorityColors: Record<TaskPriority, { bg: string; text: string }> = {
  URGENT: { bg: 'bg-red-100', text: 'text-red-800' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  LOW: { bg: 'bg-slate-100', text: 'text-slate-800' },
};

const priorityLabels: Record<TaskPriority, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export function TaskDetailPanel({ task, teamMembers, labels, teamId, projectId }: TaskDetailPanelProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentTask, setCurrentTask] = useState(task);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const token = (session as any)?.accessToken;

  const updateField = useCallback(async (field: string, value: any) => {
    if (!token) return;

    setIsSaving(true);
    try {
      const updated = await api.patch<TaskDetail>(
        `/tasks/${currentTask.id}`,
        { [field]: value },
        token
      );
      setCurrentTask(updated);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task');
    } finally {
      setIsSaving(false);
    }
  }, [currentTask.id, token]);

  const handleTitleSave = async () => {
    if (editedTitle.trim() && editedTitle !== currentTask.title) {
      await updateField('title', editedTitle.trim());
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
      await updateField('description', editedDescription || null);
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
      await api.delete(`/tasks/${currentTask.id}`, token);
      router.push(`/teams/${teamId}/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  };

  const handleCommentsUpdate = () => {
    // Refresh the page to get updated comments
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Title */}
        <div className="bg-white shadow rounded-lg p-6">
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
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-2 py-1"
              onClick={() => setIsEditingTitle(true)}
            >
              {currentTask.title}
            </h1>
          )}

          {/* Description */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
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
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleDescriptionCancel}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="text-gray-600 cursor-pointer hover:bg-gray-50 rounded px-3 py-2 min-h-[60px]"
                onClick={() => setIsEditingDescription(true)}
              >
                {currentTask.description || <span className="text-gray-400 italic">Click to add a description...</span>}
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Comments ({currentTask.comments.length})
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <CommentThread comments={currentTask.comments} taskId={currentTask.id} onUpdate={handleCommentsUpdate} />
            <CommentForm taskId={currentTask.id} onCommentAdded={handleCommentsUpdate} />
          </div>
        </div>
      </div>

      {/* Metadata Sidebar - Right Column */}
      <div className="lg:col-span-1">
        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          {isSaving && (
            <div className="text-xs text-blue-600 font-medium">Saving...</div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select
              value={currentTask.assigneeId || ''}
              onChange={(e) => updateField('assigneeId', e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.id}
                </option>
              ))}
            </select>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={currentTask.dueDate ? format(new Date(currentTask.dueDate), 'yyyy-MM-dd') : ''}
              onChange={(e) => updateField('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          {/* Created By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
            <div className="flex items-center gap-2">
              {currentTask.createdBy.image ? (
                <img src={currentTask.createdBy.image} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                  {currentTask.createdBy.name?.[0] || '?'}
                </div>
              )}
              <span className="text-sm text-gray-600">{currentTask.createdBy.name}</span>
            </div>
          </div>

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
            <div className="text-sm text-gray-600">
              {formatDistanceToNow(new Date(currentTask.createdAt), { addSuffix: true })}
            </div>
          </div>

          {/* Updated At */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
            <div className="text-sm text-gray-600">
              {formatDistanceToNow(new Date(currentTask.updatedAt), { addSuffix: true })}
            </div>
          </div>

          {/* Delete Button */}
          <div className="pt-4 border-t border-gray-200">
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
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
    </div>
  );
}
