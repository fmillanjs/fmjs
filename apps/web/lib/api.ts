/**
 * API Client Utility
 *
 * Provides fetch wrappers for frontend-to-backend communication
 * with automatic JWT token attachment and error handling.
 */

import { getServerSession } from 'next-auth';
import { authConfig } from './auth.config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      throw new Error(error.message || `HTTP ${response.status}`);
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
      throw new Error(error.message || `HTTP ${response.status}`);
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
      throw new Error(error.message || `HTTP ${response.status}`);
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
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // DELETE might return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },
};

/**
 * Server-side API client (use in Server Components, Server Actions)
 * Automatically fetches session and attaches JWT token
 */
export const serverApi = {
  async get<T>(path: string): Promise<T> {
    const session = await getServerSession(authConfig);
    const token = (session as any)?.accessToken;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return api.get<T>(path, token);
  },

  async post<T>(path: string, body: any): Promise<T> {
    const session = await getServerSession(authConfig);
    const token = (session as any)?.accessToken;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return api.post<T>(path, body, token);
  },

  async patch<T>(path: string, body: any): Promise<T> {
    const session = await getServerSession(authConfig);
    const token = (session as any)?.accessToken;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return api.patch<T>(path, body, token);
  },

  async delete<T>(path: string): Promise<T> {
    const session = await getServerSession(authConfig);
    const token = (session as any)?.accessToken;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return api.delete<T>(path, token);
  },
};
