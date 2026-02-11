import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770372654679 implements MigrationInterface {
    name = 'Migrations1770372654679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "onboardings" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "onboardings" DROP COLUMN "deleted_at"`);
    }

}
