import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateLinkDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUrl()
  url: string;
}
