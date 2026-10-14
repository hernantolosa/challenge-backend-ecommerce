import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class RenameActorToCreatedBy1791951395284 implements MigrationInterface {
  name = 'RenameActorToCreatedBy1791951395284';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stock_movements" RENAME COLUMN "actor" TO "created_by"`);
    await queryRunner.query(
      `ALTER TABLE "stock_movements" RENAME CONSTRAINT "UQ_stock_movements_actor_idempotency_key" TO "UQ_stock_movements_created_by_idempotency_key"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_movements" RENAME CONSTRAINT "UQ_stock_movements_created_by_idempotency_key" TO "UQ_stock_movements_actor_idempotency_key"`,
    );
    await queryRunner.query(`ALTER TABLE "stock_movements" RENAME COLUMN "created_by" TO "actor"`);
  }
}
