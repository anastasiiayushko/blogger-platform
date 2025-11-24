import { MigrationInterface, QueryRunner } from "typeorm";

export class CommentEntityInit1761666227696 implements MigrationInterface {
    name = 'CommentEntityInit1761666227696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "comment"
            (
                "id"         uuid      NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "version"    integer   NOT NULL DEFAULT '0',
                "post_id"    uuid      NOT NULL,
                "user_id"    uuid      NOT NULL,
                "content"    text      NOT NULL,
                CONSTRAINT "PK_comment_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_post_id" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_comment_post_id"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_comment_user_id"`);
        await queryRunner.query(`DROP TABLE "comment"`);
    }

}
