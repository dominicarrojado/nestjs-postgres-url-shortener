import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateLinkDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUrl()
  url: string;
}
