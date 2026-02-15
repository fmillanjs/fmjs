import { createZodDto } from 'nestjs-zod';
import { updateProjectSchema } from '@repo/shared';

export class UpdateProjectDto extends createZodDto(updateProjectSchema) {}
