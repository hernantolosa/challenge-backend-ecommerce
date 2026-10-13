import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class OrderMovementsBySequence1791926158770 implements MigrationInterface {
  name = 'OrderMovementsBySequence1791926158770';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_movements_variant_occurred_at"`);
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD "sequence" bigint GENERATED ALWAYS AS IDENTITY NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_variant_sequence" ON "stock_movements" ("variant_id", "sequence") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_movements_variant_sequence"`);
    await queryRunner.query(`ALTER TABLE "stock_movements" DROP COLUMN "sequence"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_stock_movements_variant_occurred_at" ON "stock_movements" ("variant_id", "occurred_at") `,
    );
  }
}
