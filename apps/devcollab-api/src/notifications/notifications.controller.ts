import { Controller, Get, Patch, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // STATIC ROUTE FIRST — must be before :id to avoid NestJS matching 'unread-count' as :id
  @CheckAbility('read', 'Notification')
  @Get('unread-count')
  unreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.unreadCount(user.sub);
  }

  @CheckAbility('read', 'Notification')
  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.list(user.sub);
  }

  // STATIC ROUTE FIRST — read-all before :id/read
  @CheckAbility('update', 'Notification')
  @Patch('read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @CheckAbility('update', 'Notification')
  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.markRead(id, user.sub);
  }
}
