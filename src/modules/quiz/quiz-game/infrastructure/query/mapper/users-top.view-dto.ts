import { GameStatusesEnum } from '../../../domain/game/game-statuses.enum';
import { PlayerProgressViewDto } from './player-progress.view-dto';
import { GameQuestionViewDto } from './game-question.view-dto';
import { Game } from '../../../domain/game/game.entity';
import { Player } from '../../../domain/player/player.entity';
import { ApiProperty } from '@nestjs/swagger';
import { AnswerStatusesEnum } from '../../../domain/answer/answer-statuses.enum';
import { GameStatistic } from '../../../domain/game-statistic/game-statistic.entity';
import { loginConstraints } from '../../../../../user-accounts/domin/user.constraints';

export class UsersTopViewDto {
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

  player: {
    id: string;
    login: string;
  };

  static mapToView(statistic: GameStatistic): UsersTopViewDto {
    const usersTopViewDto = new UsersTopViewDto();

    usersTopViewDto.gamesCount = statistic.gameCount;
    usersTopViewDto.sumScore = statistic.sumScore;
    usersTopViewDto.avgScores = Number(statistic.avgScore);
    usersTopViewDto.winsCount = statistic.winsCount;
    usersTopViewDto.lossesCount = statistic.lossesCount;
    usersTopViewDto.drawsCount = statistic.drawsCount;
    usersTopViewDto.player = {
      id: statistic.user.id,
      login: statistic.user.login,
    };
    return usersTopViewDto;
  }
}
