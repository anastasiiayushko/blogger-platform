import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizGameAnswerEntityInit1765395137702
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "answer"
        (
            "id"          uuid                   NOT NULL DEFAULT uuid_generate_v4(),
            "created_at"  TIMESTAMP              NOT NULL DEFAULT now(),
            "updated_at"  TIMESTAMP              NOT NULL DEFAULT now(),
            "deleted_at"  TIMESTAMP,
            "player_id"   uuid                   NOT NULL,
            "question_id" uuid                   NOT NULL,
            "status"      "answer_statuses_enum" NOT NULL,
            CONSTRAINT "PK_answer_id" PRIMARY KEY ("id")
        )
    `)
    await queryRunner.query(`
        ALTER TABLE "answer"
            ADD CONSTRAINT "FK_answer_player_id" FOREIGN KEY ("player_id") REFERENCES "player" (id) ON DELETE CASCADE ON UPDATE NO ACTION

    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "answer" DROP CONSTRAINT "FK_answer_player_id"`);
    await queryRunner.query(`DROP TABLE "answer"`);
  }
}
