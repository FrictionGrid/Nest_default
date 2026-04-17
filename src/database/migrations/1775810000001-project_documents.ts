import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectDocuments1775810000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE document_status AS ENUM ('missing', 'uploaded', 'approved', 'rejected')
    `);

    await queryRunner.query(`
      CREATE TABLE project_documents (
        id                 SERIAL PRIMARY KEY,
        project_id         INTEGER NOT NULL REFERENCES project_incoming(id) ON DELETE CASCADE,
        document_type_id   INTEGER NOT NULL REFERENCES document_types(id) ON DELETE CASCADE,
        status             document_status NOT NULL DEFAULT 'missing',
        rejected_reason    TEXT,
        approved_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
        approved_at        TIMESTAMP,
        UNIQUE (project_id, document_type_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE project_documents`);
    await queryRunner.query(`DROP TYPE document_status`);
  }
}
