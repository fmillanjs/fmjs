import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('workspaces/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @CheckAbility('create', 'Comment')
  @Post()
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.create(slug, dto, user.sub);
  }

  @CheckAbility('read', 'Comment')
  @Get()
  findAll(
    @Param('slug') slug: string,
    @Query('postId') postId?: string,
    @Query('snippetId') snippetId?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.commentsService.findAll(slug, user?.sub ?? '', {
      postId,
      snippetId,
    });
  }

  @CheckAbility('update', 'Comment')
  @Patch(':id')
  update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.update(slug, id, dto, user.sub);
  }

  @CheckAbility('delete', 'Comment')
  @Delete(':id')
  remove(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.remove(slug, id, user.sub);
  }
}
