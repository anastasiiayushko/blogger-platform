import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizGameStatusesEnum1765054902592 implements MigrationInterface {
  name = 'QuizGameStatusesEnum1765054902592';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE quiz_game_statuses AS ENUM ('PendingSecondPlayer','Active','Finished')    
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    DROP TYPE quiz_game_statuses
    `);
  }
}
