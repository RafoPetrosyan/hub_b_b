import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770281560602 implements MigrationInterface {
    name = 'Migrations1770281560602'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade" DROP CONSTRAINT "FK_ac40608b8665839bcbb69ab510d"`);
        await queryRunner.query(`ALTER TABLE "trade" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "trade" ADD "company_id" uuid`);
        await queryRunner.query(`ALTER TABLE "trade" ADD "creator_company_id" uuid`);
        await queryRunner.query(`ALTER TABLE "trade" ADD CONSTRAINT "FK_7c562157cc6a0bd3b3a16cdedfe" FOREIGN KEY ("creator_company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trade" DROP CONSTRAINT "FK_7c562157cc6a0bd3b3a16cdedfe"`);
        await queryRunner.query(`ALTER TABLE "trade" DROP COLUMN "creator_company_id"`);
        await queryRunner.query(`ALTER TABLE "trade" DROP COLUMN "company_id"`);
        await queryRunner.query(`ALTER TABLE "trade" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trade" ADD CONSTRAINT "FK_ac40608b8665839bcbb69ab510d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
