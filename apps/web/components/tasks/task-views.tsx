'use client';

import { useState } from 'react';
import { TaskWithRelations, LabelBase } from '@repo/shared/types';
import { ViewToggle } from './view-toggle';
import { KanbanBoard } from './kanban-board';
import { TaskListView } from './task-list-view';
import { TaskForm } from './task-form';
import { Plus } from 'lucide-react';

interface TaskViewsProps {
  initialTasks: TaskWithRelations[];
  projectId: string;
  teamMembers: Array<{ id: string; name: string | null; image: string | null }>;
  labels: LabelBase[];
}

export function TaskViews({ initialTasks, projectId, teamMembers, labels }: TaskViewsProps) {
  const [view, setView] = useState<'board' | 'list'>('board');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    // Force a router refresh to re-fetch data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* View controls */}
      <div className="flex items-center justify-between">
        <ViewToggle currentView={view} onChange={setView} />
        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Task views */}
      {view === 'board' ? (
        <KanbanBoard
          key={refreshKey}
          initialTasks={initialTasks}
          projectId={projectId}
          teamMembers={teamMembers}
          labels={labels}
        />
      ) : (
        <TaskListView
          key={refreshKey}
          tasks={initialTasks}
          projectId={projectId}
          teamMembers={teamMembers}
          labels={labels}
          onRefresh={handleRefresh}
        />
      )}

      {isNewTaskOpen && (
        <TaskForm
          mode="create"
          projectId={projectId}
          teamMembers={teamMembers}
          labels={labels}
          onClose={() => setIsNewTaskOpen(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
