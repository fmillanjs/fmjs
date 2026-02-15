import { createZodDto } from 'nestjs-zod';
import { createTaskSchema } from '@repo/shared';

export class CreateTaskDto extends createZodDto(createTaskSchema) {}
