'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TaskWithRelations, LabelBase } from '@repo/shared/types';
import { ViewToggle } from './view-toggle';
import { KanbanBoard } from './kanban-board';
import { TaskListView } from './task-list-view';
import { TaskForm } from './task-form';
import { TaskSearch } from './task-search';
import { TaskFilters } from './task-filters';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, CheckSquare } from 'lucide-react';
import { useRealTimeTasks } from '@/hooks/use-real-time-tasks';

// Phase 07.1-03 Fix: Added email field to teamMembers for proper user identification
interface TaskViewsProps {
  initialTasks: TaskWithRelations[];
  projectId: string;
  orgSlug: string;
  teamMembers: Array<{ id: string; name: string | null; email: string; image: string | null }>;
  labels: LabelBase[];
}

export function TaskViews({ initialTasks, projectId, orgSlug, teamMembers, labels }: TaskViewsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tasks, setTasks] = useState(initialTasks);

  // Real-time task updates from other users
  useRealTimeTasks(projectId, session?.user?.id || '', tasks, setTasks);

  const handleRefresh = () => {
    // Increment refresh key to force re-render of task views
    // WebSocket will handle the actual data update via useRealTimeTasks
    setRefreshKey((prev) => prev + 1);
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

      {/* Empty states */}
      {isEmpty && hasActiveFilters ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-foreground mb-2">No tasks match your filters</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search criteria or clearing some filters to see more results.
            </p>
            <a
              href={window.location.pathname}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Clear all filters
            </a>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="bg-card border border-border rounded-lg p-12">
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Create your first task to get started organizing work for this project."
            action={
              <button
                onClick={() => setIsNewTaskOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Task
              </button>
            }
          />
        </div>
      ) : (
        /* Task views */
        <>
          {view === 'board' ? (
            <KanbanBoard
              key={refreshKey}
              initialTasks={tasks}
              projectId={projectId}
              orgSlug={orgSlug}
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
