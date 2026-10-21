import { IsUUID } from 'class-validator';

export class CreateGameDomainDto {
  @IsUUID()
  declare firstPlayerId: string;
}
