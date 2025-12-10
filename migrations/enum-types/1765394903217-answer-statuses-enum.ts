import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnswerStatusesEnum1765394903217 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE answer_statuses_enum AS ENUM ('Correct', 'Incorrect');`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE  answer_statuses_enum;`);
  }
}
