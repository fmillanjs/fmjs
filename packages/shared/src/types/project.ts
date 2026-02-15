import type { ProjectStatus } from './enums';

export interface ProjectBase {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithTaskCount extends ProjectBase {
  _count: {
    tasks: number;
  };
}
