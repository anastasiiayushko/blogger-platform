import { MigrationInterface, QueryRunner } from "typeorm";

export class CommentReactionEntityInit1762356349081 implements MigrationInterface {
    name = 'CommentReactionEntityInit1762356349081'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`-- ALTER TABLE "comment" DROP CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93"`);
        await queryRunner.query(`-- ALTER TABLE "comment" DROP CONSTRAINT "FK_bbfe153fa60aa06483ed35ff4a7"`);
        // await queryRunner.query(`CREATE TYPE "public"."comment_reactions_status_enum" AS ENUM('Like', 'Dislike', 'None')`);
        await queryRunner.query(`CREATE TABLE "comment_reaction" (
                        "id" uuid NOT NULL DEFAULT uuid_generate_v4(), 
                        "created_at" TIMESTAMP NOT NULL DEFAULT now(), 
                        "updated_at" TIMESTAMP NOT NULL DEFAULT now(), 
                        "deleted_at" TIMESTAMP, 
                        "version" integer NOT NULL DEFAULT '0', 
                        "comment_id" uuid NOT NULL, 
                        "user_id" uuid NOT NULL, 
                        "status" "public"."reactions_status_enum" NOT NULL DEFAULT 'None',
                        CONSTRAINT "PK_comment_reaction" PRIMARY KEY ("id"))
    `);
        await queryRunner.query(`-- ALTER TABLE "comment" ADD CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`-- ALTER TABLE "comment" ADD CONSTRAINT "FK_bbfe153fa60aa06483ed35ff4a7" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "FK_comment_reaction_comment_id" FOREIGN KEY ("comment_id") REFERENCES "comment"("id")  ON DELETE NO ACTION
            ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" ADD CONSTRAINT "FK_comment_reaction_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("id")  ON DELETE NO ACTION
            ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_comment_reaction_comment_id"`);
        await queryRunner.query(`ALTER TABLE "comment_reaction" DROP CONSTRAINT "FK_comment_reaction_user_id"`);
        await queryRunner.query(`-- ALTER TABLE "comment_reactions" DROP CONSTRAINT "FK_dc714054fc62b698018fcb0ae37"`);
        await queryRunner.query(`-- ALTER TABLE "comment" DROP CONSTRAINT "FK_bbfe153fa60aa06483ed35ff4a7"`);
        await queryRunner.query(`-- ALTER TABLE "comment" DROP CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93"`);
        await queryRunner.query(`DROP TABLE "comment_reaction"`);
        // await queryRunner.query(`DROP TYPE "public"."comment_reactions_status_enum"`);
        await queryRunner.query(`-- ALTER TABLE "comment" ADD CONSTRAINT "FK_bbfe153fa60aa06483ed35ff4a7" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`-- ALTER TABLE "comment" ADD CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
