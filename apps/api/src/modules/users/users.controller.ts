import { Controller, Get, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckAbility } from '../../core/rbac/decorators/check-ability.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @CheckAbility('read', 'User')
  @ApiOperation({ summary: 'List all users (filtered by role permissions)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user);
  }

  @Get(':id')
  @CheckAbility('read', 'User')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findById(id, user);
  }

  @Patch(':id/profile')
  @CheckAbility('update', 'User')
  @ApiOperation({ summary: 'Update user profile (own profile or admin)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Can only update own profile' })
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.updateProfile(id, dto, user);
  }

  @Patch(':id/role')
  @CheckAbility('manage', 'User')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Admin only' })
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const metadata = (req as any).auditMetadata;
    return this.usersService.updateRole(id, role, user, metadata);
  }
}
