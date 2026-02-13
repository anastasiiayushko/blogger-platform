import { MigrationInterface, QueryRunner } from 'typeorm';

export class GameTasksEntity1770466479973 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "game_task_statuses" as Enum('pending', 'processing', 'done', 'failed')`,
    );
    await queryRunner.query(`CREATE TABLE "game_tasks"
                             (
                                 "id"         uuid               NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
                                 "game_id"    uuid UNIQUE        NOT NULL REFERENCES "game" ("id"),
                                 "status"     game_task_statuses NOT NULL DEFAULT 'pending',
                                 "execute_at" timestamptz                 DEFAULT NOW(),
                                 "locked_until" timestamptz                 DEFAULT NULL,
                                 "version"    integer            NOT NULL DEFAULT 0
                             )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "game_tasks"`);
    await queryRunner.query(`DROP TYPE "game_task_statuses"`);
  }
}
