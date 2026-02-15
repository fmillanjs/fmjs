import { SessionUser } from './user';

export interface AuthSession {
  user: SessionUser;
  expires: string;
  accessToken?: string;
}
