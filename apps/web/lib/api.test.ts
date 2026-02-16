import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatedApi } from './api';
import { OrganizationWithCountSchema } from './validators/api-schemas';
import { z } from 'zod';

describe('validatedApi', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    vi.clearAllMocks();
  });

  it('validates successful response with correct schema', async () => {
    const mockTeams = [
      {
        id: 'clx123456',
        name: 'Engineering',
        slug: 'engineering',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: {
          members: 5,
        },
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTeams,
    });

    const result = await validatedApi.get(
      '/api/teams',
      z.array(OrganizationWithCountSchema),
      'test-token'
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Engineering');
    expect(result[0].createdAt).toBeInstanceOf(Date); // Coerced by Zod
    expect(result[0]._count?.members).toBe(5);
  });

  it('throws error in strict mode when schema validation fails', async () => {
    const invalidData = [
      { id: 123, name: 'Bad' }, // Invalid: id should be string (CUID)
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => invalidData,
    });

    // In development mode (strict), should throw
    await expect(
      validatedApi.get('/api/teams', z.array(OrganizationWithCountSchema), 'token')
    ).rejects.toThrow(/does not match expected schema/);
  });

  it('validates date coercion from ISO string to Date object', async () => {
    const mockTeam = {
      id: 'clx123456',
      name: 'Product',
      slug: 'product',
      createdAt: '2026-02-16T06:00:00Z', // ISO string
      updatedAt: '2026-02-16T06:00:00Z',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTeam,
    });

    const result = await validatedApi.get(
      '/api/teams/clx123456',
      OrganizationWithCountSchema,
      'test-token'
    );

    // Zod should coerce ISO string to Date object
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('handles API errors before validation', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    // API errors should throw before validation
    await expect(
      validatedApi.get('/api/teams', z.array(OrganizationWithCountSchema), 'bad-token')
    ).rejects.toThrow(/Unauthorized/);
  });
});
