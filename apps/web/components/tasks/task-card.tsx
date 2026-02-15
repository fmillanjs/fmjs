'use client';

import { TaskWithRelations } from '@repo/shared/types';
import { TaskPriority, TaskStatus } from '@repo/shared/types/enums';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, MessageSquare } from 'lucide-react';

interface TaskCardProps {
  task: TaskWithRelations;
  isDragging?: boolean;
  onClick?: () => void;
}

const priorityColors: Record<TaskPriority, { bg: string; text: string; border: string }> = {
  URGENT: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-500' },
  HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-500' },
  MEDIUM: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-500' },
  LOW: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-500' },
};

const statusColors: Record<TaskStatus, { bg: string; text: string }> = {
  TODO: { bg: 'bg-blue-50', text: 'text-blue-700' },
  IN_PROGRESS: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  DONE: { bg: 'bg-green-50', text: 'text-green-700' },
  BLOCKED: { bg: 'bg-red-50', text: 'text-red-700' },
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

export function TaskCard({ task, isDragging = false, onClick }: TaskCardProps) {
  const priorityColor = priorityColors[task.priority];
  const statusColor = statusColors[task.status];

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border-2 p-3 cursor-pointer transition-all
        ${priorityColor.border}
        ${isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'}
      `}
    >
      {/* Priority and Status badges */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${priorityColor.bg} ${priorityColor.text}`}
        >
          {task.priority}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${statusColor.bg} ${statusColor.text}`}>
          {statusLabels[task.status]}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-sm mb-2 line-clamp-2">{task.title}</h3>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center gap-1"
              title={label.name}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <span className="text-xs text-gray-600">{label.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Assignee and metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
        <div className="flex items-center gap-2">
          {/* Assignee */}
          {task.assignee ? (
            <div className="flex items-center gap-1">
              {task.assignee.image ? (
                <img
                  src={task.assignee.image}
                  alt={task.assignee.name || 'User'}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                  {task.assignee.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-xs">{task.assignee.name}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Unassigned</span>
          )}
        </div>

        {/* Due date and comments */}
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}</span>
            </div>
          )}
          {task._count.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>{task._count.comments}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
