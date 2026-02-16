/**
 * API Client Utility
 *
 * Provides fetch wrappers for frontend-to-backend communication
 * with automatic JWT token attachment and error handling.
 *
 * Two clients:
 * - `api`: Basic fetch wrappers (existing, for backward compatibility)
 * - `validatedApi`: Enhanced with runtime Zod validation (new, for type safety)
 */

import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const VALIDATE_RESPONSES = process.env.NODE_ENV !== 'production';

/**
 * Custom error class that includes HTTP response details
 */
class ApiError extends Error {
  response: {
    status: number;
    data: any;
  };

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.response = { status, data };
  }
}

/**
 * Client-side API client (use in Client Components)
 * Requires session to be available via useSession()
 */
export const api = {
  async get<T>(path: string, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
    }

    return response.json();
  },

  async post<T>(path: string, body: any, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
    }

    return response.json();
  },

  async patch<T>(path: string, body: any, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
    }

    return response.json();
  },

  async delete<T>(path: string, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
    }

    // DELETE might return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },
};

/**
 * Validated API client (use in Client Components)
 * Enhanced with runtime Zod validation for type safety
 *
 * Development mode: Validates strictly and throws on mismatch
 * Production mode: Logs errors gracefully without throwing
 */
export const validatedApi = {
  async get<T>(path: string, schema: z.ZodType<T>, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
    }

    const data = await response.json();
    const result = schema.safeParse(data);

    if (!result.success) {
      console.error('API response validation failed:', {
        path,
        errors: result.error.format(),
        received: data,
      });

      if (VALIDATE_RESPONSES) {
        throw new Error(`API response does not match expected schema for ${path}: ${result.error.message}`);
      }
    }

    return result.success ? result.data : data;
  },

  async post<T>(path: string, body: any, schema: z.ZodType<T>, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
    }

    const data = await response.json();
    const result = schema.safeParse(data);

    if (!result.success) {
      console.error('API response validation failed:', {
        path,
        errors: result.error.format(),
        received: data,
      });

      if (VALIDATE_RESPONSES) {
        throw new Error(`API response does not match expected schema for ${path}: ${result.error.message}`);
      }
    }

    return result.success ? result.data : data;
  },

  async patch<T>(path: string, body: any, schema: z.ZodType<T>, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
    }

    const data = await response.json();
    const result = schema.safeParse(data);

    if (!result.success) {
      console.error('API response validation failed:', {
        path,
        errors: result.error.format(),
        received: data,
      });

      if (VALIDATE_RESPONSES) {
        throw new Error(`API response does not match expected schema for ${path}: ${result.error.message}`);
      }
    }

    return result.success ? result.data : data;
  },

  async delete<T>(path: string, schema: z.ZodType<T>, token?: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(error.message || `HTTP ${response.status}`, response.status, error);
    }

    // DELETE might return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    const result = schema.safeParse(data);

    if (!result.success) {
      console.error('API response validation failed:', {
        path,
        errors: result.error.format(),
        received: data,
      });

      if (VALIDATE_RESPONSES) {
        throw new Error(`API response does not match expected schema for ${path}: ${result.error.message}`);
      }
    }

    return result.success ? result.data : data;
  },
};

/**
 * Server-side API client (use in Server Components, Server Actions)
 * Automatically fetches session and attaches JWT token
 * Uses dynamic import to avoid bundling server-only code (bcrypt) in client
 */
export const serverApi = {
  async get<T>(path: string): Promise<T> {
    const { auth } = await import('./auth');
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return api.get<T>(path, token);
  },

  async post<T>(path: string, body: any): Promise<T> {
    const { auth } = await import('./auth');
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return api.post<T>(path, body, token);
  },

  async patch<T>(path: string, body: any): Promise<T> {
    const { auth } = await import('./auth');
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return api.patch<T>(path, body, token);
  },

  async delete<T>(path: string): Promise<T> {
    const { auth } = await import('./auth');
    const session = await auth();
    const token = (session as any)?.accessToken;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return api.delete<T>(path, token);
  },
};
