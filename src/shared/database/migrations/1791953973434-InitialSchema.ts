import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class InitialSchema1791953973434 implements MigrationInterface {
  name = 'InitialSchema1791953973434';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_categories_name" UNIQUE ("name"), CONSTRAINT "PK_categories" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "category_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "description" text NOT NULL, "price_cents" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_products_price_cents_non_negative" CHECK ("price_cents" >= 0), CONSTRAINT "PK_products" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_category_id" ON "products" ("category_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "variants" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "product_id" uuid NOT NULL, "sku" character varying(64) NOT NULL, "size" character varying(20) NOT NULL, "color" character varying(30) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_variants_product_size_color" UNIQUE ("product_id", "size", "color"), CONSTRAINT "UQ_variants_sku" UNIQUE ("sku"), CONSTRAINT "CHK_variants_sku_format" CHECK ("sku" ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'), CONSTRAINT "PK_variants" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_levels" ("variant_id" uuid NOT NULL, "on_hand" integer NOT NULL DEFAULT '0', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_stock_levels_on_hand_non_negative" CHECK ("on_hand" >= 0), CONSTRAINT "PK_stock_levels" PRIMARY KEY ("variant_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "variant_id" uuid NOT NULL, "quantity" integer NOT NULL, "reason" character varying(32) NOT NULL, "balance_after" integer NOT NULL, "created_by" character varying(255) NOT NULL, "idempotency_key" uuid NOT NULL, "sequence" bigint GENERATED ALWAYS AS IDENTITY NOT NULL, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_stock_movements_created_by_idempotency_key" UNIQUE ("created_by", "idempotency_key"), CONSTRAINT "CHK_stock_movements_reason" CHECK ("reason" IN ('SALE', 'RETURN', 'RESTOCK', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE')), CONSTRAINT "CHK_stock_movements_balance_after_non_negative" CHECK ("balance_after" >= 0), CONSTRAINT "CHK_stock_movements_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_stock_movements" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_variant_sequence" ON "stock_movements" ("variant_id", "sequence") `,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "variants" ADD CONSTRAINT "FK_variants_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_levels" ADD CONSTRAINT "FK_stock_levels_variant" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_stock_movements_variant" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_stock_movements_variant"`,
    );
    await queryRunner.query(`ALTER TABLE "stock_levels" DROP CONSTRAINT "FK_stock_levels_variant"`);
    await queryRunner.query(`ALTER TABLE "variants" DROP CONSTRAINT "FK_variants_product"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_movements_variant_sequence"`);
    await queryRunner.query(`DROP TABLE "stock_movements"`);
    await queryRunner.query(`DROP TABLE "stock_levels"`);
    await queryRunner.query(`DROP TABLE "variants"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_category_id"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
