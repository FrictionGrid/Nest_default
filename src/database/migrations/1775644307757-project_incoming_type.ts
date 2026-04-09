import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectIncomingType1775644307757 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE project_incoming_type (
                project_id INTEGER NOT NULL REFERENCES project_incoming(id) ON DELETE CASCADE,
                type_id    INTEGER NOT NULL REFERENCES project_type(id) ON DELETE CASCADE,
                PRIMARY KEY (project_id, type_id)
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE project_incoming_type`);
    }

}
