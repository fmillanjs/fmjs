import NextAuth, { type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@repo/database';
import { loginSchema } from '@repo/shared/validators';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { authConfig } from './auth.config';
import { redis } from './redis';
import { randomUUID } from 'crypto';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }
}

// Add JWT token extension
interface CustomJWT {
  id?: string;
  role?: string;
  sessionToken?: string;
}

// Redis session adapter functions
const SESSION_PREFIX = 'session:';
const SESSION_BY_USER_PREFIX = 'user:sessions:';
const SESSION_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

async function createSessionInRedis(userId: string, sessionToken: string) {
  const expires = new Date(Date.now() + SESSION_EXPIRY * 1000);

  const session = {
    sessionToken,
    userId,
    expires: expires.toISOString(),
  };

  // Store session by token
  await redis.setex(
    `${SESSION_PREFIX}${sessionToken}`,
    SESSION_EXPIRY,
    JSON.stringify(session)
  );

  // Track session for user (for multi-device management)
  await redis.sadd(`${SESSION_BY_USER_PREFIX}${userId}`, sessionToken);

  return session;
}

async function getSessionFromRedis(sessionToken: string) {
  const data = await redis.get(`${SESSION_PREFIX}${sessionToken}`);
  if (!data) return null;

  const session = JSON.parse(data);

  // Check if expired
  if (new Date(session.expires) < new Date()) {
    await deleteSessionFromRedis(sessionToken);
    return null;
  }

  return session;
}

async function deleteSessionFromRedis(sessionToken: string) {
  const data = await redis.get(`${SESSION_PREFIX}${sessionToken}`);
  if (data) {
    const session = JSON.parse(data);
    await redis.srem(`${SESSION_BY_USER_PREFIX}${session.userId}`, sessionToken);
  }
  await redis.del(`${SESSION_PREFIX}${sessionToken}`);
}

const nextAuthResult = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt', // Credentials provider requires JWT strategy
    maxAge: SESSION_EXPIRY,
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate credentials with Zod
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Create session in Redis after successful credential validation
      if (user?.id) {
        const sessionToken = randomUUID();
        await createSessionInRedis(user.id, sessionToken);

        // Store sessionToken on user object to be used in jwt callback
        (user as any).sessionToken = sessionToken;
      }
      return true;
    },
    async jwt({ token, user }) {
      // On sign in, attach user data to token
      const customToken = token as typeof token & CustomJWT;
      if (user) {
        customToken.id = user.id;
        customToken.role = user.role;
        customToken.sessionToken = (user as any).sessionToken;
      }
      return customToken;
    },
    async session({ session, token }) {
      const customToken = token as typeof token & CustomJWT;

      // SSR diagnostic logging
      const isSSR = typeof window === 'undefined';
      console.log(`[NextAuth Session Callback] ${isSSR ? 'SSR' : 'Client'}:`, {
        timestamp: new Date().toISOString(),
        hasToken: !!customToken,
        hasSessionToken: !!customToken.sessionToken,
        tokenId: customToken.id || 'none',
      });

      // Verify session exists in Redis
      if (customToken.sessionToken) {
        const redisSession = await getSessionFromRedis(customToken.sessionToken);
        if (!redisSession) {
          // Session expired or invalid
          console.warn(`[NextAuth Session Callback] ${isSSR ? 'SSR' : 'Client'} Failure:`, {
            reason: 'Redis session not found or expired',
            sessionToken: customToken.sessionToken,
          });
          return {
            ...session,
            user: {
              id: '',
              email: '',
              name: '',
              role: '',
            },
          };
        }
      }

      // Fetch fresh user data from database
      if (customToken.id) {
        const user = await prisma.user.findUnique({
          where: { id: customToken.id },
        });

        if (user) {
          session.user.id = user.id;
          session.user.email = user.email;
          session.user.name = user.name || '';
          session.user.role = user.role;

          // Generate JWT token for API authentication
          const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';

          const accessToken = jwt.sign(
            {
              sub: user.id,
              email: user.email,
              role: user.role,
            },
            jwtSecret,
            // Type assertion needed due to strict build mode with process.env types
            { expiresIn: '15m' }
          );

          session.accessToken = accessToken;

          console.log(`[NextAuth Session Callback] ${isSSR ? 'SSR' : 'Client'} Success:`, {
            userId: user.id,
            hasAccessToken: !!session.accessToken,
            accessTokenLength: accessToken.length,
          });
        }
      }

      return session;
    },
  },
  events: {
    async signOut(message) {
      // Delete session from Redis on sign out
      if ('token' in message && message.token) {
        const customToken = message.token as typeof message.token & CustomJWT;
        if (customToken?.sessionToken) {
          await deleteSessionFromRedis(customToken.sessionToken);
        }
      }
    },
  },
});

// Export with explicit types to avoid portability issues
export const handlers: typeof nextAuthResult.handlers = nextAuthResult.handlers;
export const auth: typeof nextAuthResult.auth = nextAuthResult.auth;
export const signIn: typeof nextAuthResult.signIn = nextAuthResult.signIn;
export const signOut: typeof nextAuthResult.signOut = nextAuthResult.signOut;
