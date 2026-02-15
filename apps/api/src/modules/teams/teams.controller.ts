import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { TeamsService } from './teams.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckAbility } from '../../core/rbac/decorators/check-ability.decorator';
import { CreateTeamDto } from './dto/create-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @CheckAbility('create', 'Organization')
  @ApiOperation({ summary: 'Create a new team/organization' })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Team with this name already exists' })
  async create(
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const metadata = (req as any).auditMetadata;
    return this.teamsService.create(dto, user, metadata);
  }

  @Get()
  @CheckAbility('read', 'Organization')
  @ApiOperation({ summary: 'Get all teams the current user is a member of' })
  @ApiResponse({ status: 200, description: 'Teams retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@CurrentUser() user: any) {
    return this.teamsService.findAllForUser(user.id);
  }

  @Get(':id')
  @CheckAbility('read', 'Organization')
  @ApiOperation({ summary: 'Get team by ID with members' })
  @ApiResponse({ status: 200, description: 'Team retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Not a member' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.teamsService.findById(id, user.id);
  }

  @Get(':id/members')
  @CheckAbility('read', 'Membership')
  @ApiOperation({ summary: 'Get all members of a team' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Not a member' })
  async getMembers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.teamsService.getMembers(id, user.id);
  }

  @Post(':id/members')
  @CheckAbility('create', 'Membership')
  @ApiOperation({ summary: 'Invite a member to the team (ADMIN or MANAGER only)' })
  @ApiResponse({ status: 201, description: 'Member invited successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only admins and managers can invite' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  async inviteMember(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const metadata = (req as any).auditMetadata;
    return this.teamsService.inviteMember(id, dto, user, metadata);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from the team (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only admins can remove members' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 400, description: 'Cannot remove last admin' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const metadata = (req as any).auditMetadata;
    return this.teamsService.removeMember(id, userId, user, metadata);
  }
}
