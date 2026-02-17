import { PrismaClient } from '.prisma/devcollab-client';

const globalForPrisma = globalThis as unknown as {
  devcollabPrisma: PrismaClient;
};

export const prisma =
  globalForPrisma.devcollabPrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.devcollabPrisma = prisma;
}
