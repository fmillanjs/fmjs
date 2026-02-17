'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskWithRelations } from '@repo/shared/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
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
    <Card className="flex flex-col min-h-[500px]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">
            {title}
            <span className="ml-2 font-normal text-muted-foreground">({count})</span>
          </h3>
          <button
            onClick={onAddTask}
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            + Add
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {/* droppable area — UNCHANGED */}
        <div
          ref={setNodeRef}
          className={`
            flex-1 space-y-3 rounded-lg transition-colors
            ${isOver ? 'bg-accent border-2 border-primary/30 border-dashed' : 'border-2 border-transparent'}
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
      </CardContent>
    </Card>
  );
}
