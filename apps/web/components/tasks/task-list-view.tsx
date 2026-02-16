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
  URGENT: { bg: 'bg-red-100', text: 'text-red-700' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  LOW: { bg: 'bg-slate-100', text: 'text-slate-700' },
};

const statusColors: Record<TaskStatus, { bg: string; text: string }> = {
  TODO: { bg: 'bg-blue-100', text: 'text-blue-700' },
  IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  DONE: { bg: 'bg-green-100', text: 'text-green-700' },
  BLOCKED: { bg: 'bg-red-100', text: 'text-red-700' },
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
        <div className="font-medium text-gray-900">{info.getValue()}</div>
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
          return <span className="text-gray-400 text-sm">Unassigned</span>;
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
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
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
        if (!dueDate) return <span className="text-gray-400 text-sm">-</span>;

        const isOverdue = new Date(dueDate) < new Date() && info.row.original.status !== 'DONE';
        return (
          <div className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
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
                <span className="text-xs text-gray-600 hidden md:inline">{label.name}</span>
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
          <div className="flex items-center gap-1 text-sm text-gray-600">
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
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No tasks yet. Create your first task.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
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
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row.original)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
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

      {isFormOpen && selectedTask && (
        <TaskForm
          mode="edit"
          task={selectedTask}
          projectId={projectId}
          teamMembers={teamMembers}
          labels={labels}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
