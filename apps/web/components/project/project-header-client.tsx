'use client';

import { PresenceIndicator } from './presence-indicator';
import { ConnectionStatus } from './connection-status';

interface ProjectHeaderClientProps {
  projectId: string;
}

export function ProjectHeaderClient({ projectId }: ProjectHeaderClientProps) {
  return (
    <div className="flex items-center gap-4">
      <ConnectionStatus />
      <PresenceIndicator projectId={projectId} />
    </div>
  );
}
