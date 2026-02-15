import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CheckAbility } from '../../core/rbac/decorators/check-ability.decorator';

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tasks/:taskId/comments')
  @CheckAbility('create', 'Task') // Comments inherit task permissions
  @ApiOperation({ summary: 'Add comment to task' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  create(
    @Param('taskId') taskId: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    return this.commentsService.create(taskId, content, user, metadata);
  }

  @Get('tasks/:taskId/comments')
  @CheckAbility('read', 'Task')
  @ApiOperation({ summary: 'List all comments on task' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  findAll(@Param('taskId') taskId: string, @Req() req: any) {
    const user = req.user;
    return this.commentsService.findAllByTask(taskId, user.id);
  }

  @Patch('comments/:id')
  @CheckAbility('update', 'Task')
  @ApiOperation({ summary: 'Update comment (author or admin only)' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment author' })
  update(
    @Param('id') id: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    const user = req.user;
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    return this.commentsService.update(id, content, user, metadata);
  }

  @Delete('comments/:id')
  @CheckAbility('delete', 'Task')
  @ApiOperation({ summary: 'Delete comment (author or admin only)' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment author' })
  remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    return this.commentsService.remove(id, user, metadata);
  }
}
