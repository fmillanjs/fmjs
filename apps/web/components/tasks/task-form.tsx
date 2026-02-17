'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, updateTaskSchema, CreateTaskInput, UpdateTaskInput } from '@repo/shared/validators';
import { TaskStatus, TaskPriority } from '@repo/shared/types/enums';
import { LabelBase, TaskWithRelations } from '@repo/shared/types';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

// Phase 07.1-03 Fix: Added email field to teamMembers for proper user identification
interface TaskFormProps {
  mode: 'create' | 'edit';
  task?: TaskWithRelations;
  projectId: string;
  teamMembers: Array<{ id: string; name: string | null; email: string; image: string | null }>;
  labels: LabelBase[];
  onClose: () => void;
  onSuccess: () => void;
  prefilledStatus?: TaskStatus;
}

export function TaskForm({
  mode,
  task,
  projectId,
  teamMembers,
  labels,
  onClose,
  onSuccess,
  prefilledStatus,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: mode === 'create'
      ? zodResolver(createTaskSchema)
      : zodResolver(updateTaskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || prefilledStatus || TaskStatus.TODO,
      priority: task?.priority || TaskPriority.MEDIUM,
      dueDate: task?.dueDate ? (new Date(task.dueDate).toISOString().split('T')[0] as any) : undefined,
      assigneeId: task?.assigneeId || undefined,
      labelIds: task?.labels.map((l) => l.id) || [],
      ...(mode === 'create' && { projectId }),
    },
  } as any);

  const selectedLabelIds = watch('labelIds') || [];

  const onSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get access token from session storage or context
      const session = await fetch('/api/auth/session').then((r) => r.json());
      const token = session?.accessToken;

      if (!token) {
        throw new Error('Not authenticated');
      }

      if (mode === 'create') {
        await api.post(`/api/projects/${projectId}/tasks`, data, token);
      } else if (task) {
        // Include version for conflict detection
        const updateData = { ...data, version: task.version };
        await api.patch(`/api/tasks/${task.id}`, updateData, token);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    const current = selectedLabelIds || [];
    if (current.includes(labelId)) {
      setValue(
        'labelIds',
        current.filter((id: string) => id !== labelId)
      );
    } else {
      setValue('labelIds', [...current, labelId]);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'create' ? 'Create Task' : 'Edit Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="bg-[var(--red-3)] border border-[var(--red-6)] text-[var(--red-11)] px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground bg-card"
              placeholder="Task title"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{String(errors.title.message)}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground bg-card"
              placeholder="Task description (optional)"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{String(errors.description.message)}</p>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground bg-card"
              >
                <option value={TaskStatus.TODO}>To Do</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.DONE}>Done</option>
                <option value={TaskStatus.BLOCKED}>Blocked</option>
              </select>
              {errors.status && (
                <p className="text-red-600 text-sm mt-1">{String(errors.status.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Priority
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground bg-card"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
                <option value={TaskPriority.URGENT}>Urgent</option>
              </select>
              {errors.priority && (
                <p className="text-red-600 text-sm mt-1">{String(errors.priority.message)}</p>
              )}
            </div>
          </div>

          {/* Due Date and Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Due Date
              </label>
              <input
                {...register('dueDate')}
                type="date"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground bg-card"
              />
              {errors.dueDate && (
                <p className="text-red-600 text-sm mt-1">{String(errors.dueDate.message)}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Assignee
              </label>
              <select
                {...register('assigneeId')}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground bg-card"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </select>
              {errors.assigneeId && (
                <p className="text-red-600 text-sm mt-1">{String(errors.assigneeId.message)}</p>
              )}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-colors
                    ${
                      selectedLabelIds.includes(label.id)
                        ? 'border-primary bg-accent'
                        : 'border-border bg-card hover:border-foreground'
                    }
                  `}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-sm text-foreground">{label.name}</span>
                </button>
              ))}
              {labels.length === 0 && (
                <p className="text-sm text-muted-foreground">No labels available</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground bg-muted rounded-md hover:bg-accent transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
