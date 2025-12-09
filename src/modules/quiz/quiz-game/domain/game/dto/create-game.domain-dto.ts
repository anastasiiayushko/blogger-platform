import { IsUUID } from 'class-validator';

export class CreateGameDomainDto {
  @IsUUID()
  firstPlayerId: string;
}
