import { SetMetadata } from '@nestjs/common';

export const CHECK_ABILITY_KEY = 'check_ability';

export interface AbilityRequirement {
  action: string;
  subject: string;
}

export const CheckAbility = (action: string, subject: string) =>
  SetMetadata(CHECK_ABILITY_KEY, { action, subject } as AbilityRequirement);
