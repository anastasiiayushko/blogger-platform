import { IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryParams } from '../../../../../../../core/dto/base.query-params.input-dto';
import { GameStatusesEnum } from '../../../../domain/game/game-statuses.enum';

type GameStatus = keyof typeof GameStatusesEnum;

export enum MyGameSortByEnum {
  pairCreatedDate = 'pairCreatedDate',
  startGameDate = 'startGameDate',
  finishGameDate = 'finishGameDate',
  status = 'status',

}

export class MyGamesQueryDto extends BaseQueryParams {
  @IsEnum(MyGameSortByEnum)
  @IsOptional()
  @Type(() => String)
  sortBy: MyGameSortByEnum = MyGameSortByEnum.pairCreatedDate;


}
