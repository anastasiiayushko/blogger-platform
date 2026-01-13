import { IsEnum, IsUUID } from 'class-validator';
import { PlayerGameStatusEnum } from '../player-game-status.enum';

export class CreatePlayerDomainDto {
  @IsUUID()
  userId: string;

  // @IsEnum(PlayerGameStatusEnum)
  // gameStatus: PlayerGameStatusEnum;
}
