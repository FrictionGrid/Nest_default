import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectIncoming1775630286569 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      CREATE TYPE project_status AS ENUM (
        'in_progress',
        'delayed',
        'completed'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE project_incoming (
        id SERIAL PRIMARY KEY,
        item INTEGER,
        project_name VARCHAR(255) NOT NULL,
        sales_name VARCHAR(255),
        po_value DECIMAL(15,2), 
        po_no VARCHAR(255),
        status project_status NOT NULL DEFAULT 'in_progress',
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE project_incoming`);
    await queryRunner.query(`DROP TYPE project_status`);
  }
}