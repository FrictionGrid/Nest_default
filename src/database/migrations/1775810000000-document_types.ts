import { MigrationInterface, QueryRunner } from 'typeorm';

export class DocumentTypes1775810000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE document_types (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        is_required BOOLEAN NOT NULL DEFAULT true,
        sort_order  INTEGER NOT NULL DEFAULT 0
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE document_types`);
  }
}
