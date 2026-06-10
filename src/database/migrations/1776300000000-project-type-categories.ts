import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectTypeCategories1776300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE project_type_categories (
        id              SERIAL PRIMARY KEY,
        project_type_id INTEGER     NOT NULL REFERENCES project_type(id) ON DELETE CASCADE,
        category        VARCHAR(50) NOT NULL,
        UNIQUE (project_type_id, category)
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE project_type_categories`);
  }
}
