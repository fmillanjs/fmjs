import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CheckAbility } from '../../core/rbac/decorators/check-ability.decorator';
import { Request } from 'express';

@ApiTags('projects')
@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('teams/:teamId/projects')
  @CheckAbility('create', 'Project')
  @ApiOperation({ summary: 'Create a project in a team' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Param('teamId') teamId: string,
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const metadata = {
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.projectsService.create(teamId, createProjectDto, user, metadata);
  }

  @Get('teams/:teamId/projects')
  @CheckAbility('read', 'Project')
  @ApiOperation({ summary: 'List all projects in a team' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Param('teamId') teamId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.projectsService.findAllByOrg(teamId, user.id);
  }

  @Get('projects/:id')
  @CheckAbility('read', 'Project')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.projectsService.findById(id, user.id);
  }

  @Patch('projects/:id')
  @CheckAbility('update', 'Project')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    const metadata = {
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.projectsService.update(id, updateProjectDto, user, metadata);
  }

  @Patch('projects/:id/archive')
  @CheckAbility('update', 'Project')
  @ApiOperation({ summary: 'Archive a project' })
  @ApiResponse({ status: 200, description: 'Project archived successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  archive(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    const metadata = {
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.projectsService.archive(id, user, metadata);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Delete a project (admin only)' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin only' })
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    const metadata = {
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    return this.projectsService.remove(id, user, metadata);
  }
}
