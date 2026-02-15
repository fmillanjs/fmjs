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
import { LabelsService } from './labels.service';
import { CheckAbility } from '../../core/rbac/decorators/check-ability.decorator';
import { Request } from 'express';

@ApiTags('labels')
@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post('teams/:teamId/labels')
  @CheckAbility('create', 'Project') // Labels follow project permissions (manager+)
  @ApiOperation({ summary: 'Create a label in a team' })
  @ApiResponse({ status: 201, description: 'Label created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Param('teamId') teamId: string,
    @Body() createLabelDto: { name: string; color?: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.labelsService.create(teamId, createLabelDto.name, createLabelDto.color, user.id);
  }

  @Get('teams/:teamId/labels')
  @CheckAbility('read', 'Project')
  @ApiOperation({ summary: 'List all labels in a team' })
  @ApiResponse({ status: 200, description: 'Labels retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Param('teamId') teamId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.labelsService.findAllByOrg(teamId, user.id);
  }

  @Patch('labels/:id')
  @CheckAbility('update', 'Project')
  @ApiOperation({ summary: 'Update a label' })
  @ApiResponse({ status: 200, description: 'Label updated successfully' })
  @ApiResponse({ status: 404, description: 'Label not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateLabelDto: { name?: string; color?: string; organizationId: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.labelsService.update(
      id,
      updateLabelDto.name,
      updateLabelDto.color,
      user.id,
      updateLabelDto.organizationId,
    );
  }

  @Delete('labels/:id')
  @CheckAbility('delete', 'Project')
  @ApiOperation({ summary: 'Delete a label' })
  @ApiResponse({ status: 200, description: 'Label deleted successfully' })
  @ApiResponse({ status: 404, description: 'Label not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(
    @Param('id') id: string,
    @Body() body: { organizationId: string },
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.labelsService.remove(id, user.id, body.organizationId);
  }
}
