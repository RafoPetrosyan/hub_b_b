import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770630318418 implements MigrationInterface {
    name = 'Migrations1770630318418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "company_booking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "subdomain" character varying(255), "custom_subdomain" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_0a16e52905682ecd6a71418a1cc" UNIQUE ("company_id"), CONSTRAINT "UQ_af3cc52623d762e48e0a2a777ca" UNIQUE ("subdomain"), CONSTRAINT "UQ_19fdfea0bc33445fbef2e111a5d" UNIQUE ("custom_subdomain"), CONSTRAINT "REL_0a16e52905682ecd6a71418a1c" UNIQUE ("company_id"), CONSTRAINT "PK_d2b4a5f95de0860c9eaf174bbb0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "business_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "currency" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "company_booking" ADD CONSTRAINT "FK_0a16e52905682ecd6a71418a1cc" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_booking" DROP CONSTRAINT "FK_0a16e52905682ecd6a71418a1cc"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "business_name"`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "name" character varying(255)`);
        await queryRunner.query(`DROP TABLE "company_booking"`);
    }

}
