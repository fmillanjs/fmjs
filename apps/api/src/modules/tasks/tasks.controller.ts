import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto, UpdateTaskStatusDto } from './dto/update-task.dto';
import { CheckAbility } from '../../core/rbac/decorators/check-ability.decorator';
import { TaskStatus } from '@repo/shared';

@ApiTags('tasks')
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:projectId/tasks')
  @CheckAbility('create', 'Task')
  @ApiOperation({ summary: 'Create task in project' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    // Ensure projectId from URL matches DTO
    const dto = { ...createTaskDto, projectId };

    return this.tasksService.create(dto, user, metadata);
  }

  @Get('projects/:projectId/tasks')
  @CheckAbility('read', 'Task')
  @ApiOperation({ summary: 'List all tasks in project with filters' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  findAll(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('labels') labels?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const user = req.user;
    const filters: any = {};

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assigneeId) filters.assigneeId = assigneeId;
    if (labels) filters.labelIds = labels.split(',');
    if (search) filters.search = search;
    if (sortBy) filters.sortBy = sortBy;
    if (sortOrder) filters.sortOrder = sortOrder;

    return this.tasksService.findAllByProject(projectId, user.id, filters);
  }

  @Get('tasks/:id')
  @CheckAbility('read', 'Task')
  @ApiOperation({ summary: 'Get task details with comments' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  findOne(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.tasksService.findById(id, user.id);
  }

  @Patch('tasks/:id')
  @CheckAbility('update', 'Task')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    return this.tasksService.update(id, updateTaskDto, user, metadata);
  }

  @Patch('tasks/:id/status')
  @CheckAbility('update', 'Task')
  @ApiOperation({ summary: 'Update task status (Kanban drag-drop)' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    return this.tasksService.updateStatus(id, updateTaskStatusDto, user, metadata);
  }

  @Delete('tasks/:id')
  @CheckAbility('delete', 'Task')
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  remove(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    return this.tasksService.remove(id, user, metadata);
  }
}
