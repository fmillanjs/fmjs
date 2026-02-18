import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { SnippetsService } from './snippets.service';
import { CreateSnippetDto } from './dto/create-snippet.dto';
import { UpdateSnippetDto } from './dto/update-snippet.dto';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('workspaces/:slug/snippets')
export class SnippetsController {
  constructor(private readonly snippetsService: SnippetsService) {}

  @CheckAbility('create', 'Snippet')
  @Post()
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateSnippetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.snippetsService.create(slug, dto, user.sub);
  }

  @CheckAbility('read', 'Snippet')
  @Get()
  findAll(@Param('slug') slug: string) {
    return this.snippetsService.findAll(slug);
  }

  @CheckAbility('read', 'Snippet')
  @Get(':id')
  findOne(@Param('slug') slug: string, @Param('id') id: string) {
    return this.snippetsService.findOne(slug, id);
  }

  @CheckAbility('update', 'Snippet')
  @Patch(':id')
  update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdateSnippetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.snippetsService.update(slug, id, dto, user.sub);
  }

  @CheckAbility('delete', 'Snippet')
  @Delete(':id')
  remove(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.snippetsService.remove(slug, id, user.sub);
  }
}
