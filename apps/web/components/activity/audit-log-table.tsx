'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { AuditOutcome } from '@repo/shared/types';

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  outcome: AuditOutcome;
  changes: any;
  metadata: {
    ip?: string;
    userAgent?: string;
    requestId?: string;
  };
  timestamp: string;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface AuditLogTableProps {
  teamId: string;
  initialEntries: AuditLogEntry[];
  totalCount: number;
}

export function AuditLogTable({ teamId, initialEntries, totalCount }: AuditLogTableProps) {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<AuditLogEntry[]>(initialEntries);
  const [total, setTotal] = useState(totalCount);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const token = (session as any)?.accessToken;

  const fetchEntries = async (newOffset: number) => {
    if (!token) return;

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('offset', newOffset.toString());
      params.set('limit', limit.toString());

      if (searchTerm) params.set('action', searchTerm);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (outcomeFilter) params.set('outcome', outcomeFilter);
      if (startDate) params.set('startDate', new Date(startDate).toISOString());
      if (endDate) params.set('endDate', new Date(endDate).toISOString());

      const response = await api.get<{
        logs: AuditLogEntry[];
        total: number;
        offset: number;
        limit: number;
      }>(`/teams/${teamId}/audit-log?${params.toString()}`, token);

      setEntries(response.logs);
      setTotal(response.total);
      setOffset(newOffset);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchEntries(0);
  };

  const handlePrevious = () => {
    const newOffset = Math.max(0, offset - limit);
    fetchEntries(newOffset);
  };

  const handleNext = () => {
    const newOffset = offset + limit;
    if (newOffset < total) {
      fetchEntries(newOffset);
    }
  };

  const toggleRowExpansion = (entryId: string) => {
    setExpandedRow(expandedRow === entryId ? null : entryId);
  };

  const formatChanges = (changes: any): string => {
    if (!changes) return 'N/A';

    if (changes.previous && changes.current) {
      const diff: string[] = [];
      Object.keys(changes.current).forEach((key) => {
        if (changes.previous[key] !== changes.current[key]) {
          diff.push(`${key}: ${changes.previous[key]} → ${changes.current[key]}`);
        }
      });
      return diff.length > 0 ? diff.join(', ') : 'No changes detected';
    }

    if (changes.previousStatus && changes.newStatus) {
      return `status: ${changes.previousStatus} → ${changes.newStatus}`;
    }

    return JSON.stringify(changes);
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const outcomeColor = (outcome: AuditOutcome) => {
    switch (outcome) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'DENIED':
        return 'bg-red-100 text-red-800';
      case 'FAILURE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Action
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., TASK_CREATED"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          {/* Entity Type Filter */}
          <div>
            <label htmlFor="entityType" className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              id="entityType"
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All</option>
              <option value="User">User</option>
              <option value="Task">Task</option>
              <option value="Project">Project</option>
              <option value="Comment">Comment</option>
              <option value="Organization">Organization</option>
              <option value="Membership">Membership</option>
            </select>
          </div>

          {/* Outcome Filter */}
          <div>
            <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-1">
              Outcome
            </label>
            <select
              id="outcome"
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All</option>
              <option value="SUCCESS">Success</option>
              <option value="DENIED">Denied</option>
              <option value="FAILURE">Failure</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Searching...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outcome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No audit log entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <>
                    <tr
                      key={entry.id}
                      onClick={() => toggleRowExpansion(entry.id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.actor.image ? (
                            <img
                              src={entry.actor.image}
                              alt={entry.actor.name || 'User'}
                              className="w-6 h-6 rounded-full mr-2"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                              {entry.actor.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span className="text-sm text-gray-900">{entry.actor.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.action.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.entityType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${outcomeColor(entry.outcome)}`}>
                          {entry.outcome}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-800">
                          {expandedRow === entry.id ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {expandedRow === entry.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Entity ID:</span>{' '}
                              <span className="text-gray-900">{entry.entityId}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Changes:</span>{' '}
                              <span className="text-gray-900">{formatChanges(entry.changes)}</span>
                            </div>
                            {entry.metadata?.ip && (
                              <div>
                                <span className="font-medium text-gray-700">IP Address:</span>{' '}
                                <span className="text-gray-900">{entry.metadata.ip}</span>
                              </div>
                            )}
                            {entry.metadata?.userAgent && (
                              <div>
                                <span className="font-medium text-gray-700">User Agent:</span>{' '}
                                <span className="text-gray-900 break-all">{entry.metadata.userAgent}</span>
                              </div>
                            )}
                            {entry.metadata?.requestId && (
                              <div>
                                <span className="font-medium text-gray-700">Request ID:</span>{' '}
                                <span className="text-gray-900">{entry.metadata.requestId}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={handlePrevious}
              disabled={offset === 0 || isLoading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={offset + limit >= total || isLoading}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{offset + 1}</span> to{' '}
                <span className="font-medium">{Math.min(offset + limit, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={handlePrevious}
                  disabled={offset === 0 || isLoading}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={offset + limit >= total || isLoading}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
