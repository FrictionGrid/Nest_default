import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentInstallments1776000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_installments (
        id              SERIAL PRIMARY KEY,
        project_id      INTEGER NOT NULL REFERENCES project_incoming(id) ON DELETE CASCADE,
        installment_no  INTEGER NOT NULL,
        due_date        DATE,
        amount          NUMERIC(15,2),
        status          VARCHAR(20) NOT NULL DEFAULT 'upcoming'
                          CHECK (status IN ('paid', 'pending', 'upcoming')),
        paid_date       DATE,
        note            TEXT,
        created_at      TIMESTAMPTZ DEFAULT now(),
        updated_at      TIMESTAMPTZ DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_installments_project
      ON payment_installments(project_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS payment_installments`);
  }
}
