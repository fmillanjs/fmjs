import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '.prisma/devcollab-client/runtime/library';
import { PrismaService } from '../core/database/prisma.service';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleReaction(slug: string, dto: ToggleReactionDto, userId: string) {
    // 1. Workspace lookup
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // 2. Require at least one target
    if (!dto.postId && !dto.commentId) {
      throw new BadRequestException('postId or commentId required');
    }

    // 3. Build unique where clause based on target type
    const where = dto.postId
      ? {
          userId_emoji_postId: {
            userId,
            emoji: dto.emoji,
            postId: dto.postId,
          },
        }
      : {
          userId_emoji_commentId: {
            userId,
            emoji: dto.emoji,
            commentId: dto.commentId!,
          },
        };

    // 4. Toggle: delete if exists, create if not
    const existing = await this.prisma.reaction.findUnique({ where });

    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return { action: 'removed', emoji: dto.emoji };
    }

    // 5. Create with P2002 race condition handling
    try {
      await this.prisma.reaction.create({
        data: {
          emoji: dto.emoji,
          userId,
          postId: dto.postId,
          commentId: dto.commentId,
        },
      });
      return { action: 'added', emoji: dto.emoji };
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // Race condition: another request created the reaction first — idempotent
        return { action: 'added', emoji: dto.emoji };
      }
      throw err;
    }
  }
}
