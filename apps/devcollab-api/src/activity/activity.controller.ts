import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CheckAbility } from '../common/decorators/check-ability.decorator';

@Controller('workspaces/:slug/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @CheckAbility('read', 'ActivityEvent')
  @Get()
  findFeed(
    @Param('slug') slug: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.activityService.findFeed(slug, cursor);
  }
}
