'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { TaskWithRelations, LabelBase } from '@repo/shared/types';
import { ViewToggle } from './view-toggle';
import { KanbanBoard } from './kanban-board';
import { TaskListView } from './task-list-view';
import { TaskForm } from './task-form';
import { TaskSearch } from './task-search';
import { TaskFilters } from './task-filters';
import { Plus } from 'lucide-react';
import { useRealTimeTasks } from '@/hooks/use-real-time-tasks';

interface TaskViewsProps {
  initialTasks: TaskWithRelations[];
  projectId: string;
  teamMembers: Array<{ id: string; name: string | null; image: string | null }>;
  labels: LabelBase[];
}

export function TaskViews({ initialTasks, projectId, teamMembers, labels }: TaskViewsProps) {
  const { data: session } = useSession();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tasks, setTasks] = useState(initialTasks);

  // Real-time task updates from other users
  useRealTimeTasks(projectId, session?.user?.id || '', tasks, setTasks);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    // Force a router refresh to re-fetch data
    window.location.reload();
  };

  // Check if filters are active (client-side check)
  const hasActiveFilters =
    typeof window !== 'undefined' &&
    (window.location.search.includes('status=') ||
      window.location.search.includes('priority=') ||
      window.location.search.includes('assignee=') ||
      window.location.search.includes('labels=') ||
      window.location.search.includes('search='));

  const isEmpty = tasks.length === 0;

  return (
    <div className="space-y-6">
      {/* Search */}
      <TaskSearch />

      {/* Filters */}
      <TaskFilters teamMembers={teamMembers} labels={labels} />

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

      {/* Empty state when filters are active but no results */}
      {isEmpty && hasActiveFilters ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks match your filters</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search criteria or clearing some filters to see more results.
            </p>
            <a
              href={window.location.pathname}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </a>
          </div>
        </div>
      ) : (
        /* Task views */
        <>
          {view === 'board' ? (
            <KanbanBoard
              key={refreshKey}
              initialTasks={tasks}
              projectId={projectId}
              teamMembers={teamMembers}
              labels={labels}
            />
          ) : (
            <TaskListView
              key={refreshKey}
              tasks={tasks}
              projectId={projectId}
              teamMembers={teamMembers}
              labels={labels}
              onRefresh={handleRefresh}
            />
          )}
        </>
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
