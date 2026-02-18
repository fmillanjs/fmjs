import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { JoinWorkspaceDto } from './dto/join-workspace.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // WORK-01: Create workspace — any authenticated user
  @CheckAbility('create', 'Workspace')
  @Post()
  create(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: JwtPayload) {
    return this.workspacesService.create(dto, user.sub);
  }

  // WORK-01: List user's workspaces — any authenticated user
  @CheckAbility('read', 'Workspace')
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.workspacesService.findAll(user.sub);
  }

  // WORK-03: Join workspace via invite token — MUST be before :slug routes
  // No :slug param — guard passes through (no workspace ability check needed)
  @CheckAbility('create', 'WorkspaceMember')
  @Post('join')
  joinWorkspace(@Body() dto: JoinWorkspaceDto, @CurrentUser() user: JwtPayload) {
    return this.workspacesService.joinWorkspace(dto, user.sub);
  }

  // WORK-01: Get workspace by slug — guard checks membership via WorkspaceAbilityFactory
  @CheckAbility('read', 'Workspace')
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.workspacesService.findOne(slug);
  }

  // WORK-02: Generate invite link — Admin only (guard: create InviteLink)
  @CheckAbility('create', 'InviteLink')
  @Post(':slug/invite-links')
  generateInviteLink(@Param('slug') slug: string) {
    return this.workspacesService.generateInviteLink(slug);
  }

  // WORK-04: List members — any workspace member (guard: read WorkspaceMember)
  @CheckAbility('read', 'WorkspaceMember')
  @Get(':slug/members')
  listMembers(@Param('slug') slug: string) {
    return this.workspacesService.listMembers(slug);
  }

  // RBAC-01 / WORK-04: Update member role — Admin only (guard: update WorkspaceMember)
  @CheckAbility('update', 'WorkspaceMember')
  @Patch(':slug/members/:userId/role')
  updateMemberRole(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(slug, userId, dto);
  }

  // WORK-04 / WORK-05: Remove member — Admin only (guard: delete WorkspaceMember)
  @CheckAbility('delete', 'WorkspaceMember')
  @Delete(':slug/members/:userId')
  removeMember(@Param('slug') slug: string, @Param('userId') userId: string) {
    return this.workspacesService.removeMember(slug, userId);
  }
}
