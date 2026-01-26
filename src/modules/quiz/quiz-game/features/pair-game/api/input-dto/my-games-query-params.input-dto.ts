import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { GameStatusesEnum } from '../../../../domain/game/game-statuses.enum';
import { BaseQueryParams } from '../../../../../../../core/dto/base.query-params.input-dto';

type GameStatus = keyof typeof GameStatusesEnum;

export enum MyGameSortByEnum {
  pairCreatedDate = 'pairCreatedDate',
  startGameDate = 'startGameDate',
  finishGameDate = 'finishGameDate',
  // status = GameStatus,
}

export class MyGamesQueryDto extends BaseQueryParams {
  @IsEnum(MyGameSortByEnum)
  @IsOptional()
  @Type(() => String)
  sortBy: MyGameSortByEnum = MyGameSortByEnum.pairCreatedDate;
}
