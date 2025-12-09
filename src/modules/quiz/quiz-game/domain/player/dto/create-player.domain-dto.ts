import { IsUUID } from 'class-validator';

export class CreatePlayerDomainDto {
  @IsUUID()
  userId: string;
}
