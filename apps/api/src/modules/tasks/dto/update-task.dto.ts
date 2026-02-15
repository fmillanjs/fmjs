import { createZodDto } from 'nestjs-zod';
import { updateTaskSchema, updateTaskStatusSchema } from '@repo/shared';

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}

export class UpdateTaskStatusDto extends createZodDto(updateTaskStatusSchema) {}
