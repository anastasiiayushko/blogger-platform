import { MigrationInterface, QueryRunner } from "typeorm";

export class AnswerAddConstrainUniqPlayeridQuestionid1771004437570 implements MigrationInterface {
    name = 'AnswerAddConstrainUniqPlayeridQuestionid1771004437570'

    public async up(queryRunner: QueryRunner): Promise<void> {
              await queryRunner.query(`
ALTER TABLE "answer" ADD CONSTRAINT "UQ_answer_player_question" UNIQUE ("player_id", "question_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "answer" DROP CONSTRAINT "UQ_answer_player_question"`);

    }

}
