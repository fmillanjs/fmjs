import { Controller, Get, Param, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('workspaces/:slug/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @CheckAbility('read', 'Post')
  @Get()
  search(
    @Param('slug') slug: string,
    @Query('q') q: string = '',
    @CurrentUser() user: JwtPayload,
  ) {
    return this.searchService.search(slug, q, user.sub);
  }
}
