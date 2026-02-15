import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@repo/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client = prisma;

  async onModuleInit() {
    await this.client.$connect();
    console.log('[Prisma] Connected to database');
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    console.log('[Prisma] Disconnected from database');
  }

  get $() {
    return this.client;
  }

  // Expose common Prisma operations
  get user() {
    return this.client.user;
  }

  get account() {
    return this.client.account;
  }

  get session() {
    return this.client.session;
  }

  get verificationToken() {
    return this.client.verificationToken;
  }

  get auditLog() {
    return this.client.auditLog;
  }

  // Raw query access
  $queryRaw = this.client.$queryRaw.bind(this.client);
  $executeRaw = this.client.$executeRaw.bind(this.client);
  $transaction = this.client.$transaction.bind(this.client);
}
