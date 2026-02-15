import { UserRole } from './enums';

export interface UserBase {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface UserProfile extends UserBase {
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser extends UserBase {
  // Minimal user data stored in JWT/session
}
