import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCompanyPaymentMethods1770060000000 implements MigrationInterface {
  name = 'DropCompanyPaymentMethods1770060000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "company_payment_methods"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "company_payment_methods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "stripe_payment_method_id" character varying(255) NOT NULL,
        "type" character varying(50) NOT NULL,
        "last4" character varying(10),
        "brand" character varying(50),
        "exp_month" integer,
        "exp_year" integer,
        "billing_name" character varying(255),
        "is_primary" boolean NOT NULL DEFAULT false,
        "fingerprint" character varying(255),
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_payment_methods_id" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query('CREATE INDEX "IDX_company_payment_methods_company_id" ON "company_payment_methods" ("company_id")');
    await queryRunner.query(
      'ALTER TABLE "company_payment_methods" ADD CONSTRAINT "FK_company_payment_methods_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  }
}
