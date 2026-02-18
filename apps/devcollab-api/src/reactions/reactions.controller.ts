import { Controller, Post, Body, Param } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('workspaces/:slug/reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @CheckAbility('create', 'Reaction')
  @Post()
  toggleReaction(
    @Param('slug') slug: string,
    @Body() dto: ToggleReactionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reactionsService.toggleReaction(slug, dto, user.sub);
  }
}
