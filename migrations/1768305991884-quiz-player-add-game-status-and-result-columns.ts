import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { PlayerGameStatusEnum } from '../src/modules/quiz/quiz-game/domain/player/player-game-status.enum';

export class QuizPlayerAddGameStatusAndResultColumns1768305991884
  implements MigrationInterface
{
  name = 'QuizPlayerAddGameStatusAndResultColumns1768305991884';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'player',
      new TableColumn({
        name: 'game_status',
        type: 'enum',
        enum: [PlayerGameStatusEnum.joined, PlayerGameStatusEnum.finished],
        enumName: 'quiz_player_game_statuses',
        isNullable: false,
        default: `'joined'`,
      }),
    );
    await queryRunner.addColumn(
      'player',

      new TableColumn({
        name: 'result',
        type: 'enum',
        enum: ['win', 'lose', 'draw'],
        enumName: 'quiz_player_result',
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.query(`
        CREATE UNIQUE INDEX "uq_player_active_user"
            ON "player" ("user_id") WHERE "game_status" IN ('joined');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`DROP INDEX IF EXISTS "uq_player_active_user"`);
    await queryRunner.dropColumn(`player`, 'result');
    await queryRunner.dropColumn(`player`, 'game_status');
    await queryRunner.query(`DROP TYPE IF EXISTS quiz_player_result`);
    await queryRunner.query(`DROP TYPE IF EXISTS quiz_player_game_statuses`);
  }
}
