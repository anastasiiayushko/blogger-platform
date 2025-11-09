import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommentReactionEntityInit1762356349081
  implements MigrationInterface
{
  name = 'CommentReactionEntityInit1762356349081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "comment_reaction"
                             (
                                 "id"         uuid                             NOT NULL DEFAULT uuid_generate_v4(),
                                 "created_at" TIMESTAMP                        NOT NULL DEFAULT now(),
                                 "updated_at" TIMESTAMP                        NOT NULL DEFAULT now(),
                                 "deleted_at" TIMESTAMP,
                                 "version"    integer                          NOT NULL DEFAULT '0',
                                 "comment_id" uuid                             NOT NULL,
                                 "user_id"    uuid                             NOT NULL,
                                 "status"     "public"."reactions_status_enum" NOT NULL DEFAULT 'None',
                                 CONSTRAINT "PK_comment_reaction" PRIMARY KEY ("id")
                             )
    `);
    await queryRunner.query(`ALTER TABLE "comment_reaction"
        ADD CONSTRAINT "FK_comment_reaction_comment_id" FOREIGN KEY ("comment_id") REFERENCES "comment" ("id") ON DELETE NO ACTION
            ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "comment_reaction"
        ADD CONSTRAINT "FK_comment_reaction_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE NO ACTION
            ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_comment_reaction_comment_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_comment_reaction_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "comment_reaction"`);
  }
}
