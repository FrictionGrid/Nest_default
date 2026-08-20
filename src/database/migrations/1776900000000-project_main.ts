import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Splits project_incoming into:
 *   - project_main      (the real project: name, sales, status, item, types)
 *   - project_incoming  (slimmed down to just PO rows: po_no, po_value, project_main_id)
 *
 * project_main rows reuse the same ids as the project_incoming rows they came
 * from, so project_team.project_id / task_team.project_id / project_documents.project_id
 * (all still pointing at the same numeric ids) only need their FK *constraint*
 * retargeted to project_main — no row data has to change.
 */
async function retargetFk(
  queryRunner: QueryRunner,
  table: string,
  column: string,
  oldRefTable: string,
  newRefTable: string,
  onDelete: 'CASCADE' | 'SET NULL' = 'CASCADE',
  newRefColumn = 'id',
): Promise<void> {
  const [{ cname }] = await queryRunner.query(
    `
    SELECT tc.constraint_name AS cname
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
      AND kcu.column_name = $2
      AND ccu.table_name = $3
    LIMIT 1
    `,
    [table, column, oldRefTable],
  ).then((rows: any[]) => (rows.length ? rows : [{ cname: null }]));

  if (cname) {
    await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT "${cname}"`);
  }
  await queryRunner.query(
    `ALTER TABLE ${table} ADD CONSTRAINT "${table}_${column}_${newRefTable}_fkey" FOREIGN KEY (${column}) REFERENCES ${newRefTable}(${newRefColumn}) ON DELETE ${onDelete}`,
  );
}

export class ProjectMain1776900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. project_main table (reuses the project_status enum created for project_incoming)
    await queryRunner.query(`
      CREATE TABLE project_main (
        id SERIAL PRIMARY KEY,
        item INTEGER,
        project_name VARCHAR(255) NOT NULL,
        sales_name VARCHAR(255),
        status project_status NOT NULL DEFAULT 'in_progress',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 2. copy existing project_incoming rows into project_main, keeping the same ids
    await queryRunner.query(`
      INSERT INTO project_main (id, item, project_name, sales_name, status, created_at, updated_at)
      SELECT id, item, project_name, sales_name, status, created_at, updated_at FROM project_incoming;
    `);
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('project_main', 'id'), GREATEST((SELECT MAX(id) FROM project_main), 1));
    `);

    // 3. project_incoming: add project_main_id, self-map it to the old id, then drop the moved columns
    await queryRunner.query(`ALTER TABLE project_incoming ADD COLUMN project_main_id INTEGER;`);
    await queryRunner.query(`UPDATE project_incoming SET project_main_id = id;`);
    await queryRunner.query(`ALTER TABLE project_incoming ALTER COLUMN project_main_id SET NOT NULL;`);
    await queryRunner.query(`
      ALTER TABLE project_incoming
        ADD CONSTRAINT project_incoming_project_main_id_fkey
        FOREIGN KEY (project_main_id) REFERENCES project_main(id) ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE project_incoming
        DROP COLUMN project_name,
        DROP COLUMN sales_name,
        DROP COLUMN region,
        DROP COLUMN status,
        DROP COLUMN item,
        DROP COLUMN start_date,
        DROP COLUMN end_date;
    `);

    // 4. types are a project_main concept now
    await queryRunner.query(`ALTER TABLE project_incoming_type RENAME TO project_main_type;`);
    await queryRunner.query(`ALTER TABLE project_main_type RENAME COLUMN project_id TO project_main_id;`);
    await retargetFk(queryRunner, 'project_main_type', 'project_main_id', 'project_incoming', 'project_main');

    // 5. project_team / task_team / project_documents / overtime_requests now belong to the whole project (project_main)
    await retargetFk(queryRunner, 'project_team', 'project_id', 'project_incoming', 'project_main', 'CASCADE');
    await retargetFk(queryRunner, 'task_team', 'project_id', 'project_incoming', 'project_main', 'CASCADE');
    await retargetFk(queryRunner, 'project_documents', 'project_id', 'project_incoming', 'project_main', 'CASCADE');
    await retargetFk(queryRunner, 'overtime_requests', 'project_id', 'project_incoming', 'project_main', 'SET NULL');

    // payment_installments stays pointed at project_incoming (per-PO payments) — untouched.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await retargetFk(queryRunner, 'overtime_requests', 'project_id', 'project_main', 'project_incoming', 'SET NULL');
    await retargetFk(queryRunner, 'project_documents', 'project_id', 'project_main', 'project_incoming', 'CASCADE');
    await retargetFk(queryRunner, 'task_team', 'project_id', 'project_main', 'project_incoming', 'CASCADE');
    await retargetFk(queryRunner, 'project_team', 'project_id', 'project_main', 'project_incoming', 'CASCADE');

    await retargetFk(queryRunner, 'project_main_type', 'project_main_id', 'project_main', 'project_incoming');
    await queryRunner.query(`ALTER TABLE project_main_type RENAME COLUMN project_main_id TO project_id;`);
    await queryRunner.query(`ALTER TABLE project_main_type RENAME TO project_incoming_type;`);

    await queryRunner.query(`
      ALTER TABLE project_incoming
        ADD COLUMN project_name VARCHAR(255),
        ADD COLUMN sales_name VARCHAR(255),
        ADD COLUMN region VARCHAR(50),
        ADD COLUMN status project_status NOT NULL DEFAULT 'in_progress',
        ADD COLUMN item INTEGER,
        ADD COLUMN start_date DATE,
        ADD COLUMN end_date DATE;
    `);
    await queryRunner.query(`
      UPDATE project_incoming pi
      SET project_name = pm.project_name, sales_name = pm.sales_name, status = pm.status, item = pm.item
      FROM project_main pm
      WHERE pm.id = pi.project_main_id;
    `);
    await queryRunner.query(`ALTER TABLE project_incoming DROP CONSTRAINT project_incoming_project_main_id_fkey;`);
    await queryRunner.query(`ALTER TABLE project_incoming DROP COLUMN project_main_id;`);
    await queryRunner.query(`ALTER TABLE project_incoming ALTER COLUMN project_name SET NOT NULL;`);

    await queryRunner.query(`DROP TABLE project_main;`);
  }
}
