import { createZodDto } from 'nestjs-zod';
import { createProjectSchema } from '@repo/shared';

export class CreateProjectDto extends createZodDto(createProjectSchema) {}
