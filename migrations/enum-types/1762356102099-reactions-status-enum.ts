import { MigrationInterface, QueryRunner } from "typeorm";

export class ReactionsStatusEnum1762356102099 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reactions_status_enum" AS ENUM('Like', 'Dislike', 'None')`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TYPE "public"."reactions_status_enum"`);

    }

}
