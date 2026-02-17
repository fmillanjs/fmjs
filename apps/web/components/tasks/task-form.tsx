'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, updateTaskSchema, CreateTaskInput, UpdateTaskInput } from '@repo/shared/validators';
import { TaskStatus, TaskPriority } from '@repo/shared/types/enums';
import { LabelBase, TaskWithRelations } from '@repo/shared/types';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Phase 07.1-03 Fix: Added email field to teamMembers for proper user identification
interface TaskFormProps {
  mode: 'create' | 'edit';
  task?: TaskWithRelations;
  projectId: string;
  teamMembers: Array<{ id: string; name: string | null; email: string; image: string | null }>;
  labels: LabelBase[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  prefilledStatus?: TaskStatus;
}

export function TaskForm({
  mode,
  task,
  projectId,
  teamMembers,
  labels,
  open,
  onOpenChange,
  onSuccess,
  prefilledStatus,
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    resolver: mode === 'create' ? zodResolver(createTaskSchema) : zodResolver(updateTaskSchema),
    mode: 'onBlur',
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || prefilledStatus || TaskStatus.TODO,
      priority: task?.priority || TaskPriority.MEDIUM,
      dueDate: task?.dueDate ? (new Date(task.dueDate).toISOString().split('T')[0] as any) : '',
      assigneeId: task?.assigneeId || '',
      labelIds: task?.labels.map((l) => l.id) || [],
      ...(mode === 'create' && { projectId }),
    },
  } as any);

  const selectedLabelIds = form.watch('labelIds') || [];

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
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    const current = selectedLabelIds || [];
    if (current.includes(labelId)) {
      form.setValue(
        'labelIds',
        current.filter((id: string) => id !== labelId)
      );
    } else {
      form.setValue('labelIds', [...current, labelId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Task' : 'Edit Task'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new task to this project.'
              : 'Update the task details below.'}
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div role="alert" className="bg-[var(--red-3)] border border-[var(--red-6)] text-[var(--red-11)] px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Title */}
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title <span className="text-[var(--red-11)]">*</span></FormLabel>
                <FormControl><Input type="text" {...field} placeholder="Task title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Description */}
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={4} {...field} placeholder="Task description (optional)" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                      <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                      <SelectItem value={TaskStatus.BLOCKED}>Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                      <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Due Date and Assignee */}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="assigneeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Labels */}
            <div>
              <div role="group" aria-labelledby="labels-heading">
                <p id="labels-heading" className="text-sm font-medium text-muted-foreground mb-2">Labels</p>
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
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
