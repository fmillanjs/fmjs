'use client';

import { useState, useOptimistic, startTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TaskWithRelations, LabelBase } from '@repo/shared/types';
import { TaskStatus } from '@repo/shared/types/enums';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { TaskForm } from './task-form';
import { api } from '@/lib/api';
import { ConflictWarning } from '../ui/conflict-warning';

interface KanbanBoardProps {
  initialTasks: TaskWithRelations[];
  projectId: string;
  orgSlug: string;
  teamMembers: Array<{ id: string; name: string | null; image: string | null }>;
  labels: LabelBase[];
}

const STATUS_COLUMNS = [
  { id: TaskStatus.TODO, title: 'To Do' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress' },
  { id: TaskStatus.DONE, title: 'Done' },
  { id: TaskStatus.BLOCKED, title: 'Blocked' },
] as const;

export function KanbanBoard({ initialTasks, projectId, orgSlug, teamMembers, labels }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(tasks);
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [prefilledStatus, setPrefilledStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  const [conflictTaskId, setConflictTaskId] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine target status from the column or task
    // When dropping on a column: over.data.current.status contains the status
    // When dropping on a task: over.data.current.task.status contains the status
    const targetStatus = over.data.current?.status || over.data.current?.task?.status;

    if (task.status === targetStatus) return;

    // Optimistically update the UI
    const updatedTask = { ...task, status: targetStatus as TaskStatus };
    startTransition(() => {
      setOptimisticTasks((current) =>
        current.map((t) => (t.id === taskId ? updatedTask : t))
      );
    });

    try {
      // Fetch access token
      const session = await fetch('/api/auth/session').then((r) => r.json());
      const token = session?.accessToken;

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Update task status via API with version
      await api.patch(`/api/tasks/${taskId}/status`, {
        status: targetStatus,
        version: task.version
      }, token);

      // Update actual state after successful API call
      setTasks((current) => current.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (error: any) {
      console.error('Failed to update task status:', error);

      // Check if it's a 409 conflict error
      if (error?.response?.status === 409) {
        setConflictTaskId(taskId);
        setConflictMessage('This task was modified by another user.');
        setShowConflict(true);
        // Refetch tasks to get latest state
        handleFormSuccess();
      }
      // Optimistic update will automatically revert on error
      // because we didn't update the actual tasks state
    }
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleAddTask = (status: TaskStatus) => {
    setPrefilledStatus(status);
    setSelectedTask(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleFormSuccess = async () => {
    // Refresh tasks from server
    try {
      const session = await fetch('/api/auth/session').then((r) => r.json());
      const token = session?.accessToken;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const updatedTasks = await api.get<TaskWithRelations[]>(
        `/organizations/${orgSlug}/projects/${projectId}/tasks`,
        token
      );
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    }
  };

  // Group tasks by status
  const tasksByStatus = STATUS_COLUMNS.reduce(
    (acc, column) => {
      acc[column.id] = optimisticTasks.filter((task) => task.status === column.id);
      return acc;
    },
    {} as Record<TaskStatus, TaskWithRelations[]>
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasksByStatus[column.id]}
              count={tasksByStatus[column.id].length}
              onTaskClick={handleTaskClick}
              onAddTask={() => handleAddTask(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {isFormOpen && (
        <TaskForm
          mode={formMode}
          task={selectedTask || undefined}
          projectId={projectId}
          teamMembers={teamMembers}
          labels={labels}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          prefilledStatus={prefilledStatus}
        />
      )}

      {showConflict && conflictTaskId && (
        <ConflictWarning
          taskId={conflictTaskId}
          message={conflictMessage}
          onReload={handleFormSuccess}
          onDismiss={() => setShowConflict(false)}
        />
      )}
    </>
  );
}
