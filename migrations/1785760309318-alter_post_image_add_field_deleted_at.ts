import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPostImageAddFieldDeletedAt1785760309318 implements MigrationInterface {
    name = 'AlterPostImageAddFieldDeletedAt1785760309318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_images"
          ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL`);
     }

    public async down(queryRunner: QueryRunner): Promise<void> {
           await queryRunner.query(
             `ALTER TABLE "post_image" DROP COLUMN IF EXISTS  "deleted_at"`,
           );
    }

}
