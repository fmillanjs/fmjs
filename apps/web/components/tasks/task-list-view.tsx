'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { TaskWithRelations, LabelBase } from '@repo/shared/types';
import { TaskPriority, TaskStatus } from '@repo/shared/types/enums';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';
import { TaskForm } from './task-form';

// Phase 07.1-03 Fix: Added email field to teamMembers for proper user identification
interface TaskListViewProps {
  tasks: TaskWithRelations[];
  projectId: string;
  teamMembers: Array<{ id: string; name: string | null; email: string; image: string | null }>;
  labels: LabelBase[];
  onRefresh: () => void;
}

const priorityColors: Record<TaskPriority, { bg: string; text: string }> = {
  URGENT: { bg: 'bg-[var(--red-3)]', text: 'text-[var(--red-11)]' },
  HIGH: { bg: 'bg-[var(--amber-3)]', text: 'text-[var(--amber-11)]' },
  MEDIUM: { bg: 'bg-[var(--amber-3)]', text: 'text-[var(--amber-11)]' },
  LOW: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

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

const columnHelper = createColumnHelper<TaskWithRelations>();

export function TaskListView({ tasks, projectId, teamMembers, labels, onRefresh }: TaskListViewProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => (
        <div className="font-medium text-foreground">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        const color = statusColors[status];
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${color.bg} ${color.text}`}>
            {statusLabels[status]}
          </span>
        );
      },
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: (info) => {
        const priority = info.getValue();
        const color = priorityColors[priority];
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${color.bg} ${color.text}`}>
            {priority}
          </span>
        );
      },
    }),
    columnHelper.accessor('assignee', {
      header: 'Assignee',
      cell: (info) => {
        const assignee = info.getValue();
        if (!assignee) {
          return <span className="text-muted-foreground text-sm">Unassigned</span>;
        }
        return (
          <div className="flex items-center gap-2">
            {assignee.image ? (
              <img
                src={assignee.image}
                alt={assignee.name || 'User'}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                {assignee.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <span className="text-sm">{assignee.name}</span>
          </div>
        );
      },
      enableSorting: false,
    }),
    columnHelper.accessor('dueDate', {
      header: 'Due Date',
      cell: (info) => {
        const dueDate = info.getValue();
        if (!dueDate) return <span className="text-muted-foreground text-sm">-</span>;

        const isOverdue = new Date(dueDate) < new Date() && info.row.original.status !== 'DONE';
        return (
          <div className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-[var(--red-11)] font-medium' : 'text-muted-foreground'}`}>
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(dueDate), { addSuffix: true })}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('labels', {
      header: 'Labels',
      cell: (info) => {
        const labels = info.getValue();
        if (labels.length === 0) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-1"
                title={label.name}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-xs text-muted-foreground hidden md:inline">{label.name}</span>
              </div>
            ))}
          </div>
        );
      },
      enableSorting: false,
    }),
    columnHelper.accessor('_count.comments', {
      header: 'Comments',
      cell: (info) => {
        const count = info.getValue();
        if (count === 0) return null;
        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            <span className="hidden md:inline">{count}</span>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleRowClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    onRefresh();
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-muted rounded-lg">
        <p className="text-muted-foreground">No tasks yet. Create your first task.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto bg-card rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-muted-foreground">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4 opacity-0 group-hover:opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row.original)}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TaskForm
        key={selectedTask?.id || 'new'}
        open={isFormOpen && !!selectedTask}
        onOpenChange={setIsFormOpen}
        mode="edit"
        task={selectedTask || undefined}
        projectId={projectId}
        teamMembers={teamMembers}
        labels={labels}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}
