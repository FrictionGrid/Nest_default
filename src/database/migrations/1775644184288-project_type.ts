import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectType1775644184288 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE project_type (
                id   SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            );
        `);

        await queryRunner.query(`
            INSERT INTO project_type (id, name) VALUES
                (1, 'BMS/SCADA'),
                (2, 'PME'),
                (3, 'CCTV'),
                (4, 'ACS'),
                (5, 'Installaion'),
                (6, 'Engineer');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE project_type`);
    }

}
