import { MigrationInterface, QueryRunner } from 'typeorm';

export class GameAddColumnTaskId1770920047170 implements MigrationInterface {
  name = 'GameAddColumnTaskId1770920047170';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "game"
          ADD COLUMN task_id uuid DEFAULT NULL `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "game" DROP COLUMN task_id
    `);
  }
}
