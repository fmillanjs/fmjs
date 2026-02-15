import type { UserRole } from './enums';

export interface OrganizationBase {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipBase {
  id: string;
  role: UserRole;
  userId: string;
  organizationId: string;
  joinedAt: Date;
}

export interface TeamMember extends MembershipBase {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface OrganizationWithMembers extends OrganizationBase {
  members: TeamMember[];
}
