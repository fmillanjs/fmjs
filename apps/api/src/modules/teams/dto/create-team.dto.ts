import { createZodDto } from 'nestjs-zod';
import { createTeamSchema } from '@repo/shared';

export class CreateTeamDto extends createZodDto(createTeamSchema) {}
