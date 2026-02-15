'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectActionsProps {
  projectId: string;
  teamId: string;
  projectName: string;
  projectStatus: 'ACTIVE' | 'ARCHIVED';
  isAdmin: boolean;
}

export function ProjectActions({
  projectId,
  teamId,
  projectName,
  projectStatus,
  isAdmin,
}: ProjectActionsProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleArchive = async () => {
    setIsArchiving(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/projects/${projectId}/archive`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to archive project' }));
        throw new Error(errorData.message || 'Failed to archive project');
      }

      // Redirect to project list after archiving
      router.push(`/teams/${teamId}/projects`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsArchiving(false);
      setShowArchiveConfirm(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete project' }));
        throw new Error(errorData.message || 'Failed to delete project');
      }

      // Redirect to project list after deletion
      router.push(`/teams/${teamId}/projects`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Archive Section */}
      {projectStatus === 'ACTIVE' && (
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Archive Project</h3>
          <p className="text-sm text-gray-600 mb-3">
            Archiving this project will hide it from the active projects list. You can unarchive it later.
          </p>
          {!showArchiveConfirm ? (
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-md hover:bg-yellow-100"
            >
              Archive Project
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4">
              <p className="text-sm text-yellow-800 mb-3">
                Are you sure you want to archive "{projectName}"?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isArchiving ? 'Archiving...' : 'Yes, Archive'}
                </button>
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  disabled={isArchiving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Section (Admin Only) */}
      {isAdmin && (
        <div>
          <h3 className="text-sm font-medium text-red-900 mb-2">Delete Project</h3>
          <p className="text-sm text-gray-600 mb-3">
            Permanently delete this project and all its tasks. This action cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete Project
            </button>
          ) : (
            <div className="bg-red-50 border border-red-300 rounded-md p-4">
              <p className="text-sm text-red-800 mb-1 font-medium">
                This action cannot be undone!
              </p>
              <p className="text-sm text-red-700 mb-3">
                Type the project name "{projectName}" to confirm deletion.
              </p>
              <input
                type="text"
                placeholder="Type project name to confirm"
                className="w-full px-3 py-2 mb-3 border border-red-300 rounded-md text-sm"
                onChange={(e) => {
                  const confirmBtn = document.getElementById('confirm-delete-btn') as HTMLButtonElement;
                  if (confirmBtn) {
                    confirmBtn.disabled = e.target.value !== projectName || isDeleting;
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  id="confirm-delete-btn"
                  onClick={handleDelete}
                  disabled={true}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isAdmin && (
        <div className="text-sm text-gray-500 italic">
          Only administrators can delete projects.
        </div>
      )}
    </div>
  );
}
