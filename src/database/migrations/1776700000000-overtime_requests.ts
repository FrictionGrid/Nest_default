import { MigrationInterface, QueryRunner } from 'typeorm';

export class OvertimeRequests1776700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE ot_type AS ENUM ('weekday', 'holiday');
      CREATE TYPE ot_approval_status AS ENUM (
        'pending_level1',
        'pending_level2',
        'approved',
        'rejected'
      );

      CREATE TABLE overtime_requests (
        id                      SERIAL PRIMARY KEY,
        user_id                 INTEGER REFERENCES users(id) ON DELETE SET NULL,
        project_id              INTEGER REFERENCES project_incoming(id) ON DELETE SET NULL,
        customer_name           VARCHAR(255)  NULL,
        ot_date                 DATE NOT NULL,
        start_time              TIME NOT NULL,
        end_time                TIME NOT NULL,
        total_hours             NUMERIC(5,2) NOT NULL,
        ot_type                 ot_type NOT NULL,
        reason                  TEXT NULL,
        approval_status         ot_approval_status NOT NULL DEFAULT 'pending_level1',
        supervisor_approved_at  TIMESTAMPTZ,
        manager_approved_at     TIMESTAMPTZ,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_overtime_requests_user             ON overtime_requests(user_id);
      CREATE INDEX idx_overtime_requests_project          ON overtime_requests(project_id);
      CREATE INDEX idx_overtime_requests_approval_status  ON overtime_requests(approval_status);
      CREATE INDEX idx_overtime_requests_ot_date          ON overtime_requests(ot_date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS overtime_requests;
      DROP TYPE IF EXISTS ot_approval_status;
      DROP TYPE IF EXISTS ot_type;
    `);
  }
}
