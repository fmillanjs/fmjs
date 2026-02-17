'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskWithRelations } from '@repo/shared/types';
import { SortableTaskCard } from './sortable-task-card';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: TaskWithRelations[];
  count: number;
  onTaskClick: (task: TaskWithRelations) => void;
  onAddTask: () => void;
}

export function KanbanColumn({ id, title, tasks, count, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'column', status: id },
  });

  return (
    <div className="flex flex-col bg-muted rounded-lg p-4 min-h-[500px]">
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">
          {title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">({count})</span>
        </h3>
        <button
          onClick={onAddTask}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          + Add
        </button>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 space-y-3 rounded-lg transition-colors
          ${isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'border-2 border-transparent'}
          ${tasks.length === 0 ? 'border-2 border-dashed border-border flex items-center justify-center' : ''}
        `}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">Drop tasks here</p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
