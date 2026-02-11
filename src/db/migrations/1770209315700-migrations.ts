import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770209315700 implements MigrationInterface {
    name = 'Migrations1770209315700'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" ADD "uploaded_by" character varying(200)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "media" DROP COLUMN "uploaded_by"`);
    }

}
