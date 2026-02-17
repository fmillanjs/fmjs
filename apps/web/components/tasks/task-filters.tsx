'use client';

import { useTransition } from 'react';
import { useQueryStates, parseAsString, parseAsArrayOf } from 'nuqs';
import { TaskStatus, TaskPriority } from '@repo/shared/types/enums';
import { LabelBase } from '@repo/shared/types';
import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

// Phase 07.1-03 Fix: Added email field to teamMembers for proper user identification
interface TaskFiltersProps {
  teamMembers: Array<{ id: string; name: string | null; email: string; image: string | null }>;
  labels: LabelBase[];
}

const statusOptions = [
  { value: TaskStatus.TODO, label: 'To Do', color: 'bg-[var(--blue-3)] text-[var(--blue-11)]' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-[var(--amber-3)] text-[var(--amber-11)]' },
  { value: TaskStatus.DONE, label: 'Done', color: 'bg-[var(--green-3)] text-[var(--green-11)]' },
  { value: TaskStatus.BLOCKED, label: 'Blocked', color: 'bg-[var(--red-3)] text-[var(--red-11)]' },
];

const priorityOptions = [
  { value: TaskPriority.LOW, label: 'Low', color: 'bg-muted text-muted-foreground' },
  { value: TaskPriority.MEDIUM, label: 'Medium', color: 'bg-[var(--amber-3)] text-[var(--amber-11)]' },
  { value: TaskPriority.HIGH, label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: TaskPriority.URGENT, label: 'Urgent', color: 'bg-[var(--red-3)] text-[var(--red-11)]' },
];

const sortOptions = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
];

export function TaskFilters({ teamMembers, labels }: TaskFiltersProps) {
  const [isPending, startTransition] = useTransition();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [filters, setFilters] = useQueryStates(
    {
      status: parseAsArrayOf(parseAsString).withDefault([]),
      priority: parseAsArrayOf(parseAsString).withDefault([]),
      assignee: parseAsString.withDefault(''),
      labels: parseAsArrayOf(parseAsString).withDefault([]),
      sortBy: parseAsString.withDefault('createdAt'),
      sortOrder: parseAsString.withDefault('desc'),
    },
    {
      history: 'push',
    }
  );

  const toggleStatus = (value: string) => {
    startTransition(() => {
      const current = filters.status || [];
      const updated = current.includes(value)
        ? current.filter((s) => s !== value)
        : [...current, value];
      setFilters({ status: updated.length > 0 ? updated : null });
    });
  };

  const togglePriority = (value: string) => {
    startTransition(() => {
      const current = filters.priority || [];
      const updated = current.includes(value)
        ? current.filter((p) => p !== value)
        : [...current, value];
      setFilters({ priority: updated.length > 0 ? updated : null });
    });
  };

  const setAssignee = (value: string) => {
    startTransition(() => {
      setFilters({ assignee: value || null });
      setOpenDropdown(null);
    });
  };

  const toggleLabel = (value: string) => {
    startTransition(() => {
      const current = filters.labels || [];
      const updated = current.includes(value)
        ? current.filter((l) => l !== value)
        : [...current, value];
      setFilters({ labels: updated.length > 0 ? updated : null });
    });
  };

  const setSortBy = (value: string) => {
    startTransition(() => {
      setFilters({ sortBy: value });
      setOpenDropdown(null);
    });
  };

  const toggleSortOrder = () => {
    startTransition(() => {
      setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      setFilters({
        status: null,
        priority: null,
        assignee: null,
        labels: null,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });
  };

  const activeFilterCount =
    (filters.status?.length || 0) +
    (filters.priority?.length || 0) +
    (filters.assignee ? 1 : 0) +
    (filters.labels?.length || 0);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Status
            {filters.status && filters.status.length > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {filters.status.length}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>
          {openDropdown === 'status' && (
            <div className="absolute z-10 mt-2 w-56 bg-card border border-border rounded-md shadow-lg">
              <div className="p-2 space-y-1">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(option.value) || false}
                      onChange={() => toggleStatus(option.value)}
                      className="rounded border-border"
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Priority
            {filters.priority && filters.priority.length > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {filters.priority.length}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>
          {openDropdown === 'priority' && (
            <div className="absolute z-10 mt-2 w-56 bg-card border border-border rounded-md shadow-lg">
              <div className="p-2 space-y-1">
                {priorityOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.priority?.includes(option.value) || false}
                      onChange={() => togglePriority(option.value)}
                      className="rounded border-border"
                    />
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${option.color}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assignee Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Assignee
            {filters.assignee && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">1</span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>
          {openDropdown === 'assignee' && (
            <div className="absolute z-10 mt-2 w-64 bg-card border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setAssignee('')}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded text-left ${
                    !filters.assignee ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-sm text-muted-foreground">All Assignees</span>
                </button>
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setAssignee(member.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded ${
                      filters.assignee === member.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name || 'User'}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                        {member.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground">{member.name || 'Unknown'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Labels Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'labels' ? null : 'labels')}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Labels
            {filters.labels && filters.labels.length > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {filters.labels.length}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>
          {openDropdown === 'labels' && (
            <div className="absolute z-10 mt-2 w-64 bg-card border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
              <div className="p-2 space-y-1">
                {labels.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No labels available</div>
                ) : (
                  labels.map((label) => (
                    <label
                      key={label.id}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.labels?.includes(label.id) || false}
                        onChange={() => toggleLabel(label.id)}
                        className="rounded border-border"
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm text-muted-foreground">{label.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Sort by: {sortOptions.find((o) => o.value === filters.sortBy)?.label}
            <ChevronDown className="w-4 h-4" />
          </button>
          {openDropdown === 'sort' && (
            <div className="absolute z-10 mt-2 w-48 bg-card border border-border rounded-md shadow-lg">
              <div className="p-2 space-y-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`w-full text-left px-2 py-1.5 hover:bg-muted/50 rounded text-sm ${
                      filters.sortBy === option.value ? 'bg-blue-50 text-blue-700' : 'text-muted-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sort Order Toggle */}
        <button
          onClick={toggleSortOrder}
          className="px-3 py-2 border border-border rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          title={`Sort ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
        >
          {filters.sortOrder === 'asc' ? '↑' : '↓'}
        </button>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--red-11)] hover:bg-[var(--red-3)] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
            Clear all filters
          </button>
        )}

        {/* Active Filter Count Badge */}
        {hasActiveFilters && (
          <div className="ml-auto px-2 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded">
            {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
          </div>
        )}
      </div>
    </div>
  );
}
