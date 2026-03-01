import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  companyUrl: string;
}
