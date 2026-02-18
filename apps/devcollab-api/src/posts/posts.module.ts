import { Module } from '@nestjs/common';
import { DatabaseModule } from '../core/database/database.module';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
