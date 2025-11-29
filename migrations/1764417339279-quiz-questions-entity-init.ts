import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizQuestionsEntityInit1764417339279
  implements MigrationInterface
{
  name = 'QuizQuestionsEntityInit1764417339279';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "questions"
                             (
                                 "id"         uuid             NOT NULL DEFAULT uuid_generate_v4(),
                                 "created_at" TIMESTAMP        NOT NULL DEFAULT now(),
                                 "updated_at" TIMESTAMP        NOT NULL DEFAULT now(),
                                 "deleted_at" TIMESTAMP,
                                 "version"    integer          NOT NULL DEFAULT '0',
                                 "body"       text COLLATE "C" NOT NULL,
                                 "answers"    varchar[] NOT NULL,
                                 "published"  boolean          NOT NULL DEFAULT false
                             )`);
    await queryRunner.query(`ALTER TABLE "questions"
        ADD CONSTRAINT "PK_questions_id" PRIMARY KEY ("id") `);
    await queryRunner.query(`
        ALTER TABLE "questions"
            ADD CONSTRAINT "CHK_questions_answers_not_empty"
                CHECK (array_length("answers", 1) IS NOT NULL AND array_length("answers", 1) > 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "CHK_questions_answers_not_empty"`)
    await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "PK_questions_id"`)
    await queryRunner.query(`DROP TABLE "questions"`);
  }
}
