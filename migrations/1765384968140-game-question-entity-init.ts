import { MigrationInterface, QueryRunner } from 'typeorm';

export class GameQuestionEntityInit1765384968140 implements MigrationInterface {
  name = 'GameQuestionEntityInit1765384968140';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "game_question"
        (
            "id"          uuid      NOT NULL DEFAULT uuid_generate_v4(),
            "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at"  TIMESTAMP          DEFAULT now(),
            "deleted_at"  TIMESTAMP,
            "version"     integer   NOT NULL DEFAULT '0',
            "game_id"     uuid      NOT NULL,
            "question_id" uuid      NOT NULL,
            "order"       int GENERATED ALWAYS AS IDENTITY,
            CONSTRAINT "UQ_game_id_question_id" UNIQUE ("game_id", "question_id"),
            CONSTRAINT "PK_game_question_id" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(`ALTER TABLE "game_question"
        ADD CONSTRAINT "FK_game_question_game_id" FOREIGN KEY ("game_id") REFERENCES "game" ("id") ON DELETE CASCADE ON UPDATE CASCADE `);
    await queryRunner.query(`ALTER TABLE "game_question"
        ADD CONSTRAINT "FK_game_question_question_id" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
          ALTER TABLE "game_question" DROP CONSTRAINT "FK_game_question_question_id",
          ALTER TABLE "game_question" DROP CONSTRAINT "FK_game_question_game_id",
          ALTER TABLE "game_question" DROP CONSTRAINT "PK_game_question_id",
          ALTER TABLE "game_question" DROP CONSTRAINT "UQ_game_id_question_id"
      `,
    );


    await queryRunner.query(`
     DROP TABLE "qame_question"
    `)
  }
}
