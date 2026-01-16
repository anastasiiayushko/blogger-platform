import { GameStatusesEnum } from '../../../domain/game/game-statuses.enum';
import { PlayerProgressViewDto } from './player-progress.view-dto';
import { GameQuestionViewDto } from './game-question.view-dto';
import { Game } from '../../../domain/game/game.entity';
import { Player } from '../../../domain/player/player.entity';
import { ApiProperty } from '@nestjs/swagger';
import { AnswerStatusesEnum } from '../../../domain/answer/answer-statuses.enum';
import { GameStatistic } from '../../../domain/game-statistic/game-statistic.entity';
import { loginConstraints } from '../../../../../user-accounts/domin/user.constraints';

export class GameStatisticViewDto {
  @ApiProperty({
    type: 'number',
    nullable: false,
  })
  sumScore: number = 0;

  @ApiProperty({
    type: 'number',
    nullable: false,
  })
  avgScores: number = 0;

  @ApiProperty({
    type: 'number',
    nullable: false,
  })
  gamesCount: number = 0;

  @ApiProperty({
    type: 'number',
    nullable: false,
  })
  winsCount: number = 0;

  @ApiProperty({
    type: 'number',
    nullable: false,
  })
  lossesCount: number = 0;

  @ApiProperty({
    type: 'number',
    nullable: false,
  })
  drawsCount: number = 0;

  static mapToView(statistic: GameStatistic | null): GameStatisticViewDto {
    const statisticViewDto = new GameStatisticViewDto();

    if (!statistic) {
      return statisticViewDto;
    }


    statisticViewDto.gamesCount = statistic.gameCount;
    statisticViewDto.sumScore = statistic.sumScore;
    statisticViewDto.avgScores =  Number(statistic.avgScore);
    statisticViewDto.winsCount = statistic.winsCount;
    statisticViewDto.lossesCount = statistic.lossesCount;
    statisticViewDto.drawsCount = statistic.drawsCount;

    return statisticViewDto;
  }
}
