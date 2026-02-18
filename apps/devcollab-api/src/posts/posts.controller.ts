import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CheckAbility } from '../common/decorators/check-ability.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('workspaces/:slug/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @CheckAbility('create', 'Post')
  @Post()
  create(
    @Param('slug') slug: string,
    @Body() dto: CreatePostDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.postsService.create(slug, dto, user.sub);
  }

  @CheckAbility('read', 'Post')
  @Get()
  findAll(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.postsService.findAll(slug, user.sub);
  }

  @CheckAbility('read', 'Post')
  @Get(':id')
  findOne(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.postsService.findOne(slug, id, user.sub);
  }

  @CheckAbility('update', 'Post')
  @Patch(':id')
  update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.postsService.update(slug, id, dto, user.sub);
  }

  @CheckAbility('update', 'Post')
  @Patch(':id/status')
  setStatus(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: { status: 'Draft' | 'Published' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.postsService.setStatus(slug, id, body.status, user.sub);
  }

  @CheckAbility('delete', 'Post')
  @Delete(':id')
  remove(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.postsService.remove(slug, id, user.sub);
  }
}
