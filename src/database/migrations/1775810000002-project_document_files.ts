import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectDocumentFiles1775810000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE project_document_files (
        id                   SERIAL PRIMARY KEY,
        project_document_id  INTEGER NOT NULL REFERENCES project_documents(id) ON DELETE CASCADE,
        filename             VARCHAR(255) NOT NULL,
        file_path            VARCHAR(500) NOT NULL,
        file_size            BIGINT,
        mime_type            VARCHAR(100),
        uploaded_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
        uploaded_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE project_document_files`);
  }
}
