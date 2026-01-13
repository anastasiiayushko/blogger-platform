import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

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
        enum: ['pending', 'active', 'finished'],
        enumName: 'quiz_player_game_statuses',
        isNullable: false,
        default: `'pending'`,
      }),
    );
    await queryRunner.addColumn(
      'player',

      new TableColumn({
        name: 'result',
        type: 'enum',
        enum: ['win', 'lose'],
        enumName: 'quiz_player_result',
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.query(`
        CREATE UNIQUE INDEX "uq_player_active_user"
            ON "player" ("user_id") WHERE "game_status" IN ('pending', 'active');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE quiz_player_game_statuses`);
    await queryRunner.query(`DROP TYPE quiz_player_result`);
    await queryRunner.query(` DROP INDEX "uq_player_active_user"`);
    await queryRunner.dropColumn(`player`, 'result');
    await queryRunner.dropColumn(`player`, 'game_status');
  }
}
