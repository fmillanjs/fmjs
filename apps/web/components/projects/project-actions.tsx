'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [confirmName, setConfirmName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
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
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-[var(--red-3)] border border-[var(--red-6)] text-[var(--red-11)] px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Archive Section */}
      {projectStatus === 'ACTIVE' && (
        <div className="border-b border-border pb-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Archive Project</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Archiving this project will hide it from the active projects list. You can unarchive it later.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="text-[var(--amber-11)] border-[var(--amber-6)] bg-[var(--amber-3)] hover:bg-[var(--amber-4)]"
                disabled={isArchiving}
              >
                {isArchiving ? 'Archiving...' : 'Archive Project'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{projectName}&quot; will be hidden from the active projects list. You can unarchive it from the Archived tab later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
                  {isArchiving ? 'Archiving...' : 'Yes, Archive'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Delete Section (Admin Only) */}
      {isAdmin && (
        <div>
          <h3 className="text-sm font-medium text-[var(--red-11)] mb-2">Delete Project</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Permanently delete this project and all its tasks. This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={() => { setDeleteOpen(true); setConfirmName(''); }}
          >
            Delete Project
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">Delete Project</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. Type <strong>{projectName}</strong> to confirm deletion.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="Type project name to confirm"
                className="mt-2"
              />
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={confirmName !== projectName || isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {!isAdmin && (
        <div className="text-sm text-muted-foreground italic">
          Only administrators can delete projects.
        </div>
      )}
    </div>
  );
}
