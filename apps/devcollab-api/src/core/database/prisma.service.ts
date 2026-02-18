import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@devcollab/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client = prisma;

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get user() {
    return this.client.user;
  }

  get workspace() {
    return this.client.workspace;
  }

  get workspaceMember() {
    return this.client.workspaceMember;
  }

  get inviteLink() {
    return this.client.inviteLink;
  }

  get snippet() {
    return this.client.snippet;
  }

  get post() {
    return this.client.post;
  }

  get comment() {
    return this.client.comment;
  }

  get reaction() {
    return this.client.reaction;
  }
}
