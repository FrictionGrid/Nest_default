import { MigrationInterface, QueryRunner } from "typeorm";

export class Users1775708836863 implements MigrationInterface {


    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "user_role" AS ENUM ('admin', 'adminsystem', 'manager', 'head_engineer', 'engineer', 'sale');
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                display_name VARCHAR(150),
                role "user_role" NOT NULL DEFAULT 'engineer',
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE users`);
        await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
    }

}