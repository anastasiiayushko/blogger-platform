import { ApiProperty } from '@nestjs/swagger';
import { GameStatistic } from '../../../domain/game-statistic/game-statistic.entity';

export class TopPlayersViewDto {
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

  static mapToView(statistic: GameStatistic): TopPlayersViewDto {
    const usersTopViewDto = new TopPlayersViewDto();

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
