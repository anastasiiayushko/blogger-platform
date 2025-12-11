import { MigrationInterface, QueryRunner } from 'typeorm';

export class AnswerAddVerisonColumn1765475503258 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "answer"
            ADD COLUMN IF NOT EXISTS "version" integer NOT NULL default '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "answer" DROP COLUMN IF EXISTS "version"`);
  }
}
