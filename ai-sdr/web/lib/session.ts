import { SessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn: boolean;
  email: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'ai-sdr-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  },
};

// Demo credentials — displayed on login page (AUTH-02) and validated in login action (AUTH-01)
export const DEMO_EMAIL = process.env.DEMO_EMAIL || 'recruiter@demo.com';
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo1234';
