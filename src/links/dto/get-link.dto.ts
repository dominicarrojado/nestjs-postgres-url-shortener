import { IsUUID } from 'class-validator';

export class GetLinkDto {
  @IsUUID()
  id: string;
}
